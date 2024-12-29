"use client"
import { useState, useEffect } from 'react';
import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import board from '../../../public/board/contents.json';
import { Card } from './card';
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();


const findParents = (board, card) => {
  const currentLevel = card?.cards?.map(x => [x.document_id, card.id]) ?? [];
  const nextLevel = currentLevel.flatMap(([x, _]) => findParents(board, {...board.documents[x], id: x}));
  return currentLevel.concat(nextLevel);
};

// In muse-board.tsx, update the global styles
<style jsx global>{`
  body {
    background-color: #DFDFDE;
    font-family: var(--font-geist-sans);
  }
`}</style>


const parents = Object.fromEntries(findParents(board, {...board.documents[board.root], id: board.root}));

const withParentLink = (Comp) => ({id, recurse, ...rest}) => {
    if (recurse !== 0 || board.root === id) {
      return <Comp id={id} recurse={recurse} {...rest} />;
    }
    const parent = parents[id];
    
    return (
      <>
        <div style={{position: "absolute", right: 50, zIndex: 1000}}>
          <Link 
            href={parent === board.root ? "/" : `/${parent}`}
            style={{textDecoration: "none"}}
          >
            <b>↑ Parent</b>
          </Link>
        </div>
        <Comp id={id} recurse={recurse} {...rest} />
      </>
    );
  };
  

const Image = withParentLink(({ original_file, recurse }) => {
  const size = recurse === 0 ? {} : {width: "100%", height: "100%"};
  return <img 
    style={{position: "absolute", ...size}} 
    src={`/board/files/${original_file}`}
    alt={`Board ${original_file}`}
  />;
});

const Ink = withParentLink(({ ink_svg }) => {
  return <img 
    style={{position: "absolute"}} 
    src={`/board/files/${ink_svg}`}
    alt="Ink drawing"
  />;
});

// const Pdf = withParentLink(({ original_file, recurse }) => {
//   const size = recurse === 0 ? {} : {width: "100%"};
//   return <img 
//     style={{...size}} 
//     src={`/board/files/${original_file}-0.png`}
//     alt={`PDF ${original_file}`}
//   />;
// });
const Pdf = withParentLink(({ original_file, recurse }) => {
    const [pages, setPages] = useState([]);
    
    useEffect(() => {
      async function loadPDF() {
        const pdf = await pdfjsLib.getDocument(`/board/files/${original_file}`).promise;
        const pagePromises = [];
        
        // Increase scale for better quality
        const scale = 2.0; // Higher scale for better resolution
        
        for(let i = 1; i <= Math.min(6, pdf.numPages); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          // Set canvas dimensions to match viewport
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          // Improve rendering quality
          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            intent: 'display',
            renderInteractiveForms: true,
            canvasFactory: null,
            background: 'rgb(255, 255, 255)'
          };
          
          await page.render(renderContext).promise;
          pagePromises.push(canvas.toDataURL('image/jpeg', 1.0));
        }
        setPages(await Promise.all(pagePromises));
      }
      
      loadPDF().catch(console.error);
    }, [original_file]);
  
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "4px",
        padding: "8px",
        width: "100%",
        height: "100%",
        backgroundColor: "rgb(233,232,231)",
        borderRadius: "3px",
        boxSizing: "border-box"
      }}>
        {pages.map((dataUrl, index) => (
          <img 
            key={index}
            src={dataUrl}
            alt={`PDF page ${index + 1}`}
            style={{
              width: "100%",
              objectFit: "contain",
              imageRendering: "high-quality"
            }}
          />
        ))}
      </div>
    );
  });
  
  

const Text = withParentLink(({ original_file }) => {
    const [fileContent, setFileContent] = useState(null);
    
    useEffect(() => {
      fetch(`/board/files/${original_file}`)
        .then(resp => resp.text())
        .then(setFileContent)
        .catch(console.error);
    }, [original_file]);
    
    return <div style={{
      fontSize: 14,
      lineHeight: 1.3,
      fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      fontWeight: 500,
      color: "rgb(55, 53, 47)",
      padding: "13px 13px",
      whiteSpace: "pre-wrap",
      backgroundColor: "rgb(233,232,231)",
      borderRadius: "3px",
      boxShadow: "rgb(206, 206, 205) 0px 0px 3px",
      height: "100%",
      width: "100%",
      position: "absolute",
      boxSizing: "border-box",
      overflow: "hidden"
    }}>{fileContent}</div>;
});
  
const MuseCard = withParentLink(({ type, document_id, position_x, position_y, size_height, size_width, recurse, z, ...rest }) => {
    const router = useRouter();
    const cardInfo = board.documents[document_id];
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
      setIsVisible(true);
    }, []);
  
    const calculateContentExtent = (boardInfo) => {
      if (!boardInfo.cards) return { width: 0, height: 0 };
      
      return boardInfo.cards.reduce((max, card) => {
        const rightEdge = card.position_x + card.size_width;
        const bottomEdge = card.position_y + card.size_height;
        return {
          width: Math.max(max.width, rightEdge),
          height: Math.max(max.height, bottomEdge)
        };
      }, { width: 0, height: 0 });
    };
  
    const getScale = () => {
      if (cardInfo.type !== 'board') return 0.1;
      
      const extent = calculateContentExtent(cardInfo);
      const scaleX = size_width / (extent.width || size_width);
      const scaleY = size_height / (extent.height || size_height);
      return Math.min(scaleX, scaleY, 1) * 0.9;
    };
  
    const scale = getScale();
    
    return (
      <div style={{
        position: "absolute",
        left: position_x, 
        top: position_y,
        width: size_width, 
        height: size_height,
        zIndex: z,
        cursor: cardInfo.type === "text" ? undefined : "pointer",
        opacity: isVisible ? 1 : 0,
        transform: `scale(${isVisible ? 1 : 0.8})`,
        transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
      }}>
        {cardInfo.type === "url" ? null :
          <div style={{
            color: "black", 
            top: -25, 
            position: "absolute", 
            width: size_width - 20, 
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
            maxWidth: "30ch",
            fontSize: "13px",
            fontWeight: 550,
            padding: "2px 0"
          }}>
            {cardInfo.label}
          </div>
        }
        <div
          style={cardInfo.type === "text" ? {} : {
            width: size_width, 
            height: size_height,
            borderRadius: 8,
            boxShadow: "rgb(206, 206, 205) 0px 0px 3px",
            backgroundColor: "#F0F0EE",
            overflow: "hidden"
          }}
          onClick={() => {
            if (recurse === 1 && cardInfo.type !== "url") {
              router.push(`/${document_id}`);
            }
          }}
        >
          {cardInfo.type !== "board" 
            ? <CardForType {...cardInfo} id={document_id} />
            : <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden"
              }}>
                <div style={{
                  position: "absolute",
                  transform: `scale(${scale})`,
                  transformOrigin: "0 0",
                  width: `${100/scale}%`,
                  height: `${100/scale}%`
                }}>
                  {recurse <= 3 ? <Board {...cardInfo} id={document_id} recurse={recurse + 1} /> : null}
                </div>
              </div>
          }
        </div>
      </div>
    );
  });
  

const inkToArray = (ink_models) => {
  return Object.entries(ink_models || {})
    .filter(([k, v]) => v.ink_svg)
    .map(([k, v]) => v);
};

const Board = withParentLink(({ cards, ink_models, recurse, type, label, id, ...rest }) => {
    const pathname = usePathname();
    
    const getBreadcrumbs = () => {
      const paths = pathname?.split('/').filter(Boolean) || [];
      const breadcrumbs = [];
      let currentPath = '';
      
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        currentPath += `/${path}`;
        const doc = board.documents[path];
        
        if (doc) {
          // Check if it's a nested board
          const parentId = parents[path];
          const parentDoc = board.documents[parentId];
          
          // Add parent board if it exists and hasn't been added
          if (parentDoc && !breadcrumbs.find(b => b.id === parentId)) {
            breadcrumbs.push({
              id: parentId,
              label: parentDoc.label || 'Board',
              path: `/${parentId}`
            });
          }
          
          breadcrumbs.push({
            id: path,
            label: doc.label || path,
            path: currentPath
          });
        }
      }
  
      return [
        {
          id: board.root,
          label: 'Home',
          path: '/'
        },
        ...breadcrumbs
      ];
    };
  
    return (
      <>
        {recurse !== 0 ? null : (
          <div style={{
            position: "absolute",
            top: 16,
            left: 16,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "rgb(34, 34, 34)",
            fontSize: "14px",
            fontWeight: 500,
            maxWidth: "calc(100% - 32px)",
            overflow: "hidden"
          }}>
            {getBreadcrumbs().map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && (
                  <span style={{ color: "rgb(155, 155, 155)" }}>{">"}</span>
                )}
                <Link
                  href={item.path}
                  style={{
                    color: "inherit",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "150px"
                  }}
                >
                  {item.label}
                </Link>
              </React.Fragment>
            ))}
          </div>
        )}
        {(cards || []).map(card => (
          <MuseCard
            key={card.document_id}
            {...card}
            recurse={recurse + 1}
            id={card.document_id}
          />
        ))}
        {inkToArray(ink_models).map(ink => (
          <Ink key={ink.ink_svg} {...ink} />
        ))}
      </>
    );
  });
  


  

const truncateTitle = (title: string, maxLength: number = 31) => {
    if (title.length > maxLength) {
      return title.slice(0, maxLength);
    }
    return title;
  };
  
const LinkIcon = () => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 256 256" 
      style={{
        flexShrink: 0,
        marginTop: "2px",
        color: "rgb(55, 53, 47)"
      }}
    >
      <path 
        d="M33.5,128v118H128h94.5v-94.4V57.2l-23.6-23.6L175.2,10h-70.9H33.5V128z M151.6,57.1l0.1,23.6l23.6,0.1L199,81l-0.1,70.7l-0.1,70.6H128H57.2l-0.1-93.8c0-51.6,0-94.1,0.1-94.4c0.1-0.4,10-0.6,47.2-0.6h47L151.6,57.1z"
        fill="currentColor"
      />
    </svg>
  );
  
  const Url = withParentLink(({url, title, label}) => {
    const domain = url ? new URL(url).hostname : '';
    const truncatedTitle = truncateTitle(label || title);
    
    return (
      <div style={{
        padding: "10px 10px",
        backgroundColor: "rgb(233,232,231)",
        borderRadius: "3px",
        boxShadow: "rgb(206, 206, 205) 0px 0px 3px",
        height: "100%",
        width: "100%",
        position: "absolute",
        boxSizing: "border-box",
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px"
        }}>
          <LinkIcon />
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}>
            <a 
              href={url}
              style={{
                textDecoration: "none",
                color: "rgb(55, 53, 47)",
                fontSize: "14px",
                fontWeight: 550,
                lineHeight: 1.3
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {truncatedTitle}
            </a>
            <div style={{
              color: "rgb(120, 119, 116)",
              fontSize: "12px",
              fontWeight: 400
            }}>
              {domain}
            </div>
          </div>
        </div>
      </div>
    );
  });
  

const CardForType = ({ type, ...cardInfo }) => {
  switch (type) {
    case "image": return <Image {...cardInfo} />;
    case "text": return <Text {...cardInfo} />;
    case "board": return <Board {...cardInfo} />;
    case "pdf": return <Pdf {...cardInfo} />;
    case "url": return <Url {...cardInfo} />;
    default: return JSON.stringify({type, ...cardInfo}, null, 2);
  }
};

const Muse = () => {
  const pathname = usePathname();
  const [boardId, setBoardId] = useState(board.root);
  
  useEffect(() => {
    const id = pathname?.split('/').pop() || board.root;
    setBoardId(id === 'muse' ? board.root : id);
  }, [pathname]);

  const currentBoard = board.documents[boardId];

  return (
    <>
      <style jsx global>{`
        body {
          background-color: #DFDFDE;
          font-family: sans-serif;
        }
      `}</style>
      <CardForType {...currentBoard} id={boardId} recurse={0} />
    </>
  );
};

export { Muse as MuseBoard };

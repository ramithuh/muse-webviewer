"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

// For PDF rendering
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Import your board JSON (Muse-exported data)
var b_name = "Public"
import board from "../../../public/Public/contents.json";

interface Board {
  documents: {
    [key: string]: Document;  // Add this index signature
  };
  root: string;
}


interface Document {
  cards: Array<{
    card_id: string;
    document_id: string;
    position_x: number;
    position_y: number;
    size_height: number;
    size_width: number;
    z: number;
  }>;
  connections: string[][];
  created_at: string;
  label: string;
  type: string;
}


/* ------------------------------------------------------------------
   1) Build the "parents" map:
   This is used to figure out each document's direct parent so we
   can do things like "↑ Parent" or build full breadcrumbs.
------------------------------------------------------------------ */
function findParents(boardData: any, card: any, visited = new Set()) {
  if (!card || visited.has(card.id)) return [];
  visited.add(card.id);

  const relationships: Array<[string, string]> = [];
  if (card.cards) {
    for (const childCard of card.cards) {
      relationships.push([childCard.document_id, card.id]);
      relationships.push(
        ...findParents(
          boardData,
          { ...boardData.documents[childCard.document_id], id: childCard.document_id },
          visited
        )
      );
    }
  }
  return relationships;
}

export const parents: Record<string, string> = Object.fromEntries(
  findParents(board, { ...board.documents[board.root as keyof typeof board.documents], id: board.root })
);

/* ------------------------------------------------------------------
   2) A helper to build full breadcrumb data for the current path.
   We'll show this in the top bar (mac traffic lights + breadcrumb).
------------------------------------------------------------------ */
function getBreadcrumbs(pathname: string) {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs: Array<{ id: string; label: string; path: string }> = [];

  // Always add home (root)
  if (board.documents?.[board.root]) {
    breadcrumbs.push({
      id: board.root,
      label: board.documents[board.root].label || "Home",
      path: "/",
    });
  }

  const visited = new Set([board.root]);
  let currentPath = "";

  for (const seg of paths) {
    const doc = board.documents[seg];
    if (!doc) continue;

    // Build up the parent chain
    const parentChain = [];
    let currentId = seg;
    while (parents[currentId] && !visited.has(parents[currentId])) {
      const parentId = parents[currentId];
      const parentDoc = board.documents[parentId];
      if (parentDoc && parentId !== board.root) {
        parentChain.unshift({
          id: parentId,
          label: parentDoc.label || "Board",
          path: `/${parentId}`,
        });
        visited.add(parentId);
      }
      currentId = parentId;
    }

    // Add parent chain
    breadcrumbs.push(...parentChain);

    // Add the current doc
    if (!visited.has(seg)) {
      currentPath += `/${seg}`;
      breadcrumbs.push({
        id: seg,
        label: doc.label || seg,
        path: currentPath,
      });
      visited.add(seg);
    }
  }

  return breadcrumbs;
}

/* ------------------------------------------------------------------
   3) The "withParentLink" HOC:
   - Renders a breadcrumb bar if `recurse === 0`.
   - Renders an "↑ Parent" link (if there's a parent).
   - Then renders whatever card/component was wrapped.
------------------------------------------------------------------ */
function withParentLink<T extends { id: string; recurse: number }>(
  WrappedComponent: React.ComponentType<T>
) {
  return function ParentLinkedComponent(props: T) {
    const { id, recurse } = props;
    const pathname = usePathname();
    const parentId = parents[id];

    // We only show the breadcrumbs if we’re at recursion level 0 (top-level).
    const showBreadcrumbs = recurse === 0;

    return (
      <>
        {/* BREADCRUMB BAR (visible at top-level) */}
        {showBreadcrumbs && (
          <div
            style={{
              position: "fixed",
              top: 5,
              left: 5,
              right: 5,
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(246, 245, 245, 1)",
              backdropFilter: "blur(8px)",
              padding: "11px 16px",
              borderRadius: "6px",
              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
              zIndex: 1000,
            }}
          >
            {/* Mac traffic lights (optional) */}
            <div
              style={{
                display: "flex",
                gap: "6px",
                alignItems: "center",
                marginRight: "12px",
                paddingRight: "12px",
                borderRight: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Red */}
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#FF5F56",
                  border: "0.5px solid rgba(0, 0, 0, 0.15)",
                }}
              />
              {/* Yellow */}
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#FFBD2E",
                  border: "0.5px solid rgba(0, 0, 0, 0.15)",
                }}
              />
              {/* Green */}
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "#27C93F",
                  border: "0.5px solid rgba(0, 0, 0, 0.15)",
                }}
              />
            </div>

            {/* Actual breadcrumb links */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "rgb(34, 34, 34)",
                fontSize: "14px",
                fontWeight: 550,
                overflow: "hidden",
              }}
            >
              {getBreadcrumbs(pathname || "").map((crumb, index) => (
                <React.Fragment key={crumb.id}>
                  {index > 0 && (
                    <span
                      style={{
                        color: "rgb(155, 155, 155)",
                        margin: "0 2px",
                      }}
                    >
                      {">"}
                    </span>
                  )}
                  <Link
                    href={crumb.path}
                    style={{
                      color: "inherit",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "150px",
                    }}
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* OPTIONAL: Show an "↑ Parent" link if not at root and top-level */}
        {showBreadcrumbs && parentId && parentId !== board.root && (
          <div style={{ position: "absolute", right: 50, zIndex: 500 }}>
            <Link
              href={parentId === board.root ? "/" : `/${parentId}`}
              style={{ textDecoration: "none" }}
            >
              <b>↑ Parent</b>
            </Link>
          </div>
        )}

        {/* Render the actual component we wrapped */}
        <WrappedComponent {...(props as T)} />
      </>
    );
  };
}

/* ------------------------------------------------------------------
   4) Components for each Muse "type":
   - Board, Image, Ink, PDF, Text, URL
   - Each one is wrapped with "withParentLink".
   - Because they're all wrapped, they can show the breadcrumb bar.
------------------------------------------------------------------ */

// IMAGE
const Image = withParentLink(({ original_file, recurse }: any) => {
  // If it's nested, scale it. If top-level, fill container.
  const size = recurse === 0 ? {} : { width: "100%", height: "100%" };
  return (
    <img
      style={{ position: "absolute", ...size }}
      src={`/${b_name}/files/${original_file}`}
      alt={`Image: ${original_file}`}
    />
  );
});

// INK
const Ink = withParentLink(({ ink_svg }: any) => {
  return (
    <img
      style={{ position: "absolute" }}
      src={`/${b_name}/files/${ink_svg}`}
      alt="Ink drawing"
    />
  );
});

// PDF
const Pdf = withParentLink(({ original_file, recurse }: any) => {
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    async function loadPDF() {
      const pdf = await pdfjsLib.getDocument(`/${b_name}/files/${original_file}`).promise;
      const pagePromises: Promise<string>[] = [];

      // Lower scale for better performance
      const scale = recurse === 0 ? 2 : 0.3;
      // Show more pages at top level, fewer in cards
      const maxPages = recurse === 0 ? Math.min(6, pdf.numPages) : 2;
      // Lower JPEG quality for thumbnails
      const quality = recurse === 0 ? 1.0 : 0.7;

      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
          canvasContext: context,
          viewport,
          background: "rgb(255, 255, 255)",
        };
        await page.render(renderContext).promise;
        pagePromises.push(canvas.toDataURL("image/jpeg", quality));
      }

      const result = await Promise.all(pagePromises);
      setPages(result);
    }

    loadPDF().catch(console.error);
  }, [original_file, recurse]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "4px",
        padding: "8px",
        width: "100%",
        height: "100%",
        backgroundColor: "rgb(233,232,231)",
        borderRadius: "3px",
        boxSizing: "border-box",
      }}
    >
      {pages.map((dataUrl, idx) => (
        <img
          key={idx}
          src={dataUrl}
          alt={`PDF page ${idx + 1}`}
          style={{
            width: "100%",
            objectFit: "contain",
          }}
        />
      ))}
    </div>
  );
});


// TEXT
const Text = withParentLink(({ original_file }: any) => {
  const [fileContent, setFileContent] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/${b_name}/files/${original_file}`)
      .then((resp) => resp.text())
      .then(setFileContent)
      .catch(console.error);
  }, [original_file]);

  return (
    <div
      style={{
        fontSize: 14,
        lineHeight: 1.3,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
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
        overflow: "hidden",
      }}
    >
      {fileContent}
    </div>
  );
});

// URL
function truncateTitle(title: string, maxLength = 31) {
  return title.length > maxLength ? title.slice(0, maxLength) + "…" : title;
}

const LinkIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 256 256"
    style={{
      flexShrink: 0,
      marginTop: "2px",
      color: "rgb(55, 53, 47)",
    }}
  >
    <path
      d="M33.5,128v118H128h94.5v-94.4V57.2l-23.6-23.6L175.2,10h-70.9H33.5V128z M151.6,57.1l0.1,23.6l23.6,0.1L199,81l-0.1,70.7l-0.1,70.6H128H57.2l-0.1-93.8c0-51.6,0-94.1,0.1-94.4c0.1-0.4,10-0.6,47.2-0.6h47L151.6,57.1z"
      fill="currentColor"
    />
  </svg>
);

const Url = withParentLink(({ url, title, label }: any) => {
  const domain = url ? new URL(url).hostname : "";
  const truncatedTitle = truncateTitle(label || title || "Link");

  return (
    <div
      style={{
        padding: "10px 10px",
        backgroundColor: "rgb(233,232,231)",
        borderRadius: "3px",
        boxShadow: "rgb(206, 206, 205) 0px 0px 3px",
        height: "100%",
        width: "100%",
        position: "absolute",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <LinkIcon />
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <a
            href={url}
            style={{
              textDecoration: "none",
              color: "rgb(55, 53, 47)",
              fontSize: "14px",
              fontWeight: 550,
              lineHeight: 1.3,
            }}
            target="_blank"
            rel="noopener noreferrer"
          >
            {truncatedTitle}
          </a>
          <div
            style={{
              color: "rgb(120, 119, 116)",
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            {domain}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------
   5) The "Board" component (for type="board"):
   - Renders child cards + ink drawings.
   - No breadcrumb logic here; that's in "withParentLink".
------------------------------------------------------------------ */
function inkToArray(ink_models: any) {
  return Object.entries(ink_models || {})
    .filter(([_, v]) => v.ink_svg)
    .map(([_, v]) => v);
}

// 1) A small <Connector> component that draws a line between (x1,y1) & (x2,y2).
function Connector({
  x1,
  y1,
  x2,
  y2,
  stroke = "black",
  strokeWidth = 2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  // Compute the bounding box for the line
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const width = Math.abs(x2 - x1) || 1;  // fallback if 0
  const height = Math.abs(y2 - y1) || 1; // fallback if 0

  return (
    <svg
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        pointerEvents: "none", // so clicks pass through
        zIndex: 1, // or behind the cards if you want
      }}
    >
      <line
        // Inside the local SVG coordinates, shift the line by subtracting left/top
        x1={x1 - left}
        y1={y1 - top}
        x2={x2 - left}
        y2={y2 - top}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

// 2) The Board component, using individual <Connector> per line
export const Board = withParentLink(
  ({ cards = [], ink_models, connections = [], recurse, id }: any) => {
    const HEADER_HEIGHT = 128;

    return (
      <div
        style={{
          position: "relative",
          // If you want a top padding for a "header", you can keep it.
          // Just remember if your card coords are raw, you might need to offset them:
          // paddingTop: HEADER_HEIGHT,
          width: "100%",
          height: "100%",
        }}
      >
        {/* 2A) Render each connector as a separate absolutely-positioned svg */}
        {connections.map(([startId, endId]: [string, string], i: number) => {
          const startCard = cards.find((c: any) => c.card_id === startId);
          const endCard = cards.find((c: any) => c.card_id === endId);
          if (!startCard || !endCard) return null;

          // If you do NOT have a top padding in the container, use the raw coords.
          // If you DO have `paddingTop: HEADER_HEIGHT`, then add +HEADER_HEIGHT to y1,y2.
          const x1 = startCard.position_x + startCard.size_width / 2;
          const y1 = startCard.position_y + startCard.size_height / 2;
          const x2 = endCard.position_x + endCard.size_width / 2;
          const y2 = endCard.position_y + endCard.size_height / 2;

          return (
            <Connector
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgb(194, 192, 192)"
              strokeWidth={2}
            />
          );
        })}

        {/* 2B) Render the child cards */}
        {cards.map((card: any, index: number) => (
          <MuseCard
            key={`${id}_${card.document_id}_${index}`}
            {...card}
            recurse={recurse + 1}
            id={card.document_id}
          />
        ))}

        {/* 2C) Render any ink drawings */}
        {inkToArray(ink_models).map((ink: any, i: number) => (
          <Ink key={`${id}_${ink.ink_svg}_${i}`} {...ink} />
        ))}
      </div>
    );
  }
);


/* ------------------------------------------------------------------
   6) "MuseCard" for rendering each card in a board.
   - If it's a "board" card, we'll recursively render <Board>.
   - Otherwise we pick the correct sub-component (image, text, etc.).
------------------------------------------------------------------ */
const MuseCard = withParentLink(
  ({
    type,
    document_id,
    position_x,
    position_y,
    size_height,
    size_width,
    recurse,
    z,
  }: any) => {
    const router = useRouter();
    const cardInfo = board.documents[document_id];
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      setIsVisible(true);
    }, []);

    const calculateContentExtent = (boardInfo: any) => {
      if (!boardInfo.cards) return { width: 0, height: 0 };
      return boardInfo.cards.reduce(
        (max: any, c: any) => {
          const rightEdge = c.position_x + c.size_width;
          const bottomEdge = c.position_y + c.size_height;
          return {
            width: Math.max(max.width, rightEdge),
            height: Math.max(max.height, bottomEdge),
          };
        },
        { width: 0, height: 0 }
      );
    };

    const getScale = () => {
      if (cardInfo.type !== "board") return 0.1;
      const extent = calculateContentExtent(cardInfo);
      const scaleX = size_width / (extent.width || size_width);
      const scaleY = size_height / (extent.height || size_height);
      return Math.min(scaleX, scaleY, 1) * 0.9;
    };

    const scale = getScale();

    return (
      <div
        style={{
          position: "absolute",
          left: position_x,
          top: position_y,
          width: size_width,
          height: size_height,
          zIndex: z,
          cursor: cardInfo.type === "text" ? undefined : "pointer",
          opacity: isVisible ? 1 : 0,
          transform: `scale(${isVisible ? 1 : 0.8})`,
          transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
        }}
      >
        {/* If it's a URL, skip showing label. Otherwise, show label above. */}
        {cardInfo.type === "url" ? null : (
          <div
            style={{
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
              padding: "2px 0",
            }}
          >
            {cardInfo.label}
          </div>
        )}

        <div
          style={
            cardInfo.type === "text"
              ? {}
              : {
                  width: size_width,
                  height: size_height,
                  borderRadius: 8,
                  boxShadow: "rgb(206, 206, 205) 0px 0px 3px",
                  backgroundColor: "#F0F0EE",
                  overflow: "hidden",
                }
          }
          onClick={() => {
            // If we’re in a board (recurse=1) and the card isn't a URL,
            // navigate to that card’s route.
            if (recurse === 1 && cardInfo.type !== "url") {
              router.push(`/${document_id}`);
            }
          }}
        >
          {cardInfo.type !== "board" ? (
            <CardForType {...cardInfo} id={document_id} />
          ) : (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  transform: `scale(${scale})`,
                  transformOrigin: "0 0",
                  width: `${100 / scale}%`,
                  height: `${100 / scale}%`,
                }}
              >
                {recurse <= 3 ? (
                  <Board {...cardInfo} id={document_id} recurse={recurse + 1}  />
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

/* ------------------------------------------------------------------
   7) "CardForType" to pick the right sub-component for any card type.
   Notice how each sub-component is already "withParentLink"-wrapped,
   so they can show breadcrumbs if top-level.
------------------------------------------------------------------ */
function CardForType({ type, ...cardInfo }: any) {
  switch (type) {
    case "image":
      return <Image {...cardInfo} />;
    case "text":
      return <Text {...cardInfo} />;
    case "board":
      return <Board {...cardInfo} connections={cardInfo.connections || []} />;
    case "pdf":
      return <Pdf {...cardInfo} />;
    case "url":
      return <Url {...cardInfo} />;
    default:
      // If there's an unknown type, just show JSON for debugging
      return <pre>{JSON.stringify({ type, ...cardInfo }, null, 2)}</pre>;
  }
}

/* ------------------------------------------------------------------
   8) The main "Muse" component that picks which board/card to show
      based on the current URL. This is typically your top-level route.
------------------------------------------------------------------ */
export function MuseBoard() {
  const pathname = usePathname();
  const [boardId, setBoardId] = useState(board.root);

  useEffect(() => {
    // e.g. /abc => boardId= "abc"
    const segments = pathname?.split("/").filter(Boolean) || [];
    const lastSegment = segments[segments.length - 1] || board.root;
    setBoardId(lastSegment === "muse" ? board.root : lastSegment);
  }, [pathname]);

  const currentDoc = board.documents[boardId] || board.documents[board.root];

  return (
    <>
      {/* Global style override */}
      <style jsx global>{`
        body {
          background-color: #dfdfde;
          font-family: sans-serif;
        }
      `}</style>

      {/* Render the chosen card/board at top-level (recurse=0) */}
      <CardForType {...currentDoc} id={boardId} recurse={0} connections={currentDoc.connections || []} />
    </>
  );
}

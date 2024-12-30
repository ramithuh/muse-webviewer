// opengraph-image.tsx
import { ImageResponse } from 'next/og';
import contents from '../../public/Public/contents.json';
import { Board, Card, Document } from './types';

export const runtime = 'edge';
export const alt = 'Muse Board Preview';
export const contentType = 'image/png';
export const size = {
  width: 1200,
  height: 630,
};

// Helper functions
const calculateContentExtent = (boardInfo: Document): { width: number; height: number } => {
  if (!boardInfo.cards) return { width: 0, height: 0 };
  return boardInfo.cards.reduce(
    (max, card) => ({
      width: Math.max(max.width, card.position_x + card.size_width),
      height: Math.max(max.height, card.position_y + card.size_height),
    }),
    { width: 0, height: 0 }
  );
};

const getScale = (boardInfo: Document, containerWidth: number, containerHeight: number): number => {
  const extent = calculateContentExtent(boardInfo);
  const scaleX = containerWidth / (extent.width || containerWidth);
  const scaleY = containerHeight / (extent.height || containerHeight);
  return Math.min(scaleX, scaleY, 1) * 0.9;
};

// Component to render individual cards
// RenderCard Component (Extended)
const RenderCard = ({
    card,
    scale,
    documents,
  }: {
    card: Card;
    scale: number;
    documents: Record<string, Document>;
  }) => {
    const cardInfo = documents[card.document_id];
    if (!cardInfo) return null;
  
    const styles: React.CSSProperties = {
      position: 'absolute',
      left: `${card.position_x * scale}px`,
      top: `${card.position_y * scale}px`,
      width: `${card.size_width * scale}px`,
      height: `${card.size_height * scale}px`,
      background: cardInfo.type === 'text' ? 'transparent' : '#F0F0EE',
      borderRadius: '8px',
      boxShadow: cardInfo.type === 'text' ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: card.z || 1,
    };
  
    // Render different card types
    const renderContent = () => {
      switch (cardInfo.type) {
        case 'text':
          return (
            <div
              style={{
                padding: '12px',
                fontSize: '14px',
                color: '#171717',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap',
              }}
            >
              {cardInfo.label}
            </div>
          );
        case 'url':
          return (
            <div
              style={{
                padding: '10px',
                fontSize: '14px',
                color: '#171717',
              }}
            >
              {cardInfo.label || cardInfo.type}
            </div>
          );
        case 'image':
          return (
            <img
              src={`/${b_name}/files/${cardInfo.original_file}`}
              alt={cardInfo.label || 'Image'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          );
        // Add more cases as needed
        default:
          return null;
      }
    };
  
    return <div style={styles}>{renderContent()}</div>;
  };
  

// Main Image Component
export default async function Image({ params }: { params: { id: string } }) {
  const { id } = params;
  const board: Document | undefined = contents.documents[id];

  if (!board) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#dfdfde',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            color: '#171717',
          }}
        >
          Board Not Found
        </div>
      ),
      { ...size }
    );
  }

  const containerWidth = size.width - 80;
  const containerHeight = size.height - 120;
  const scale = getScale(board, containerWidth, containerHeight);

  return new ImageResponse(
    (
      <div
        style={{
          background: '#dfdfde',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          padding: '40px',
          boxSizing: 'border-box',
        }}
      >
        {/* Render Cards */}
        <div
          style={{
            position: 'absolute',
            top: '40px',
            left: '40px',
            width: `${containerWidth}px`,
            height: `${containerHeight}px`,
            display: 'flex',
            flexWrap: 'wrap',
            position: 'relative',
          }}
        >
          {board.cards.map((card: Card, index: number) => (
            <RenderCard key={index} card={card} scale={scale} documents={contents.documents} />
          ))}
        </div>

        {/* Board Title */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '40px',
            right: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '32px',
              color: '#171717',
              margin: '0',
              fontWeight: '500',
              textAlign: 'center',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {board.label || 'Untitled Board'}
          </h1>
        </div>
      </div>
    ),
    {
      ...size,
      headers: {
        'Cache-Control': 'public, immutable, no-transform, s-maxage=86400, max-age=86400',
      },
    }
  );
}

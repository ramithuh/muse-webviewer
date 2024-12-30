import { ImageResponse } from 'next/og'
import contents from '../../public/Public/contents.json'

export const runtime = 'edge'
export const alt = 'Muse Board Preview'
export const contentType = 'image/png'
export const size = {
  width: 1200,
  height: 630
}

function calculateContentExtent(boardInfo: any) {
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
}

export default async function Image({ params }: { params: { id: string } }) {
  const { id } = await params
  const board = contents.documents[id]
  const cards = board?.cards || []
  
  const extent = calculateContentExtent(board)
  const scale = Math.min(
    size.width / (extent.width || size.width),
    size.height / (extent.height || size.height),
    1
  ) * 0.9

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
          padding: '40px'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 40,
          left: 40,
          right: 40,
          bottom: 40,
          display: 'flex'
        }}>
          {cards.map((card, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: card.position_x * scale,
                top: card.position_y * scale,
                width: card.size_width * scale,
                height: card.size_height * scale,
                background: '#F0F0EE',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            right: 40,
            display: 'flex'
          }}
        >
          <h1 style={{
            fontSize: 48,
            color: '#171717',
            margin: 0
          }}>
            {board?.label || 'Untitled Board'}
          </h1>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

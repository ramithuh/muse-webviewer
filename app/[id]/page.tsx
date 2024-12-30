import { MuseBoard } from '@/src/components/ui/muse-board';
import contents from '../../public/Public/contents.json'

export const runtime = 'edge';

export default function MuseBoardPage() {
  return (
    <main className="min-h-screen p-4">
      <MuseBoard />
    </main>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { id } = await params
  const board = contents.documents[id]
  
  if (!board) {
    return {
      title: 'Board Not Found',
      description: 'The requested board could not be found'
    }
  }
  
  return {
    title: board.label || 'Untitled Board',
    description: `Interactive Muse board created on ${new Date(board.created_at).toLocaleDateString()}`,
    openGraph: {
      title: board.label || 'Untitled Board',
      description: `Interactive Muse board created on ${new Date(board.created_at).toLocaleDateString()}`,
      type: 'website',
    }
  }
}

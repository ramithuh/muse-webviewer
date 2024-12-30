import { MuseBoard } from '@/src/components/ui/muse-board';

export const runtime = 'edge';

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <MuseBoard />
    </main>
  );
}

import Downloader from '@/components/Downloader';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24 relative overflow-hidden">
      {/* Decorative blurred background elements */}
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-brand-500/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-neon-purple/10 blur-[120px] rounded-full pointer-events-none" />

      <Downloader />
    </main>
  );
}

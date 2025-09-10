'use client';

import { useAtom } from "jotai";
import { useEffect } from "react";
import { pageAtom } from "./MangaBook3D";
import Link from "next/link";
import { ArrowLeft, Home, ShoppingBag, Pause, Play } from "lucide-react";
import { atom } from "jotai";

// Atom for controlling float animation
export const floatEnabledAtom = atom(true);

interface MangaUIProps {
  pages: Array<{
    front: string;
    back: string;
  }>;
  chapterTitle: string;
  chapterNumber: number;
}

export const MangaUI = ({ pages, chapterTitle, chapterNumber }: MangaUIProps) => {
  const [page, setPage] = useAtom(pageAtom);
  const [floatEnabled, setFloatEnabled] = useAtom(floatEnabledAtom);

  useEffect(() => {
    // Reset page when component mounts
    setPage(0);
  }, [setPage]);

  // Simple keyboard controls
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
        case 'Enter':
          event.preventDefault();
          setFloatEnabled(!floatEnabled);
          break;
        case 'Escape':
          event.preventDefault();
          window.location.href = '/manga';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [floatEnabled, setFloatEnabled]);

  useEffect(() => {
    // Play page flip sound (optional)
    if (typeof window !== 'undefined') {
      try {
        const audio = new Audio("/sounds/page-flip.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio errors (autoplay restrictions)
        });
      } catch (error) {
        // Ignore audio errors
      }
    }
  }, [page]);

  return (
    <>
      {/* Header Navigation */}
      <header className="pointer-events-auto fixed top-0 left-0 right-0 z-20 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left side - Back button */}
          <div className="flex items-center gap-4">
            <Link 
              href="/manga"
              className="flex items-center gap-2 text-white hover:text-purple-300 transition-colors"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Rozdziały</span>
            </Link>
          </div>
          
          {/* Center - Title */}
          <h1 className="text-lg sm:text-xl font-semibold text-white text-center">
            {chapterTitle}
          </h1>
          
          {/* Right side - Navigation */}
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="text-white hover:text-purple-300 transition-colors"
              title="Strona główna"
            >
              <Home size={20} />
            </Link>
            <Link 
              href="/sklep"
              className="text-white hover:text-purple-300 transition-colors"
              title="Sklep"
            >
              <ShoppingBag size={20} />
            </Link>
          </div>
        </div>
      </header>

      {/* Floating Back Button */}
      <div className="pointer-events-auto fixed left-4 top-32 z-30">
        <Link
          href="/manga"
          className="flex items-center gap-2 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white px-4 py-3 rounded-full transition-colors shadow-lg"
          title="Powrót do rozdziałów"
        >
          <ArrowLeft size={20} />
          <span className="hidden sm:inline">Cofnij</span>
        </Link>
      </div>

      {/* Main UI */}
      <main className="pointer-events-none select-none z-10 fixed inset-0 flex justify-between flex-col pt-20">
        

        {/* Physical version info - moved to side */}
        <div className="pointer-events-auto fixed right-4 top-1/2 transform -translate-y-1/2 z-30 hidden lg:block">
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 max-w-xs">
            <h3 className="text-white text-sm font-semibold mb-2">
              🎁 Fizyczna wersja
            </h3>
            <p className="text-gray-300 text-xs mb-3">
              Zdobądź mangę kupując w sklepie
            </p>
            <Link 
              href="/sklep"
              className="inline-block bg-white/20 text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-white/30 transition-colors"
            >
              Sklep →
            </Link>
          </div>
        </div>

        {/* Spacer for content */}
        <div className="flex-1"></div>

        {/* Bottom Navigation */}
        <div className="pointer-events-auto p-6">
          {/* Page Navigation */}
          <div className="w-full overflow-auto flex justify-center mb-4">
            <div className="overflow-auto flex items-center gap-2 max-w-full p-4 bg-black/20 backdrop-blur-sm rounded-full">
              {[...pages].map((_, index) => (
                <button
                  key={index}
                  className={`border-transparent hover:border-white transition-all duration-300 px-3 py-2 rounded-full text-sm uppercase shrink-0 border ${
                    index === page
                      ? "bg-white/90 text-black"
                      : "bg-black/30 text-white hover:bg-black/50"
                  }`}
                  onClick={() => setPage(index)}
                >
                  {index === 0 ? "Okładka" : `${index}`}
                </button>
              ))}
              <button
                className={`border-transparent hover:border-white transition-all duration-300 px-3 py-2 rounded-full text-sm uppercase shrink-0 border ${
                  page === pages.length
                    ? "bg-white/90 text-black"
                    : "bg-black/30 text-white hover:bg-black/50"
                }`}
                onClick={() => setPage(pages.length)}
              >
                Tył
              </button>
              
              {/* Float toggle button */}
              <div className="w-px h-6 bg-white/20 mx-2"></div>
              <button
                onClick={() => setFloatEnabled(!floatEnabled)}
                className={`border-transparent hover:border-white transition-all duration-300 px-3 py-2 rounded-full text-sm shrink-0 border flex items-center gap-2 ${
                  floatEnabled
                    ? "bg-purple-600/80 text-white"
                    : "bg-black/30 text-white hover:bg-black/50"
                }`}
                title={floatEnabled ? "Wyłącz animację" : "Włącz animację"}
              >
                {floatEnabled ? <Pause size={16} /> : <Play size={16} />}
                <span className="hidden sm:inline">
                  {floatEnabled ? "Zatrzymaj" : "Animuj"}
                </span>
              </button>
            </div>
          </div>

          {/* Physical version info for mobile */}
          <div className="lg:hidden bg-black/20 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto text-center">
            <h3 className="text-white text-sm font-semibold mb-2">
              🎁 Chcesz fizyczną wersję?
            </h3>
            <p className="text-gray-300 text-xs mb-3">
              Zdobądź ekskluzywną mangę kupując dowolny produkt w naszym sklepie
            </p>
            <Link 
              href="/sklep"
              className="inline-block bg-white text-black px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Zobacz sklep →
            </Link>
          </div>
        </div>
      </main>

      {/* Mobile Controls */}
      <div className="pointer-events-auto fixed bottom-4 left-4 right-4 z-20 md:hidden">
        <div className="flex justify-between items-center bg-black/40 backdrop-blur-sm rounded-full px-4 py-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="text-white disabled:text-gray-500 p-2"
          >
            ← Poprzednia
          </button>
          
          <span className="text-white text-sm">
            {page === 0 ? "Okładka" : page === pages.length ? "Tył" : `Strona ${page}`}
          </span>
          
          <button
            onClick={() => setPage(Math.min(pages.length, page + 1))}
            disabled={page === pages.length}
            className="text-white disabled:text-gray-500 p-2"
          >
            Następna →
          </button>
        </div>
      </div>
    </>
  );
};
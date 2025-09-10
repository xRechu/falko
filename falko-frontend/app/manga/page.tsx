import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function MangaPage() {
  const chapters = [
    {
      id: 1,
      title: "Rozdział 1: Początek",
      description: "Pierwsza część przygody Falko Project",
      coverImage: "/manga/rozdzial-1/cover.jpg",
      pages: 16
    },
    {
      id: 2, 
      title: "Rozdział 2: Rozwój",
      description: "Kontynuacja historii",
      coverImage: "/manga/rozdzial-2/cover.jpg", 
      pages: 18
    },
    {
      id: 3,
      title: "Rozdział 3: Wyzwanie", 
      description: "Najtrudniejsze momenty",
      coverImage: "/manga/rozdzial-3/cover.jpg",
      pages: 20
    },
    {
      id: 4,
      title: "Rozdział 4: Finał",
      description: "Epickie zakończenie serii",
      coverImage: "/manga/rozdzial-4/cover.jpg",
      pages: 22
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            📚 Manga Falko Project
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Odkryj ekskluzywną mangę Falko Project w interaktywnym formacie 3D. 
            Cztery rozdziały pełne przygód czekają na Ciebie!
          </p>
        </div>

        {/* Bonus Info */}
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-6 mb-12 border border-purple-500/30">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-white mb-2">
              🎁 Bonus dla klientów!
            </h3>
            <p className="text-gray-300">
              Zdobądź fizyczną wersję tej mangi kupując dowolny produkt w naszym sklepie
            </p>
            <Link 
              href="/sklep"
              className="inline-block mt-4 bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Zobacz sklep →
            </Link>
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {chapters.map((chapter) => (
            <Link key={chapter.id} href={`/manga/rozdzial-${chapter.id}`}>
              <Card className="bg-black/40 border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-105 cursor-pointer group">
                <div className="p-6">
                  {/* Cover placeholder */}
                  <div className="aspect-[3/4] bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {chapter.id}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {chapter.title}
                  </h3>
                  
                  <p className="text-gray-400 text-sm mb-3">
                    {chapter.description}
                  </p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>{chapter.pages} stron</span>
                    <span className="text-purple-400">Czytaj →</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Back to home */}
        <div className="text-center mt-16">
          <Link 
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Powrót do strony głównej
          </Link>
        </div>
      </div>
    </div>
  );
}
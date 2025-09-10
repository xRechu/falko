'use client';

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

/**
 * Główna strona 404 - Not Found
 * Automatycznie przewija do góry przy załadowaniu
 */
export default function NotFound() {
  // Automatyczne przewinięcie do góry przy załadowaniu strony
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8 max-w-lg mx-auto px-4">
        {/* 404 Header */}
        <div className="space-y-4">
          <div className="text-8xl font-bold text-primary/20 select-none">
            404
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Strona nie znaleziona
          </h1>
          <p className="text-lg text-muted-foreground">
            Przepraszamy, ale strona którą próbujesz odwiedzić nie istnieje lub została przeniesiona.
          </p>
        </div>
        
        {/* Sugestie */}
        <div className="bg-muted/50 p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Co możesz zrobić?
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li>• Sprawdź czy adres URL jest poprawny</li>
            <li>• Użyj wyszukiwarki aby znaleźć to czego szukasz</li>
            <li>• Wróć na stronę główną i zacznij od nowa</li>
            <li>• Przeglądaj nasze produkty w sklepie</li>
          </ul>
        </div>
        
        {/* Przyciski nawigacji */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button asChild variant="default" className="w-full">
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Strona główna
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/sklep">
              <Search className="h-4 w-4 mr-2" />
              Przejdź do sklepu
            </Link>
          </Button>
        </div>
        
        {/* Przycisk powrotu */}
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Wróć do poprzedniej strony
        </Button>
      </div>
    </div>
  );
}

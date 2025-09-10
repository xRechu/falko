'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/context/auth-context';
import { LoyaltyPointsDisplay } from '@/components/shared/LoyaltyPointsDisplay';
import { 
  User, 
  LogOut, 
  Settings, 
  Package, 
  MapPin, 
  Star,
  UserPlus,
  LogIn,
  ChevronDown
} from 'lucide-react';

/**
 * Dropdown menu dla konta użytkownika w headerze (desktop only)
 * Zawiera logowanie/rejestrację lub informacje o koncie zalogowanego użytkownika
 */
export function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { state, logout } = useAuth();

  // Zamknij dropdown przy kliknięciu poza nim
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-2 text-foreground/60 hover:text-foreground relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <User className="h-4 w-4" />
        <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        
        {/* Badge dla zalogowanych użytkowników */}
        {state.isAuthenticated && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
        )}
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card className="p-0 shadow-lg border">
            {state.isAuthenticated ? (
              /* Zalogowany użytkownik */
              <div className="p-4 space-y-4">
                {/* Powitanie */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Cześć, {state.user?.first_name || 'User'}!
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {state.user?.email}
                    </p>
                  </div>
                </div>

                {/* Punkty lojalnościowe */}
                <div className="bg-muted/30 p-3 rounded-lg">
                  <LoyaltyPointsDisplay variant="profile" />
                </div>

                <Separator />

                {/* Menu opcji */}
                <div className="space-y-1">
                  <Button 
                    asChild 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-2"
                    onClick={handleLinkClick}
                  >
                    <Link href="/konto">
                      <User className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Moje konto</div>
                        <div className="text-xs text-muted-foreground">Profil i ustawienia</div>
                      </div>
                    </Link>
                  </Button>

                  <Button 
                    asChild 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-2"
                    onClick={handleLinkClick}
                  >
                    <Link href="/konto?tab=orders">
                      <Package className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Moje zamówienia</div>
                        <div className="text-xs text-muted-foreground">Historia zakupów</div>
                      </div>
                    </Link>
                  </Button>

                  <Button 
                    asChild 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-2"
                    onClick={handleLinkClick}
                  >
                    <Link href="/konto?tab=addresses">
                      <MapPin className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Adresy</div>
                        <div className="text-xs text-muted-foreground">Zarządzaj adresami</div>
                      </div>
                    </Link>
                  </Button>

                  <Button 
                    asChild 
                    variant="ghost" 
                    className="w-full justify-start h-auto p-2"
                    onClick={handleLinkClick}
                  >
                    <Link href="/konto?tab=loyalty">
                      <Star className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Program lojalnościowy</div>
                        <div className="text-xs text-muted-foreground">Punkty i nagrody</div>
                      </div>
                    </Link>
                  </Button>
                </div>

                <Separator />

                {/* Wylogowanie */}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Wyloguj się
                </Button>
              </div>
            ) : (
              /* Niezalogowany użytkownik */
              <div className="p-4 space-y-4">
                {/* Nagłówek */}
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">Dołącz do nas!</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Zaloguj się lub załóż konto, aby korzystać ze wszystkich funkcji
                  </p>
                </div>

                {/* Przyciski logowania */}
                <div className="space-y-2">
                  <Button 
                    asChild 
                    className="w-full"
                    onClick={handleLinkClick}
                  >
                    <Link href="/login">
                      <LogIn className="h-4 w-4 mr-2" />
                      Zaloguj się
                    </Link>
                  </Button>

                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full"
                    onClick={handleLinkClick}
                  >
                    <Link href="/register">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Załóż konto
                    </Link>
                  </Button>
                </div>

                <Separator />

                {/* Korzyści z rejestracji */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Korzyści z konta:
                  </p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Star className="h-3 w-3 text-amber-500" />
                      <span>Zdobywaj punkty lojalnościowe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-3 w-3 text-blue-500" />
                      <span>Śledź status zamówień</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-green-500" />
                      <span>Zapisuj adresy dostawy</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

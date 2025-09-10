"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ApiStatus from "@/components/ui/api-status";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AccountDropdown } from "@/components/shared/AccountDropdown";
import { useAuth } from "@/lib/context/auth-context";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Menu, X, User, LogOut } from "lucide-react";

/**
 * Główny nagłówek strony dla Falko Project
 * - Sticky navigation z ciemnym tłem
 * - Logo w centrum
 * - Menu nawigacyjne
 * - Ikona koszyka
 * - Responsywny design
 */
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { state, logout } = useAuth();

  const navigationLinks = [
    { href: "/sklep", label: "Sklep" },
    { href: "/manga", label: "Manga" },
    { href: "/nowosci", label: "Nowości" },
    { href: "/o-nas", label: "O Nas" },
  ];

  const handleLogout = async () => {
    await logout();
    setIsMobileMenuOpen(false); // Zamknij mobile menu po wylogowaniu
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Desktop Layout */}
        <div className="hidden md:block">
          {/* Logo Row */}
          <div className="flex h-16 items-center justify-between">
            <div></div> {/* Spacer */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold tracking-tight">
                Falko Project
              </span>
            </Link>
            {/* User Auth & Shopping Cart Icons */}
            <div className="flex items-center gap-3">
              <ApiStatus />
              <ThemeToggle />
              <AccountDropdown />
              <CartDrawer />
            </div>
          </div>
          
          {/* Navigation Row */}
          <div className="flex h-12 items-center justify-center border-t border-border/20">
            <nav className="flex items-center space-x-8">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-10 w-10 p-0"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>

            {/* Logo - Center on mobile */}
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold tracking-tight">
                Falko Project
              </span>
            </Link>

            {/* Shopping Cart Icon + Auth (Mobile) */}
            <div className="flex items-center gap-2">
              <ThemeToggle size="sm" />
              {/* Mobile Auth Quick Access */}
              {state.isAuthenticated ? (
                <div className="flex items-center gap-1">
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Link href="/konto">
                      <User className="h-4 w-4" />
                      <span className="sr-only">Moje konto</span>
                    </Link>
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Wyloguj</span>
                  </Button>
                </div>
              ) : (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Link href="/login">
                    <User className="h-4 w-4" />
                    <span className="sr-only">Zaloguj się</span>
                  </Link>
                </Button>
              )}
              
              <CartDrawer />
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="border-t border-border/40 pb-4 pt-4">
              <nav className="flex flex-col space-y-4">
                {/* Main Navigation */}
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                
                {/* Auth Section - Mobile */}
                <div className="pt-2 border-t border-border/20">
                  {state.isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <User className="h-4 w-4 text-foreground/60" />
                        <span className="text-sm text-foreground/80">
                          Cześć, {state.user?.first_name || 'User'}!
                        </span>
                      </div>
                      <Link
                        href="/konto"
                        className="flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Moje konto
                      </Link>
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 px-1 text-foreground/60 hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Wyloguj się
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        href="/login"
                        className="flex items-center gap-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground py-1"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        Zaloguj się
                      </Link>
                      <Link
                        href="/register"
                        className="block text-sm font-medium text-primary transition-colors hover:text-primary/80 py-1 pl-6"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Załóż konto
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { Instagram, Facebook, Twitter } from "lucide-react";

/**
 * Stopka strony dla Falko Project
 * - Trzy kolumny: Logo/Copyright, Social Media, Legal Links
 * - Ciemne tło zgodne z premium designem
 * - Responsywny layout
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "Instagram",
      href: "https://instagram.com/falkoproject",
      icon: Instagram,
    },
    {
      name: "Facebook", 
      href: "https://facebook.com/falkoproject",
      icon: Facebook,
    },
    {
      name: "X (Twitter)",
      href: "https://x.com/falkoproject",
      icon: Twitter,
    },
  ];

  const legalLinks = [
    {
      name: "Regulamin",
      href: "/regulamin",
    },
    {
      name: "Polityka Prywatności",
      href: "/polityka-prywatnosci",
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Column 1: Logo & Copyright */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold tracking-tight">
                Falko Project
              </span>
            </Link>
            <p className="text-sm text-gray-400">
              Premium streetwear dla wymagających.
            </p>
            <p className="text-xs text-gray-500">
              © {currentYear} Falko Project. Wszelkie prawa zastrzeżone.
            </p>
          </div>

          {/* Column 2: Social Media */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Śledź nas
            </h3>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 transition-colors hover:text-white"
                    aria-label={social.name}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>
            <div className="space-y-2">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {social.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 3: Legal Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
              Informacje prawne
            </h3>
            <div className="space-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-sm text-gray-400 transition-colors hover:text-white"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="mt-8 border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-xs text-gray-500">
              Sklep internetowy z premium streetwearem
            </p>
            <p className="text-xs text-gray-500">
              Wykonane z ❤️ dla miłośników mody
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

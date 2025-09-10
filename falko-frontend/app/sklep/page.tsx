import { Metadata } from "next";
import ShopPageClient from "@/components/pages/ShopPageClient";

/**
 * Metadata dla strony sklepu
 */
export const metadata: Metadata = {
  title: "Sklep - Falko Project",
  description: "Przeglądaj pełną kolekcję premium streetwearu Falko Project. Bluzy, koszulki i czapki najwyższej jakości.",
};

/**
 * Server Component - Strona główna sklepu
 */
export default function ShopPage() {
  return <ShopPageClient />;
}

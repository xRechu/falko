import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CallToAction() {
  return (
    <section className="py-20 bg-gradient-to-r from-neutral-900 to-neutral-800">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
          Gotowy na nowy styl?
        </h2>
        <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
          Dołącz do tysięcy zadowolonych klientów i odkryj premium streetwear, 
          który podkreśli Twoją indywidualność.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/sklep">
            <Button size="lg" className="bg-white text-black hover:bg-neutral-100">
              Odkryj kolekcję
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/newsletter">
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
              Zapisz się do newslettera
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

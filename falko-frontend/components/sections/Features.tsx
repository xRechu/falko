import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Sparkles, 
  Leaf, 
  Users 
} from "lucide-react";

const FeaturesSkeleton = () => {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
  );
};

const features = [
  {
    title: "Najwyższa jakość",
    description: "Każdy produkt przechodzi szczegółową kontrolę jakości. Używamy tylko najlepszych materiałów i technik produkcji.",
    header: <FeaturesSkeleton />,
    icon: <ShieldCheck className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Szybka dostawa",
    description: "Darmowa dostawa kurierska od 200 zł. Standardowa dostawa w 24-48 godzin na terenie całej Polski.",
    header: <FeaturesSkeleton />,
    icon: <Truck className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "30 dni na zwrot",
    description: "Nie jesteś zadowolony? Masz 30 dni na bezpłatny zwrot bez podania przyczyny. Pełen refund gwarantowany.",
    header: <FeaturesSkeleton />,
    icon: <RotateCcw className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-2",
  },
  {
    title: "Limitowane edycje",
    description: "Nasze produkty są wypuszczane w ograniczonych nakładach. Gdy się skończą, nie wracają.",
    header: <FeaturesSkeleton />,
    icon: <Sparkles className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-2",
  },
  {
    title: "Eco-friendly",
    description: "100% bawełna organiczna, opakowania z materiałów recyclingu. Dbamy o planetę.",
    header: <FeaturesSkeleton />,
    icon: <Leaf className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Społeczność",
    description: "Dołącz do społeczności Falko Project. Dziel się swoim stylem i inspiruj innych.",
    header: <FeaturesSkeleton />,
    icon: <Users className="h-4 w-4 text-neutral-500" />,
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">
            Dlaczego Falko Project?
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Nasze wartości i zobowiązania wobec klientów. Jakość, która się liczy.
          </p>
        </div>
        
        <BentoGrid className="max-w-6xl mx-auto">
          {features.map((item, i) => (
            <BentoGridItem
              key={i}
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={item.className}
            />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

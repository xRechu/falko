import { ProductPreview } from "@/lib/types/product";

/**
 * Przykładowe dane produktów do testowania
 * Zgodne z typami Medusa.js API
 * Będą zastąpione prawdziwymi API calls do http://localhost:9000
 */
export const mockProducts: ProductPreview[] = [
  {
    id: "prod_01HQZX5T2J9K8P3R4S6V7W8X9Y",
    title: "Falko Hoodie Premium Black",
    handle: "falko-hoodie-premium-black",
    thumbnail: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&crop=center",
    price: {
      amount: 25000, // 250.00 PLN w groszach
      currency_code: "pln",
    },
    collection: {
      id: "pcol_01HQZX5T2J9K8P3R4S6V7W8X9Y",
      title: "Hoodies",
    },
  },
  {
    id: "prod_01HQZX5T2J9K8P3R4S6V7W8X9Z", 
    title: "Falko T-shirt Essentials White",
    handle: "falko-tshirt-essentials-white",
    thumbnail: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
    price: {
      amount: 12000, // 120.00 PLN w groszach
      currency_code: "pln",
    },
    collection: {
      id: "pcol_01HQZX5T2J9K8P3R4S6V7W8XAA",
      title: "T-Shirts",
    },
  },
  {
    id: "prod_01HQZX5T2J9K8P3R4S6V7W8XBB",
    title: "Falko Cap Streetwear Navy",
    handle: "falko-cap-streetwear-navy",
    thumbnail: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop&crop=center",
    price: {
      amount: 8000, // 80.00 PLN w groszach
      currency_code: "pln",
    },
    collection: {
      id: "pcol_01HQZX5T2J9K8P3R4S6V7W8XCC",
      title: "Caps",
    },
  },
  {
    id: "prod_01HQZX5T2J9K8P3R4S6V7W8XDD",
    title: "Falko Hoodie Limited Edition Gray",
    handle: "falko-hoodie-limited-edition-gray",
    thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center",
    price: {
      amount: 30000, // 300.00 PLN w groszach
      currency_code: "pln",
    },
    collection: {
      id: "pcol_01HQZX5T2J9K8P3R4S6V7W8X9Y",
      title: "Hoodies",
    },
  },
];

/**
 * Backup mock data z placeholder obrazami (dla przypadków gdy zewnętrzne domeny nie są dostępne)
 */
export const mockProductsPlaceholder: ProductPreview[] = [
  {
    id: "prod_placeholder_01",
    title: "Falko Hoodie Premium Black",
    handle: "falko-hoodie-premium-black-placeholder",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Ib29kaWU8L3RleHQ+PC9zdmc+",
    price: {
      amount: 25000,
      currency_code: "pln",
    },
  },
  {
    id: "prod_placeholder_02", 
    title: "Falko T-shirt Essentials White",
    handle: "falko-tshirt-essentials-white-placeholder",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ULXNoaXJ0PC90ZXh0Pjwvc3ZnPg==",
    price: {
      amount: 12000,
      currency_code: "pln",
    },
  },
  {
    id: "prod_placeholder_03",
    title: "Falko Cap Streetwear Navy",
    handle: "falko-cap-streetwear-navy-placeholder",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNGI1NTYzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2FwPC90ZXh0Pjwvc3ZnPg==",
    price: {
      amount: 8000,
      currency_code: "pln",
    },
  },
  {
    id: "prod_placeholder_04",
    title: "Falko Hoodie Limited Edition Gray",
    handle: "falko-hoodie-limited-edition-gray-placeholder",
    thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjOTM5Mzk5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SG9vZGllIDI8L3RleHQ+PC9zdmc+",
    price: {
      amount: 30000,
      currency_code: "pln",
    },
  },
];

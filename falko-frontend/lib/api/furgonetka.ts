/**
 * Furgonetka.pl API Integration
 * Integracja z API Furgonetka.pl dla kalkulacji kosztów wysyłki i zarządzania przesyłkami
 */

// ====================================================================
// TYPES & INTERFACES
// ====================================================================

/**
 * Wymiary paczki
 */
export interface PackageDimensions {
  length: number; // cm
  width: number;  // cm  
  height: number; // cm
  weight: number; // kg
}

/**
 * Adres dostawy
 */
export interface DeliveryAddress {
  postal_code: string;
  city: string;
  country_code?: string; // domyślnie 'PL'
}

/**
 * Opcje dostawy z Furgonetka
 */
export interface FurgonetkaShippingOption {
  provider: string;        // np. "DPD", "InPost", "DHL"
  service_name: string;    // nazwa usługi
  price: number;          // cena w złotówkach
  delivery_time: string;  // czas dostawy, np. "1-2 dni robocze"
  pickup_points?: FurgonetkaPickupPoint[];
}

/**
 * Punkt odbioru (dla InPost, itp.)
 */
export interface FurgonetkaPickupPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Zapytanie o kalkulację wysyłki
 */
export interface ShippingCalculationRequest {
  package: PackageDimensions;
  delivery_address: DeliveryAddress;
  pickup_method?: 'courier' | 'point'; // odbiór przez kuriera lub punkt
}

/**
 * Odpowiedź z kalkulacją
 */
export interface ShippingCalculationResponse {
  success: boolean;
  options: FurgonetkaShippingOption[];
  error?: string;
}

/**
 * Zamówienie przesyłki
 */
export interface CreateShipmentRequest {
  sender: {
    name: string;
    company?: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postal_code: string;
  };
  recipient: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    postal_code: string;
  };
  package: PackageDimensions;
  service_provider: string;
  pickup_point_id?: string;
  insurance_amount?: number;
  cod_amount?: number; // kwota pobrania
  notes?: string;
}

export interface CreateShipmentResponse {
  success: boolean;
  shipment_id?: string;
  tracking_number?: string;
  label_url?: string;
  error?: string;
}

// ====================================================================
// CONFIGURATION
// ====================================================================

/**
 * Konfiguracja API Furgonetka
 * W produkcji te klucze powinny być w zmiennych środowiskowych
 */
const FURGONETKA_CONFIG = {
  // Używamy lokalnego proxy w development, prawdziwego API w produkcji
  baseUrl: process.env.NODE_ENV === 'development' 
    ? '/api/shipping' // Nasz Next.js proxy endpoint
    : (process.env.FURGONETKA_API_URL || 'https://api.furgonetka.pl/v1'),
  apiKey: process.env.FURGONETKA_API_KEY || 'mock-api-key',
  // Domyślne wymiary dla produktów Falko Project (bluzy, t-shirty, czapki)
  defaultPackage: {
    length: 30,
    width: 25, 
    height: 5,
    weight: 0.5
  } as PackageDimensions,
  // Adres nadawcy (sklep Falko Project)
  senderAddress: {
    name: 'Falko Project',
    phone: '+48123456789',
    email: 'zamowienia@falkoproject.com',
    address: 'ul. Przykładowa 1',
    city: 'Warszawa',
    postal_code: '00-001'
  }
};

// ====================================================================
// MOCK DATA (dla developmentu bez prawdziwego API)
// ====================================================================

/**
 * Mock dane - symulacja odpowiedzi API Furgonetka
 * W produkcji zastąpić prawdziwymi wywołaniami API
 */
const MOCK_SHIPPING_OPTIONS: FurgonetkaShippingOption[] = [
  {
    provider: 'DPD',
    service_name: 'DPD Standard',
    price: 12.99,
    delivery_time: '1-2 dni robocze'
  },
  {
    provider: 'InPost',
    service_name: 'InPost Paczkomaty 24/7',
    price: 9.99,
    delivery_time: '1-2 dni robocze',
    pickup_points: [
      {
        id: 'WAW001',
        name: 'Paczkomat WAW001',
        address: 'ul. Marszałkowska 1',
        city: 'Warszawa',
        postal_code: '00-001'
      },
      {
        id: 'WAW002', 
        name: 'Paczkomat WAW002',
        address: 'ul. Nowy Świat 20',
        city: 'Warszawa',
        postal_code: '00-001'
      }
    ]
  },
  {
    provider: 'GLS',
    service_name: 'GLS Standard',
    price: 11.50,
    delivery_time: '1-3 dni robocze'
  },
  {
    provider: 'UPS',
    service_name: 'UPS Standard',
    price: 18.99,
    delivery_time: '1-2 dni robocze'
  },
  {
    provider: 'DHL',
    service_name: 'DHL Express',
    price: 24.99,
    delivery_time: '24h'
  }
];

// ====================================================================
// CORE API FUNCTIONS
// ====================================================================

/**
 * Sprawdzenie dostępności API Furgonetka
 */
async function checkFurgonetkaApiHealth(): Promise<boolean> {
  try {
    // W rzeczywistej implementacji - ping do API
    console.log('🔍 Furgonetka API Health Check...');
    
    // Mock: zawsze dostępne w developmencie
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
    
    // W produkcji - prawdziwe wywołanie
    const response = await fetch(`${FURGONETKA_CONFIG.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FURGONETKA_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Furgonetka API niedostępne:', error);
    return false;
  }
}

/**
 * Kalkulacja kosztów wysyłki
 */
export async function calculateShippingCosts(
  request: ShippingCalculationRequest
): Promise<ShippingCalculationResponse> {
  try {
    console.log('🔄 Kalkulacja kosztów wysyłki Furgonetka...', request);
    
    const isApiHealthy = await checkFurgonetkaApiHealth();
    
    if (!isApiHealthy) {
      console.warn('⚠️ Furgonetka API niedostępne, używamy mock danych');
      return {
        success: true,
        options: MOCK_SHIPPING_OPTIONS.map(option => ({
          ...option,
          // Dodaj losową wariację ceny w zależności od kodu pocztowego
          price: option.price + (request.delivery_address.postal_code.startsWith('0') ? 2 : 0)
        }))
      };
    }
    
    // Prawdziwe wywołanie API (lub przez proxy w development)
    const isProxyMode = process.env.NODE_ENV === 'development';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Dodaj Authorization header tylko jeśli nie używamy proxy
    if (!isProxyMode) {
      headers['Authorization'] = `Bearer ${FURGONETKA_CONFIG.apiKey}`;
    }
    
    const response = await fetch(`${FURGONETKA_CONFIG.baseUrl}/calculate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        package: request.package,
        delivery_address: request.delivery_address,
        pickup_method: request.pickup_method || 'courier'
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      throw new Error(`Furgonetka API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Furgonetka kalkulacja zakończona:', data);
    
    return {
      success: true,
      options: data.shipping_options || []
    };
    
  } catch (error) {
    console.error('❌ Błąd kalkulacji Furgonetka:', error);
    
    // Fallback do mock danych
    return {
      success: false,
      options: MOCK_SHIPPING_OPTIONS,
      error: 'Błąd API Furgonetka - używane dane fallback'
    };
  }
}

/**
 * Pobieranie punktów odbioru dla danej usługi
 */
export async function getPickupPoints(
  provider: string,
  address: DeliveryAddress
): Promise<FurgonetkaPickupPoint[]> {
  try {
    console.log(`🔄 Pobieranie punktów odbioru ${provider}...`, address);
    
    const isApiHealthy = await checkFurgonetkaApiHealth();
    
    if (!isApiHealthy) {
      // Mock punkty dla InPost
      if (provider === 'InPost') {
        return MOCK_SHIPPING_OPTIONS
          .find(opt => opt.provider === 'InPost')?.pickup_points || [];
      }
      return [];
    }
    
    // Prawdziwe API call (lub przez proxy w development)
    const isProxyMode = process.env.NODE_ENV === 'development';
    const url = isProxyMode 
      ? `${FURGONETKA_CONFIG.baseUrl}/pickup-points?provider=${provider}&postal_code=${address.postal_code}&city=${encodeURIComponent(address.city)}`
      : `${FURGONETKA_CONFIG.baseUrl}/pickup-points`;
      
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Dodaj Authorization header tylko jeśli nie używamy proxy
    if (!isProxyMode) {
      headers['Authorization'] = `Bearer ${FURGONETKA_CONFIG.apiKey}`;
    }
    
    const requestOptions: RequestInit = {
      headers,
      signal: AbortSignal.timeout(10000)
    };
    
    if (isProxyMode) {
      // W proxy mode używamy GET z query params
      requestOptions.method = 'GET';
    } else {
      // W production używamy POST z body
      requestOptions.method = 'POST';
      requestOptions.body = JSON.stringify({
        provider,
        delivery_address: address,
        radius: 5000 // 5km
      });
    }
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`Furgonetka pickup points API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.pickup_points || [];
    
  } catch (error) {
    console.error('❌ Błąd pobierania punktów odbioru:', error);
    return [];
  }
}

/**
 * Utworzenie przesyłki po złożeniu zamówienia
 */
export async function createShipment(
  request: CreateShipmentRequest
): Promise<CreateShipmentResponse> {
  try {
    console.log('🔄 Tworzenie przesyłki Furgonetka...', request);
    
    const isApiHealthy = await checkFurgonetkaApiHealth();
    
    if (!isApiHealthy) {
      // Mock response
      const mockShipmentId = `FRG${Date.now()}`;
      console.log('⚠️ Mock utworzenie przesyłki:', mockShipmentId);
      
      return {
        success: true,
        shipment_id: mockShipmentId,
        tracking_number: `TR${mockShipmentId}`,
        label_url: `https://mock.furgonetka.pl/labels/${mockShipmentId}.pdf`
      };
    }
    
    // Prawdziwe API call
    const response = await fetch(`${FURGONETKA_CONFIG.baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FURGONETKA_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) {
      throw new Error(`Furgonetka shipment API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Przesyłka utworzona:', data);
    
    return {
      success: true,
      shipment_id: data.id,
      tracking_number: data.tracking_number,
      label_url: data.label_url
    };
    
  } catch (error) {
    console.error('❌ Błąd tworzenia przesyłki:', error);
    
    return {
      success: false,
      error: 'Błąd tworzenia przesyłki Furgonetka'
    };
  }
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Kalkulacja wymiarów paczki na podstawie produktów w koszyku
 */
export function calculatePackageDimensions(cartItems: any[]): PackageDimensions {
  // Proste podejście - suma objętości + stała wysokość
  const totalWeight = cartItems.reduce((sum, item) => 
    sum + (item.quantity * (item.product?.weight || 0.5)), 0);
  
  // Dla odzieży - standardowe wymiary z skalowaniem
  const basePackage = FURGONETKA_CONFIG.defaultPackage;
  const scaleFactor = Math.max(1, Math.ceil(totalWeight / 2)); // skaluj co 2kg
  
  return {
    length: Math.min(basePackage.length * scaleFactor, 60), // max 60cm
    width: Math.min(basePackage.width * scaleFactor, 40),   // max 40cm  
    height: Math.min(basePackage.height + (cartItems.length * 2), 20), // max 20cm
    weight: Math.max(totalWeight, 0.1) // min 0.1kg
  };
}

/**
 * Formatowanie ceny do wyświetlenia
 */
export function formatShippingPrice(price: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
  }).format(price);
}

/**
 * Konwersja opcji Furgonetka na format używany w checkout
 */
export function convertToCheckoutOptions(options: FurgonetkaShippingOption[]) {
  return options.map(option => ({
    id: `${option.provider.toLowerCase()}_${option.service_name.toLowerCase().replace(/\s+/g, '_')}`,
    label: `${option.provider} - ${option.service_name}`,
    description: option.delivery_time,
    price: option.price,
    provider: option.provider,
    has_pickup_points: option.pickup_points && option.pickup_points.length > 0
  }));
}

// ====================================================================
// EXPORTS
// ====================================================================

export {
  FURGONETKA_CONFIG,
  checkFurgonetkaApiHealth,
  MOCK_SHIPPING_OPTIONS
};

export default {
  calculateShippingCosts,
  getPickupPoints,
  createShipment,
  calculatePackageDimensions,
  formatShippingPrice,
  convertToCheckoutOptions
};

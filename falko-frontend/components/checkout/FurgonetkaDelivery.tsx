/**
 * Nowy komponent dostawy dla Furgonetka.pl
 * Wykorzystuje Widget Map i dostępne usługi kurierskie
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Typy dla Furgonetka Widget API
declare global {
  interface Window {
    Furgonetka?: {
      Map: new (config: FurgonetkaMapConfig) => {
        show: () => void;
      };
    };
  }
}

interface FurgonetkaMapConfig {
  courierServices?: string[];
  courierServicesFilter?: string[];
  type?: 'parcel_machine' | 'service_point';
  city?: string;
  street?: string;
  pointTypesFilter?: string[];
  callback?: (params: FurgonetkaCallbackParams) => void;
  closeModalCallback?: () => void;
  zoom?: number;
  apiUrl?: string; // Dodanie parametru apiUrl dla proxy
}

interface FurgonetkaCallbackParams {
  point: {
    code: string;
    name: string;
    type: string;
  };
}

interface DeliveryOption {
  id: string;
  provider: string; // 'dpd', 'dhl', 'inpost', 'gls', 'ups'
  service: string; // 'Classic', 'Paczkomaty', 'Punkt DHL'
  type: 'courier' | 'pickup_point';
  price: number;
  delivery_time: string;
  description: string;
  logo: string;
  features: string[];
}

interface PickupPoint {
  id: string;
  provider: string;
  name: string;
  address: string;
  distance: string;
  hours: string;
  coordinates: [number, number];
}

interface DeliveryAddress {
  street: string;
  city: string;
  postal_code: string;
  country: string;
}

interface FurgonetkaDeliveryProps {
  address: DeliveryAddress;
  onDeliverySelect: (option: DeliveryOption, pickupPoint?: PickupPoint) => void;
  cartWeight: number;
  cartValue: number;
}

export function FurgonetkaDelivery({ 
  address, 
  onDeliverySelect, 
  cartWeight, 
  cartValue 
}: FurgonetkaDeliveryProps) {
  const [availableOptions, setAvailableOptions] = useState<DeliveryOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<DeliveryOption | null>(null);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<PickupPoint | null>(null);
  const [loading, setLoading] = useState(false);

  // Zmemoizuj address żeby uniknąć niepotrzebnych re-fetchów
  const memoizedAddress = useMemo(() => ({
    street: address.street?.trim() || '',
    city: address.city?.trim() || '',
    postal_code: address.postal_code?.trim() || '',
    country: address.country?.trim() || 'pl' // Medusa wymaga małych liter
  }), [address]);

  // Pobierz dostępne opcje dostawy z Furgonetka API - tylko gdy adres jest kompletny
  useEffect(() => {
    if (memoizedAddress.postal_code && memoizedAddress.city && memoizedAddress.postal_code.length >= 5) {
      console.log('🚚 Fetching delivery options for:', memoizedAddress);
      fetchDeliveryOptions();
    }
  }, [memoizedAddress.postal_code, memoizedAddress.city]); // Usuń cartWeight, cartValue z dependency

  const fetchDeliveryOptions = useCallback(async () => {
    console.log('🔄 fetchDeliveryOptions started for address:', memoizedAddress);
    setLoading(true);
    try {
      console.log('📡 Trying to fetch from API...');
      // TODO: Wywołanie API Medusa backend który używa Furgonetka OAuth
      const response = await fetch('/api/medusa/shipping/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_address: address,
          package_weight: cartWeight,
          package_value: cartValue
        })
      });

      console.log('📡 API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API response not OK: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API response data:', data);
      setAvailableOptions(data.options || []);
    } catch (error) {
      console.error('❌ Błąd pobierania opcji dostawy:', error);
      // Fallback do mockowych danych
      const mockOptions = getMockDeliveryOptions();
      console.log('📦 Ładowanie mock opcji dostawy:', mockOptions);
      setAvailableOptions(mockOptions);
    } finally {
      setLoading(false);
      console.log('✅ fetchDeliveryOptions completed');
    }
  }, [memoizedAddress]); // dependency na memoized address

  const handleDeliveryOptionSelect = useCallback((option: DeliveryOption) => {
    console.log('📦 Wybrano opcję dostawy:', option);
    setSelectedOption(option);
    
    if (option.type === 'pickup_point') {
      console.log('🗺️ Opcja pickup_point - otwieranie mapy...');
      // Uruchom bezpośrednio widget Furgonetka zamiast naszego modala
      openFurgonetkaWidget(option.provider);
    } else {
      console.log('🚚 Opcja courier - wywołuję onDeliverySelect...');
      onDeliverySelect(option, undefined);
    }
  }, [onDeliverySelect]);

  const openFurgonetkaWidget = useCallback(async (provider: string) => {
    console.log('Uruchamianie Furgonetka Widget dla:', provider);
    console.log('Adres:', address);
    
    // Lepsze mapowanie providerów na nazwy usług w Furgonetka
    const serviceMapping: { [key: string]: string } = {
      'inpost': 'inpost',
      'dpd': 'dpd', 
      'dhl': 'dhl',
      'gls': 'gls',
      'ups': 'ups',
      'fedex': 'fedex'
    };
    
    const furgonetkaService = serviceMapping[provider] || provider;
    
    try {
      const payload: Record<string, any> = {
        city: address.city || 'Warszawa',
        courierServices: furgonetkaService,
        type: 'parcel_machine' // lub 'service_point'
      };

      if (address.street) {
        payload.street = address.street;
      }

      console.log('📡 Wysyłanie request (POST):', `/api/medusa/store/furgonetka/points`, payload);

      const response = await fetch(`/api/medusa/store/furgonetka/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        alert(`❌ Błąd serwera: ${response.status} - ${errorText}`);
        return;
      }
      
  const data = await response.json();
  console.log('📦 Odpowiedź z proxy:', data);
      
  if (Array.isArray(data.points) && data.points.length > 0) {
        // Otwórz mapę Furgonetki z punkami
        openFurgonetkaMap(data.points, provider);
      } else {
        console.log('📍 Brak punktów dla:', furgonetkaService, 'w', address.city);
        alert(`❌ Nie znaleziono punktów odbioru ${provider.toUpperCase()} w miejscowości ${address.city}`);
      }
      
    } catch (error) {
      console.error('❌ Błąd pobierania punktów:', error);
      alert('❌ Błąd połączenia z serwerem');
    }
  }, [memoizedAddress]); // dependency na address

  const openFurgonetkaMap = (points: any[], provider: string) => {
    try {
      // Sprawdź czy Furgonetka Map API jest dostępne (zgodnie z oficjalną dokumentacją)
      if (typeof window !== 'undefined' && window.Furgonetka && window.Furgonetka.Map) {
        console.log('🗺️ Otwieranie mapy Furgonetki z oficjalnym API');
        
        // Mapowanie providerów na nazwy usług w Furgonetka API
        const serviceMapping: { [key: string]: string[] } = {
          'inpost': ['inpost'],
          'dpd': ['dpd'], 
          'dhl': ['dhl'],
          'gls': ['gls'],
          'ups': ['ups'],
          'fedex': ['fedex'],
          'poczta': ['poczta'],
          'orlen': ['orlen']
        };
        
        const courierServices = serviceMapping[provider] || [provider];
        
        // Inicjalizacja mapy zgodnie z dokumentacją
        const furgonetkaMap = new window.Furgonetka.Map({
          courierServices: courierServices,
          city: address.city || 'Warszawa',
          street: address.street || '',
          type: 'parcel_machine', // lub 'service_point'
          apiUrl: '/api/medusa/store/furgonetka', // Użyj naszego proxy zamiast bezpośrednio API Furgonetki
          callback: (params: any) => {
            console.log('✅ Użytkownik wybrał punkt z mapy Furgonetki:', params);
            console.log('🔍 Stan selectedOption przed wyborem punktu:', selectedOption);
            
            // FIXED: Proper address handling to avoid duplication
            const mappedPoint = {
              id: params.point.code,
              provider: selectedOption?.provider || provider,
              name: params.point.name,
              // Use params.point.type for address (Furgonetka widget returns address in type field)
              address: params.point.type || params.point.name, 
              distance: 'Nieznana',
              hours: 'Sprawdź godziny otwarcia',
              coordinates: [0, 0] as [number, number]
            };
            
            console.log('🔍 Mapped point from widget:', mappedPoint);
            
            handlePickupPointSelect(mappedPoint);
          },
          closeModalCallback: () => {
            console.log('🚪 Mapa Furgonetki została zamknięta');
          }
        });
        
        // Pokaż mapę
        furgonetkaMap.show();
        
      } else {
        console.warn('⚠️ Furgonetka Map API nie jest dostępne, fallback do listy');
        showFallbackPointsList(points, provider);
      }
    } catch (error) {
      console.error('❌ Błąd przy otwieraniu mapy:', error);
      showFallbackPointsList(points, provider);
    }
  };

  const handlePickupPointSelect = (point: PickupPoint) => {
    console.log('📍 Wybrano punkt odbioru:', point);
    console.log('🔍 Aktualny selectedOption:', selectedOption);
    setSelectedPickupPoint(point);
    if (selectedOption) {
      console.log('✅ Mamy opcję dostawy, wywołuję onDeliverySelect:', selectedOption);
      onDeliverySelect(selectedOption, point);
    } else {
      console.log('❌ Brak wybranej opcji dostawy! Sprawdzę wszystkie opcje...');
      console.log('📋 Dostępne opcje:', availableOptions);
      
      // Fallback - znajdź opcję pickup_point dla tego providera
      let fallbackOption = availableOptions.find(opt => 
        opt.type === 'pickup_point' && opt.provider === point.provider
      );
      
      // Jeśli nie ma opcji w liście, utwórz ją dynamicznie
      if (!fallbackOption) {
        console.log('🔄 Tworzę opcję dostawy dynamicznie dla providera:', point.provider);
        fallbackOption = {
          id: `${point.provider}-paczkomaty`,
          provider: point.provider,
          service: `${point.provider.toUpperCase()} Paczkomaty`,
          type: 'pickup_point',
          price: point.provider === 'inpost' ? 12.99 : 13.99,
          delivery_time: '1-2 dni robocze',
          description: `Odbiór w punkcie ${point.provider.toUpperCase()}`,
          logo: `/logos/${point.provider}.svg`,
          features: ['24/7', 'Punkt odbioru']
        };
        console.log('📦 Utworzona opcja:', fallbackOption);
      }
      
      if (fallbackOption) {
        console.log('🔄 Znaleziono/utworzono fallback opcję:', fallbackOption);
        setSelectedOption(fallbackOption);
        onDeliverySelect(fallbackOption, point);
      } else {
        console.log('❌ Nie można utworzyć opcji dostawy');
      }
    }
  };

  const getOpeningHoursString = (hours: any): string => {
    if (!hours) return 'Sprawdź godziny otwarcia';
    
    try {
      // Konwersja godzin otwarcia do czytelnego formatu
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = dayNames[new Date().getDay()];
      const todayHours = hours[today] || hours.monday;
      
      if (todayHours && todayHours.start_hour && todayHours.end_hour) {
        return `${todayHours.start_hour} - ${todayHours.end_hour}`;
      }
      
      return 'Sprawdź godziny otwarcia';
    } catch {
      return 'Sprawdź godziny otwarcia';
    }
  };

  const showFallbackPointsList = (points: any[], provider: string) => {
    // Fallback do prostej listy wyboru gdy mapa nie działa
    const pointsList = points.slice(0, 5).map((point, index) => 
      `${index + 1}. ${point.name} - ${point.address?.street || point.address || 'Brak adresu'}`
    ).join('\n');
    
    const choice = prompt(`Wybierz punkt odbioru dla ${provider.toUpperCase()}:\n\n${pointsList}\n\nWprowadź numer (1-5):`);
    
    if (choice && parseInt(choice) >= 1 && parseInt(choice) <= 5) {
      const selectedPoint = points[parseInt(choice) - 1];
      
      const mappedPoint = {
        id: selectedPoint.code || selectedPoint.id,
        provider: provider,
        name: selectedPoint.name,
        address: selectedPoint.address?.street ? 
          `${selectedPoint.address.street}, ${selectedPoint.address.city}` : 
          selectedPoint.address || selectedPoint.name,
        distance: selectedPoint.distance ? `${selectedPoint.distance.toFixed(2)} km` : 'Nieznana',
        hours: getOpeningHoursString(selectedPoint.opening_hours),
        coordinates: [
          selectedPoint.coordinates?.latitude || 0, 
          selectedPoint.coordinates?.longitude || 0
        ] as [number, number]
      };
      
      console.log('✅ Wybrano punkt:', mappedPoint);
      handlePickupPointSelect(mappedPoint);
    }
  };

  return (
    <div className="furgonetka-delivery">
      {/* Tymczasowa info o proxy */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-700">
          ℹ️ Używamy proxy API zamiast widget z powodu ograniczeń CORS
        </p>
      </div>

      <div className="delivery-header mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Wybierz sposób dostawy
        </h3>
        <p className="text-sm text-gray-600">
          Dostawa na adres: {address.street}, {address.postal_code} {address.city}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">Ładowanie opcji dostawy...</p>
        </div>
      ) : (
        <div className="delivery-options space-y-4">
          {availableOptions.map((option) => (
            <DeliveryOptionCard
              key={option.id}
              option={option}
              isSelected={selectedOption?.id === option.id}
              onSelect={() => handleDeliveryOptionSelect(option)}
            />
          ))}
        </div>
      )}

      {/* Wybrany punkt odbioru */}
      {selectedPickupPoint && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="selected-pickup-point mt-4 p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-green-900">
                Wybrany punkt odbioru
              </h4>
              <p className="text-sm text-green-700">
                {selectedPickupPoint.name}
              </p>
              <p className="text-sm text-green-600">
                {selectedPickupPoint.address}
              </p>
              <p className="text-xs text-green-500">
                Odległość: {selectedPickupPoint.distance} • {selectedPickupPoint.hours}
              </p>
            </div>
            <button
              onClick={() => openFurgonetkaWidget(selectedOption?.provider || 'inpost')}
              className="text-sm text-green-600 hover:text-green-800"
            >
              Zmień
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function DeliveryOptionCard({ 
  option, 
  isSelected, 
  onSelect 
}: {
  option: DeliveryOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`delivery-option-card p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src={option.logo} 
            alt={option.provider}
            className="w-12 h-8 object-contain"
          />
          <div>
            <h4 className="font-medium text-gray-900">
              {option.service}
            </h4>
            <p className="text-sm text-gray-600">
              {option.description}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500">
                {option.delivery_time}
              </span>
              {option.features.map((feature, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-semibold text-gray-900">
            {option.price.toFixed(2)} PLN
          </div>
          {option.type === 'pickup_point' && (
            <div className="text-xs text-blue-600">
              + wybór punktu
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Mock data dla rozwoju
function getMockDeliveryOptions(): DeliveryOption[] {
  return [
    {
      id: 'dpd-classic',
      provider: 'dpd',
      service: 'DPD Classic',
      type: 'courier',
      price: 15.99,
      delivery_time: '1-2 dni robocze',
      description: 'Dostawa kurierska do drzwi',
      logo: '/logos/dpd.svg',
      features: ['Tracking', 'Ubezpieczenie']
    },
    {
      id: 'inpost-paczkomaty',
      provider: 'inpost',
      service: 'InPost Paczkomaty',
      type: 'pickup_point',
      price: 12.99,
      delivery_time: '1-2 dni robocze',
      description: 'Odbiór w Paczkomacie 24/7',
      logo: '/logos/inpost.svg',
      features: ['24/7', 'Eco-friendly']
    },
    {
      id: 'dhl-servicepoint',
      provider: 'dhl',
      service: 'DHL ServicePoint',
      type: 'pickup_point',
      price: 13.99,
      delivery_time: '1-3 dni robocze',
      description: 'Odbiór w punkcie DHL',
      logo: '/logos/dhl.svg',
      features: ['Tracking', 'Punkt odbioru']
    },
    {
      id: 'ups-standard',
      provider: 'ups',
      service: 'UPS Standard',
      type: 'courier',
      price: 16.99,
      delivery_time: '1-2 dni robocze',
      description: 'Dostawa kurierska UPS',
      logo: '/logos/ups.svg',
      features: ['Tracking', 'Ubezpieczenie', 'Szybka dostawa']
    },
    {
      id: 'gls-pickup',
      provider: 'gls',
      service: 'GLS Punkty Odbioru',
      type: 'pickup_point',
      price: 11.99,
      delivery_time: '2-3 dni robocze',
      description: 'Odbiór w punkcie GLS',
      logo: '/logos/gls.svg',
      features: ['Punkty odbioru', 'Tracking']
    }
  ];
}

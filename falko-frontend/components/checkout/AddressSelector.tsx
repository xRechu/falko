'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Home, 
  Building2,
  User
} from 'lucide-react';
import { CustomerAddress, formatAddress, COUNTRIES } from '@/lib/api/addresses';
import { CheckoutFormData } from './CheckoutForm';

interface AddressSelectorProps {
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress | null;
  onAddressSelect: (address: CustomerAddress | null) => void;
  onNewAddress: () => void;
  currentFormData: Partial<CheckoutFormData>;
  className?: string;
}

/**
 * Komponent do wyboru adresu z zapisanych adresów użytkownika
 * Pokazuje się tylko dla zalogowanych użytkowników z adresami
 */
export function AddressSelector({
  addresses,
  selectedAddress,
  onAddressSelect,
  onNewAddress,
  currentFormData,
  className = ''
}: AddressSelectorProps) {
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  
  // Jeśli nie ma adresów, nie pokazuj komponentu
  if (addresses.length === 0) {
    return null;
  }

  // Pokaż maksymalnie 2 adresy na początku
  const addressesToShow = showAllAddresses ? addresses : addresses.slice(0, 2);
  const hasMoreAddresses = addresses.length > 2;

  const getAddressIcon = (address: CustomerAddress) => {
    if (address.company) return Building2;
    return Home;
  };

  const getAddressLabel = (address: CustomerAddress) => {
    if (address.company) return 'Firma';
    return 'Dom';
  };

  const isCurrentFormDataAddress = () => {
    // Sprawdź czy aktualne dane formularza to nowy adres (nie z listy)
    return !selectedAddress && (
      currentFormData.address ||
      currentFormData.city ||
      currentFormData.postalCode
    );
  };

  return (
    <Card className={`p-4 border-blue-100 bg-blue-50/30 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">Zapisane adresy</h3>
        <Badge variant="outline" className="text-xs">
          {addresses.length}
        </Badge>
      </div>
      
      <RadioGroup 
        value={selectedAddress?.id || (isCurrentFormDataAddress() ? 'new' : '')} 
        onValueChange={(value) => {
          if (value === 'new') {
            onAddressSelect(null);
          } else {
            const address = addresses.find(addr => addr.id === value);
            if (address) {
              onAddressSelect(address);
            }
          }
        }}
        className="space-y-3"
      >
        {/* Opcja: wprowadź nowy adres */}
        <div className="flex items-start space-x-3">
          <RadioGroupItem value="new" id="new-address" className="mt-1" />
          <Label 
            htmlFor="new-address" 
            className="flex-1 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  Wprowadź nowy adres
                </div>
                <div className="text-sm text-gray-500">
                  {isCurrentFormDataAddress() ? (
                    <span className="text-green-600 font-medium">
                      Wypełniasz nowy adres
                    </span>
                  ) : (
                    'Wpisz adres ręcznie'
                  )}
                </div>
              </div>
            </div>
          </Label>
        </div>

        <Separator className="bg-blue-200" />

        {/* Lista zapisanych adresów */}
        {addressesToShow.map((address) => {
          const IconComponent = getAddressIcon(address);
          const label = getAddressLabel(address);
          const country = COUNTRIES.find(c => c.code === address.country_code);
          
          return (
            <div key={address.id} className="flex items-start space-x-3">
              <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
              <Label 
                htmlFor={address.id} 
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {address.first_name} {address.last_name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      {address.company && (
                        <div className="font-medium">{address.company}</div>
                      )}
                      <div>{address.address_1}</div>
                      {address.address_2 && <div>{address.address_2}</div>}
                      <div>
                        {address.postal_code} {address.city}
                      </div>
                      <div className="text-gray-500">
                        {country?.name || address.country_code}
                      </div>
                      {address.phone && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <User className="h-3 w-3" />
                          {address.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Label>
            </div>
          );
        })}

        {/* Przycisk "Pokaż więcej" */}
        {hasMoreAddresses && !showAllAddresses && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAllAddresses(true)}
            className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            Pokaż wszystkie adresy ({addresses.length - 2} więcej)
          </Button>
        )}

        {/* Przycisk "Pokaż mniej" */}
        {showAllAddresses && hasMoreAddresses && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAllAddresses(false)}
            className="w-full text-gray-600 hover:text-gray-700 hover:bg-gray-50"
          >
            Pokaż mniej
          </Button>
        )}
      </RadioGroup>

      <Separator className="bg-blue-200 my-4" />

      {/* Przycisk dodaj nowy adres */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onNewAddress}
        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
      >
        <Plus className="h-4 w-4 mr-2" />
        Dodaj nowy adres do profilu
      </Button>
    </Card>
  );
}

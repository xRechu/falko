'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Plus, 
  Home, 
  Building2,
  User
} from 'lucide-react';
import { CustomerAddress, COUNTRIES } from '@/lib/api/addresses';
import { CheckoutFormData } from './CheckoutForm';

interface AddressSelectorWithFormProps {
  addresses: CustomerAddress[];
  selectedAddress: CustomerAddress | null;
  onAddressSelect: (address: CustomerAddress | null) => void;
  onNewAddress: () => void;
  formData: CheckoutFormData;
  errors: any;
  updateFormData: (field: keyof CheckoutFormData, value: any) => void;
  className?: string;
}

/**
 * Komponent do wyboru adresu z zapisanych adresów użytkownika + formularz adresu
 * Premium design zgodny z instructions.md (Apple/Tesla style)
 */
export function AddressSelectorWithForm({
  addresses,
  selectedAddress,
  onAddressSelect,
  onNewAddress,
  formData,
  errors,
  updateFormData,
  className = ''
}: AddressSelectorWithFormProps) {
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  
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
      formData.address ||
      formData.city ||
      formData.postalCode
    );
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <MapPin className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-900">Adres dostawy</h2>
          <p className="text-sm text-gray-500">
            {addresses.length > 0 
              ? 'Wybierz z zapisanych lub wprowadź nowy'
              : 'Wprowadź adres dostawy'
            }
          </p>
        </div>
        {addresses.length > 0 && (
          <Badge variant="outline" className="ml-auto">
            {addresses.length} zapisanych
          </Badge>
        )}
      </div>

      {/* Jeśli są zapisane adresy, pokaż selektor */}
      {addresses.length > 0 && (
        <>
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
            className="space-y-3 mb-6"
          >
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
                    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
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

            {/* Opcja: wprowadź nowy adres */}
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="new" id="new-address" className="mt-1" />
              <Label 
                htmlFor="new-address" 
                className="flex-1 cursor-pointer"
              >
                <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
          </RadioGroup>

          <Separator className="my-6" />
        </>
      )}

      {/* Formularz adresu - pokazuje się gdy nie ma zapisanych adresów lub wybrano "nowy adres" */}
      {(addresses.length === 0 || !selectedAddress) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-gray-900">
              {addresses.length === 0 ? 'Adres dostawy' : 'Nowy adres dostawy'}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="address" className="text-sm font-medium">
                Ulica i numer *
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                className={errors.address ? 'border-red-300' : ''}
                placeholder="ul. Przykładowa 123"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode" className="text-sm font-medium">
                  Kod pocztowy *
                </Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => updateFormData('postalCode', e.target.value)}
                  className={errors.postalCode ? 'border-red-300' : ''}
                  placeholder="00-000"
                />
                {errors.postalCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                )}
              </div>

              <div>
                <Label htmlFor="city" className="text-sm font-medium">
                  Miasto *
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  className={errors.city ? 'border-red-300' : ''}
                  placeholder="Warszawa"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>
            </div>
          </div>

          {/* Przycisk dodaj do profilu - tylko gdy użytkownik jest zalogowany */}
          {addresses.length > 0 && (
            <>
              <Separator className="my-4" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onNewAddress}
                className="w-full border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Zapisz ten adres w profilu
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

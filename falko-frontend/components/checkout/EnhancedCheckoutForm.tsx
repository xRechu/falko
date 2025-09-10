'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Truck, 
  Mail, 
  User, 
  MapPin, 
  Phone,
  Info,
  CheckCircle
} from 'lucide-react';
import { useCheckoutProfile } from '@/lib/hooks/useCheckoutProfile';
import { AddressSelector } from './AddressSelector';
import { AddressSelectorWithForm } from './AddressSelectorWithForm';
import { CustomerAddress } from '@/lib/api/addresses';
import { CheckoutFormData } from './CheckoutForm';
import { FurgonetkaDelivery } from './FurgonetkaDelivery';

interface EnhancedCheckoutFormProps {
  onSubmit: (formData: CheckoutFormData) => Promise<void>;
  isProcessing: boolean;
  onShippingUpdate?: (formData: CheckoutFormData) => void;
}

interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  terms?: string;
}

/**
 * Rozszerzony formularz checkout z integracją profilu użytkownika
 * Automatycznie wypełnia dane z profilu i umożliwia wybór zapisanych adresów
 */
export function EnhancedCheckoutForm({ onSubmit, isProcessing, onShippingUpdate }: EnhancedCheckoutFormProps) {
  const profile = useCheckoutProfile();
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Inicjalizuj formularz z danymi z profilu
  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    const initialData = profile.getInitialFormData();
    return {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'PL',
      shippingMethod: 'standard',
      paymentMethod: 'card',
      newsletter: false,
      terms: false,
      notes: '',
      ...initialData,
    } as CheckoutFormData;
  });

  // Aktualizuj formularz gdy załadują się dane profilu
  useEffect(() => {
    if (!profile.isLoading && profile.hasProfile) {
      const profileData = profile.getInitialFormData();
      setFormData(prev => ({
        ...prev,
        ...profileData,
      }));
      
      // Automatycznie wybierz domyślny adres
      if (profile.defaultAddress) {
        setSelectedAddress(profile.defaultAddress);
        const addressData = profile.selectAddress(profile.defaultAddress);
        setFormData(prev => ({
          ...prev,
          ...addressData,
        }));
      }
    }
  }, [profile.isLoading, profile.hasProfile, profile.defaultAddress]);

  // Wyczyść dane gdy użytkownik się wyloguje
  useEffect(() => {
    if (!profile.isLoading && !profile.hasProfile) {
      // Reset do pustych danych
      const emptyData = profile.getInitialFormData();
      setFormData(prev => ({
        ...prev,
        ...emptyData,
        // Wyczyść też adres
        address: '',
        city: '',
        postalCode: '',
        country: 'PL',
      }));
      setSelectedAddress(null);
    }
  }, [profile.isLoading, profile.hasProfile]);

  const handleAddressSelect = (address: CustomerAddress | null) => {
    setSelectedAddress(address);
    
    if (address) {
      // Wypełnij formularz danymi z wybranego adresu
      const addressData = profile.selectAddress(address);
      setFormData(prev => ({
        ...prev,
        ...addressData,
      }));
    }
    // Jeśli address === null, użytkownik chce wprowadzić nowy adres
    // - zachowujemy obecne dane w formularzu
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Walidacja email
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Podaj prawidłowy adres email';
    }
    
    // Walidacja wymaganych pól
    if (!formData.firstName.trim()) newErrors.firstName = 'Imię jest wymagane';
    if (!formData.lastName.trim()) newErrors.lastName = 'Nazwisko jest wymagane';
    if (!formData.phone.trim()) newErrors.phone = 'Telefon jest wymagany';
    if (!formData.address.trim()) newErrors.address = 'Adres jest wymagany';
    if (!formData.city.trim()) newErrors.city = 'Miasto jest wymagane';
    if (!formData.postalCode.trim()) newErrors.postalCode = 'Kod pocztowy jest wymagany';
    
    // Walidacja regulaminu
    if (!formData.terms) {
      newErrors.terms = 'Musisz zaakceptować regulamin';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Błąd podczas składania zamówienia:', error);
    }
  };

  const updateFormData = useCallback((field: keyof CheckoutFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Wyczyść błędy dla tego pola
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleNewAddressClick = () => {
    // TODO: Implementacja modala do dodawania nowego adresu
    console.log('TODO: Open add address modal');
  };

  // Memoized delivery address to prevent unnecessary recalculations
  const deliveryAddress = useMemo(() => {
    if (formData.city && formData.postalCode) {
      return {
        postal_code: formData.postalCode,
        city: formData.city,
        country_code: formData.country || 'PL'
      };
    }
    return undefined;
  }, [formData.postalCode, formData.city, formData.country]);

  // Memoized shipping callbacks to prevent infinite loops
  const handleShippingSelected = useCallback((option: any, pickupPoint?: any) => {
    updateFormData('shippingMethod', `${option.provider}_${option.service_name}`);
    updateFormData('shippingProvider', option.provider);
    updateFormData('shippingCost', option.price);
    if (pickupPoint) {
      updateFormData('pickupPoint', pickupPoint);
    }
    // Notify parent about shipping update
    if (onShippingUpdate) {
      // Get fresh formData using setFormData callback
      setFormData(currentFormData => {
        const updatedFormData = {
          ...currentFormData,
          shippingMethod: `${option.provider}_${option.service_name}`,
          shippingProvider: option.provider,
          shippingCost: option.price,
          pickupPoint: pickupPoint || undefined
        };
        onShippingUpdate(updatedFormData);
        return currentFormData; // Don't actually update, just notify parent
      });
    }
  }, [onShippingUpdate]);

  const handleShippingCostChanged = useCallback((cost: number) => {
    updateFormData('shippingCost', cost);
    // Notify parent about cost change
    if (onShippingUpdate) {
      // Get fresh formData using setFormData callback
      setFormData(currentFormData => {
        const updatedFormData = {
          ...currentFormData,
          shippingCost: cost
        };
        onShippingUpdate(updatedFormData);
        return currentFormData; // Don't actually update, just notify parent
      });
    }
  }, [onShippingUpdate]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Informacja o profilu */}
      {profile.hasProfile ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Zalogowany jako {profile.firstName} {profile.lastName}</strong>
            <br />
            Dane zostały automatycznie wypełnione z Twojego profilu.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Kupujesz jako gość</strong>
            <br />
            Możesz się <a href="/login" className="underline font-medium">zalogować</a> aby skorzystać z zapisanych adresów i danych.
          </AlertDescription>
        </Alert>
      )}

      {/* Sekcja 1: Dane kontaktowe */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Dane kontaktowe</h2>
            <p className="text-sm text-gray-500">Informacje potrzebne do kontaktu</p>
          </div>
          {profile.hasProfile && (
            <Badge variant="outline" className="ml-auto">
              Z profilu
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Adres email *
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                disabled={profile.hasProfile} // Disable tylko dla zalogowanych
                className={`pl-10 ${errors.email ? 'border-red-300' : ''} ${profile.hasProfile ? 'bg-gray-50' : ''}`}
                placeholder="twoj@email.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              Telefon *
            </Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                className={`pl-10 ${errors.phone ? 'border-red-300' : ''}`}
                placeholder="+48 123 456 789"
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="firstName" className="text-sm font-medium">
              Imię *
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => updateFormData('firstName', e.target.value)}
              className={errors.firstName ? 'border-red-300' : ''}
              placeholder="Jan"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName" className="text-sm font-medium">
              Nazwisko *
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => updateFormData('lastName', e.target.value)}
              className={errors.lastName ? 'border-red-300' : ''}
              placeholder="Kowalski"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Sekcja 2: Adres dostawy */}
      <AddressSelectorWithForm
        addresses={profile.addresses}
        selectedAddress={selectedAddress}
        onAddressSelect={handleAddressSelect}
        onNewAddress={handleNewAddressClick}
        formData={formData}
        errors={errors}
        updateFormData={updateFormData}
      />

      {/* Sekcja 3: Dostawa z Furgonetka */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Truck className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Dostawa</h2>
            <p className="text-sm text-gray-500">Wybierz sposób dostawy</p>
          </div>
        </div>

        <FurgonetkaDelivery
          address={{
            street: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
            country: formData.country
          }}
          onDeliverySelect={(option, pickupPoint) => {
            updateFormData('deliveryOption', option);
            if (pickupPoint) {
              updateFormData('pickupPoint', pickupPoint);
            }
            // Wywołaj callback dla parent komponentu
            if (onShippingUpdate) {
              onShippingUpdate({
                ...formData,
                deliveryOption: option,
                pickupPoint: pickupPoint
              });
            }
          }}
          cartWeight={2.5} // TODO: Rzeczywista waga z koszyka
          cartValue={299.99} // TODO: Rzeczywista wartość z koszyka
        />
      </Card>

      {/* Sekcja 4: Płatność */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900">Płatność</h2>
            <p className="text-sm text-gray-500">Wybierz metodę płatności</p>
          </div>
        </div>

        <RadioGroup 
          value={formData.paymentMethod} 
          onValueChange={(value) => updateFormData('paymentMethod', value)}
        >
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex-1 cursor-pointer">
              <div className="font-medium">Karta płatnicza</div>
              <div className="text-sm text-gray-500">Visa, Mastercard, BLIK</div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="transfer" id="transfer" />
            <Label htmlFor="transfer" className="flex-1 cursor-pointer">
              <div className="font-medium">Przelew bankowy</div>
              <div className="text-sm text-gray-500">Tradycyjny przelew</div>
            </Label>
          </div>
        </RadioGroup>
      </Card>

      {/* Sekcja 5: Dodatkowe opcje */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="newsletter" 
              checked={formData.newsletter}
              onCheckedChange={(checked) => updateFormData('newsletter', checked)}
            />
            <Label htmlFor="newsletter" className="text-sm">
              Chcę otrzymywać newsletter z nowościami i ofertami
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={formData.terms}
              onCheckedChange={(checked) => updateFormData('terms', checked)}
            />
            <Label htmlFor="terms" className="text-sm">
              Akceptuję <a href="/regulamin" className="text-blue-600 underline">regulamin</a> i <a href="/polityka-prywatnosci" className="text-blue-600 underline">politykę prywatności</a> *
            </Label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-600">{errors.terms}</p>
          )}

          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Uwagi do zamówienia
            </Label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => updateFormData('notes', e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
              rows={3}
              placeholder="Dodatkowe informacje dla kuriera..."
            />
          </div>
        </div>
      </Card>

      {/* Przycisk submit */}
      <Card className="p-6">
        <Button
          type="submit"
          disabled={isProcessing}
          className="w-full h-12 text-lg font-medium"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Przetwarzanie...
            </div>
          ) : (
            'Złóż zamówienie'
          )}
        </Button>
      </Card>
    </form>
  );
}

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Truck, Mail, User, MapPin, Phone, Info, CheckCircle } from 'lucide-react';
import { FurgonetkaDelivery } from './FurgonetkaDelivery';
import { useCheckoutProfile } from '@/lib/hooks/useCheckoutProfile';
import { AddressSelector } from './AddressSelector';
import { CustomerAddress } from '@/lib/api/addresses';

interface CheckoutFormProps {
  onSubmit: (formData: CheckoutFormData) => Promise<void>;
  isProcessing: boolean;
}

export interface CheckoutFormData {
  // Dane osobowe
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  
  // Adres dostawy
  address: string;
  city: string;
  postalCode: string;
  country: string;
  
  // Opcje dostawy (nowy system)
  deliveryOption?: {
    id: string;
    provider: string;
    service: string;
    type: 'courier' | 'pickup_point';
    price: number;
    delivery_time: string;
  };
  
  // Punkt odbioru (jeśli wybrano pickup_point)
  pickupPoint?: {
    id: string;
    provider: string;
    name: string;
    address: string;
    distance: string;
    hours: string;
    coordinates: [number, number];
  };
  
  // Płatność
  paymentMethod: string;
  // BLIK (White Label)
  blikCode?: string;
  gdprAccepted?: boolean;
  
  // Dodatkowe
  newsletter: boolean;
  terms: boolean;
  notes?: string;
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
  deliveryOption?: string;
  pickupPoint?: string;
}

/**
 * Formularz checkout z walidacją i premium UX
 * Podzielony na sekcje z ikonami i progress indicator
 * Zintegrowany z profilem użytkownika i adresami
 */
export function CheckoutForm({ onSubmit, isProcessing }: CheckoutFormProps) {
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
      country: 'pl', // Medusa wymaga małych liter
      paymentMethod: 'blik', // Domyślna metoda online
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
  }, [profile.hasProfile, profile.defaultAddress]);

  // Wyczyść dane gdy użytkownik się wyloguje
  useEffect(() => {
    if (!profile.hasProfile) {
      // Reset do pustych danych
      const emptyData = profile.getInitialFormData();
      setFormData(prev => ({
        ...prev,
        ...emptyData,
        // Wyczyść też adres
        address: '',
        city: '',
        postalCode: '',
        country: 'pl', // Medusa wymaga małych liter
      }));
      setSelectedAddress(null);
    }
  }, [profile.hasProfile]);

  const handleAddressSelect = useCallback((address: CustomerAddress | null) => {
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
  }, [profile]);

  const validateForm = (): boolean => {
    console.log('🔍 Walidacja formularza rozpoczęta');
    console.log('📝 Dane do walidacji:', formData);
    
    const newErrors: FormErrors = {};
    
    // Walidacja email
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Podaj prawidłowy adres email';
      console.log('❌ Błąd email:', formData.email);
    }
    
    // Walidacja wymaganych pól
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Imię jest wymagane';
      console.log('❌ Błąd: Brak imienia');
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Nazwisko jest wymagane';
      console.log('❌ Błąd: Brak nazwiska');
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefon jest wymagany';
      console.log('❌ Błąd: Brak telefonu');
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Adres jest wymagany';
      console.log('❌ Błąd: Brak adresu');
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Miasto jest wymagane';
      console.log('❌ Błąd: Brak miasta');
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Kod pocztowy jest wymagany';
      console.log('❌ Błąd: Brak kodu pocztowego');
    }
    
    // Walidacja opcji dostawy
    if (!formData.deliveryOption) {
      newErrors.deliveryOption = 'Wybierz sposób dostawy';
      console.log('❌ Błąd: Brak opcji dostawy');
    } else {
      console.log('✅ Opcja dostawy wybrana:', formData.deliveryOption);
    }
    
    // Walidacja punktu odbioru (jeśli wymagany)
    if (formData.deliveryOption?.type === 'pickup_point' && !formData.pickupPoint) {
      newErrors.pickupPoint = 'Wybierz punkt odbioru dla wybranej opcji dostawy';
      console.log('❌ Błąd: Brak punktu odbioru dla pickup_point');
    } else if (formData.deliveryOption?.type === 'pickup_point' && formData.pickupPoint) {
      console.log('✅ Punkt odbioru wybrany:', formData.pickupPoint.name);
    }
    
    // Walidacja ceny dostawy
    if (formData.deliveryOption && (!formData.deliveryOption.price || formData.deliveryOption.price <= 0)) {
      newErrors.deliveryOption = 'Błąd wyliczania kosztu dostawy';
      console.log('❌ Błąd: Nieprawidłowa cena dostawy');
    }
    
    // Walidacja regulaminu
    if (!formData.terms) {
      newErrors.terms = 'Musisz zaakceptować regulamin';
      console.log('❌ Błąd: Regulamin nie zaakceptowany');
    } else {
      console.log('✅ Regulamin zaakceptowany');
    }

    // Walidacja BLIK i RODO gdy wybrano BLIK (White Label)
    if (formData.paymentMethod === 'blik') {
      if (!formData.blikCode || !/^\d{6}$/.test(formData.blikCode)) {
        newErrors.pickupPoint = 'Podaj 6-cyfrowy kod BLIK';
        console.log('❌ Błąd: Kod BLIK nieprawidłowy');
      }
      if (!formData.gdprAccepted) {
        newErrors.pickupPoint = (newErrors.pickupPoint ? newErrors.pickupPoint + ' i ' : '') + 'zaakceptuj klauzulę RODO Paynow';
        console.log('❌ Błąd: Klauzula RODO niezaakceptowana');
      }
    }

    console.log('📊 Wszystkie błędy walidacji:', newErrors);
    console.log('✅ Czy formularz jest ważny:', Object.keys(newErrors).length === 0);
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔥 handleSubmit wywołane - form submitted');
    console.log('📝 Aktualne dane formularza:', formData);
    
    const isValid = validateForm();
    console.log('✅ Walidacja formularza:', isValid);
    
    if (!isValid) {
      console.log('❌ Formularz nie przeszedł walidacji, błędy:', errors);
      return;
    }
    
    console.log('🚀 Wywołuję onSubmit z danymi:', formData);
    await onSubmit(formData);
  }, [formData, onSubmit]);

  const updateField = useCallback((field: keyof CheckoutFormData, value: any) => {
    console.log('🔄 Updating field:', field, value);
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Usuń błąd dla tego pola jeśli istnieje
    if (field in errors) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  }, [errors]);

  const handleDeliverySelect = useCallback((option: any, pickupPoint?: any) => {
    console.log('🚚 handleDeliverySelect wywołane:', { option, pickupPoint });
    updateField('deliveryOption', option);
    if (pickupPoint) {
      updateField('pickupPoint', pickupPoint);
    }
  }, [updateField]);

  // Zmemoizuj address object żeby uniknąć niepotrzebnych re-renderów FurgonetkaDelivery
  const deliveryAddress = useMemo(() => ({
    street: formData.address,
    city: formData.city,
    postal_code: formData.postalCode,
    country: formData.country
  }), [formData.address, formData.city, formData.postalCode, formData.country]);

  return (
    <form key="checkout-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Status logowania - wyświetl zawsze */}
      <Alert className={profile.hasProfile ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
        <Info className={`h-4 w-4 ${profile.hasProfile ? "text-green-600" : "text-blue-600"}`} />
        <AlertDescription className={profile.hasProfile ? "text-green-800" : "text-blue-800"}>
          {profile.hasProfile ? (
            <>
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Zalogowany jako <strong>{profile.email}</strong> - dane zostały automatycznie wypełnione z Twojego profilu
            </>
          ) : (
            <>
              Składasz zamówienie jako gość. 
              <a href="/login" className="underline font-medium ml-1">Zaloguj się</a> aby automatycznie wypełnić dane.
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Dane kontaktowe */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold">Dane kontaktowe</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Adres email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="twoj@email.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Imię *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="Jan"
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName">Nazwisko *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Kowalski"
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+48 123 456 789"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Adres dostawy */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <MapPin className="h-5 w-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold">Adres dostawy</h2>
        </div>
        
        {/* Wybór adresu lub form dla nowego adresu */}
        {profile.hasProfile && profile.addresses.length > 0 ? (
          <div className="space-y-4">
            <AddressSelector
              addresses={profile.addresses}
              selectedAddress={selectedAddress}
              onAddressSelect={handleAddressSelect}
              onNewAddress={() => setSelectedAddress(null)}
              currentFormData={{
                address: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
                country: formData.country
              }}
            />
            
            {/* Form dla nowego adresu jeśli wybrano "nowy adres" */}
            {selectedAddress === null && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Nowy adres dostawy</h3>
                <div>
                  <Label htmlFor="address">Ulica i numer *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="ul. Przykładowa 123"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Miasto *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="Warszawa"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="postalCode">Kod pocztowy *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value)}
                      placeholder="00-000"
                      className={errors.postalCode ? 'border-red-500' : ''}
                    />
                    {errors.postalCode && (
                      <p className="text-sm text-red-500 mt-1">{errors.postalCode}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Form dla gości lub gdy brak zapisanych adresów
          <div className="space-y-4">
            <div>
              <Label htmlFor="address">Ulica i numer *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="ul. Przykładowa 123"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500 mt-1">{errors.address}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Miasto *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Warszawa"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="postalCode">Kod pocztowy *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => updateField('postalCode', e.target.value)}
                  placeholder="00-000"
                  className={errors.postalCode ? 'border-red-500' : ''}
                />
                {errors.postalCode && (
                  <p className="text-sm text-red-500 mt-1">{errors.postalCode}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Dostawa - nowy komponent Furgonetka */}
      <Card key="delivery-section" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Truck className="h-5 w-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold">Metoda dostawy</h2>
        </div>
        
        <FurgonetkaDelivery
          address={deliveryAddress}
          onDeliverySelect={handleDeliverySelect}
          cartWeight={2.5} // TODO: Oblicz z rzeczywistego koszyka
          cartValue={299.99} // TODO: Pobierz z rzeczywistego koszyka
        />
      </Card>

      {/* Płatność */}
      <Card key="payment-section" className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <CreditCard className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold">Metoda płatności</h2>
        </div>
        
        <RadioGroup 
          value={formData.paymentMethod} 
          onValueChange={(value) => updateField('paymentMethod', value)}
        >
          <div key="blik-option" className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value="blik" id="blik" />
            <Label htmlFor="blik" className="flex-1">
              <div>
                <p className="font-medium">BLIK</p>
                <p className="text-sm text-gray-600">Szybka płatność BLIK</p>
              </div>
            </Label>
          </div>

          <div key="apple-pay-option" className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value="apple_pay" id="apple_pay" />
            <Label htmlFor="apple_pay" className="flex-1">
              <div>
                <p className="font-medium">Apple Pay</p>
                <p className="text-sm text-gray-600">Płatność Apple Pay</p>
              </div>
            </Label>
          </div>

          <div key="google-pay-option" className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value="google_pay" id="google_pay" />
            <Label htmlFor="google_pay" className="flex-1">
              <div>
                <p className="font-medium">Google Pay</p>
                <p className="text-sm text-gray-600">Płatność Google Pay</p>
              </div>
            </Label>
          </div>

          <div key="card-option" className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value="card" id="card" />
            <Label htmlFor="card" className="flex-1">
              <div>
                <p className="font-medium">Karta płatnicza</p>
                <p className="text-sm text-gray-600">Visa, Mastercard</p>
              </div>
            </Label>
          </div>

          <div key="bank-transfer-option" className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value="bank_transfer" id="bank_transfer" />
            <Label htmlFor="bank_transfer" className="flex-1">
              <div>
                <p className="font-medium">Szybki przelew</p>
                <p className="text-sm text-gray-600">Przelewy online</p>
              </div>
            </Label>
          </div>

          <div key="paypal-option" className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value="paypal" id="paypal" />
            <Label htmlFor="paypal" className="flex-1">
              <div>
                <p className="font-medium">PayPal</p>
                <p className="text-sm text-gray-600">Płatność przez PayPal</p>
              </div>
            </Label>
          </div>

          <div key="cod-option" className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value="cod" id="cod" />
            <Label htmlFor="cod" className="flex-1">
              <div>
                <p className="font-medium">Płatność przy odbiorze</p>
                <p className="text-sm text-gray-600">Gotówka lub karta</p>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {/* BLIK on-site: input na kod i klauzula RODO */}
        {formData.paymentMethod === 'blik' && (
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="blikCode">Kod BLIK *</Label>
              <Input
                id="blikCode"
                inputMode="numeric"
                maxLength={6}
                value={formData.blikCode || ''}
                onChange={(e) => updateField('blikCode', e.target.value.replace(/\D/g, '').slice(0,6))}
                placeholder="••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Wpisz 6-cyfrowy kod BLIK z aplikacji bankowej.</p>
            </div>
            <GdprNotice
              accepted={!!formData.gdprAccepted}
              onChange={(v) => updateField('gdprAccepted', v)}
            />
          </div>
        )}
      </Card>

      {/* Dodatkowe opcje */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="newsletter"
              checked={formData.newsletter}
              onCheckedChange={(checked) => updateField('newsletter', !!checked)}
            />
            <Label htmlFor="newsletter" className="text-sm">
              Chcę otrzymywać newsletter z nowościami i promocjami
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={formData.terms}
              onCheckedChange={(checked) => updateField('terms', !!checked)}
            />
            <Label htmlFor="terms" className="text-sm">
              Akceptuję{' '}
              <a href="/regulamin" className="text-blue-600 hover:underline">
                regulamin
              </a>{' '}
              i{' '}
              <a href="/polityka-prywatnosci" className="text-blue-600 hover:underline">
                politykę prywatności
              </a>{' '}
              *
            </Label>
          </div>
          {errors.terms && (
            <p className="text-sm text-red-500">{errors.terms}</p>
          )}
        </div>
      </Card>

      {/* Submit Button */}
      <Button 
        type="submit" 
        size="lg" 
        className="w-full"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Przetwarzanie...
          </>
        ) : (
          'Złóż zamówienie'
        )}
      </Button>
    </form>
  );
}

export default CheckoutForm;

// Prosty komponent z klauzulą RODO Paynow (pobieramy przez nasz endpoint)
function GdprNotice({ accepted, onChange }: { accepted: boolean; onChange: (v: boolean) => void }) {
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ''}/store/payments/paynow/gdpr`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          // Zakładamy strukturę: { title, content }
          if (mounted) {
            setTitle(data.title || 'Informacja RODO Paynow')
            setContent(data.content || '')
          }
        }
      } catch {}
      finally { setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="mt-3 border rounded-lg p-3 bg-gray-50">
      <p className="text-sm font-medium mb-1">{title || 'Informacja RODO Paynow'}</p>
      <div className="text-xs text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: loading ? 'Ładowanie…' : (content || 'Treść klauzuli RODO zostanie pobrana z Paynow.') }} />
      <div className="flex items-center gap-2 mt-2">
        <Checkbox id="gdpr" checked={accepted} onCheckedChange={(c) => onChange(!!c)} />
        <Label htmlFor="gdpr" className="text-xs">Potwierdzam zapoznanie się z informacją RODO Paynow</Label>
      </div>
    </div>
  )
}

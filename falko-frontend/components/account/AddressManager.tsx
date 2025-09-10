'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Check,
  X,
  Loader2
} from 'lucide-react';
import { 
  CustomerAddress, 
  createCustomerAddress, 
  updateCustomerAddress, 
  deleteCustomerAddress,
  validateAddress,
  COUNTRIES,
  formatAddress,
  CreateAddressRequest
} from '@/lib/api/addresses';

/**
 * Komponent do zarządzania adresami użytkownika
 */

interface AddressManagerProps {
  addresses: CustomerAddress[];
  onAddressesUpdate: () => void;
}

export function AddressManager({ addresses, onAddressesUpdate }: AddressManagerProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [newAddress, setNewAddress] = useState<CreateAddressRequest>({
    first_name: '',
    last_name: '',
    company: '',
    address_1: '',
    address_2: '',
    city: '',
    postal_code: '',
    country_code: 'PL',
    phone: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddAddress = async () => {
    const validation = validateAddress(newAddress);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Proszę poprawić błędy w formularzu');
      return;
    }

    setIsLoading(true);
    try {
      const response = await createCustomerAddress(newAddress);
      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      toast.success('Adres dodany pomyślnie');
      onAddressesUpdate();
      setIsAddingNew(false);
      resetForm();
    } catch (error) {
      toast.error('Błąd podczas dodawania adresu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten adres?')) return;

    setIsLoading(true);
    try {
      const response = await deleteCustomerAddress(addressId);
      if (response.error) {
        toast.error(response.error.message);
        return;
      }

      toast.success('Adres usunięty pomyślnie');
      onAddressesUpdate();
    } catch (error) {
      toast.error('Błąd podczas usuwania adresu');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewAddress({
      first_name: '',
      last_name: '',
      company: '',
      address_1: '',
      address_2: '',
      city: '',
      postal_code: '',
      country_code: 'PL',
      phone: '',
    });
    setErrors({});
  };

  const updateField = (field: keyof typeof newAddress, value: string) => {
    setNewAddress(prev => ({ ...prev, [field]: value }));
    
    // Usuń błędy gdy użytkownik zaczyna pisać
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Address Button */}
      {!isAddingNew && (
        <Button 
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Dodaj nowy adres
        </Button>
      )}

      {/* Add New Address Form */}
      {isAddingNew && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Dodaj nowy adres</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsAddingNew(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Imię</Label>
              <Input
                id="first_name"
                value={newAddress.first_name || ''}
                onChange={(e) => updateField('first_name', e.target.value)}
                placeholder="Imię"
                className={errors.first_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Nazwisko</Label>
              <Input
                id="last_name"
                value={newAddress.last_name || ''}
                onChange={(e) => updateField('last_name', e.target.value)}
                placeholder="Nazwisko"
                className={errors.last_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company">Firma (opcjonalnie)</Label>
              <Input
                id="company"
                value={newAddress.company || ''}
                onChange={(e) => updateField('company', e.target.value)}
                placeholder="Nazwa firmy"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address_1">Adres</Label>
              <Input
                id="address_1"
                value={newAddress.address_1 || ''}
                onChange={(e) => updateField('address_1', e.target.value)}
                placeholder="Ulica i numer domu"
                className={errors.address_1 ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.address_1 && (
                <p className="text-sm text-red-600">{errors.address_1}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address_2">Adres (linia 2)</Label>
              <Input
                id="address_2"
                value={newAddress.address_2 || ''}
                onChange={(e) => updateField('address_2', e.target.value)}
                placeholder="Mieszkanie, piętro, itd. (opcjonalnie)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input
                id="city"
                value={newAddress.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                placeholder="Miasto"
                className={errors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.city && (
                <p className="text-sm text-red-600">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postal_code">Kod pocztowy</Label>
              <Input
                id="postal_code"
                value={newAddress.postal_code || ''}
                onChange={(e) => updateField('postal_code', e.target.value)}
                placeholder="00-000"
                className={errors.postal_code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              />
              {errors.postal_code && (
                <p className="text-sm text-red-600">{errors.postal_code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country_code">Kraj</Label>
              <select
                id="country_code"
                value={newAddress.country_code || 'PL'}
                onChange={(e) => updateField('country_code', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.country_code ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country_code && (
                <p className="text-sm text-red-600">{errors.country_code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon (opcjonalnie)</Label>
              <Input
                id="phone"
                value={newAddress.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+48 123 456 789"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsAddingNew(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button 
              onClick={handleAddAddress}
              disabled={isLoading}
              className="flex-1 flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isLoading ? 'Dodawanie...' : 'Dodaj adres'}
            </Button>
          </div>
        </Card>
      )}

      {/* Existing Addresses */}
      <div className="space-y-4">
        {addresses.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak adresów</h3>
            <p className="text-gray-600">Dodaj swój pierwszy adres, aby przyspieszić zamówienia.</p>
          </Card>
        ) : (
          addresses.map((address) => (
            <Card key={address.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <h4 className="font-semibold">
                      {address.first_name} {address.last_name}
                    </h4>
                  </div>
                  
                  <div className="text-sm text-gray-600 whitespace-pre-line">
                    {formatAddress(address)}
                  </div>

                  {address.phone && (
                    <p className="text-sm text-gray-600 mt-2">
                      Tel: {address.phone}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingId(address.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteAddress(address.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

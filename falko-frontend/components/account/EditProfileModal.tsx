'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Mail, Phone, Save, X, Loader2 } from 'lucide-react';
import { type CustomerProfile, updateCustomerProfile, validateProfileData } from '@/lib/api/profile';

/**
 * Komponent do edycji profilu użytkownika
 * Premium design z walidacją formularza
 */

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile | null;
  onSuccess: () => void;
}

export function EditProfileModal({ isOpen, onClose, profile, onSuccess }: EditProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  const [errors, setErrors] = useState<{
    first_name?: string;
    last_name?: string;
    phone?: string;
  }>({});

  // Aktualizuj formData gdy profile się zmieni
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const validateForm = (): boolean => {
    const validation = validateProfileData(formData);
    const newErrors: typeof errors = {};

    if (!validation.isValid) {
      validation.errors.forEach(error => {
        if (error.includes('Imię')) newErrors.first_name = error;
        if (error.includes('Nazwisko')) newErrors.last_name = error;
        if (error.includes('telefon')) newErrors.phone = error;
      });
    }

    setErrors(newErrors);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await updateCustomerProfile(formData);
      
      if (response.error) {
        toast.error(response.error.message);
        return;
      }
      
      toast.success('Profil zaktualizowany pomyślnie');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Błąd podczas aktualizacji profilu');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Usuń błąd dla tego pola
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Edytuj profil</h2>
                <p className="text-sm text-gray-600">Zaktualizuj swoje dane osobowe</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Imię */}
            <div className="space-y-2">
              <Label htmlFor="first_name">Imię</Label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                placeholder="Twoje imię"
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            {/* Nazwisko */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Nazwisko</Label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                placeholder="Twoje nazwisko"
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>

            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-xs text-gray-500">Email nie może być zmieniony</p>
            </div>

            {/* Telefon */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+48 123 456 789"
                  className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Anuluj
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isLoading ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

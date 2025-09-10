'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/lib/api/auth'; // Zmienione z auth-new na auth
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

/**
 * Strona ustawiania nowego hasła (po kliknięciu w link z emaila)
 * Premium design z walidacją i UX feedback
 */
export function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    token?: string;
  }>({});

  // Pobierz parametry z URL
  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    // Sprawdź czy mamy wymagane parametry
    if (!email || !token) {
      setErrors({ token: 'Nieprawidłowy lub wygasły link resetowania hasła' });
    }
  }, [email, token]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    // Token validation
    if (!email || !token) {
      newErrors.token = 'Nieprawidłowy lub wygasły link resetowania hasła';
      setErrors(newErrors);
      return false;
    }
    
    // Password validation
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Hasło musi mieć co najmniej 8 znaków';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Hasło musi zawierać małą literę';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Hasło musi zawierać wielką literę';
    } else if (!/(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Hasło musi zawierać cyfrę';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Potwierdź hasło';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Hasła nie są identyczne';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await resetPassword(email!, token!, formData.password);
      
      if (result.error) {
        toast.error(result.error.message || 'Błąd podczas resetowania hasła');
        setErrors({ token: 'Link resetowania hasła jest nieprawidłowy lub wygasł' });
      } else {
        setIsSuccess(true);
        toast.success('Hasło zostało pomyślnie zmienione!');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Wystąpił błąd podczas resetowania hasła');
      setErrors({ token: 'Link resetowania hasła jest nieprawidłowy lub wygasł' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: 'password' | 'confirmPassword', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGoToLogin = () => {
    router.push('/login');
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Falko Project
              </h1>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Hasło zmienione!
              </h2>
            </div>
          </div>

          {/* Success Card */}
          <Card className="p-6 shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Hasło zostało pomyślnie zmienione
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Twoje hasło zostało zaktualizowane. Możesz teraz zalogować się na swoje konto używając nowego hasła.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleGoToLogin}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  Przejdź do logowania
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Error state (invalid token)
  if (errors.token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Falko Project
              </h1>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Link wygasł
              </h2>
            </div>
          </div>

          {/* Error Card */}
          <Card className="p-6 shadow-lg">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Nieprawidłowy lub wygasły link
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Link resetowania hasła jest nieprawidłowy lub wygasł. Linki są ważne przez 24 godziny ze względów bezpieczeństwa.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/forgot-password')}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  Wyślij nowy link
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleGoToLogin}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  Powrót do logowania
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4" />
            <span>Powrót do logowania</span>
          </Link>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Falko Project
            </h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Ustaw nowe hasło
            </h2>
            <p className="text-gray-600">
              Wprowadź nowe hasło dla konta{' '}
              <span className="font-medium">{email}</span>
            </p>
          </div>
        </div>

        {/* Reset Password Form */}
        <Card className="p-6 shadow-lg">
          <div className="px-2 py-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nowe hasło */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Nowe hasło
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Minimum 8 znaków"
                    className={`pl-11 pr-11 h-12 text-base ${errors.password ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
                
                {/* Wskaźnik siły hasła */}
                <PasswordStrengthIndicator 
                  password={formData.password} 
                  showDetails={true}
                />
              </div>

              {/* Potwierdzenie hasła */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Potwierdź nowe hasło
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Powtórz hasło"
                    className={`pl-11 pr-11 h-12 text-base ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Resetowanie hasła...
                    </>
                  ) : (
                    'Ustaw nowe hasło'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Security info */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-2 gap-6 text-xs text-gray-500">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">Bezpieczne szyfrowanie</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium">Ochrona danych</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

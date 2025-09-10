'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, RegisterData } from '@/lib/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { useRateLimit } from '@/lib/hooks/useRateLimit';
import { RateLimitWarning } from './RateLimitWarning';
import { useEmailValidation } from '@/lib/hooks/useEmailValidation';
import { EmailValidationIndicator } from './EmailValidationIndicator';

/**
 * Strona rejestracji dla Falko Project
 * Premium design z walidacją i UX feedback
 */
export function RegisterPageClient() {
  const { state, register } = useAuth();
  const router = useRouter();
  
  // Rate limiting hook
  const rateLimit = useRateLimit('registration', {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000, // 15 minut
    blockDurationMs: 30 * 60 * 1000, // 30 minut blokady
  });
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  
  // Email validation hook (po deklaracji formData)
  const emailValidation = useEmailValidation(
    formData.email,
    // Włącz walidację tylko jeśli email ma prawidłowy format
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
  );
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    // Email validation
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Podaj prawidłowy adres email';
    } else if (emailValidation.hasChecked && emailValidation.isAvailable === false) {
      newErrors.email = 'Ten adres email jest już używany';
    } else if (emailValidation.isChecking) {
      newErrors.email = 'Sprawdzanie dostępności emaila...';
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
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Potwierdź hasło';
    } else if (confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Hasła nie są identyczne';
    }
    
    // Name validation
    if (!formData.first_name || formData.first_name.trim().length < 2) {
      newErrors.first_name = 'Imię musi mieć co najmniej 2 znaki';
    }
    
    if (!formData.last_name || formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Nazwisko musi mieć co najmniej 2 znaki';
    }
    
    // Phone validation (opcjonalne)
    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Podaj prawidłowy numer telefonu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sprawdź rate limiting
    if (!rateLimit.canSubmit) {
      toast.error('Przekroczono limit prób. Spróbuj ponownie później.');
      return;
    }
    
    // Poczekaj na zakończenie sprawdzania emaila jeśli w trakcie
    if (emailValidation.isChecking) {
      toast.error('Poczekaj na sprawdzenie dostępności emaila');
      return;
    }
    
    // Sprawdź czy email jest dostępny
    if (emailValidation.hasChecked && emailValidation.isAvailable === false) {
      toast.error('Ten adres email jest już używany');
      rateLimit.recordAttempt();
      return;
    }
    
    if (!validateForm()) {
      // Zapisz nieudaną próbę walidacji
      rateLimit.recordAttempt();
      return;
    }
    
    // Przygotuj dane do wysłania (usuń puste pole telefonu)
    const registrationData: RegisterData = {
      ...formData,
      phone: formData.phone?.trim() || undefined,
    };
    
    const result = await register(registrationData);
    
    if (result.success) {
      toast.success('Konto utworzone pomyślnie! Zostałeś automatycznie zalogowany.');
      // Reset rate limiting przy udanej rejestracji
      rateLimit.reset();
      // Przekieruj do strony głównej lub poprzedniej strony
      const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
      router.push(returnUrl || '/');
    } else {
      // Zapisz nieudaną próbę rejestracji
      rateLimit.recordAttempt();
      toast.error(result.error || 'Błąd tworzenia konta');
    }
  };

  const updateField = (field: keyof RegisterData | 'confirmPassword', value: string) => {
    if (field === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Reset email validation when email field changes
    if (field === 'email') {
      emailValidation.reset();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Powrót do sklepu</span>
          </Link>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Falko Project
            </h1>
            <h2 className="text-xl font-semibold text-foreground/90 mb-2">
              Utwórz nowe konto
            </h2>
            <p className="text-foreground/70">
              Masz już konto?{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Zaloguj się
              </Link>
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <Card className="p-6 shadow-lg bg-card/80 backdrop-blur-sm border">
          <div className="px-2 py-2">
            {/* Rate Limit Warning */}
            <RateLimitWarning
              attempts={rateLimit.attempts}
              maxAttempts={3}
              isBlocked={rateLimit.isBlocked}
              timeRemaining={rateLimit.timeRemaining}
              className="mb-6"
            />
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Imię i Nazwisko */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium text-foreground">
                    Imię
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-foreground/40" />
                    </div>
                    <Input
                      id="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => updateField('first_name', e.target.value)}
                      placeholder="Jan"
                      className={`pl-11 h-12 text-base ${errors.first_name ? 'border-red-500' : ''}`}
                      disabled={state.isLoading}
                    />
                  </div>
                  {errors.first_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-medium text-foreground">
                    Nazwisko
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-foreground/40" />
                    </div>
                    <Input
                      id="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => updateField('last_name', e.target.value)}
                      placeholder="Kowalski"
                      className={`pl-11 h-12 text-base ${errors.last_name ? 'border-red-500' : ''}`}
                      disabled={state.isLoading}
                    />
                  </div>
                  {errors.last_name && (
                    <p className="text-sm text-red-500 mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Adres email
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-foreground/40" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="jan.kowalski@email.com"
                    className={`pl-11 h-12 text-base ${errors.email ? 'border-red-500' : ''}`}
                    disabled={state.isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500 mt-2">{errors.email}</p>
                )}
                
                {/* Email validation indicator */}
                <EmailValidationIndicator
                  isChecking={emailValidation.isChecking}
                  isAvailable={emailValidation.isAvailable}
                  error={emailValidation.error}
                  hasChecked={emailValidation.hasChecked}
                  email={formData.email}
                  className="mt-2"
                />
              </div>

              {/* Telefon (opcjonalny) */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Numer telefonu <span className="text-foreground/50">(opcjonalny)</span>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-foreground/40" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+48 123 456 789"
                    className={`pl-11 h-12 text-base ${errors.phone ? 'border-red-500' : ''}`}
                    disabled={state.isLoading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-500 mt-2">{errors.phone}</p>
                )}
              </div>

              {/* Hasło */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Hasło
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-foreground/40" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Minimum 8 znaków"
                    className={`pl-11 pr-11 h-12 text-base ${errors.password ? 'border-red-500' : ''}`}
                    disabled={state.isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-foreground/40 hover:text-foreground/60 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-foreground/40 hover:text-foreground/60 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 mt-2">{errors.password}</p>
                )}
                
                {/* Wskaźnik siły hasła */}
                <PasswordStrengthIndicator 
                  password={formData.password} 
                  showDetails={true}
                />
              </div>

              {/* Potwierdzenie hasła */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Potwierdź hasło
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-foreground/40" />
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Powtórz hasło"
                    className={`pl-11 pr-11 h-12 text-base ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    disabled={state.isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-foreground/40 hover:text-foreground/60 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-foreground/40 hover:text-foreground/60 transition-colors" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-2">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Przycisk rejestracji */}
              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                  disabled={
                    state.isLoading || 
                    !rateLimit.canSubmit || 
                    emailValidation.isChecking ||
                    (emailValidation.hasChecked && emailValidation.isAvailable === false)
                  }
                >
                  {state.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Tworzenie konta...
                    </>
                  ) : !rateLimit.canSubmit ? (
                    'Konto tymczasowo zablokowane'
                  ) : emailValidation.isChecking ? (
                    'Sprawdzanie emaila...'
                  ) : (emailValidation.hasChecked && emailValidation.isAvailable === false) ? (
                    'Email już zajęty'
                  ) : (
                    'Utwórz konto'
                  )}
                </Button>
              </div>
            </form>

            {/* Separator i opcja gościa */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    Lub kontynuuj jako gość
                  </span>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base"
                  size="lg"
                  onClick={() => router.push('/checkout')}
                >
                  Zakupy bez konta
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Trust indicators */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-3 gap-6 text-xs text-gray-500">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">Bezpieczne dane</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium">Ochrona prywatności</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium">Szybka rejestracja</span>
            </div>
          </div>
        </div>

        {/* Informacja o regulaminie */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Tworząc konto, akceptujesz nasze{' '}
            <Link href="/regulamin" className="text-blue-600 hover:text-blue-700 underline">
              Warunki korzystania
            </Link>{' '}
            oraz{' '}
            <Link href="/polityka-prywatnosci" className="text-blue-600 hover:text-blue-700 underline">
              Politykę prywatności
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

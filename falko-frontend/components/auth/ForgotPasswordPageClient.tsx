'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/api/auth'; // Zmienione z auth-new na auth
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Strona resetowania hasła dla Falko Project
 * Premium design z walidacją i UX feedback
 */
export function ForgotPasswordPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Podaj adres email');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Podaj prawidłowy adres email');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await requestPasswordReset(email);
      
      if (result.error) {
        // Nawet jeśli email nie istnieje, pokazujemy sukces dla bezpieczeństwa
        // (nie ujawniamy czy email istnieje w systemie)
        setIsEmailSent(true);
        toast.success('Instrukcje resetowania hasła zostały wysłane na podany adres email');
      } else {
        setIsEmailSent(true);
        toast.success('Instrukcje resetowania hasła zostały wysłane na podany adres email');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      // Zawsze pokazujemy sukces dla bezpieczeństwa
      setIsEmailSent(true);
      toast.success('Instrukcje resetowania hasła zostały wysłane na podany adres email');
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmail = (value: string) => {
    setEmail(value);
    if (error) {
      setError(null);
    }
  };

  const handleBackToLogin = () => {
    router.push('/login');
  };

  const handleResendEmail = () => {
    setIsEmailSent(false);
    setEmail('');
  };

  if (isEmailSent) {
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
                Email wysłany!
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
                Sprawdź swoją skrzynkę email
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                Wysłaliśmy instrukcje resetowania hasła na adres <strong>{email}</strong>. 
                Kliknij w link w emailu, aby ustawić nowe hasło.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleBackToLogin}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  Powrót do logowania
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  Wyślij ponownie
                </Button>
              </div>
            </div>
          </Card>

          {/* Help text */}
          <div className="mt-8 text-center">
            <div className="text-sm text-gray-500 space-y-2">
              <p>Nie otrzymałeś emaila?</p>
              <p>• Sprawdź folder spam/promocje</p>
              <p>• Upewnij się, że podałeś prawidłowy adres</p>
              <p>• Email może dotrzeć w ciągu kilku minut</p>
            </div>
          </div>
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
              Resetowanie hasła
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Podaj adres email powiązany z Twoim kontem, a wyślemy Ci instrukcje resetowania hasła
            </p>
          </div>
        </div>

        {/* Reset Password Form */}
        <Card className="p-6 shadow-lg">
          <div className="px-2 py-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Adres email
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(e.target.value)}
                    placeholder="twoj@email.com"
                    className={`pl-11 h-12 text-base ${error ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-500 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
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
                      Wysyłanie...
                    </>
                  ) : (
                    'Wyślij instrukcje resetowania'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Help links */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-2 gap-6 text-xs text-gray-500">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <span className="font-medium">Bezpieczny proces</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="font-medium">Szybkie działanie</span>
            </div>
          </div>
        </div>

        {/* Additional help */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Potrzebujesz pomocy?{' '}
            <Link href="/kontakt" className="text-blue-600 hover:text-blue-700 underline">
              Skontaktuj się z nami
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

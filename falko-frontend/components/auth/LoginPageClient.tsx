// Enhanced Login Page with proper Remember Me functionality
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { SocialLoginButtons } from './SocialLoginButtons';
import { EmailValidationIndicator } from './EmailValidationIndicator';
import { RateLimitWarning } from './RateLimitWarning';
import { useAuth } from '@/lib/context/auth-context';
import { useEmailValidation } from '@/lib/hooks/useEmailValidation';
import { useRateLimit } from '@/lib/hooks/useRateLimit';
import { SessionManager } from '@/lib/auth-session';
import { toast } from 'sonner';

export default function LoginPageClient() {
  const router = useRouter();
  const { login, state } = useAuth();
  
  // Form state
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Enhanced hooks
  const [email, setEmail] = useState('');
  const { isAvailable, isChecking } = useEmailValidation(email, false);
  const { canSubmit, attempts, isBlocked, timeRemaining, recordAttempt, reset } = useRateLimit('login', {
    maxAttempts: 10, // Zwiększ limit prób
    windowMs: 15 * 60 * 1000, // 15 minut
    blockDurationMs: 5 * 60 * 1000, // 5 minut blokady
  });
  
  // Load remembered email and remember me state on component mount
  useEffect(() => {
    const rememberedEmail = SessionManager.getRememberedEmail();
    const shouldRemember = SessionManager.shouldRememberUser();
    
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(shouldRemember);
    }
  }, [canSubmit, attempts, isBlocked, timeRemaining]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      router.push('/sklep');
    }
  }, [state.isAuthenticated, router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      toast.error(`Zbyt wiele prób logowania. Spróbuj ponownie za ${Math.max(1, Math.ceil(timeRemaining / 60))} minut.`);
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Podaj prawidłowy adres email');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Hasło musi mieć co najmniej 6 znaków');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await login(email, password, rememberMe);
      
      if (result.success) {
        toast.success('Zalogowano pomyślnie!');
        
        // Log session info for debugging
        const sessionStatus = SessionManager.getSessionStatus();
        
        router.push('/sklep');
      } else {
        recordAttempt();
        toast.error(result.error || 'Błąd logowania');
      }
    } catch (error) {
      recordAttempt();
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd';
      toast.error('Wystąpił błąd podczas logowania');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 shadow-xl border bg-card/80 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Zaloguj się
            </h1>
            <p className="text-foreground/70">
              Witaj ponownie w Falko Project
            </p>
          </div>
          
          {/* Rate Limit Warning */}
          <RateLimitWarning 
            attempts={attempts}
            maxAttempts={10}
            isBlocked={isBlocked}
            timeRemaining={timeRemaining}
          />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj@email.com"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <EmailValidationIndicator 
                  isChecking={isChecking}
                  isAvailable={null}
                  error={null}
                  hasChecked={false}
                  email={email}
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Twoje hasło"
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/60 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/20"
                />
                <Label htmlFor="remember-me" className="text-sm text-foreground/70 cursor-pointer">
                  Zapamiętaj mnie {rememberMe ? '(30 dni)' : '(do zamknięcia przeglądarki)'}
                </Label>
              </div>
              
              <Link 
                href="/forgot-password" 
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Zapomniałeś hasła?
              </Link>
            </div>
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logowanie...</span>
                </div>
              ) : (
                'Zaloguj się'
              )}
            </Button>
          </form>
          
          {/* Social Login Options */}
          <SocialLoginButtons 
            className="mt-6" 
            callbackUrl="/sklep" 
          />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-foreground/60">
                  Lub kontynuuj jako gość
                </span>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => router.push('/sklep')}
                className="w-full"
                disabled={loading}
              >
                Zakupy bez konta
              </Button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-foreground/70">
              Nie masz konta?{' '}
              <Link 
                href="/register" 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Zarejestruj się
              </Link>
            </p>
          </div>
          
          {/* Debug Info (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-muted/50 rounded-lg text-xs">
              <p className="font-medium mb-1 text-foreground">Debug Info:</p>
              <p className="text-foreground/70">Remember Me: {rememberMe ? 'Yes (30 days)' : 'No (session only)'}</p>
              <p className="text-foreground/70">Email Available: {isAvailable ? 'Yes' : 'No'}</p>
              <p className="text-foreground/70">Rate Limit: {10 - attempts} attempts left</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
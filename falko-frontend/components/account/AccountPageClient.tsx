'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Package, 
  Settings, 
  CreditCard, 
  MapPin, 
  Bell,
  LogOut,
  ChevronRight,
  Edit,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  X,
  Loader2,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Link from 'next/link';
import { EditProfileModal } from './EditProfileModal';
import { AddressManager } from './AddressManager';
import { ChangePasswordModal } from './ChangePasswordModal';
import { OrderDetailsModal } from './OrderDetailsModal';
import { LoyaltyPointsDisplay } from '@/components/shared/LoyaltyPointsDisplay';
import { LoyaltyRewardsGrid } from '@/components/shared/LoyaltyRewardsGrid';
import { LoyaltyHistory } from '@/components/shared/LoyaltyHistory';
import { LoyaltyConnectionStatus } from '@/components/shared/LoyaltyConnectionStatus';
import { AccountSkeleton } from '@/components/ui/loading-skeletons';
import { useCustomerOrders, useCustomerAddresses, useCustomerProfile } from '@/lib/hooks/use-customer-data';
import { Order, getOrderStatusLabel, getOrderStatusColor, formatPrice } from '@/lib/api/orders';
import { CustomerAddress, formatAddress } from '@/lib/api/addresses';
import { CustomerProfile, formatFullName } from '@/lib/api/profile';

/**
 * Panel użytkownika dla Falko Project
 * Premium design z wszystkimi funkcjami e-commerce
 */

type TabType = 'overview' | 'orders' | 'profile' | 'addresses' | 'loyalty' | 'settings';

export function AccountPageClient() {
  const { state, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Pobieranie rzeczywistych danych z API
  const { orders, loading: ordersLoading, error: ordersError, refetch: refetchOrders } = useCustomerOrders();
  const { addresses, loading: addressesLoading, error: addressesError, refetch: refetchAddresses } = useCustomerAddresses();
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useCustomerProfile();

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      router.push('/login?returnUrl=/konto');
    }
  }, [state.isAuthenticated, state.isLoading, router]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      toast.success('Wylogowano pomyślnie');
      router.push('/');
    } catch (error) {
      toast.error('Błąd podczas wylogowywania');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = () => {
    refetchProfile();
    setIsEditProfileOpen(false);
    toast.success('Profil zaktualizowany pomyślnie');
  };

  const handleAddressesUpdate = () => {
    refetchAddresses();
    toast.success('Adresy zaktualizowane pomyślnie');
  };

  if (state.isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <AccountSkeleton />
        </div>
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return null; // Przekierowanie już się dzieje w useEffect
  }

  const tabs = [
    {
      id: 'overview' as TabType,
      label: 'Przegląd',
      icon: User,
      description: 'Podsumowanie konta'
    },
    {
      id: 'orders' as TabType,
      label: 'Zamówienia',
      icon: Package,
      description: 'Historia zakupów'
    },
    {
      id: 'profile' as TabType,
      label: 'Profil',
      icon: Edit,
      description: 'Dane osobowe'
    },
    {
      id: 'addresses' as TabType,
      label: 'Adresy',
      icon: MapPin,
      description: 'Adresy dostawy'
    },
    {
      id: 'loyalty' as TabType,
      label: 'Program lojalnościowy',
      icon: Star,
      description: 'Punkty i nagrody'
    },
    {
      id: 'settings' as TabType,
      label: 'Ustawienia',
      icon: Settings,
      description: 'Preferencje konta'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">Moje konto</h1>
              <div className="hidden sm:block">
                <p className="text-sm text-foreground/70">
                  Witaj, {profile ? (profile.first_name || profile.last_name ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : profile.email) : state.user?.email}!
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Wyloguj
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'text-foreground/80 hover:bg-muted/50'
                    }`}
                  >
                    <tab.icon className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{tab.label}</p>
                      <p className="text-xs text-foreground/50 truncate">{tab.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && <OverviewTab orders={orders} ordersLoading={ordersLoading} profile={profile as any} />}
                {activeTab === 'orders' && <OrdersTab orders={orders} ordersLoading={ordersLoading} onOrderSelect={setSelectedOrderId} />}
                {activeTab === 'profile' && <ProfileTab profile={profile as any} profileLoading={profileLoading} onEditProfile={() => setIsEditProfileOpen(true)} />}
                {activeTab === 'addresses' && <AddressesTab addresses={addresses} addressesLoading={addressesLoading} onAddressesUpdate={handleAddressesUpdate} />}
                {activeTab === 'loyalty' && <LoyaltyTab />}
                {activeTab === 'settings' && <SettingsTab onChangePassword={() => setIsChangePasswordOpen(true)} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditProfileModal
        profile={profile}
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onSuccess={handleProfileUpdate}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Order Details Modal */}
      {selectedOrderId && (
        <OrderDetailsModal 
          order={{ id: selectedOrderId } as Order}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}

// Komponenty dla poszczególnych tabów
function OverviewTab({ 
  orders, 
  ordersLoading, 
  profile 
}: { 
  orders: Order[]; 
  ordersLoading: boolean; 
  profile: CustomerProfile | null; 
}) {
  const recentOrders = orders.slice(0, 3);
  const totalSpent = orders
    .filter(o => o.payment_status === 'captured' && o.status !== 'canceled')
    .reduce((sum, order) => sum + Math.max(0, (order.total - (order.refunded_total || 0))), 0);

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2 text-foreground/60" />
        <span className="text-foreground/80">Ładowanie danych...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground/60">Wszystkie zamówienia</p>
              <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-foreground/60">Łącznie wydano</p>
              <p className="text-2xl font-bold text-foreground">{formatPrice(totalSpent)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-foreground/60">Klient od</p>
              <p className="text-2xl font-bold text-foreground">
                {profile ? new Date(profile.created_at).getFullYear() : '---'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Ostatnie zamówienia</h3>
        {recentOrders.length === 0 ? (
          <p className="text-foreground/60 text-center py-8">Brak zamówień</p>
        ) : (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <Package className="h-4 w-4 text-foreground/60" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">#{order.display_id}</p>
                    <p className="text-sm text-foreground/60">
                      {new Date(order.created_at).toLocaleDateString('pl-PL')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={getOrderStatusColor(order.status)}>
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                  <p className="text-sm font-medium mt-1">{formatPrice(order.total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function OrdersTab({ 
  orders, 
  ordersLoading,
  onOrderSelect 
}: { 
  orders: Order[]; 
  ordersLoading: boolean;
  onOrderSelect: (orderId: string) => void;
}) {
  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2 text-foreground/60" />
        <span className="text-foreground/80">Ładowanie zamówień...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Moje zamówienia</h2>
        <div className="text-sm text-foreground/60">
          {orders.length} zamówień
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Brak zamówień</h3>
          <p className="text-foreground/60 mb-4">Nie masz jeszcze żadnych zamówień.</p>
          <Button asChild>
            <Link href="/sklep">Rozpocznij zakupy</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold">#{order.display_id}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('pl-PL')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getOrderStatusColor(order.status)}>
                    {getOrderStatusLabel(order.status)}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onOrderSelect(order.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Szczegóły
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Kwota</p>
                  <p className="font-medium">{formatPrice(order.total)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Produkty</p>
                  <p className="font-medium">{order.items.length} pozycji</p>
                </div>
                <div>
                  <p className="text-gray-600">Status płatności</p>
                  <Badge className={getOrderStatusColor(order.payment_status, 'payment')}>
                    {getOrderStatusLabel(order.payment_status, 'payment')}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ 
  profile, 
  profileLoading, 
  onEditProfile 
}: { 
  profile: CustomerProfile | null; 
  profileLoading: boolean; 
  onEditProfile: () => void; 
}) {
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Ładowanie profilu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mój profil</h2>
        <Button onClick={onEditProfile}>
          <Edit className="h-4 w-4 mr-2" />
          Edytuj profil
        </Button>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Imię</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.first_name || '---'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Nazwisko</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.last_name || '---'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.email || '---'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Telefon</label>
            <p className="mt-1 text-sm text-gray-900">{profile?.phone || '---'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Data rejestracji</label>
            <p className="mt-1 text-sm text-gray-900">
              {profile ? new Date(profile.created_at).toLocaleDateString('pl-PL') : '---'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AddressesTab({ 
  addresses, 
  addressesLoading, 
  onAddressesUpdate 
}: { 
  addresses: CustomerAddress[]; 
  addressesLoading: boolean; 
  onAddressesUpdate: () => void; 
}) {
  if (addressesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Ładowanie adresów...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Moje adresy</h2>
      </div>

      <AddressManager 
        addresses={addresses}
        onAddressesUpdate={onAddressesUpdate}
      />
    </div>
  );
}

function SettingsTab({ onChangePassword }: { onChangePassword: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ustawienia konta</h2>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Bezpieczeństwo</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Hasło</p>
              <p className="text-sm text-gray-600">Zmień hasło dostępu do konta</p>
            </div>
            <Button variant="outline" onClick={onChangePassword}>
              Zmień hasło
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Powiadomienia</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Powiadomienia email</p>
              <p className="text-sm text-gray-600">Otrzymuj powiadomienia o statusie zamówień</p>
            </div>
            <Button variant="outline">
              Zarządzaj
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LoyaltyTab() {
  const { tier, nextTier, pointsToNextTier, lifetimeSpent } = (require('@/lib/context/loyalty-context') as any).useLoyalty();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Program Lojalnościowy</h2>
        <LoyaltyPointsDisplay variant="profile" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1 md:col-span-3 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Twoja ranga</p>
              <h3 className="text-xl font-semibold">{tier.name}</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                {tier.name === 'Bronze' && 'Zdobywaj punkty za zakupy aby odblokować wyższe poziomy i dodatkowe korzyści.'}
                {tier.name === 'Silver' && '+5% punktów za każde zamówienie oraz dostęp do ekskluzywnych nagród Silver.'}
                {tier.name === 'Gold' && 'Najwyższy poziom: +10% punktów, ekskluzywne produkty i wcześniejszy dostęp do premier.'}
              </p>
            </div>
            {nextTier && (
              <div className="w-full max-w-sm">
                <p className="text-sm text-muted-foreground mb-1">Postęp do {nextTier.name}</p>
                <div className="h-3 w-full rounded bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-amber-500"
                    style={{
                      width: (() => {
                        const base = tier.minAmount ?? 0;
                        const target = nextTier.minAmount ?? (base + 1);
                        const progress = (lifetimeSpent - base) / Math.max(1, target - base);
                        return `${Math.min(100, Math.max(0, progress * 100))}%`;
                      })()
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pozostało {pointsToNextTier} zł</p>
              </div>
            )}
            {!nextTier && (
              <div className="px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm">
                Osiągnąłeś najwyższy poziom. Czekaj na specjalne sezony i bonusy!
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LoyaltyRewardsGrid />
        </div>
        <div>
          <LoyaltyHistory />
        </div>
      </div>
    </div>
  );
}

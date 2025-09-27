'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/context/auth-context'
import { toast } from 'sonner';
import { 
  fetchCustomerLoyaltyPoints, 
  fetchLoyaltyRewards, 
  redeemLoyaltyReward,
  mapLoyaltyRewardFromApi,
  mapLoyaltyTransactionFromApi,
  type LoyaltyRewardResponse,
  type LoyaltyTransactionResponse
} from '@/lib/api/loyalty';
import { getCustomerOrders, type Order } from '@/lib/api/orders';

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  category: 'discount' | 'shipping' | 'product' | 'exclusive';
  discountAmount?: number; // w PLN
  discountPercentage?: number; // w %
  productId?: string;
  isLimited?: boolean;
  validUntil?: string;
  image?: string;
}

export interface LoyaltyTransaction {
  id: string;
  type: 'earned' | 'spent';
  points: number;
  description: string;
  orderId?: string;
  rewardId?: string;
  createdAt: string;
}

export type LoyaltyTier = 'bronze' | 'silver' | 'gold';

interface LoyaltyTierInfo {
  id: LoyaltyTier;
  name: string;
  // Uwaga: w nowym modelu min/max odnoszą się do WYDATKÓW (PLN), nie punktów
  minAmount: number; // PLN
  maxAmount: number | null; // PLN
  gradient: string;
  color: string;
  perks: string[];
}

// Progi rang oparte na wydatkach (PLN)
const TIERS_BY_SPEND: LoyaltyTierInfo[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minAmount: 0,
    maxAmount: 999,
    gradient: 'from-amber-600 to-amber-400',
    color: 'text-amber-600',
    perks: ['Standardowe nagrody', 'Śledzenie punktów', 'Bonus powitalny']
  },
  {
    id: 'silver',
    name: 'Silver',
    minAmount: 1000,
    maxAmount: 1999,
    gradient: 'from-slate-400 to-slate-200',
    color: 'text-slate-500',
    perks: ['+5% punktów za zamówienia', 'Dostęp do nagród Silver', 'Priorytetowe wsparcie']
  },
  {
    id: 'gold',
    name: 'Gold',
    minAmount: 2000,
    maxAmount: null,
    gradient: 'from-yellow-400 via-amber-300 to-yellow-200',
    color: 'text-yellow-500',
    perks: ['+10% punktów za zamówienia', 'Ekskluzywne nagrody Gold', 'Early access do kolekcji']
  }
];

function resolveTierBySpend(amountPLN: number): LoyaltyTierInfo {
  return (
    TIERS_BY_SPEND.find(
      (t) => amountPLN >= t.minAmount && (t.maxAmount === null || amountPLN <= t.maxAmount)
    ) || TIERS_BY_SPEND[0]
  );
}

function nextTierInfoBySpend(amountPLN: number) {
  const current = resolveTierBySpend(amountPLN);
  const next = TIERS_BY_SPEND.find((t) => t.minAmount > current.minAmount) || null;
  const toNext = next ? Math.max(0, next.minAmount - amountPLN) : 0;
  return { current, next: next || null, toNext };
}

interface LoyaltyContextType {
  points: number;
  pointsHistory: LoyaltyTransaction[];
  availableRewards: LoyaltyReward[];
  loading: boolean;
  error: string | null;
  redeemReward: (rewardId: string) => Promise<boolean>;
  refreshPoints: () => Promise<void>;
  refreshRewards: () => Promise<void>;
  getPointsForOrder: (orderTotal: number) => number;
  // Rangi oparte na WYDATKACH
  tier: LoyaltyTierInfo;
  nextTier: LoyaltyTierInfo | null;
  pointsToNextTier: number; // Uwaga: teraz oznacza PLN do następnej rangi (nazwa zachowana dla kompatybilności)
  lifetimeSpent: number; // PLN, prawdziwa suma wydana przez klienta
  lastOrderAt: string | null; // ISO date ostatniego zamówienia
}

const LoyaltyContext = createContext<LoyaltyContextType | null>(null);

// Usunięto stare mocki nagród/historii – korzystamy z backendu i logiki opartej o wydatki

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const { state: auth } = useAuth()
  const [points, setPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState<LoyaltyTransaction[]>([]);
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // WYDATKI (PLN) – źródło prawdy do rang
  const [lifetimeSpent, setLifetimeSpent] = useState<number>(0);
  const [lastOrderAt, setLastOrderAt] = useState<string | null>(null);
  const [tierState, setTierState] = useState(() => nextTierInfoBySpend(0));

  // Konfiguracja degradacji rangi po nieaktywności (miesiące)
  const INACTIVITY_MONTHS = Number(process.env.NEXT_PUBLIC_LOYALTY_INACTIVITY_MONTHS || 3);

  function applyInactivityDegradation(current: LoyaltyTierInfo, lastOrderISO: string | null): LoyaltyTierInfo {
    if (!lastOrderISO) return current;
    try {
      const now = new Date();
      const last = new Date(lastOrderISO);
      const months = (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth());
      if (months < INACTIVITY_MONTHS) return current;

      // Degradacja o 1 poziom za każdy pełny okres INACTIVITY_MONTHS
      const steps = Math.floor(months / INACTIVITY_MONTHS);
      const order = ['gold', 'silver', 'bronze'] as LoyaltyTier[];
      const idx = order.indexOf(current.id);
      const newIdx = Math.min(order.length - 1, idx + steps);
      const targetId = order[newIdx];
      return TIERS_BY_SPEND.find((t) => t.id === targetId) || current;
    } catch {
      return current;
    }
  }

  const refreshPoints = async () => {
    if (!auth?.isAuthenticated) {
      // reset state for guests
      setPoints(0)
      setPointsHistory([])
      return
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomerLoyaltyPoints();
      setPoints(data.points);
      setPointsHistory(data.history.map(mapLoyaltyTransactionFromApi));
      // Ranga wyliczana na podstawie WYDATKÓW – ustawiana w refreshSpend()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nie udało się pobrać punktów lojalnościowych';
      setError(errorMessage);
      toast.error('Nie udało się pobrać punktów lojalnościowych');
    } finally {
      setLoading(false);
    }
  };

  // Prawdziwe dane o WYDATKACH z Medusa SDK
  const refreshSpend = async () => {
    if (!auth?.isAuthenticated) {
      setLifetimeSpent(0)
      setLastOrderAt(null)
      setTierState(nextTierInfoBySpend(0))
      return
    }
    try {
      const res = await getCustomerOrders(100, 0);
      const orders: Order[] = (res.data?.orders || []).filter(
        (o) => o.payment_status === 'captured' && o.status !== 'canceled'
      );
      // Suma totali w walucie bazowej (zakładamy grosze -> konwersja do PLN jeśli total w groszach)
      // W orders.total z API Medusa values są zazwyczaj w najmniejszej jednostce (np. grosze)
      const sumMinor = orders.reduce((acc, o) => acc + (o.total || 0), 0);
      const currency = orders[0]?.currency_code?.toUpperCase() || 'PLN';
      // Dla PLN: najmniejsza jednostka to grosze -> dzielimy przez 100
      const sumPLN = currency === 'PLN' ? Math.round(sumMinor) / 100 : Math.round(sumMinor) / 100;

      setLifetimeSpent(sumPLN);

      const lastOrder = orders
        .map((o) => o.created_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] || null;
      setLastOrderAt(lastOrder);

      // Wylicz rangę po wydatkach
      const baseTier = nextTierInfoBySpend(sumPLN);
      const degradedCurrent = applyInactivityDegradation(baseTier.current, lastOrder);
      // Jeśli zdegradowano current, przelicz next i toNext względem zdegradowanej rangi
      const recalculated = (() => {
        if (degradedCurrent.id === baseTier.current.id) return baseTier;
        const next = TIERS_BY_SPEND.find((t) => t.minAmount > degradedCurrent.minAmount) || null;
        const toNext = next ? Math.max(0, next.minAmount - sumPLN) : 0;
        return { current: degradedCurrent, next, toNext };
      })();

      setTierState(recalculated);
    } catch (e) {
      // Silent – nie blokujemy UI, ale zostawiamy domyślne 0 PLN
    }
  };

  const refreshRewards = async () => {
    if (!auth?.isAuthenticated) {
      setAvailableRewards([])
      return
    }
    try {
      const data = await fetchLoyaltyRewards();
      const mappedRewards = data
        .filter(reward => reward.is_active)
        .map(mapLoyaltyRewardFromApi);

      // Dodatkowe nagrody zależne od rangi (mock)
      const extra: LoyaltyReward[] = [];
      if (tierState.current.id === 'silver' || tierState.current.id === 'gold') {
        extra.push({
          id: 'silver-1',
            title: 'Silver Deal: +5% punktów na kolejne zamówienie',
            description: 'Jednorazowy booster punktów dla użytkowników Silver',
            pointsCost: 0,
            category: 'exclusive',
            isLimited: true
        });
      }
      if (tierState.current.id === 'gold') {
        extra.push({
          id: 'gold-1',
          title: 'Gold Exclusive Hoodie',
          description: 'Limitowana bluza tylko dla Gold',
          pointsCost: 0,
          category: 'exclusive',
          isLimited: true
        });
      }
      setAvailableRewards([...mappedRewards, ...extra]);
    } catch (err) {
      // silent
    }
  };

  const redeemReward = async (rewardId: string): Promise<boolean> => {
    if (!auth?.isAuthenticated) {
      toast.error('Zaloguj się, aby korzystać z nagród')
      return false
    }
    const reward = availableRewards.find(r => r.id === rewardId);
    if (!reward) {
      toast.error('Nie znaleziono nagrody');
      return false;
    }

    if (points < reward.pointsCost) {
      toast.error('Nie masz wystarczająco punktów', {
        description: `Potrzebujesz ${reward.pointsCost} punktów, masz ${points}`
      });
      return false;
    }

    setLoading(true);
    try {
      console.log('🔄 Redeeming reward:', rewardId);
      
      const result = await redeemLoyaltyReward(rewardId);
      
      if (!result.success) {
        toast.error(result.message || 'Nie udało się odebrać nagrody');
        return false;
      }

      // Aktualizuj stan lokalnie
      setPoints(prev => prev - reward.pointsCost);
      
      if (result.transaction) {
        const mappedTransaction = mapLoyaltyTransactionFromApi(result.transaction);
        setPointsHistory(prev => [mappedTransaction, ...prev]);
      }

      toast.success('Nagroda została odebrana! 🎉', {
        description: `Wykorzystano ${reward.pointsCost} punktów na ${reward.title}`
      });

      console.log('✅ Reward redeemed successfully:', reward.title);
      
      // Odśwież dane z serwera po krótkiej chwili
      setTimeout(() => {
        refreshPoints();
      }, 1000);
      
      return true;
    } catch (err) {
      console.error('❌ Error redeeming reward:', err);
      toast.error('Nie udało się odebrać nagrody');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Reaguj na zmiany autoryzacji – ładuj dane tylko gdy użytkownik jest zalogowany
  useEffect(() => {
    (async () => {
      if (auth?.isAuthenticated) {
        await refreshPoints();
        await refreshRewards();
        await refreshSpend();
      } else {
        // wyczyść stan na logout/guest
        setPoints(0)
        setPointsHistory([])
        setAvailableRewards([])
        setLifetimeSpent(0)
        setLastOrderAt(null)
        setTierState(nextTierInfoBySpend(0))
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.isAuthenticated])

  const getPointsForOrder = (orderTotal: number): number => {
    // 1 punkt za każde 1 PLN
    return Math.floor(orderTotal);
  };

  // Inicjalne ładowanie danych
  useEffect(() => {
    const loadInitialData = async () => {
      await refreshPoints();
    await refreshSpend();
      await refreshRewards();
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    // Kiedy zmieniają się punkty (a więc tier) odśwież nagrody zależne od rangi
    refreshRewards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tierState.current.id]);

  return (
    <LoyaltyContext.Provider value={{
      points,
      pointsHistory,
      availableRewards,
      loading,
      error,
      redeemReward,
      refreshPoints,
      refreshRewards,
      getPointsForOrder,
  tier: tierState.current,
  nextTier: tierState.next || null,
  pointsToNextTier: tierState.toNext,
  lifetimeSpent,
  lastOrderAt
    }}>
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
}

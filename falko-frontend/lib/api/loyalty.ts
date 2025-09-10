/**
 * Loyalty API Service Layer for Medusa.js 2.0 Integration
 * Includes fallback to mock data when backend is unavailable
 */

export interface LoyaltyPointsResponse {
  points: number;
  history: LoyaltyTransactionResponse[];
}

export interface LoyaltyTransactionResponse {
  id: string;
  type: 'earned' | 'spent';
  points: number;
  description: string;
  order_id?: string;
  reward_id?: string;
  created_at: string;
}

export interface LoyaltyRewardResponse {
  id: string;
  title: string;
  description: string;
  points_cost: number;
  category: 'discount' | 'shipping' | 'product' | 'exclusive';
  discount_amount?: number;
  discount_percentage?: number;
  product_id?: string;
  valid_until?: string;
  image?: string;
  is_active: boolean;
}

export interface RedeemRewardResponse {
  success: boolean;
  message?: string;
  transaction?: LoyaltyTransactionResponse;
  new_points_balance?: number;
}

/**
 * Sprawdź dostępność backendu
 */
async function checkBackendHealth(): Promise<boolean> {
  try {
    const baseURL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    
    // Use loyalty rewards endpoint as health check since it has proper CORS
    const response = await fetch(`${baseURL}/store/loyalty/rewards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey || '',
      },
      signal: AbortSignal.timeout(3000),
    });
    
    const isHealthy = response.ok;
    console.log(`🔍 Backend health check via loyalty endpoint: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    
    return isHealthy;
  } catch (error) {
    console.warn('⚠️ Backend health check failed:', error);
    return false;
  }
}

/**
 * Pobierz punkty lojalnościowe klienta
 */
export async function fetchCustomerLoyaltyPoints(): Promise<LoyaltyPointsResponse> {
  try {
    console.log('🔄 Fetching customer loyalty points...');
    
    const baseURL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

    // Produkcja: bez mocków – jeśli API padnie, zwróć pusty stan
    const pointsRes = await fetch(`${baseURL}/store/loyalty/points`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey || '',
      },
      signal: AbortSignal.timeout(5000),
    });

    const historyRes = await fetch(`${baseURL}/store/loyalty/history?limit=50`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey || '',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!pointsRes.ok || !historyRes.ok) {
      console.warn(`⚠️ Loyalty API failed (points=${pointsRes.status}, history=${historyRes.status})`);
      return { points: 0, history: [] };
    }

    const pointsData = await pointsRes.json();
    const historyData = await historyRes.json();

    const history = Array.isArray(historyData?.transactions) ? historyData.transactions : []

    return { points: pointsData?.points || 0, history } as LoyaltyPointsResponse;
    
  } catch (error) {
    console.warn('⚠️ Error fetching loyalty points:', error);
    if (process.env.NODE_ENV === 'production') {
      return { points: 0, history: [] }
    }
    return fallbackToMockLoyaltyData();
  }
}

/**
 * Pobierz dostępne nagrody lojalnościowe
 */
export async function fetchLoyaltyRewards(): Promise<LoyaltyRewardResponse[]> {
  try {
    console.log('🔄 Fetching loyalty rewards...');
    
    const baseURL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    
    const response = await fetch(`${baseURL}/store/loyalty/rewards`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey || '',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`⚠️ Rewards API failed (${response.status}), using mock rewards`);
      return fallbackToMockRewards();
    }

    const data = await response.json();
    console.log('✅ Successfully fetched loyalty rewards:', data);
    return data.rewards || data;
    
  } catch (error) {
    console.warn('⚠️ Error fetching loyalty rewards:', error);
    if (process.env.NODE_ENV === 'production') {
      return []
    }
    return fallbackToMockRewards();
  }
}

/**
 * Wykorzystaj punkty na nagrodę
 */
export async function redeemLoyaltyReward(rewardId: string): Promise<RedeemRewardResponse> {
  try {
    console.log('🔄 Redeeming loyalty reward:', rewardId);
    
    // Sprawdź czy backend jest dostępny
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
      console.warn('⚠️ Backend unavailable, simulating reward redemption');
      return simulateRewardRedemption(rewardId);
    }
    
    const baseURL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    
    // Mock customer ID for development
    const customerId = 'customer_01J3K2M9N0P1Q2R3S4T5U6';
    
    const response = await fetch(`${baseURL}/store/loyalty/redeem`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey || '',
        'customer-id': customerId, // Simplified auth for development
      },
      body: JSON.stringify({ reward_id: rewardId }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`⚠️ Redeem API failed (${response.status}), simulating redemption`);
      return simulateRewardRedemption(rewardId);
    }

    const data = await response.json();
    console.log('✅ Successfully redeemed reward via API:', data);
    return data;
    
  } catch (error) {
    console.warn('⚠️ Error redeeming reward, simulating redemption:', error);
    return simulateRewardRedemption(rewardId);
  }
}

/**
 * Dodaj punkty za zamówienie
 */
export async function addPointsForOrder(orderId: string, orderTotal: number): Promise<boolean> {
  try {
    console.log('🔄 Adding points for order:', orderId, orderTotal);
    
    // Sprawdź czy backend jest dostępny
    const isBackendHealthy = await checkBackendHealth();
    if (!isBackendHealthy) {
      console.warn('⚠️ Backend unavailable, simulating points addition');
      return true; // Symuluj sukces
    }
    
    const baseURL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000';
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
    
    const response = await fetch(`${baseURL}/store/loyalty/add-points`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': publishableKey || '',
      },
      body: JSON.stringify({ 
        order_id: orderId,
        order_total: orderTotal 
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`⚠️ Add points API failed (${response.status})`);
      return false;
    }

    const data = await response.json();
    console.log('✅ Successfully added points for order:', data);
    return data.success;
    
  } catch (error) {
    console.warn('⚠️ Error adding points for order:', error);
    return false;
  }
}

// ===== MOCK DATA FALLBACKS =====

/**
 * Fallback do danych mockowych dla punktów i historii
 */
function fallbackToMockLoyaltyData(): LoyaltyPointsResponse {
  console.log('🔄 Using mock loyalty data...');
  return {
    points: 1250,
    history: [
      {
        id: '1',
        type: 'earned',
        points: 200,
        description: 'Bonus powitalny za rejestrację',
        created_at: '2025-07-15T10:00:00Z'
      },
      {
        id: '2',
        type: 'earned', 
        points: 150,
        description: 'Punkty za zakup zamówienia #FL-001',
        order_id: 'FL-001',
        created_at: '2025-07-18T14:30:00Z'
      },
      {
        id: '3',
        type: 'spent',
        points: 100,
        description: 'Wykorzystano punkty na: 10% zniżki na wszystko',
        reward_id: 'discount-10',
        created_at: '2025-07-19T16:45:00Z'
      }
    ]
  };
}

/**
 * Fallback do danych mockowych dla nagród
 */
function fallbackToMockRewards(): LoyaltyRewardResponse[] {
  console.log('🔄 Using mock rewards data...');
  return [
    {
      id: '1',
      title: '50 PLN Zniżka',
      description: 'Zniżka 50 PLN na następne zakupy',
      points_cost: 500,
      category: 'discount',
      discount_amount: 50,
      image: '/loyalty/discount-50.jpg',
      is_active: true
    },
    {
      id: '2',
      title: 'Darmowa dostawa',
      description: 'Bezpłatna dostawa na następne zamówienie',
      points_cost: 300,
      category: 'shipping',
      image: '/loyalty/free-shipping.jpg',
      is_active: true
    },
    {
      id: '3',
      title: 'Exclusive T-shirt',
      description: 'Limitowany t-shirt dostępny tylko za punkty',
      points_cost: 1500,
      category: 'product',
      product_id: 'exclusive-tshirt-001',
      image: '/loyalty/exclusive-tshirt.jpg',
      is_active: true
    },
    {
      id: '4',
      title: '15% Zniżka Premium',
      description: '15% zniżki na produkty premium',
      points_cost: 1000,
      category: 'discount',
      discount_percentage: 15,
      image: '/loyalty/discount-15.jpg',
      is_active: true
    },
    {
      id: '5',
      title: 'Early Access',
      description: 'Wcześniejszy dostęp do nowych kolekcji',
      points_cost: 3000,
      category: 'exclusive',
      valid_until: '2025-12-31',
      image: '/loyalty/early-access.jpg',
      is_active: true
    },
    {
      id: '6',
      title: '20% Zniżka',
      description: '20% zniżki na cały asortyment',
      points_cost: 2000,
      category: 'discount',
      discount_percentage: 20,
      image: '/loyalty/discount-20.jpg',
      is_active: true
    }
  ];
}

/**
 * Symuluj wykorzystanie nagrody (fallback)
 */
function simulateRewardRedemption(rewardId: string): RedeemRewardResponse {
  console.log('🔄 Simulating reward redemption for:', rewardId);
  
  // Znajdź nagrodę w mock data
  const rewards = fallbackToMockRewards();
  const reward = rewards.find(r => r.id === rewardId);
  
  if (!reward) {
    return {
      success: false,
      message: 'Nie znaleziono nagrody'
    };
  }

  // Symuluj transakcję
  const transaction: LoyaltyTransactionResponse = {
    id: Date.now().toString(),
    type: 'spent',
    points: reward.points_cost,
    description: `Wykorzystano punkty na: ${reward.title}`,
    reward_id: rewardId,
    created_at: new Date().toISOString()
  };

  return {
    success: true,
    message: 'Nagroda została pomyślnie odebrana',
    transaction,
    new_points_balance: 1250 - reward.points_cost // Mock calculation
  };
}

// ===== MAPPER FUNCTIONS =====

export function mapLoyaltyRewardFromApi(apiReward: LoyaltyRewardResponse) {
  return {
    id: apiReward.id,
    title: apiReward.title,
    description: apiReward.description,
    pointsCost: apiReward.points_cost,
    category: apiReward.category,
    discountAmount: apiReward.discount_amount,
    discountPercentage: apiReward.discount_percentage,
    productId: apiReward.product_id,
    isLimited: !!apiReward.valid_until,
    validUntil: apiReward.valid_until,
  };
}

export function mapLoyaltyTransactionFromApi(apiTransaction: LoyaltyTransactionResponse) {
  return {
    id: apiTransaction.id,
    type: apiTransaction.type,
    points: apiTransaction.points,
    description: apiTransaction.description,
    orderId: apiTransaction.order_id,
    rewardId: apiTransaction.reward_id,
    createdAt: apiTransaction.created_at,
  };
}

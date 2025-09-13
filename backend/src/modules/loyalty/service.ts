import { EntityManager } from '@mikro-orm/postgresql'
import { LOYALTY_EARN_RATE, LOYALTY_ENABLED } from '../../lib/constants'

export interface LoyaltyAccount {
  customer_id: string
  balance: number
  locked_balance: number
  last_earned_at: Date | null
  created_at: Date
  updated_at: Date
}

export type LoyaltyTransactionType = 'earn' | 'redeem_lock' | 'redeem_finalize' | 'redeem_rollback' | 'adjust' | 'expire' | 'return'

export interface LoyaltyTransaction {
  id: string
  customer_id: string
  type: LoyaltyTransactionType
  points: number
  order_id?: string | null
  cart_id?: string | null
  note?: string | null
  created_at: Date
}

export class LoyaltyService {
  private manager: EntityManager

  constructor({ manager }: { manager: EntityManager }) {
    this.manager = manager
  }

  isEnabled(): boolean { return LOYALTY_ENABLED }

  async getAccount(customerId: string) {
    const res = await this.manager.getConnection().execute(
      'select customer_id, balance, locked_balance, last_earned_at, created_at, updated_at from loyalty_accounts where customer_id = ?',[customerId]
    )
    if (res.length === 0) {
      return { customer_id: customerId, balance: 0, locked_balance: 0, last_earned_at: null }
    }
    return res[0]
  }

  async ensureAccount(customerId: string) {
    await this.manager.getConnection().execute(
      `insert into loyalty_accounts (customer_id, balance, locked_balance) values (?,0,0)
       on conflict (customer_id) do nothing`,[customerId]
    )
  }

  async earnPoints(customerId: string, orderId: string, orderSubtotalMinor: number, currency: string) {
    if (!this.isEnabled()) return null
    await this.ensureAccount(customerId)
    // zakładamy minor units -> konwersja na pełne (np grosze -> PLN)
    const subtotalMajor = orderSubtotalMinor / 100
    const rawPoints = subtotalMajor * LOYALTY_EARN_RATE
    const points = Math.floor(rawPoints)
    if (points <= 0) return null
    const cx = this.manager.getConnection()
    await cx.execute('begin')
    try {
      await cx.execute('update loyalty_accounts set balance = balance + ?, last_earned_at = now(), updated_at = now() where customer_id = ?', [points, customerId])
      await cx.execute('insert into loyalty_transactions (id, customer_id, type, points, order_id) values (gen_random_uuid(), ?, ?, ?, ?)', [customerId, 'earn', points, orderId])
      await cx.execute('commit')
      return { points }
    } catch (e) {
      await cx.execute('rollback')
      throw e
    }
  }
}

export default LoyaltyService

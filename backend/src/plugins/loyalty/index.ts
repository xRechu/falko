// Loyalty plugin: ensures tables exist (idempotent) and registers LoyaltyService
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { asClass } = require('awilix')
import LoyaltyService from '../../modules/loyalty/service'
import { LOYALTY_ENABLED } from '../../lib/constants'

async function ensureTables(container: any) {
  if (!LOYALTY_ENABLED) return
  try {
    const manager = container.resolve('manager')
    const cx = manager.getConnection()
    // Simple existence check: if table already there -> fast path
    const existsRes = await cx.execute(`select to_regclass('public.loyalty_accounts') as t`)
    if (existsRes?.[0]?.t) return
    await cx.execute('begin')
    await cx.execute(`create table if not exists loyalty_accounts (
      customer_id text primary key,
      balance integer not null default 0,
      locked_balance integer not null default 0,
      last_earned_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )`)
    await cx.execute(`create table if not exists loyalty_transactions (
      id uuid primary key default gen_random_uuid(),
      customer_id text not null,
      type text not null,
      points integer not null,
      order_id text,
      cart_id text,
      note text,
      created_at timestamptz not null default now()
    )`)
    await cx.execute(`create index if not exists loyalty_transactions_customer_created_idx
      on loyalty_transactions (customer_id, created_at desc)`)
    await cx.execute('commit')
    // eslint-disable-next-line no-console
    console.info('[LOYALTY] Tables created')
  } catch (e) {
    try { await container.resolve('manager').getConnection().execute('rollback') } catch {}
    console.warn('[LOYALTY] ensureTables error', e?.message)
  }
}

export async function run(container: any) {
  await ensureTables(container)
  try {
    if (!container.hasRegistration?.('loyaltyService')) {
      container.register('loyaltyService', asClass(LoyaltyService).singleton())
    }
  } catch (e) {
    console.warn('[LOYALTY] register error', e?.message)
  }
}

export default { run }

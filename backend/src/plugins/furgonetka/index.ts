// dynamic import to avoid potential type resolution conflicts during build
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { asValue } = require('awilix')
import { furgonetkaOAuth } from '../../modules/furgonetka/services/oauth'

interface FurgonetkaPluginOptions {
  prefetch?: boolean
}

/**
 * Furgonetka plugin – rejestracja serwisu OAuth + opcjonalny prefetch usług.
 * Bez użycia Redis, lekki start. Sterowanie przez ENV / opcje.
 */
export async function run(container: any, options: FurgonetkaPluginOptions = {}) {
  const logger = safeLogger(container)
  const prefetchFlag = process.env.FURGONETKA_FEATURE_PREFETCH === '1' || !!options.prefetch

  // Rejestruj singleton jeśli nie istnieje
  if (!container.hasRegistration?.('furgonetkaOAuth')) {
    container.register('furgonetkaOAuth', asValue(furgonetkaOAuth))
  }
    // Loyalty service registration (temporary until extracted to own plugin)
    if (!container.hasRegistration('loyaltyService')) {
      const { EntityManager } = require('@mikro-orm/postgresql')
    const LoyaltyService = require('../../modules/loyalty/service').default
      try {
        const { asClass } = require('awilix')
        container.register({
          loyaltyService: asClass(LoyaltyService).inject(() => ({
            manager: container.resolve('manager') as InstanceType<typeof EntityManager>
          }))
        })
      } catch (e) {
        console.error('[LOYALTY] Failed to register loyaltyService', e)
      }
    }

  logger?.info('[furgonetka] Plugin init (prefetch=' + prefetchFlag + ')')

  if (prefetchFlag) {
    try {
      const ok = await furgonetkaOAuth.testConnection()
      if (ok) {
        await furgonetkaOAuth.getAvailableServices().catch(()=>{})
        logger?.info('[furgonetka] Prefetch services OK')
      } else {
        logger?.warn('[furgonetka] Prefetch skipped – connection test failed')
      }
    } catch (e: any) {
      logger?.warn('[furgonetka] Prefetch error: ' + e?.message)
    }
  }
}

const plugin = {
  run
}

export default plugin

function safeLogger(container: any) {
  try { return container.resolve?.('logger') } catch { return console }
}

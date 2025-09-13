// Register LoyaltyService in DI container
// This keeps usage consistent with other local plugins (e.g. furgonetka)
// so code can `req.scope.resolve('loyaltyService')` safely.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { asClass } = require('awilix')
import LoyaltyService from '../../modules/loyalty/service'

export async function run(container: any) {
  try {
    if (!container.hasRegistration?.('loyaltyService')) {
      container.register('loyaltyService', asClass(LoyaltyService).singleton())
    }
  } catch (e) {
    console.warn('[loyalty] register error', e?.message)
  }
}

const plugin = { run }
export default plugin

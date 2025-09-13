// Loyalty plugin: registers LoyaltyService (tables created manually in Neon DB)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { asClass } = require('awilix')
import LoyaltyService from 'modules/loyalty/service'

export async function run(container: any) {
  try {
    if (!container.hasRegistration?.('loyaltyService')) {
      container.register('loyaltyService', asClass(LoyaltyService).singleton())
      console.info('[LOYALTY] Service registered')
    }
  } catch (e) {
    console.warn('[LOYALTY] register error', e?.message)
  }
}

export default { run }

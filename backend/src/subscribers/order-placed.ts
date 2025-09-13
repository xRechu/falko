import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { LOYALTY_ENABLED } from '../lib/constants'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  
  const order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })
  const shippingAddress = order.shipping_address

  try {
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          replyTo: 'info@example.com',
          subject: 'Your order has been placed'
        },
        order,
        shippingAddress,
        preview: 'Thank you for your order!'
      }
    })
  } catch (error) {
    console.error('Error sending order confirmation notification:', error)
  }

  if (LOYALTY_ENABLED && order.customer_id) {
    try {
      const loyaltyService = container.resolve('loyaltyService') as any
  const subtotalMinor = (order.items || []).reduce((acc: number, it: any) => acc + (it.subtotal || 0), 0)
  await loyaltyService.earnPoints(order.customer_id, order.id, subtotalMinor, order.currency_code)
    } catch (e) {
      console.warn('[LOYALTY] earnPoints failed', e?.message)
    }
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}

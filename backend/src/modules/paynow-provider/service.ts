import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  PaymentSessionStatus,
} from "@medusajs/framework/types"

import { calculateRequestSignatureV3, getPaynowBaseUrl, verifyWebhookSignature } from "modules/paynow/service"

type Options = {
  /** Optional merchant/project configuration if needed later */
  projectId?: string
}

type InjectedDependencies = {
  // add logger or other deps via container if needed later
}

/**
 * Paynow Payment Module Provider
 * Implements a minimal set of methods to support checkout per Medusa docs.
 */
class PaynowProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "paynow"

  protected options_: Options

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options)
    this.options_ = options
  }

  /**
   * Initialize a payment session in Paynow. Returns data stored on the PaymentSession.
   * - input.amount is in minor units (per Medusa BigNumber); Paynow expects integer minor units as string/number.
   */
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
  const API_KEY = process.env.PAYNOW_API_KEY as string | undefined
  const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY as string | undefined
    const ENV = (process.env.PAYNOW_ENV as "sandbox" | "production") || "sandbox"

    if (!API_KEY || !SIGNATURE_KEY) {
      throw new Error("Missing Paynow keys")
    }

    const baseUrl = getPaynowBaseUrl(ENV)
    const url = `${baseUrl}/v3/payments`

    // Extract basic info
  const amountMinor = Number((input as any).amount ?? 0) // amount is in minor units already
    const currency = input.currency_code?.toUpperCase() || "PLN"
    const externalId = (input.context as any)?.cart_id || (input.context as any)?.id
    const buyerEmail = (input.context as any)?.customer?.email || (input.context as any)?.email

    if (!externalId) {
      throw new Error("Missing externalId (cart_id) in initiatePayment context")
    }

    if (!buyerEmail) {
      // Some gateways require buyer email; Paynow does.
      throw new Error("Missing buyer email for Paynow initiate")
    }

    const continueUrl = process.env.FRONTEND_PUBLIC_URL
      ? `${process.env.FRONTEND_PUBLIC_URL}/checkout/success?cart_id=${encodeURIComponent(String(externalId))}`
      : `${process.env.BACKEND_PUBLIC_URL || ""}/store/payments/paynow/return?cart_id=${encodeURIComponent(String(externalId))}`

    const body = {
      externalId: String(externalId),
      amount: amountMinor,
      currency: currency,
      description: `Zamówienie #${externalId}`,
      continueUrl,
      buyer: {
        email: String(buyerEmail),
      },
    }

  const idempotencyKey = `${Date.now()}_${externalId}`
    const signature = calculateRequestSignatureV3({
      apiKey: API_KEY,
      idempotencyKey,
      bodyString: JSON.stringify(body),
      signatureKey: SIGNATURE_KEY,
    })

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Api-Key": API_KEY,
        "Signature": signature,
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(body),
    })

    const txt = await resp.text()
    if (!resp.ok) {
      throw new Error(`Paynow initiate failed: ${resp.status} ${txt}`)
    }

    let data: any = {}
    try {
      data = JSON.parse(txt)
    } catch {}

    const paymentId: string | undefined = data?.paymentId || data?.id
    const redirectUrl: string | undefined = data?.redirectUrl

    if (!paymentId) {
      throw new Error("Paynow did not return paymentId")
    }

    // The returned id is stored on PaymentSession and later available during authorization/capture
    return {
      id: paymentId,
      data: {
        paymentId,
        redirectUrl,
        continueUrl: body.continueUrl,
        externalId: body.externalId,
      },
    }
  }

  /**
   * During cart completion, Medusa calls authorizePayment.
   * For Paynow redirect flow we can optimistically return authorized – the actual capture is confirmed via webhook.
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    // Keep provider data passed from initiate (contains paymentId)
    return {
      data: input.data || {},
      status: "authorized",
    }
  }

  /**
   * Map Paynow webhook payload to Medusa actions.
   * Returning action captured will result in capturing the payment within Medusa as well.
   */
  async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    try {
      const raw = (payload as any)?.rawData as string | undefined
      const headers = ((payload as any)?.headers || {}) as Record<string, string>
      const signatureHeader = headers["signature"] || headers["Signature"] || ""

      const SIGNATURE_KEY = process.env.PAYNOW_SIGNATURE_KEY as string | undefined
      if (!SIGNATURE_KEY) {
        return { action: "not_supported", data: { session_id: "", amount: new BigNumber(0) } }
      }

      // Verify signature using our helper
      if (!raw) {
        return { action: "not_supported", data: { session_id: "", amount: new BigNumber(0) } }
      }
      const valid = verifyWebhookSignature(raw, signatureHeader, SIGNATURE_KEY)
      if (!valid) {
        return { action: "not_supported", data: { session_id: "", amount: new BigNumber(0) } }
      }

  const data = JSON.parse(raw)
  const status = data?.status
  const externalId = data?.externalId
  const paymentId = data?.paymentId || data?.id
  const amount = new BigNumber(Number(data?.amount || 0))

      if (status === "CONFIRMED") {
        return {
          action: "captured",
          data: {
            // session_id must match the stored PaymentSession id (we use Paynow paymentId)
            session_id: String(paymentId || ""),
            amount,
          },
        }
      }

      if (status === "PENDING") {
        return { action: "pending", data: { session_id: String(paymentId || ""), amount: new BigNumber(0) } }
      }

      if (status === "REJECTED" || status === "ERROR" || status === "CANCELED") {
        return { action: "canceled", data: { session_id: String(paymentId || ""), amount: new BigNumber(0) } }
      }

      return { action: "not_supported", data: { session_id: String(paymentId || externalId || ""), amount: new BigNumber(0) } }
    } catch (e) {
      return { action: "not_supported", data: { session_id: "", amount: new BigNumber(0) } }
    }
  }

  // --- Minimal implementations for required methods ---
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data: input.data }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: { ...(input.data || {}) } }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    // Without querying Paynow, return pending by default
    const status: PaymentSessionStatus = "pending"
    return { status }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return (input.data || {}) as any
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    // Not implemented for now; return previous data
    return { data: input.data }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    // Not implemented: return echo of data
    return { data: input.data }
  }
}

export default PaynowProviderService

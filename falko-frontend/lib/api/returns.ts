import { API_CONFIG } from '../api-config'

export interface ReturnItem {
  variant_id: string
  quantity: number
  unit_price: number
  title: string
  thumbnail?: string
}

export interface CreateReturnRequest {
  order_id: string
  items: ReturnItem[]
  reason_code: string
  satisfaction_rating?: number
  size_issue?: string
  quality_issue?: string
  description?: string
  refund_method: 'card' | 'loyalty_points'
}

export interface Return {
  id: string
  order_id: string
  customer_id: string
  status: 'pending_survey' | 'survey_completed' | 'qr_generated' | 'shipped_by_customer' | 'received' | 'processed' | 'refunded' | 'rejected'
  reason_code?: string
  refund_method: 'card' | 'loyalty_points'
  items: ReturnItem[]
  total_amount: number
  refund_amount?: number
  furgonetka_qr_code?: string
  furgonetka_tracking_number?: string
  created_at: string
  updated_at: string
  expires_at: string
  processed_at?: string
  survey?: {
    id: string
    return_id: string
    reason_code: string
    satisfaction_rating?: number
    size_issue?: string
    quality_issue?: string
    description?: string
    created_at: string
  }
}

export interface OrderEligibility {
  eligible: boolean
  order_status: string
  days_passed: number
  days_remaining: number
  has_existing_return: boolean
  order_date: string
  items: Array<{
    id: string
    variant_id: string
    title: string
    quantity: number
    unit_price: number
    thumbnail?: string
  }>
}

export interface ReturnQRCode {
  qr_code_url: string
  tracking_number: string
  status: string
  return_id: string
  instructions: {
    step1: string
    step2: string
    step3: string
    step4: string
  }
}

/**
 * Check if order is eligible for return
 */
export async function checkReturnEligibility(orderId: string, customerId?: string): Promise<OrderEligibility> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY,
    }
    if (customerId) headers['customer-id'] = customerId
    const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/orders/${orderId}/returns/eligible`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to check return eligibility')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Error checking return eligibility:', error)
    throw error
  }
}

/**
 * Create a new return request
 */
export async function createReturn(returnData: CreateReturnRequest, customerId?: string): Promise<Return> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY,
    }
    if (customerId) headers['customer-id'] = customerId
    const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/returns`, {
      method: 'POST',
      headers,
      body: JSON.stringify(returnData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create return')
    }

    const data = await response.json()
    return data.return
  } catch (error) {
    console.error('❌ Error creating return:', error)
    throw error
  }
}

/**
 * Get customer's returns
 */
export async function getCustomerReturns(customerId?: string): Promise<Return[]> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY,
    }
    if (customerId) headers['customer-id'] = customerId
    const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/returns`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch returns')
    }

    const data = await response.json()
    return data.returns || []
  } catch (error) {
    console.error('❌ Error fetching returns:', error)
    throw error
  }
}

/**
 * Get QR code for return
 */
export async function getReturnQRCode(returnId: string, customerId?: string): Promise<ReturnQRCode> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-publishable-api-key': API_CONFIG.MEDUSA_PUBLISHABLE_KEY,
    }
    if (customerId) headers['customer-id'] = customerId
    const response = await fetch(`${API_CONFIG.MEDUSA_BACKEND_URL}/store/returns/${returnId}/qr-code`, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch QR code')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Error fetching QR code:', error)
    throw error
  }
}

/**
 * Get return reason options for the survey
 */
export function getReturnReasonOptions() {
  return [
    { value: 'wrong_size', label: 'Zły rozmiar' },
    { value: 'not_as_described', label: 'Nie odpowiada opisowi' },
    { value: 'quality_issue', label: 'Problem z jakością' },
    { value: 'damaged', label: 'Uszkodzony produkt' },
    { value: 'dont_like', label: 'Nie podoba mi się' },
    { value: 'ordered_by_mistake', label: 'Zamówiłem przez pomyłkę' },
    { value: 'other', label: 'Inne' }
  ]
}

/**
 * Get size issue options
 */
export function getSizeIssueOptions() {
  return [
    { value: 'too_small', label: 'Za mały' },
    { value: 'too_big', label: 'Za duży' },
    { value: 'not_as_size_chart', label: 'Nie zgodny z tabelą rozmiarów' }
  ]
}

/**
 * Get quality issue options
 */
export function getQualityIssueOptions() {
  return [
    { value: 'fabric_quality', label: 'Jakość materiału' },
    { value: 'stitching', label: 'Jakość szycia' },
    { value: 'print_quality', label: 'Jakość nadruku' },
    { value: 'color_difference', label: 'Różnica w kolorze' }
  ]
}
export interface FurgonetkaShippingOption {
  id: string
  provider: string
  service: string
  type: 'courier' | 'pickup_point'
  price: number
  delivery_time: string
  description: string
  logo: string
  features: string[]
}

export interface FurgonetkaPickupPoint {
  id: string
  provider: string
  name: string
  address: string
  city?: string
  postal_code?: string
  country?: string
  distance?: number
  hours?: string
  coordinates?: [number, number]
  raw?: any
}

export interface PickupPointSearchBody {
  city?: string
  postal_code?: string
  street?: string
  provider?: string
  courierServices?: string | string[]
  country?: string
}

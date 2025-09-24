// Simple addresses stub
import { ApiResponse } from './products';
import type { HttpTypes } from '@medusajs/types';

export type CustomerAddress = HttpTypes.StoreCustomerAddress;
export type CreateAddressRequest = HttpTypes.StoreCreateCustomerAddress;
export type UpdateAddressRequest = HttpTypes.StoreUpdateCustomerAddress;

// Minimalny zestaw krajów używany w formularzach adresowych
export const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'PL', name: 'Polska' },
  { code: 'DE', name: 'Niemcy' },
  { code: 'CZ', name: 'Czechy' },
  { code: 'SK', name: 'Słowacja' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Szwecja' },
  { code: 'NO', name: 'Norwegia' },
  { code: 'DK', name: 'Dania' },
  { code: 'FI', name: 'Finlandia' },
  { code: 'GB', name: 'Wielka Brytania' },
  { code: 'FR', name: 'Francja' },
  { code: 'ES', name: 'Hiszpania' },
  { code: 'IT', name: 'Włochy' },
  { code: 'NL', name: 'Holandia' },
  { code: 'BE', name: 'Belgia' },
  { code: 'IE', name: 'Irlandia' },
  { code: 'PT', name: 'Portugalia' },
  { code: 'HU', name: 'Węgry' },
  { code: 'RO', name: 'Rumunia' },
  { code: 'LT', name: 'Litwa' },
  { code: 'LV', name: 'Łotwa' },
  { code: 'EE', name: 'Estonia' },
  { code: 'UA', name: 'Ukraina' },
  { code: 'US', name: 'Stany Zjednoczone' },
  { code: 'CA', name: 'Kanada' },
];

export function formatAddress(address: Partial<CustomerAddress>): string {
  const lines: string[] = []
  const name = [address.first_name, address.last_name].filter(Boolean).join(' ')
  if (name) lines.push(name)
  const addr1 = [address.address_1, address.address_2].filter(Boolean).join(' ')
  if (addr1) lines.push(addr1)
  const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ')
  if (cityLine) lines.push(cityLine)
  const country = COUNTRIES.find(c => c.code === address.country_code)?.name || address.country_code
  if (country) lines.push(country)
  return lines.join('\n')
}

export function validateAddress(
  address: Partial<CreateAddressRequest | UpdateAddressRequest>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  if (!address.first_name || !String(address.first_name).trim()) {
    errors.first_name = 'Imię jest wymagane'
  }
  if (!address.last_name || !String(address.last_name).trim()) {
    errors.last_name = 'Nazwisko jest wymagane'
  }
  if (!address.address_1 || !String(address.address_1).trim()) {
    errors.address_1 = 'Ulica i numer są wymagane'
  }
  if (!address.city || !String(address.city).trim()) {
    errors.city = 'Miasto jest wymagane'
  }
  if (!address.postal_code || !String(address.postal_code).trim()) {
    errors.postal_code = 'Kod pocztowy jest wymagany'
  }
  if (!address.country_code || !String(address.country_code).trim()) {
    errors.country_code = 'Kraj jest wymagany'
  } else if (!COUNTRIES.some(c => c.code === address.country_code)) {
    errors.country_code = 'Nieobsługiwany kraj'
  }
  if (address.phone && !/^\+?[0-9\s-]{6,20}$/.test(String(address.phone))) {
    errors.phone = 'Podaj prawidłowy numer telefonu'
  }

  return { isValid: Object.keys(errors).length === 0, errors }
}

export async function getCustomerAddresses() {
  const resp = await fetch(`/api/customer/addresses?t=${Date.now()}` as any, { method: 'GET', cache: 'no-store' as any })
  if (!resp.ok) return { data: [] as CustomerAddress[] }
  const data = await resp.json()
  const list = (data?.addresses || data?.customer?.addresses || []) as CustomerAddress[]
  return { data: list }
}

export async function createCustomerAddress(address: CreateAddressRequest) {
  const resp = await fetch('/api/customer/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address)
  })
  if (!resp.ok) return { data: {} as CustomerAddress }
  const data = await resp.json()
  return { data: data?.address as CustomerAddress }
}

export async function updateCustomerAddress(id: string, address: UpdateAddressRequest) {
  const resp = await fetch(`/api/customer/addresses/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(address)
  })
  if (!resp.ok) return { data: {} as CustomerAddress }
  const data = await resp.json()
  return { data: data?.address as CustomerAddress }
}

export async function deleteCustomerAddress(id: string) {
  const resp = await fetch(`/api/customer/addresses/${id}`, { method: 'DELETE' })
  return { data: { success: resp.ok } }
}

// Simple addresses stub
import { ApiResponse } from './products';
import type { HttpTypes } from '@medusajs/types';

export type CustomerAddress = HttpTypes.StoreCustomerAddress;
export type CreateAddressRequest = HttpTypes.StoreCreateCustomerAddress;
export type UpdateAddressRequest = HttpTypes.StoreUpdateCustomerAddress;

export async function getCustomerAddresses() {
  const resp = await fetch('/api/customer/addresses', { method: 'GET' })
  if (!resp.ok) return { data: [] as CustomerAddress[] }
  const data = await resp.json()
  return { data: (data?.addresses || []) as CustomerAddress[] }
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

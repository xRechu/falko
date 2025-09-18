// Simple addresses stub
import { ApiResponse } from './products';
import type { HttpTypes } from '@medusajs/types';

export type CustomerAddress = HttpTypes.StoreCustomerAddress;
export type CreateAddressRequest = HttpTypes.StoreCreateCustomerAddress;
export type UpdateAddressRequest = HttpTypes.StoreUpdateCustomerAddress;

export async function getCustomerAddresses() {
  return { data: [] as CustomerAddress[] };
}

export async function createCustomerAddress(data: CreateAddressRequest) {
  return { data: {} as CustomerAddress };
}

export async function updateCustomerAddress(id: string, data: UpdateAddressRequest) {
  return { data: {} as CustomerAddress };
}

export async function deleteCustomerAddress(id: string) {
  return { data: { success: true } };
}

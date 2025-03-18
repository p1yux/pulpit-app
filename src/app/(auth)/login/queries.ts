import { apiClient } from '~/lib/client'
import { LoginSchema } from './utils'

export async function login(payload: LoginSchema) {
  const { data } = await apiClient.post('/auth/login/', payload)
  return data
}

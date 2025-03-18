import { apiClient } from '~/lib/client'
import { SignupSchema } from './utils'

export async function signup(payload: SignupSchema) {
  const { data } = await apiClient.post('/auth/signup/', payload)
  return data
}

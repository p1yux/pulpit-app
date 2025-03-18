import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'
import { env } from './env'
import Cookies from 'js-cookie'
import { CSRF_TOKEN } from './constants'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false },
  },
})

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': Cookies.get(CSRF_TOKEN),
  },
})

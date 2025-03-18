import { isAxiosError } from 'axios'
import { toast } from 'sonner'

export function handleError(error: unknown) {
  let message = 'Something went wrong.'

  if (isAxiosError(error)) {
    if ('detail' in error.response?.data) {
      message = error.response?.data?.detail
    }
  }

  toast.error(message)
}

'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '~/lib/client'

type ProvidersProps = {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

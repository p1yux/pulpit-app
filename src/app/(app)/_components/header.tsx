'use client'

import { useSidebar } from '~/components/ui/sidebar'

export default function Header() {
  const { state } = useSidebar()

  if (state === 'collapsed') {
    return (
      <div className="bg-muted text-muted-foreground flex items-center justify-center rounded border">
        P
      </div>
    )
  }

  return <div className="py-2 text-center text-4xl font-bold">Pulpit</div>
}

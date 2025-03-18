'use client'

import { LayoutDashboardIcon, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
} from '~/components/ui/sidebar'

const LINKS: Array<{
  label: string
  Icon: LucideIcon
  href: string
}> = [
  {
    label: 'Dashboard',
    Icon: LayoutDashboardIcon,
    href: '/dashboard',
  },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {LINKS.map((link) => (
          <SidebarMenuButton
            key={link.href}
            asChild
            tooltip="Dashboard"
            isActive={pathname.includes(link.href)}
          >
            <Link href={link.href}>
              <LayoutDashboardIcon />
              <span>{link.label}</span>
            </Link>
          </SidebarMenuButton>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

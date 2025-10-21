'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* No additional wrapper - let the main DashboardHeader handle navigation */}
      {children}
    </>
  )
}
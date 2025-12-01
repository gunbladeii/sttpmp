'use client'


import DashboardHeader from '@/components/DashboardHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DashboardHeader />
      <main>
        {children}
      </main>
    </>
  )
}
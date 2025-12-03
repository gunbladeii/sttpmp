'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuthSimple'
import BrandLogo from '@/components/BrandLogo'
import NotificationBell from '@/components/NotificationBell'

export default function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Helper function to check if current path is active
  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard'
    }
    if (path === '/admin') {
      return pathname === '/admin' // Exact match for admin page only
    }
    if (path === '/admin/laporan') {
      return pathname === '/admin/laporan' // Exact match for laporan page
    }
    return pathname.startsWith(path)
  }

  // Helper function to get link classes
  const getLinkClasses = (path: string, isSpecial = false) => {
    const isActive = isActivePath(path)
    
    if (isSpecial) {
      return isActive 
        ? "cloudpeak-button px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
        : "text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-600/30"
    }
    
    return isActive
      ? "cloudpeak-button px-4 py-2 rounded-lg text-sm font-medium"
      : "text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-slate-600/30"
  }

  if (!user) return null

  return (
    <header className="cloudpeak-card mx-4 mt-4 mb-0 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <BrandLogo variant="header" showSubtitle={false} />
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className={getLinkClasses('/dashboard')}> 
              Dashboard
            </Link>
            <Link 
              href="/syor" 
              className={getLinkClasses('/syor')}
            >
              Syor
            </Link>
            {/* Admin Only Links */}
            {user.role === 'admin' && (
              <>
                <Link href="/admin/announcements" className={getLinkClasses('/admin/announcements', true)}>
                  Pengumuman
                </Link>
                <Link 
                  href="/admin" 
                  className={getLinkClasses('/admin', true)}
                >
                  👥 Pengguna
                </Link>
                <Link 
                  href="/admin/laporan" 
                  className={getLinkClasses('/admin/laporan')}
                >
                  📊 Dashboard Laporan
                </Link>
              </>
            )}

            {/* Peneraju Pemeriksaan Links */}
            {user.role === 'peneraju_pemeriksaan' && (
              <Link 
                href="/create-syor" 
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all transform hover:scale-105 shadow-lg"
              >
                ➕ Syor Baharu
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-6">
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* User Info - Responsive, Truncated */}
            {/* Google-style user avatar + badge */}
            {user && user.name && (
            <div className="flex items-center gap-2">
              {/* User Initials Avatar */}
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 font-bold text-base text-white"
                style={{
                  background: user.role === 'admin' ? '#ef4444' :
                    user.role === 'peneraju_pemeriksaan' ? '#3b82f6' :
                    user.role === 'penyelaras_jpn' ? '#22c55e' :
                    user.role === 'penyelaras_jnn' ? '#14b8a6' :
                    '#64748b',
                  borderColor: user.role === 'admin' ? '#b91c1c' :
                    user.role === 'peneraju_pemeriksaan' ? '#1d4ed8' :
                    user.role === 'penyelaras_jpn' ? '#166534' :
                    user.role === 'penyelaras_jnn' ? '#0f766e' :
                    '#334155',
                }}
                title={user.name}
              >
                {user.name.split(' ').slice(0,2).map(word => word[0]).join('').toUpperCase()}
              </span>
              {/* User Role Badge */}
              <span className={`px-2 py-1 rounded-full text-xs font-medium cloudpeak-badge ${
                user.role === 'admin' 
                  ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                  : user.role === 'peneraju_pemeriksaan'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : user.role === 'penyelaras_jpn'
                  ? 'bg-green-500/20 text-green-300 border-green-500/30'
                  : user.role === 'penyelaras_jnn'
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  : 'bg-slate-500/20 text-slate-300 border-slate-500/30'
              }`}>
                {user.role === 'admin' ? 'Admin' :
                 user.role === 'peneraju_pemeriksaan' ? 'Peneraju' :
                 user.role === 'penyelaras_bahagian' ? 'Penyelaras Bahagian' :
                 user.role === 'penyelaras_jpn' ? 'Penyelaras JPN' :
                 user.role === 'penyelaras_jnn' ? 'Penyelaras JNN' :
                 'Pemantau'}
              </span>
            </div>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Enhanced */}
      <div className="md:hidden border-t border-slate-600">
        <div className="px-4 pt-4 pb-4 space-y-2">
          <Link 
            href="/dashboard" 
            className={`${isActivePath('/dashboard') 
              ? 'text-blue-300 bg-blue-600/30' 
              : 'text-slate-300 hover:text-white hover:bg-slate-600/30'} block px-4 py-3 rounded-lg text-base font-medium transition-colors`}
          >
            Dashboard
          </Link>
          <Link 
            href="/syor" 
            className={`${isActivePath('/syor') 
              ? 'text-blue-300 bg-blue-600/30' 
              : 'text-slate-300 hover:text-white hover:bg-slate-600/30'} block px-4 py-3 rounded-lg text-base font-medium transition-colors`}
          >
            Syor
          </Link>
          {user.role === 'admin' && (
            <>
              <Link 
                href="/admin" 
                className={`${isActivePath('/admin') 
                  ? 'text-purple-300 bg-purple-600/30' 
                  : 'text-purple-300 hover:text-white hover:bg-purple-600/30'} block px-4 py-3 rounded-lg text-base font-medium transition-colors`}
              >
                👥 Pengguna
              </Link>
              <Link 
                href="/admin/laporan" 
                className={`${isActivePath('/admin/laporan') 
                  ? 'text-blue-300 bg-blue-600/30' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-600/30'} block px-4 py-3 rounded-lg text-base font-medium transition-colors`}
              >
                📊 Dashboard Laporan
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
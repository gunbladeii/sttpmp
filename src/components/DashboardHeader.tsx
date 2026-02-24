'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuthSimple'
import BrandLogo from '@/components/BrandLogo'
import NotificationBell from '@/components/NotificationBell'

export default function DashboardHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Mobile: Hamburger + Logo + Notification + Avatar */}
          <div className="flex items-center gap-3 md:hidden w-full">
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Logo - Centered */}
            <Link href="/dashboard" className="flex-1 flex justify-center">
              <BrandLogo variant="header" showSubtitle={false} />
            </Link>

            {/* Right side: Notification + Avatar */}
            <div className="flex items-center gap-2">
              <NotificationBell />
              {user && user.name && (
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm text-white"
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
              )}
            </div>
          </div>

          {/* Desktop: Logo */}
          <div className="hidden md:flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <BrandLogo variant="header" showSubtitle={false} />
            </Link>
          </div>

          {/* Desktop: Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link href="/dashboard" className={getLinkClasses('/dashboard')}> 
              Dashboard
            </Link>
            <Link 
              href="/syor" 
              className={getLinkClasses('/syor')}
            >
              PM
            </Link>
            {/* Admin Only Links */}
            {user.role === 'admin' && (
              <>
                <Link href="/admin/announcements" className={getLinkClasses('/admin/announcements', true)}>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    <span>Pengumuman</span>
                  </div>
                </Link>
                <Link 
                  href="/admin" 
                  className={getLinkClasses('/admin', true)}
                >
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Pengguna</span>
                  </div>
                </Link>
                <Link 
                  href="/admin/laporan" 
                  className={getLinkClasses('/admin/laporan')}
                >
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="whitespace-nowrap">Dashboard Laporan</span>
                  </div>
                </Link>
              </>
            )}

            {/* Peneraju Pemeriksaan Links */}
            {user.role === 'peneraju_pemeriksaan' && (
              <Link 
                href="/create-syor" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Syor Baharu
              </Link>
            )}
          </nav>

          {/* Desktop: User Menu */}
          <div className="hidden md:flex items-center space-x-6">
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
              className="flex items-center gap-2 bg-slate-600 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Hamburger Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 mt-2 mx-4 cloudpeak-card border-t border-slate-600 z-[9999] shadow-2xl">
          <div className="px-4 py-3 space-y-1">
            {/* User Info Header */}
            {user && user.name && (
              <div className="pb-3 mb-3 border-b border-slate-600">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 font-bold text-base text-white"
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
                  >
                    {user.name.split(' ').slice(0,2).map(word => word[0]).join('').toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{user.name}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-red-500/20 text-red-300' 
                        : user.role === 'peneraju_pemeriksaan'
                        ? 'bg-blue-500/20 text-blue-300'
                        : user.role === 'penyelaras_jpn'
                        ? 'bg-green-500/20 text-green-300'
                        : user.role === 'penyelaras_jnn'
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}>
                      {user.role === 'admin' ? 'Admin' :
                       user.role === 'peneraju_pemeriksaan' ? 'Peneraju' :
                       user.role === 'penyelaras_bahagian' ? 'Bahagian' :
                       user.role === 'penyelaras_jpn' ? 'JPN' :
                       user.role === 'penyelaras_jnn' ? 'JNN' :
                       'Pemantau'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <Link 
              href="/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`${isActivePath('/dashboard') 
                ? 'text-blue-300 bg-blue-600/30' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600/30'} flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>

            <Link 
              href="/syor" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`${isActivePath('/syor') 
                ? 'text-blue-300 bg-blue-600/30' 
                : 'text-slate-300 hover:text-white hover:bg-slate-600/30'} flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PM
            </Link>

            {/* Admin Links */}
            {user.role === 'admin' && (
              <>
                <Link 
                  href="/admin/announcements" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${isActivePath('/admin/announcements') 
                    ? 'text-purple-300 bg-purple-600/30' 
                    : 'text-purple-300 hover:text-white hover:bg-purple-600/30'} flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  Pengumuman
                </Link>
                
                <Link 
                  href="/admin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${isActivePath('/admin') && pathname === '/admin'
                    ? 'text-purple-300 bg-purple-600/30' 
                    : 'text-purple-300 hover:text-white hover:bg-purple-600/30'} flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Pengguna
                </Link>

                <Link 
                  href="/admin/laporan" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`${isActivePath('/admin/laporan') 
                    ? 'text-blue-300 bg-blue-600/30' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/30'} flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium transition-colors`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Dashboard Laporan
                </Link>
              </>
            )}

            {/* Peneraju Links */}
            {user.role === 'peneraju_pemeriksaan' && (
              <Link 
                href="/create-syor" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                PM Baharu
              </Link>
            )}

            {/* Logout Button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false)
                handleLogout()
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium text-red-300 hover:text-white hover:bg-red-600/30 transition-colors mt-2 border-t border-slate-600 pt-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Desktop Mobile Menu - Keep existing */}
      <div className="hidden border-t border-slate-600">
        {/* This section is now hidden, replaced by hamburger menu */}
      </div>
    </header>
  )
}
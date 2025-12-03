
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import AnnouncementBox from "@/components/AnnouncementBox";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image dengan Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/minister-bg.jpg')`,
        }}
      >
        {/* Dark Overlay dengan Gradient untuk readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-blue-900/90 to-slate-800/95"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Abstract Accent Elements - Lebih subtle */}
      <div className="absolute inset-0 opacity-10">
        {/* Top Right Yellow Accent */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full blur-3xl"></div>
        
        {/* Left Blue Accent */}
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full blur-3xl"></div>
        
        {/* Bottom Right Accent */}
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-tl from-purple-500 to-pink-500 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          {/* Brand Logo Style Title */}
          <BrandLogo variant="hero" className="mb-8" />
          
          <p className="text-slate-300 max-w-3xl mx-auto mb-8 text-sm sm:text-base md:text-lg leading-relaxed px-4">
            Platform digital terkini untuk pengurusan holistik maklum balas daripada Bahagian/JPN ke atas Perakuan Menteri YB Menteri Pendidikan
          </p>
          <div className="flex justify-center px-4">
            <Link 
              href="/login"
              className="cloudpeak-button px-6 sm:px-10 py-3 sm:py-4 rounded-lg transition-all text-base sm:text-lg font-semibold w-full sm:w-auto text-center"
            >
              🔐 Masuk ke Sistem
            </Link>
          </div>
        </div>

        {/* Announcements Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <AnnouncementBox />
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Navigation Cards - Require Login */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <Link href="/login" className="group">
              <div className="cloudpeak-card p-6 sm:p-8 backdrop-blur-xl bg-white/10 border border-white/20 hover:scale-105 transition-all duration-300 group-hover:shadow-2xl group-hover:bg-white/15">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Dashboard</h3>
                <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">Pengurusan analisis sistem STRiKe</p>
                <div className="flex items-center text-sm text-blue-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Perlu log masuk
                </div>
              </div>
            </Link>

            <Link href="/login" className="group">
              <div className="cloudpeak-card p-6 sm:p-8 backdrop-blur-xl bg-white/10 border border-white/20 hover:scale-105 transition-all duration-300 group-hover:shadow-2xl group-hover:bg-white/15">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Syor</h3>
                <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">Pengurusan syor dan maklum balas</p>
                <div className="flex items-center text-sm text-green-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Perlu log masuk
                </div>
              </div>
            </Link>

            <Link href="/login" className="group">
              <div className="cloudpeak-card p-6 sm:p-8 backdrop-blur-xl bg-white/10 border border-white/20 hover:scale-105 transition-all duration-300 group-hover:shadow-2xl group-hover:bg-white/15">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Pangkalan Data STRiKe</h3>
                <p className="text-sm sm:text-base text-slate-300 mb-3 sm:mb-4">Pengurusan pangkalan data sistematik</p>
                <div className="flex items-center text-sm text-purple-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Perlu log masuk
                </div>
              </div>
            </Link> 
          </div>

          <div className="text-center mt-12 sm:mt-16 px-4">
            <p className="text-sm sm:text-base text-slate-400 mb-3 sm:mb-4">
              Jemaah Nazir | Kementerian Pendidikan Malaysia 🇲🇾
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Sistem ini hanya untuk kegunaan rasmi Jemaah Nazir. Akses terhad kepada pengguna yang berdaftar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

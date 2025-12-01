
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import AnnouncementBox from "@/components/AnnouncementBox";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Abstract Background with Malaysian Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800"></div>
      
      {/* Abstract Brush Paint Elements */}
      <div className="absolute inset-0 opacity-20">
        {/* Top Right Yellow Brush - Represents Royal Yellow */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full blur-3xl transform rotate-45"></div>
        
        {/* Left Blue Brush - Represents Unity */}
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-full blur-3xl"></div>
        
        {/* Bottom Right Red Brush - Represents Courage */}
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-tl from-red-500 to-pink-500 rounded-full blur-3xl"></div>
        
        {/* Center Harmony Element */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 rounded-full blur-3xl opacity-30"></div>
      </div>

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          {/* Brand Logo Style Title */}
          <BrandLogo variant="hero" className="mb-8" />
          
          <p className="text-slate-300 max-w-3xl mx-auto mb-8 text-lg leading-relaxed">
            Platform digital terkini untuk pengurusan holistik maklum balas daripada Bahagian/JPN ke atas Perakuan Menteri YB Menteri Pendidikan
          </p>
          <div className="flex justify-center">
            <Link 
              href="/login"
              className="cloudpeak-button px-10 py-4 rounded-lg transition-all text-lg font-semibold"
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
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Traffic Light System Info */}
            <div className="cloudpeak-card p-8 backdrop-blur-xl bg-white/10 border border-white/20">
              <h3 className="text-xl font-semibold mb-6 text-white">Trafik Status STTPMP</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 bg-red-500 rounded-full shadow-lg"></div>
                  <span className="text-slate-300 text-lg">
                    Belum Selesai (0)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 bg-yellow-500 rounded-full shadow-lg"></div>
                  <span className="text-slate-300 text-lg">
                    Dalam Tindakan (0.5)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-5 h-5 bg-green-500 rounded-full shadow-lg"></div>
                  <span className="text-slate-300 text-lg">
                    Selesai (1)
                  </span>
                </div>
              </div>
            </div>

            {/* User Roles */}
            <div className="cloudpeak-card p-8 backdrop-blur-xl bg-white/10 border border-white/20">
              <h3 className="text-xl font-semibold mb-6 text-white">Peranan Pengguna</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span><span className="font-semibold text-white">Administrator</span> - Pengurusan sistem</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span><span className="font-semibold text-white">Peneraju Pemeriksaan</span> - Agihan syor</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span><span className="font-semibold text-white">Penyelaras Bahagian</span> - Bahagian MOE</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span><span className="font-semibold text-white">Penyelaras JPN</span> - Jabatan Pendidikan Negeri</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span><span className="font-semibold text-white">Pemantau</span> - Melihat laporan</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Key Features */}
          <div className="cloudpeak-card p-8 mb-16 backdrop-blur-xl bg-white/10 border border-white/20">
            <h3 className="text-xl font-semibold mb-8 text-white text-center">Ciri-ciri Utama</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-slate-300">Paparan secara <em>Real Time</em></span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-slate-300">Akses mengikut peranan</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/30">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-slate-300"><em>Dashboard</em> Analitik</span>
              </div>
            </div>
          </div>

          {/* Navigation Cards - Require Login */}
          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/login" className="group">
              <div className="cloudpeak-card p-8 backdrop-blur-xl bg-white/10 border border-white/20 hover:scale-105 transition-all duration-300 group-hover:shadow-2xl group-hover:bg-white/15">
                <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Dashboard</h3>
                <p className="text-slate-300 mb-4">Pengurusan analisis sistem STTPMP</p>
                <div className="flex items-center text-sm text-blue-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Perlu log masuk
                </div>
              </div>
            </Link>

            <Link href="/login" className="group">
              <div className="cloudpeak-card p-8 backdrop-blur-xl bg-white/10 border border-white/20 hover:scale-105 transition-all duration-300 group-hover:shadow-2xl group-hover:bg-white/15">
                <div className="w-16 h-16 bg-green-500/20 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Syor</h3>
                <p className="text-slate-300 mb-4">Pengurusan syor dan maklum balas</p>
                <div className="flex items-center text-sm text-green-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Perlu log masuk
                </div>
              </div>
            </Link>

            <Link href="/login" className="group">
              <div className="cloudpeak-card p-8 backdrop-blur-xl bg-white/10 border border-white/20 hover:scale-105 transition-all duration-300 group-hover:shadow-2xl group-hover:bg-white/15">
                <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Pangkalan Data STTPMP</h3>
                <p className="text-slate-300 mb-4">Pengurusan pangkalan data sistematik</p>
                <div className="flex items-center text-sm text-purple-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Perlu log masuk
                </div>
              </div>
            </Link> 
          </div>

          <div className="text-center mt-16">
            <p className="text-slate-400 mb-4">
              Jemaah Nazir | Kementerian Pendidikan Malaysia 🇲🇾
            </p>
            <p className="text-sm text-slate-500">
              Sistem ini hanya untuk kegunaan rasmi MOE. Akses terhad kepada pengguna yang berdaftar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

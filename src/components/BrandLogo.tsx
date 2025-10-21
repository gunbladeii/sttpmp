import Image from 'next/image'

interface BrandLogoProps {
  variant?: 'hero' | 'header' | 'page'
  showSubtitle?: boolean
  className?: string
}

export default function BrandLogo({ 
  variant = 'page', 
  showSubtitle = true, 
  className = '' 
}: BrandLogoProps) {
  const variants = {
    hero: {
      logoSize: { width: 120, height: 60 },
      logoClass: "h-20 w-auto mb-6",
      titleClass: "text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 tracking-tight leading-none mb-4 drop-shadow-2xl",
      subtitleClass: "text-2xl text-slate-200 mb-4 font-light",
      showGradientLine: true
    },
    header: {
      logoSize: { width: 80, height: 40 },
      logoClass: "h-12 w-auto",
      titleClass: "text-2xl font-bold text-white",
      subtitleClass: "text-slate-300",
      showGradientLine: false
    },
    page: {
      logoSize: { width: 150, height: 75 },
      logoClass: "h-20 w-auto mb-6",
      titleClass: "text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 tracking-tight leading-none mb-2",
      subtitleClass: "text-lg text-slate-200 font-medium",
      showGradientLine: true
    }
  }

  const config = variants[variant]

  if (variant === 'hero') {
    return (
      <div className={`text-center ${className}`}>
        <div className="flex justify-center mb-4">
          <Image
            src="/logoJN.svg"
            alt="Jabatan Negeri Logo"
            width={config.logoSize.width}
            height={config.logoSize.height}
            className={config.logoClass}
          />
        </div>
        <div className="mb-8">
          <h1 className={config.titleClass}>
            STTPMP
          </h1>
          {config.showGradientLine && (
            <div className="flex justify-center">
              <div className="h-1 w-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg"></div>
            </div>
          )}
        </div>
        {showSubtitle && (
          <p className={config.subtitleClass}>
            Sistem Tahap Tindakan Perakuan Menteri Pendidikan
          </p>
        )}
      </div>
    )
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center space-x-4 ${className}`}>
        <Image
          src="/logoJN.svg"
          alt="Jabatan Negeri Logo"
          width={config.logoSize.width}
          height={config.logoSize.height}
          className={config.logoClass}
        />
        <div>
          <h1 className={config.titleClass}>STTPMP</h1>
          {showSubtitle && (
            <p className={config.subtitleClass}>Kementerian Pendidikan Malaysia</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="flex justify-center">
        <Image
          src="/logoJN.svg"
          alt="Jabatan Negeri Logo"
          width={config.logoSize.width}
          height={config.logoSize.height}
          className={config.logoClass}
        />
      </div>
      <h2 className={config.titleClass}>
        STTPMP
      </h2>
      {config.showGradientLine && (
        <div className="flex justify-center mb-4">
          <div className="h-0.5 w-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
        </div>
      )}
      {showSubtitle && (
        <p className={config.subtitleClass}>
          Sistem Tahap Tindakan Perakuan Menteri Pendidikan
        </p>
      )}
    </div>
  )
}
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
      jnLogoSize: { width: 160, height: 80 },
      jnLogoClass: "h-20 sm:h-24 md:h-28 w-auto mb-4 sm:mb-6",
      strikeLogoSize: { width: 500, height: 150 },
      strikeLogoClass: "h-24 sm:h-32 md:h-40 w-auto mb-4 sm:mb-6",
      subtitleClass: "text-lg sm:text-xl md:text-2xl text-slate-200 mb-4 font-light px-4",
      showGradientLine: true
    },
    header: {
      jnLogoSize: { width: 80, height: 40 },
      jnLogoClass: "h-12 w-auto",
      strikeLogoSize: { width: 180, height: 54 },
      strikeLogoClass: "h-10 w-auto",
      subtitleClass: "text-slate-300",
      showGradientLine: false
    },
    page: {
      jnLogoSize: { width: 150, height: 75 },
      jnLogoClass: "h-20 w-auto mb-6",
      strikeLogoSize: { width: 300, height: 90 },
      strikeLogoClass: "h-16 w-auto mb-4",
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
            width={config.jnLogoSize.width}
            height={config.jnLogoSize.height}
            className={config.jnLogoClass}
          />
        </div>
        <div className="mb-8 flex justify-center">
          <Image
            src="/LogoStrike.png"
            alt="STRiKe Logo"
            width={config.strikeLogoSize.width}
            height={config.strikeLogoSize.height}
            className={config.strikeLogoClass}
            priority
          />
        </div>
        {config.showGradientLine && (
          <div className="flex justify-center mb-4">
            <div className="h-1 w-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full shadow-lg"></div>
          </div>
        )}
        {showSubtitle && (
          <p className={config.subtitleClass}>
            Dashboard Status Tindakan Terhadap Perakuan Menteri Pendidikan
          </p>
        )}
      </div>
    )
  }

  if (variant === 'header') {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <Image
          src="/logoJN.svg"
          alt="Jabatan Negeri Logo"
          width={config.jnLogoSize.width}
          height={config.jnLogoSize.height}
          className={config.jnLogoClass}
        />
        <Image
          src="/LogoStrike.png"
          alt="STRiKe Logo"
          width={config.strikeLogoSize.width}
          height={config.strikeLogoSize.height}
          className={config.strikeLogoClass}
          priority
        />
      </div>
    )
  }

  return (
    <div className={`text-center ${className}`}>
      <div className="flex justify-center mb-4">
        <Image
          src="/logoJN.svg"
          alt="Jabatan Negeri Logo"
          width={config.jnLogoSize.width}
          height={config.jnLogoSize.height}
          className={config.jnLogoClass}
        />
      </div>
      <div className="flex justify-center mb-4">
        <Image
          src="/LogoStrike.png"
          alt="STRiKe Logo"
          width={config.strikeLogoSize.width}
          height={config.strikeLogoSize.height}
          className={config.strikeLogoClass}
          priority
        />
      </div>
      {config.showGradientLine && (
        <div className="flex justify-center mb-4">
          <div className="h-0.5 w-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
        </div>
      )}
      {showSubtitle && (
        <p className={config.subtitleClass}>
          Dashboard Status Tindakan Terhadap Perakuan Menteri Pendidikan
        </p>
      )}
    </div>
  )
}
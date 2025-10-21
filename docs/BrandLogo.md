# BrandLogo Component

A reusable component for consistent STTPMP brand presentation across all pages.

## Usage

```tsx
import BrandLogo from '@/components/BrandLogo'

// Hero version (for homepage)
<BrandLogo variant="hero" />

// Header version (for navigation headers)
<BrandLogo variant="header" showSubtitle={false} />

// Page version (for login, register, etc.)
<BrandLogo variant="page" />
```

## Props

- `variant?: 'hero' | 'header' | 'page'` - Display variant (default: 'page')
- `showSubtitle?: boolean` - Show subtitle text (default: true)
- `className?: string` - Additional CSS classes

## Variants

### Hero (`variant="hero"`)
- Used on homepage
- Large logo (h-20) with massive title text (8xl-9xl)
- Gradient text effect with underline accent
- Perfect for landing pages

### Header (`variant="header"`)
- Used in navigation headers
- Compact logo (h-12) with medium title (2xl)
- Horizontal layout with logo + text
- Ideal for dashboard headers

### Page (`variant="page"`)
- Used on auth pages (login, register)
- Medium logo (h-20) with large title (4xl)
- Gradient text with small underline
- Great for form pages

## Implementation Status

✅ **Updated Pages:**
- Homepage (`/`) - using `hero` variant
- Login page (`/login`) - using `page` variant  
- Register page (`/register`) - using `page` variant
- Dashboard header - using `header` variant

## Benefits

- 🎨 **Consistent Branding** - Same logo styling across all pages
- 📱 **Responsive** - Adapts to different screen sizes
- ⚡ **Optimized** - Uses Next.js Image component
- 🔧 **Flexible** - Easy to customize with props
- 🎯 **Accessible** - Proper alt text and semantic structure

## Styling Features

- **Jabatan Negeri Logo**: Official MOE logo with proper sizing
- **STTPMP Title**: Gradient text effect (blue → purple → blue)
- **Gradient Accent**: Decorative underline with gradient
- **Typography**: Professional font weights and spacing
- **Dark Theme**: Optimized for CloudPeak dark theme

## Future Pages

For any new pages, simply import and use:

```tsx
import BrandLogo from '@/components/BrandLogo'

// In your page component
<BrandLogo variant="page" />
```

This ensures consistent branding across the entire STTPMP system! 🚀
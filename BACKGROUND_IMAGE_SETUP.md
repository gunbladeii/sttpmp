# 🎨 BACKGROUND IMAGE SETUP GUIDE

## ✅ Landing Page Background Image - UPDATED!

### 📸 **Step 1: Prepare the Image**

**Your Image:** Picture of YB Menteri with students (gambar picture 3)

**Requirements:**
- Format: JPG or WebP (recommended)
- Recommended size: 1920x1080px (Full HD)
- File size: < 500KB (for fast loading)
- Filename: `bg-hero.jpg`

---

### 📁 **Step 2: Add Image to Project**

**Option A: Manual Upload (EASIEST)**
1. Save your image as `bg-hero.jpg`
2. Copy file to: `C:\Users\Surface Pro 7\Downloads\STTPMP\public\bg-hero.jpg`
3. Done! ✅

**Option B: Using PowerShell**
```powershell
# Copy your image to public folder
Copy-Item "C:\Path\To\Your\Image.jpg" "C:\Users\Surface Pro 7\Downloads\STTPMP\public\bg-hero.jpg"
```

---

### 🎨 **Design Features Applied:**

✅ **Background Image**
- Full-screen coverage
- Centered positioning
- No-repeat

✅ **Dark Overlay (95% opacity)**
- Ensures text readability
- Professional look
- Gradient: slate-900 → blue-900 → slate-800

✅ **Subtle Accent Elements**
- Yellow, blue, purple glows
- Very subtle (10% opacity)
- Modern sleek look

✅ **Grid Pattern**
- Subtle texture overlay
- Enhances depth
- 10% opacity

---

### 📐 **How It Looks:**

```
┌─────────────────────────────────────┐
│  [Background Image: YB Menteri]     │
│    ↓ (with dark gradient overlay)   │
│                                     │
│     🇲🇾 LOGO JEMAAH NAZIR          │
│                                     │
│        STTPMP                       │
│   [Subtitle text here]              │
│                                     │
│    [🔐 Masuk ke Sistem Button]     │
│                                     │
│  ┌─────────────────────────┐       │
│  │   Announcements Box     │       │
│  └─────────────────────────┘       │
│                                     │
│  [Traffic Light] [User Roles]      │
│  [Key Features Cards]              │
│  [Navigation Cards]                │
│                                     │
└─────────────────────────────────────┘
```

---

### 🎯 **Image Optimization Tips:**

**If image too large (> 500KB):**

1. **Use Online Tools:**
   - TinyJPG.com - Compress JPEG
   - Squoosh.app - Convert to WebP

2. **Recommended Settings:**
   - Resolution: 1920x1080px
   - Quality: 80-85%
   - Format: WebP (best) or JPG

3. **Alternative: Use WebP**
   ```tsx
   backgroundImage: `url('/bg-hero.webp')`
   ```

---

### 🔄 **Update Image Later:**

Just replace `public/bg-hero.jpg` with new image!
- Same filename = automatic update
- No code changes needed
- Restart dev server if needed

---

### 🎨 **Customization Options:**

**Adjust Overlay Darkness:**
```tsx
// Lighter overlay (80% instead of 95%)
<div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-blue-900/75 to-slate-800/80"></div>

// Darker overlay (98%)
<div className="absolute inset-0 bg-gradient-to-br from-slate-900/98 via-blue-900/95 to-slate-800/98"></div>
```

**Change Overlay Color:**
```tsx
// More blue tone
<div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-blue-800/95"></div>

// More purple tone  
<div className="absolute inset-0 bg-gradient-to-br from-purple-950/95 via-purple-900/90 to-indigo-800/95"></div>
```

**Adjust Accent Glow Intensity:**
```tsx
// More visible (20%)
<div className="absolute inset-0 opacity-20">

// Less visible (5%)
<div className="absolute inset-0 opacity-5">
```

---

### ✅ **What's Changed:**

**File Modified:**
- `src/app/page.tsx` - Added background image with overlay

**Features:**
- ✅ Full-screen background image
- ✅ Dark gradient overlay for text readability
- ✅ Subtle accent glows (yellow, blue, purple)
- ✅ Grid pattern texture
- ✅ Professional modern look
- ✅ Optimized for performance

---

### 🚀 **Testing:**

1. Add `bg-hero.jpg` to `public/` folder
2. Run: `npm run dev`
3. Open: http://localhost:3000
4. Check:
   - ✅ Background image loads
   - ✅ Text is readable
   - ✅ Dark overlay working
   - ✅ Professional look achieved

---

### 📝 **Important Notes:**

⚠️ **Image Not Showing?**
- Check file exists: `public/bg-hero.jpg`
- Check filename spelling (case-sensitive on Linux)
- Clear browser cache (Ctrl+Shift+R)
- Restart dev server

⚠️ **Image Too Dark/Bright?**
- Adjust overlay opacity values
- See customization section above

⚠️ **Slow Loading?**
- Compress image (< 500KB recommended)
- Use WebP format
- Consider lazy loading

---

**Status: READY - Just add the image file!** 🎉

### 📂 Quick Checklist:

- [ ] Download/prepare YB Menteri image
- [ ] Rename to `bg-hero.jpg`
- [ ] Copy to `public/` folder
- [ ] Test at localhost:3000
- [ ] Adjust overlay if needed
- [ ] Commit and push to GitHub
- [ ] Deploy to Vercel

---

**Current Setup:** Sleek & Modern Landing Page ✨

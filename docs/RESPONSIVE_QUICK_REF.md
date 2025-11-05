# Responsive & Theme Quick Reference

## 🎨 Theme Toggle Location
**Settings Page**: `app/dashboard/settings/page.tsx`
- Toggle component in top-right corner
- Saves to localStorage
- Persists across sessions

## 📱 Responsive Breakpoints Cheat Sheet

```tsx
// Mobile First - Base styles apply to mobile (< 640px)
className="text-base"          // Mobile: 16px

// Small devices (≥ 640px)
className="sm:text-lg"         // Tablets: 18px

// Medium devices (≥ 768px)
className="md:text-xl"         // Tablets landscape: 20px

// Large devices (≥ 1024px)
className="lg:text-2xl"        // Laptops: 24px

// Extra large (≥ 1280px)
className="xl:text-3xl"        // Desktops: 30px
```

## 🌓 Dark Mode Quick Classes

### Backgrounds
```tsx
bg-white dark:bg-gray-800           // Main backgrounds
bg-gray-50 dark:bg-gray-900         // Page backgrounds
bg-gray-100 dark:bg-gray-700        // Secondary backgrounds
```

### Text
```tsx
text-gray-900 dark:text-white       // Primary text
text-gray-600 dark:text-gray-300    // Secondary text
text-gray-500 dark:text-gray-400    // Tertiary text
```

### Borders
```tsx
border-gray-200 dark:border-gray-700    // Standard borders
border-gray-300 dark:border-gray-600    // Stronger borders
```

### Shadows
```tsx
shadow-sm dark:shadow-gray-900/50   // Subtle shadow
shadow-lg dark:shadow-2xl           // Prominent shadow
```

## 🎯 Common Patterns

### Card Component
```tsx
<div className="
  bg-white dark:bg-gray-800
  rounded-2xl
  shadow-sm
  p-4 sm:p-6
  border border-gray-100 dark:border-gray-700
">
```

### Button
```tsx
<button className="
  px-4 sm:px-6
  py-2 sm:py-3
  bg-emerald-600 dark:bg-emerald-500
  hover:bg-emerald-700 dark:hover:bg-emerald-600
  text-white
  rounded-lg
  transition-colors
">
```

### Grid Layout
```tsx
<div className="
  grid
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-4
  gap-4
">
```

### Icon
```tsx
<Icon className="w-5 h-5 sm:w-6 sm:h-6" />
```

## ✅ Pre-Flight Checklist

### Before Committing New Components:

- [ ] Mobile responsive (320px - 640px)
- [ ] Tablet responsive (641px - 1024px)
- [ ] Desktop responsive (1025px+)
- [ ] Light mode tested
- [ ] Dark mode tested
- [ ] Touch targets ≥ 44px on mobile
- [ ] Text readable at all sizes
- [ ] No horizontal scroll on mobile
- [ ] Hover states work on desktop
- [ ] Active states work on mobile

## 🔧 Files Modified for Theme Support

### Core Theme Files
- `components/ThemeProvider.tsx` - Theme context & logic
- `components/ThemeToggle.tsx` - UI toggle component
- `app/layout.tsx` - ThemeProvider wrapper
- `tailwind.config.ts` - Dark mode config
- `app/globals.css` - CSS variables

### Updated Pages
- `app/dashboard/settings/page.tsx` - Theme toggle added
- `app/driver/page.tsx` - Full dark mode support
- `app/driver/layout.tsx` - Bottom nav dark mode

## 🚀 Quick Start

### Add Theme Support to New Component
```tsx
// 1. Import useTheme (if needed)
import { useTheme } from "@/components/ThemeProvider";

// 2. Add dark mode classes
<div className="bg-white dark:bg-gray-800">
  <h1 className="text-gray-900 dark:text-white">
    Hello World
  </h1>
</div>

// 3. Test both themes
// - Toggle in Settings
// - Check all colors, borders, shadows
```

### Make Component Responsive
```tsx
// 1. Start with mobile base
<div className="p-4">

// 2. Add tablet breakpoint
<div className="p-4 sm:p-6">

// 3. Add desktop breakpoint
<div className="p-4 sm:p-6 lg:p-8">

// 4. Test at each breakpoint
```

## 📊 Screen Coverage Status

### ✅ Fully Responsive & Dark Mode Ready
- Driver Dashboard (`/driver`)
- Driver Layout (Bottom Nav)
- Settings Page (`/dashboard/settings`)

### 🔄 Partially Responsive (Needs Dark Mode)
- Admin Dashboard (`/dashboard`)
- Orders Page
- Sales Page
- Stock Page
- Reports Page
- Profit Analysis

### ⏳ Needs Update
- Customer Orders (`/orders`)
- Barcode Pages
- eTIMS Pages
- Profile Pages

## 💡 Pro Tips

1. **Always test dark mode** - Don't assume it works
2. **Mobile first** - Design for small screens, enhance for large
3. **Use semantic color names** - bg-white/dark:bg-gray-800, not bg-[#fff]
4. **Consistent spacing** - Stick to Tailwind's scale (4, 6, 8, 12, 16...)
5. **Group related breakpoints** - Keep sm:, md:, lg: together

## 🐛 Common Issues

### Issue: Dark mode not showing
**Fix**: Check `<html suppressHydrationWarning>` in layout.tsx

### Issue: Theme resets on refresh
**Fix**: Verify localStorage.setItem() in ThemeProvider

### Issue: Responsive not working
**Fix**: Ensure viewport meta tag exists, check Tailwind config

### Issue: Colors look wrong in dark mode
**Fix**: Use Tailwind color utilities, avoid custom hex values

---

**Quick Access**: Press `Ctrl+F` to search this document for specific patterns!

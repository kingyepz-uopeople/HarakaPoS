# Responsive Design & Theme System Guide

## Overview
HarakaPOS features a fully responsive design system that works seamlessly across all device types (mobile, tablet, desktop) with dark mode, light mode, and system-based theme support.

---

## 🎨 Theme System

### Implementation
The theme system uses:
- **Tailwind CSS** dark mode with class strategy
- **React Context** for theme state management
- **localStorage** for theme persistence
- **System preference detection** for automatic theme selection

### Available Themes
1. **Light Mode** - Clean, bright interface optimized for daylight use
2. **Dark Mode** - Eye-friendly dark interface for low-light environments
3. **System Mode** - Automatically follows OS theme preferences

### How to Use Themes

#### For Users
Navigate to **Settings → Theme Toggle** to switch between:
- ☀️ Light
- 🌙 Dark
- 💻 System

#### For Developers
```tsx
import { useTheme } from "@/components/ThemeProvider";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  return (
    <div className="bg-white dark:bg-gray-800">
      <p className="text-gray-900 dark:text-white">
        Current theme: {theme}
      </p>
      <button onClick={() => setTheme('dark')}>
        Switch to Dark
      </button>
    </div>
  );
}
```

### Dark Mode Classes
All components use Tailwind's `dark:` variant:

```tsx
// Background colors
className="bg-white dark:bg-gray-800"

// Text colors
className="text-gray-900 dark:text-white"

// Borders
className="border-gray-200 dark:border-gray-700"

// Hover states
className="hover:bg-gray-50 dark:hover:bg-gray-700"
```

---

## 📱 Responsive Design

### Breakpoints
Following Tailwind CSS default breakpoints:

| Breakpoint | Min Width | Target Devices |
|------------|-----------|----------------|
| `sm:` | 640px | Large phones (landscape), small tablets |
| `md:` | 768px | Tablets (portrait) |
| `lg:` | 1024px | Tablets (landscape), small laptops |
| `xl:` | 1280px | Laptops, desktops |
| `2xl:` | 1536px | Large desktops |

### Responsive Patterns

#### 1. **Grid Layouts**
```tsx
// 1 column mobile, 2 tablet, 4 desktop
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

#### 2. **Text Sizing**
```tsx
// Responsive typography
<h1 className="text-2xl sm:text-3xl lg:text-4xl">
<p className="text-sm sm:text-base">
```

#### 3. **Spacing**
```tsx
// Responsive padding/margins
<div className="p-4 sm:p-6 lg:p-8">
<div className="space-y-4 sm:space-y-6">
```

#### 4. **Visibility**
```tsx
// Hide on mobile, show on desktop
<span className="hidden sm:inline">Desktop Only</span>

// Show on mobile only
<span className="sm:hidden">Mobile Only</span>
```

#### 5. **Flex Direction**
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row">
```

---

## 📐 Component-Specific Responsiveness

### Driver Dashboard
```tsx
// KPI Cards: 2 columns mobile → 4 columns desktop
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

// Icons: Smaller on mobile
<Icon className="w-4 h-4 sm:w-5 sm:h-5" />

// Padding: Tighter on mobile
<div className="p-3 sm:p-4">
```

### Admin Dashboard
```tsx
// Stats Grid: 1 col mobile → 2 tablet → 3 desktop
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

// Forms: Stack on mobile
<div className="grid gap-4 md:grid-cols-2">
```

### Driver Interface
```tsx
// Bottom Navigation: Responsive button sizes
<button className="px-3 sm:px-4 py-2 min-w-[60px] sm:min-w-[70px]">

// Icon sizing
<Icon className="w-5 h-5 sm:w-6 sm:h-6" />
```

---

## 🎯 Responsive Testing Checklist

### Mobile (320px - 640px)
- ✅ All text readable without horizontal scroll
- ✅ Touch targets minimum 44px × 44px
- ✅ Bottom navigation accessible
- ✅ Forms stack vertically
- ✅ KPI cards in 2-column grid

### Tablet (641px - 1024px)
- ✅ Grid layouts expand to 2-3 columns
- ✅ Sidebars collapse to hamburger menu
- ✅ Increased padding and spacing
- ✅ Larger typography

### Desktop (1025px+)
- ✅ Full grid layouts (4+ columns)
- ✅ Persistent sidebars
- ✅ Maximum content width constraints
- ✅ Hover states functional

---

## 🌓 Dark Mode Color Palette

### Background Colors
```css
/* Light Mode */
bg-white
bg-gray-50
bg-gray-100

/* Dark Mode Equivalents */
dark:bg-gray-800
dark:bg-gray-900
dark:bg-gray-700
```

### Text Colors
```css
/* Light Mode */
text-gray-900   /* Primary text */
text-gray-600   /* Secondary text */
text-gray-500   /* Tertiary text */

/* Dark Mode Equivalents */
dark:text-white
dark:text-gray-300
dark:text-gray-400
```

### Accent Colors
```css
/* Emerald/Teal (Primary) */
bg-emerald-600 dark:bg-emerald-500
text-emerald-600 dark:text-emerald-400

/* Status Colors */
bg-green-50 dark:bg-green-900/30    /* Success */
bg-blue-50 dark:bg-blue-900/30      /* Info */
bg-orange-50 dark:bg-orange-900/30  /* Warning */
bg-red-50 dark:bg-red-900/30        /* Error */
```

---

## 🔧 Implementation Examples

### Complete Responsive Card
```tsx
<div className="
  bg-white dark:bg-gray-800 
  rounded-2xl 
  shadow-sm 
  p-3 sm:p-4 lg:p-6
  border border-gray-100 dark:border-gray-700
  hover:shadow-lg 
  transition-shadow
">
  <h3 className="
    text-lg sm:text-xl lg:text-2xl 
    font-semibold 
    text-gray-900 dark:text-white
    mb-3 sm:mb-4
  ">
    Title
  </h3>
  <p className="
    text-sm sm:text-base 
    text-gray-600 dark:text-gray-400
  ">
    Content
  </p>
</div>
```

### Responsive Button
```tsx
<button className="
  px-4 sm:px-6 
  py-2 sm:py-3 
  rounded-lg sm:rounded-xl
  text-sm sm:text-base
  font-medium sm:font-semibold
  bg-emerald-600 dark:bg-emerald-500
  text-white
  hover:bg-emerald-700 dark:hover:bg-emerald-600
  transition-colors
  w-full sm:w-auto
">
  Action
</button>
```

### Responsive Grid with Dark Mode
```tsx
<div className="
  grid 
  grid-cols-1 
  sm:grid-cols-2 
  lg:grid-cols-3 
  xl:grid-cols-4 
  gap-3 sm:gap-4 lg:gap-6
  p-4 sm:p-6 lg:p-8
  bg-gray-50 dark:bg-gray-900
">
  {items.map(item => (
    <div key={item.id} className="
      bg-white dark:bg-gray-800
      rounded-xl
      p-4
      shadow-sm
      border border-gray-200 dark:border-gray-700
    ">
      {/* Card content */}
    </div>
  ))}
</div>
```

---

## 📚 Best Practices

### 1. **Mobile-First Approach**
Always design for mobile first, then enhance for larger screens:
```tsx
// ✅ Good
className="text-sm sm:text-base lg:text-lg"

// ❌ Avoid
className="lg:text-lg md:text-base text-sm"
```

### 2. **Consistent Spacing**
Use Tailwind's spacing scale consistently:
```tsx
gap-3 sm:gap-4 lg:gap-6
p-4 sm:p-6 lg:p-8
space-y-4 sm:space-y-6
```

### 3. **Dark Mode Contrast**
Ensure sufficient contrast in both modes:
```tsx
// ✅ Good contrast
text-gray-900 dark:text-white
border-gray-300 dark:border-gray-600

// ❌ Poor contrast
text-gray-600 dark:text-gray-700
```

### 4. **Touch Targets**
Minimum 44px × 44px for mobile:
```tsx
<button className="min-h-[44px] min-w-[44px] p-3">
```

### 5. **Breakpoint Consistency**
Stick to standard breakpoints across components:
- Small adjustments: `sm:` (640px)
- Medium layouts: `md:` (768px)
- Large layouts: `lg:` (1024px)

---

## 🐛 Troubleshooting

### Theme Not Persisting
Check localStorage implementation in `ThemeProvider.tsx`:
```tsx
localStorage.setItem("theme", newTheme);
```

### Hydration Mismatch
Add `suppressHydrationWarning` to `<html>` tag:
```tsx
<html lang="en" suppressHydrationWarning>
```

### Dark Mode Not Working
1. Verify Tailwind config has `darkMode: ["class"]`
2. Check ThemeProvider wraps entire app
3. Ensure `dark:` classes are properly applied

### Responsive Issues
1. Test in browser DevTools responsive mode
2. Check viewport meta tag exists
3. Verify Tailwind purge config includes all files

---

## 📱 Testing Devices

### Recommended Test Sizes
- **Mobile**: iPhone SE (375px), iPhone 14 Pro (393px)
- **Tablet**: iPad Mini (768px), iPad Pro (1024px)
- **Desktop**: MacBook (1440px), iMac (1920px)

### Browser DevTools
Use responsive design mode:
- Chrome: `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows)
- Firefox: `Cmd+Option+M` / `Ctrl+Shift+M`

---

## 🎓 Resources

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Mobile Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

---

**Last Updated**: November 5, 2025  
**Version**: 1.0.0

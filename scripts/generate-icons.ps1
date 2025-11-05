# PWA Icon Generator Script
# This script converts the icon-design.svg to all required PWA sizes

Write-Host "🎨 HarakaPOS PWA Icon Generator" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

# Check if we have the SVG file
if (-not (Test-Path "public/icon-design.svg")) {
    Write-Host "❌ Error: icon-design.svg not found in public/ folder" -ForegroundColor Red
    exit 1
}

Write-Host "📝 Options to convert SVG to PNG icons:`n" -ForegroundColor Cyan

Write-Host "Option 1: Use Online Tool (Easiest)" -ForegroundColor Yellow
Write-Host "  1. Go to https://svgtopng.com/" -ForegroundColor White
Write-Host "  2. Upload: public/icon-design.svg" -ForegroundColor White
Write-Host "  3. Download these sizes: 192x192, 512x512, 180x180" -ForegroundColor White
Write-Host "  4. Save to public/ folder as:" -ForegroundColor White
Write-Host "     - icon-192.png" -ForegroundColor Gray
Write-Host "     - icon-512.png" -ForegroundColor Gray
Write-Host "     - apple-touch-icon.png (180x180)`n" -ForegroundColor Gray

Write-Host "Option 2: Use Inkscape (Best Quality)" -ForegroundColor Yellow
Write-Host "  1. Download Inkscape: https://inkscape.org/release/" -ForegroundColor White
Write-Host "  2. Open icon-design.svg" -ForegroundColor White
Write-Host "  3. Export PNG (File > Export PNG)" -ForegroundColor White
Write-Host "  4. Set sizes and export`n" -ForegroundColor White

Write-Host "Option 3: Use ImageMagick (Command Line)" -ForegroundColor Yellow
Write-Host "  1. Install ImageMagick: https://imagemagick.org/script/download.php" -ForegroundColor White
Write-Host "  2. Run these commands:" -ForegroundColor White
Write-Host "     magick convert -background none icon-design.svg -resize 192x192 icon-192.png" -ForegroundColor Gray
Write-Host "     magick convert -background none icon-design.svg -resize 512x512 icon-512.png" -ForegroundColor Gray
Write-Host "     magick convert -background none icon-design.svg -resize 180x180 apple-touch-icon.png`n" -ForegroundColor Gray

Write-Host "Option 4: Use Online PWA Icon Generator (Automated)" -ForegroundColor Yellow
Write-Host "  1. Go to https://www.pwabuilder.com/imageGenerator" -ForegroundColor White
Write-Host "  2. Upload icon-design.svg (or a 512x512 PNG)" -ForegroundColor White
Write-Host "  3. Download generated icons" -ForegroundColor White
Write-Host "  4. Extract to public/ folder`n" -ForegroundColor White

Write-Host "`n✅ After generating icons, update manifest.json" -ForegroundColor Green
Write-Host "   Location: public/manifest.json`n" -ForegroundColor White

# Check if icons already exist
Write-Host "📋 Current icon status:" -ForegroundColor Cyan
$icons = @("icon-192.png", "icon-512.png", "apple-touch-icon.png", "favicon.ico")
foreach ($icon in $icons) {
    $path = "public/$icon"
    if (Test-Path $path) {
        $size = (Get-Item $path).Length
        Write-Host "  ✅ $icon exists ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $icon missing" -ForegroundColor Yellow
    }
}

Write-Host "`n🎨 Your SVG icon is ready at: public/icon-design.svg" -ForegroundColor Green
Write-Host "📁 Open it in a browser to preview!" -ForegroundColor Cyan

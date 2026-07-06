Add-Type -AssemblyName System.Drawing
$imagePath = "d:\Maxwell Funeral site\Logo.jpeg"
$outPath = "d:\Maxwell Funeral site\Logo.png"

$img = [System.Drawing.Bitmap]::FromFile($imagePath)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)

# Navy Blue (strong dark) for all text
$navyR = 10; $navyG = 15; $navyB = 30
# Teal for crown
$tealR = 13; $tealG = 148; $tealB = 136

for ($x = 0; $x -lt $img.Width; $x++) {
    for ($y = 0; $y -lt $img.Height; $y++) {
        $p = $img.GetPixel($x, $y)
        $maxColor = [Math]::Max($p.R, [Math]::Max($p.G, $p.B))
        
        # Transparent for near-black background pixels
        if ($maxColor -lt 30) {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            continue
        }
        
        # Smooth alpha for edge pixels
        $alpha = 255
        if ($maxColor -lt 70) {
            $alpha = [int](($maxColor - 30) / 40.0 * 255)
        }

        # Determine if pixel is the teal crown:
        # Vivid teal: G is high, R is moderate-low, B is moderate
        # In the logo crown: R~13-100, G~100-180, B~100-140
        $greenDominates = ($p.G -gt $p.R + 20) -and ($p.G -gt $p.B)
        $tealLike = $greenDominates -and ($p.G -gt 80)
        
        if ($tealLike) {
            # Keep crown's own teal/green colors
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
        } else {
            # All text pixels -> very dark navy blue for maximum contrast on white
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $navyR, $navyG, $navyB))
        }
    }
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
$bmp.Dispose()
Write-Host "Done: All text pixels are now very dark navy. Crown stays teal."

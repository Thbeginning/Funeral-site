Add-Type -AssemblyName System.Drawing
$imagePath = "d:\Maxwell Funeral site\Logo.jpeg"
$outPath = "d:\Maxwell Funeral site\Logo.png"

$img = [System.Drawing.Bitmap]::FromFile($imagePath)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)

for ($x = 0; $x -lt $img.Width; $x++) {
    for ($y = 0; $y -lt $img.Height; $y++) {
        $p = $img.GetPixel($x, $y)
        # Check if the pixel is dark (black-ish background)
        $maxColor = [Math]::Max($p.R, [Math]::Max($p.G, $p.B))
        if ($maxColor -lt 45) {
            # Fully transparent
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } elseif ($maxColor -lt 80) {
            # Partial transparency for smooth edges
            $alpha = [int](($maxColor - 45) / 35.0 * 255)
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $p.R, $p.G, $p.B))
        } else {
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $p.R, $p.G, $p.B))
        }
    }
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
$bmp.Dispose()
Write-Host "Done converting to PNG with transparency."

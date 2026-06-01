Add-Type -AssemblyName System.Drawing
$files = @("icon", "splash", "favicon")
foreach ($f in $files) {
    $path = "e:\ebizz\mobileapp\assets\images\" + $f + ".png"
    if (Test-Path $path) {
        Write-Host "Converting $path"
        $img = [System.Drawing.Image]::FromFile($path)
        $newPath = "e:\ebizz\mobileapp\assets\images\" + $f + "_real.png"
        $img.Save($newPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $img.Dispose()
        Remove-Item -Force $path
        Rename-Item $newPath -NewName ($f + ".png")
    }
}
Write-Host "Done"

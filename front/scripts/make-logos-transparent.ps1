# Rend transparent le fond noir connecté aux bords (PNG exportés sans alpha).
Add-Type -AssemblyName System.Drawing

function Set-TransparentBackground {
  param([string]$Path)

  $src = [System.Drawing.Bitmap]::FromFile($Path)
  $w = $src.Width
  $h = $src.Height
  $out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $out.SetPixel($x, $y, $src.GetPixel($x, $y))
    }
  }
  $src.Dispose()

  $visited = New-Object 'bool[]' ($w * $h)
  $queue = [System.Collections.Generic.Queue[int[]]]::new()

  function Enqueue-Border($x, $y) {
    if ($x -lt 0 -or $y -lt 0 -or $x -ge $w -or $y -ge $h) { return }
    $i = $y * $w + $x
    if ($visited[$i]) { return }
    $c = $out.GetPixel($x, $y)
    if ($c.R -ne 0 -or $c.G -ne 0 -or $c.B -ne 0) { return }
    $visited[$i] = $true
    $queue.Enqueue(@($x, $y))
  }

  for ($x = 0; $x -lt $w; $x++) {
    Enqueue-Border $x 0
    Enqueue-Border $x ($h - 1)
  }
  for ($y = 0; $y -lt $h; $y++) {
    Enqueue-Border 0 $y
    Enqueue-Border ($w - 1) $y
  }

  while ($queue.Count -gt 0) {
    $p = $queue.Dequeue()
    $x = $p[0]
    $y = $p[1]
    $transparent = [System.Drawing.Color]::FromArgb(0, 0, 0, 0)
    $out.SetPixel($x, $y, $transparent)

    foreach ($d in @(@(1,0),@(-1,0),@(0,1),@(0,-1))) {
      $nx = $x + $d[0]
      $ny = $y + $d[1]
      if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $w -or $ny -ge $h) { continue }
      $i = $ny * $w + $nx
      if ($visited[$i]) { continue }
      $c = $out.GetPixel($nx, $ny)
      if ($c.R -ne 0 -or $c.G -ne 0 -or $c.B -ne 0) { continue }
      $visited[$i] = $true
      $queue.Enqueue(@($nx, $ny))
    }
  }

  $out.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  Write-Host "Updated $Path"
}

Set-TransparentBackground 'c:\projets\flash_ops\front\public\branding\logo-light1.png'
Set-TransparentBackground 'c:\projets\flash_ops\front\public\branding\logo-dark1.png'

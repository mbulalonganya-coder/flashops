$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $here '.env'
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      Set-Item -Path "env:$($matches[1].Trim())" -Value $matches[2].Trim()
    }
  }
}
if (-not $env:JAVA_HOME) {
  $env:JAVA_HOME = 'C:\Users\j.mbula\AppData\Local\Programs\Eclipse Adoptium\jdk-21.0.11.10-hotspot'
}
Set-Location $here
& .\mvnw.cmd spring-boot:run @args

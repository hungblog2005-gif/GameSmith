$ErrorActionPreference = "Stop"
$dir = "d:\Remake\GameSmith_v2\ai-service"
$uvicorn = Join-Path $dir ".venv\Scripts\uvicorn.exe"

while ($true) {
    try {
        Write-Host "[$(Get-Date -f 'HH:mm:ss')] Starting AI service..."
        Set-Location $dir
        & $uvicorn main:app --host 0.0.0.0 --port 8000
    } catch {
        Write-Host "[$(Get-Date -f 'HH:mm:ss')] AI service crashed: $_. Restarting in 5s..."
        Start-Sleep 5
    }
}

param([string]$NgrokUrl = "")

# Nếu không truyền URL, tự detect từ ngrok API
if (-not $NgrokUrl) {
    try {
        $NgrokUrl = (Invoke-RestMethod http://localhost:4040/api/tunnels).tunnels[0].public_url
    } catch {
        Write-Error "Ngrok chưa chạy. Hãy chạy 'ngrok http 80' trước."
        exit 1
    }
}

Write-Host "Ngrok URL: $NgrokUrl" -ForegroundColor Cyan

# Đọc .env hiện tại và cập nhật ALLOWED_ORIGINS
$envPath = "$PSScriptRoot/../.env"
$content = Get-Content $envPath
$content = $content -replace "^ALLOWED_ORIGINS=.*", "ALLOWED_ORIGINS=$NgrokUrl"
$content | Set-Content $envPath

# Restart chỉ api-gateway để apply CORS mới
docker-compose -f infrastructure/docker/docker-compose.services.yml `
    up -d api-gateway --force-recreate

Write-Host "✅ CORS updated! Share: $NgrokUrl" -ForegroundColor Green

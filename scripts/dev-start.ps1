# Khởi động chỉ infra cho local dev với IntelliJ
Write-Host "🚀 Starting Piggy infrastructure..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot/.."

docker-compose -f infrastructure/docker/docker-compose.infra.yml up -d

Write-Host "✅ Infrastructure ready:" -ForegroundColor Green
Write-Host "  MySQL:    localhost:3306"
Write-Host "  Consul:   http://localhost:8500"
Write-Host "  RabbitMQ: http://localhost:15672"
Write-Host ""
Write-Host "Now run services in IntelliJ, then: cd PiggyFE && npm run dev"

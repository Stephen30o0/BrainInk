$body = @{
    name = "Test Tournament"
    creator_address = "0x123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:10000/api/tournaments/create" -Method POST -ContentType "application/json" -Body $body
    Write-Host "✅ Tournament Created Successfully!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
    
    if ($response.success -and $response.tournament) {
        Write-Host "🎉 Tournament creation working!" -ForegroundColor Green
        Write-Host "🆔 Tournament ID: $($response.tournament.id)" -ForegroundColor Yellow
        Write-Host "📝 Tournament Name: $($response.tournament.name)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Tournament creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

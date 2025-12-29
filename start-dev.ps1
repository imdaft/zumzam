#!/usr/bin/env pwsh
# Скрипт для запуска dev сервера

Write-Host "🚀 Запуск dev сервера..." -ForegroundColor Cyan

# Останавливаем старые процессы
Write-Host "⏹️  Останавливаем старые процессы..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Освобождаем порт
Write-Host "🔓 Освобождаем порт 4000..." -ForegroundColor Yellow
npx kill-port 4000 2>$null

# Запускаем сервер
Write-Host "▶️  Запускаем npm run dev..." -ForegroundColor Green
npm run dev


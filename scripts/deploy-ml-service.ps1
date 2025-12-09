# Deploy ML Service to Google Cloud Run
# Usage: .\scripts\deploy-ml-service.ps1 -ProjectId [PROJECT_ID] -Region [REGION]

param (
    [string]$ProjectId = "superplusai-494a8",
    [string]$Region = "us-central1"
)

$ErrorActionPreference = "Stop"

# Colors
$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow
$Reset = [ConsoleColor]::White

$ServiceName = "viim-ml"
$ImageName = "gcr.io/$ProjectId/$ServiceName`:latest"

Write-Host "🚀 Deploying ML Service to Cloud Run" -ForegroundColor $Green
Write-Host "Project ID: $ProjectId"
Write-Host "Region: $Region"
Write-Host "Service: $ServiceName"
Write-Host ""

# Navigate to ML service directory
$ScriptPath = $PSScriptRoot
$ServicePath = Join-Path $ScriptPath "..\services\viim-ml"
Set-Location $ServicePath

Write-Host "📦 Building Docker image..." -ForegroundColor $Yellow
# Use cmd /c to ensure gcloud is found if it's a batch file shim
cmd /c gcloud builds submit --tag "$ImageName" --project "$ProjectId" --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor $Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor $Green
Write-Host ""

Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor $Yellow
cmd /c gcloud run deploy "$ServiceName" `
    --image "$ImageName" `
    --platform managed `
    --region "$Region" `
    --project "$ProjectId" `
    --memory 2Gi `
    --cpu 2 `
    --port 8080 `
    --min-instances 0 `
    --max-instances 10 `
    --timeout 300 `
    --allow-unauthenticated `
    --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor $Red
    exit 1
}

# Get the service URL
$ServiceUrl = cmd /c gcloud run services describe "$ServiceName" --platform managed --region "$Region" --project "$ProjectId" --format 'value(status.url)'

Write-Host ""
Write-Host "✅ ML Service deployed successfully!" -ForegroundColor $Green
Write-Host "📍 Service URL: $ServiceUrl" -ForegroundColor $Green
Write-Host ""
Write-Host "To use this URL in your Next.js app, update your .env.local:"
Write-Host "ML_SERVICE_URL=$ServiceUrl" -ForegroundColor $Yellow
Write-Host ""


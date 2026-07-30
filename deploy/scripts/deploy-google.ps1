param(
  [string]$ProjectId = "gerrys-docks-capstone",
  [string]$Region = "us-west1"
)

$ErrorActionPreference = "Stop"
$ServiceAccountName = "gerrys-backend"
$ServiceAccount = "$ServiceAccountName@$ProjectId.iam.gserviceaccount.com"

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  $CloudSdkBin = Join-Path $env:LOCALAPPDATA "Google\Cloud SDK\google-cloud-sdk\bin"
  if (Test-Path (Join-Path $CloudSdkBin "gcloud.cmd")) {
    $env:Path = "$CloudSdkBin;$env:Path"
  } else {
    throw "Google Cloud CLI is not installed. Install it, reopen PowerShell, and run this script again."
  }
}

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
  throw "Firebase CLI is not installed. Run: npm install -g firebase-tools"
}

gcloud config set project $ProjectId
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com firestore.googleapis.com firebase.googleapis.com

$existingAccount = gcloud iam service-accounts list --filter="email:$ServiceAccount" --format="value(email)"
if (-not $existingAccount) {
  gcloud iam service-accounts create $ServiceAccountName --display-name="Gerry's Docks backend"
}

gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$ServiceAccount" --role="roles/datastore.user" --quiet
gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$ServiceAccount" --role="roles/firebaseauth.admin" --quiet

$services = @(
  @{ Name = "gerrys-products"; Source = "services/product-service" },
  @{ Name = "gerrys-quotes"; Source = "services/quote-service" },
  @{ Name = "gerrys-admin"; Source = "services/admin-service" },
  @{ Name = "gerrys-ai"; Source = "services/ai-service" }
)

foreach ($service in $services) {
  Write-Host "Deploying $($service.Name)..." -ForegroundColor Cyan
  gcloud run deploy $service.Name `
    --source $service.Source `
    --region $Region `
    --service-account $ServiceAccount `
    --set-env-vars "GCLOUD_PROJECT=$ProjectId" `
    --max-instances 2 `
    --allow-unauthenticated `
    --quiet
}

firebase use $ProjectId
firebase deploy --only hosting

Write-Host "Deployment complete." -ForegroundColor Green
Write-Host "Hosting: https://$ProjectId.web.app"

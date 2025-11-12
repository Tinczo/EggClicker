# Plik: push_to_ecr.ps1 (WERSJA POPRAWIONA)
# Wersja PowerShell skryptu wdrazajacego

# Automatycznie zatrzymaj skrypt, jesli jakakolwiek komenda zawiedzie
$ErrorActionPreference = 'Stop'

Write-Host "Loading variables from .env..."
if (-not (Test-Path ".env")) {
    Write-Error "ERROR: .env file not found! Make sure it is in the same folder."
    exit 1
}

# Wczytaj zmienne z .env do srodowiska tego skryptu
Get-Content .env | ForEach-Object {
    if ($_ -match "=" -and -not $_.StartsWith("#")) {
        $name, $value = $_.Split('=', 2)
        
        # --- POPRAWIONA LINIA ---
        # Użyj poprawnej składni PowerShell do ustawiania zmiennych
        Set-Item -Path "Env:\$($name.Trim())" -Value $value.Trim()
    }
}

# Sprawdzenie zmiennych
if (-not $env:AWS_ACCOUNT_ID) {
    Write-Error "ERROR: AWS_ACCOUNT_ID is not defined in .env!"
    exit 1
}
if (-not $env:AWS_REGION) {
    Write-Error "ERROR: AWS_REGION is not defined in .env!"
    exit 1
}

Write-Host "Using account: $env:AWS_ACCOUNT_ID in region: $env:AWS_REGION"

# --- 2. Logowanie do AWS ECR ---
Write-Host "Logging into AWS ECR..."
aws ecr get-login-password --region $env:AWS_REGION | docker login --username AWS --password-stdin "$($env:AWS_ACCOUNT_ID).dkr.ecr.$($env:AWS_REGION).amazonaws.com"
Write-Host "ECR login successful."

# --- 3. Budowanie obrazow ---
Write-Host "Building new images (docker-compose build)..."
docker-compose build
Write-Host "Build successful."

# --- 4. Wypychanie obrazow do ECR ---
Write-Host "Pushing images to ECR (docker-compose push)..."
docker-compose push
Write-Host "Push successful."

# --- 5. Wymuszanie wdrozenia (Wyciszone) ---
Write-Host "Forcing new deployment on AWS Fargate..."
aws ecs update-service --cluster egg-clicker-cluster --service egg-clicker-backend-service --force-new-deployment | Out-Null
aws ecs update-service --cluster egg-clicker-cluster --service egg-clicker-frontend-service --force-new-deployment | Out-Null

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS! New versions are in ECR and Fargate is updating." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
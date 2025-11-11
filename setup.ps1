# Plik: setup.ps1
# Ten skrypt automatyzuje caly proces wdrozenia:
# 1. Uruchamia `terraform apply -auto-approve` (automatycznie zatwierdzajac)
# 2. Uruchamia `generate_env_files.ps1`
# 3. Uruchamia `push_to_ecr.bat`

Write-Host "Starting Full Setup..." -ForegroundColor Cyan

# --- Etap 1: Terraform Apply ---
Write-Host "--- Step 1: Deploying Infrastructure (terraform apply) ---"
try {
    Set-Location -Path "terraform"
} catch {
    Write-Error "ERROR: Cannot find /terraform folder. Make sure you are running this script from the project root."
    exit 1
}

# Uzywamy -auto-approve, aby pominac pytanie "yes"
terraform apply -auto-approve

# Sprawdz, czy ostatnia komenda sie udala
if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR during 'terraform apply'. Aborting script."
    Set-Location -Path ".." # Wroc do folderu glownego
    exit 1
}

Write-Host "Infrastructure deployed successfully." -ForegroundColor Green
Set-Location -Path ".."

# --- Etap 2: Generowanie .env ---
Write-Host "--- Step 2: Generating .env files ---"
.\generate_env_files.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR during .env file generation. Aborting script."
    exit 1
}

# --- Etap 3: Wypychanie obrazow ---
Write-Host "--- Step 3: Building and Pushing Docker images (push_to_ecr) ---"
# Uzywamy .bat, poniewaz jestesmy w srodowisku Windows/PowerShell
.\push_to_ecr.bat

if ($LASTEXITCODE -ne 0) {
    Write-Error "ERROR pushing images to ECR. Aborting script."
    exit 1
}

Write-Host "---" -ForegroundColor Green
Write-Host "SETUP COMPLETE! Your application is live on AWS." -ForegroundColor Green
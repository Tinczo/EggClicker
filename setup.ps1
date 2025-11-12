# Plik: setup.ps1 (WERSJA ZAKTUALIZOWANA)
# Ten skrypt automatyzuje caly proces wdrozenia:
# 1. Uruchamia `terraform apply -auto-approve`
# 2. Uruchamia `generate_env_files.ps1`
# 3. Uruchamia `push_to_ecr.ps1`
# 4. Wyswietla finalny adres URL aplikacji

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
try {
    .\generate_env_files.ps1
} catch {
    Write-Error "ERROR during .env file generation. Aborting script."
    Write-Error $_.Exception.Message
    exit 1
}

# --- Etap 3: Wypychanie obrazow ---
Write-Host "--- Step 3: Building and Pushing Docker images (push_to_ecr) ---"
try {
    .\push_to_ecr.ps1
} catch {
    Write-Error "ERROR during push_to_ecr.ps1. Aborting script."
    Write-Error $_.Exception.Message 
    exit 1
}

# --- Etap 4: Pobieranie adresu URL ---
Write-Host "--- Step 4: Fetching Application URL ---"
try {
    Set-Location -Path "terraform"
    # Uzywamy -raw aby dostac tylko czysty tekst, bez cudzyslowow
    $alb_dns = terraform output -raw alb_dns_name
    Set-Location -Path ".."
} catch {
    Write-Error "ERROR fetching terraform output. Cannot display URL."
    exit 1
}

# --- Gotowe! ---
Write-Host "---" -ForegroundColor Green
Write-Host "SETUP COMPLETE! Your application is live on AWS." -ForegroundColor Green
Write-Host "Application URL: http://$($alb_dns)" -ForegroundColor Yellow
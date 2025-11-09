# Plik: generate_env_files.ps1 (Wersja POPRAWIONA, bez polskich znakow)
#
# Ten skrypt PowerShell uruchamia terraform output i generuje wszystkie
# potrzebne pliki .env dla projektu.
# Uruchom go z glownego folderu projektu.

Write-Host "Changing directory to /terraform..."
try {
    Set-Location -Path "terraform"
} catch {
    Write-Error "ERROR: Cannot find /terraform folder. Make sure you are running this script from the project root."
    exit 1
}

try {
    Write-Host "Fetching outputs from Terraform (as JSON)..."
    # Uruchom terraform output i przechwyc JSON jako pojedynczy string
    $tfOutputJson = terraform output -json

    # Sparsuj JSON na obiekt PowerShell
    $tfOutput = $tfOutputJson | ConvertFrom-Json

    Write-Host "Extracting values..."
    # Dostęp do wartości jest teraz prosty i bezpieczny
    $AWS_ACCOUNT_ID = $tfOutput.aws_account_id.value
    $AWS_REGION = $tfOutput.aws_region.value
    $COGNITO_POOL_ID = $tfOutput.cognito_user_pool_id.value
    $COGNITO_CLIENT_ID = $tfOutput.cognito_app_client_id.value

    # Wróć do głównego folderu
    Set-Location -Path ".."
    Write-Host "Generating .env files..."

    # 1. Glowny .env (dla skryptow wdrazania)
    # --- POPRAWIONA SKLADNIA ---
    $rootEnvContent = @"
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
AWS_REGION=$AWS_REGION

REACT_APP_AWS_REGION=$AWS_REGION
REACT_APP_COGNITO_USER_POOL_ID=$COGNITO_POOL_ID
REACT_APP_COGNITO_APP_CLIENT_ID=$COGNITO_CLIENT_ID
"@
    Set-Content -Path ".env" -Value $rootEnvContent
    Write-Host "Created: ./.env"

    # 2. frontend/.env (dla `npm start`)
    # --- POPRAWIONA SKLADNIA ---
    $frontendEnvContent = @"
REACT_APP_AWS_REGION=$AWS_REGION
REACT_APP_COGNITO_USER_POOL_ID=$COGNITO_POOL_ID
REACT_APP_COGNITO_APP_CLIENT_ID=$COGNITO_CLIENT_ID
"@
    Set-Content -Path "frontend/.env" -Value $frontendEnvContent
    Write-Host "Created: ./frontend/.env"

    # 3. backend/.env (dla `node src/index.js`)
    # --- POPRAWIONA SKLADNIA ---
    $backendEnvContent = @"
AWS_REGION=$AWS_REGION
COGNITO_USER_POOL_ID=$COGNITO_POOL_ID
COGNITO_APP_CLIENT_ID=$COGNITO_CLIENT_ID
"@
    Set-Content -Path "backend/.env" -Value $backendEnvContent
    Write-Host "Created: ./backend/.env"

    Write-Host "---" -ForegroundColor Green
    Write-Host "Done! All three .env files have been successfully generated." -ForegroundColor Green

}
catch {
    Write-Error "An error occurred: $_"
    # Upewnij się, że wracamy do głównego folderu nawet po błędzie
    Set-Location -Path ".."
}
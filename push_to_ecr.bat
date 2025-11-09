@echo off
setlocal

REM --- 1. Załaduj zmienne z pliku .env ---
echo "Ladowanie zmiennych z .env..."
if not exist .env (
    echo "BLAD: Nie znaleziono pliku .env! Upewnij sie, ze jest w tym samym folderze."
    goto :eof
)
for /f "delims=" %%i in (.env) do set "%%i"

REM Sprawdzenie czy zmienne sa zaladowane
if not defined AWS_ACCOUNT_ID (
    echo "BLAD: AWS_ACCOUNT_ID nie jest zdefiniowane w .env!"
    goto :eof
)
if not defined AWS_REGION (
    echo "BLAD: AWS_REGION nie jest zdefiniowane w .env!"
    goto :eof
)

echo "Uzywam konta: %AWS_ACCOUNT_ID% w regionie: %AWS_REGION%"

REM --- 2. Logowanie do AWS ECR ---
echo "Logowanie do AWS ECR..."
aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com

REM Sprawdzenie bledu logowania
if %errorlevel% neq 0 (
    echo "BLAD: Logowanie do ECR nie powiodlo sie!"
    goto :eof
)
echo "Logowanie do ECR zakonczone pomyslnie."

REM --- 3. Budowanie obrazow ---
echo "Budowanie nowych obrazow (docker-compose build)..."
docker-compose build --quiet
if %errorlevel% neq 0 (
    echo "BLAD: Budowanie obrazow nie powiodlo sie!"
    goto :eof
)
echo "Budowanie zakonczone pomyslnie."

REM --- 4. Wypychanie obrazow do ECR ---
echo "Wypychanie obrazow do ECR (docker-compose push)..."
docker-compose push
if %errorlevel% neq 0 (
    echo "BLAD: Wypychanie obrazow nie powiodlo sie!"
    goto :eof
)

echo ""
echo "=========================================================="
echo "  SUKCES! Nowe wersje obrazow sa w ECR."
echo "=========================================================="

endlocal
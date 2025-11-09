#!/bin/bash

# === Konfiguracja ===
# Zatrzymuje skrypt, jeśli jakakolwiek komenda zawiedzie
set -e
# Zatrzymuje skrypt, jeśli komenda w 'pipe' ( | ) zawiedzie
set -o pipefail

echo "--- Ladowanie zmiennych z .env ---"

# Sprawdza, czy .env istnieje
if [ ! -f .env ]; then
    echo "BLAD: Nie znaleziono pliku .env! Upewnij sie, ze jest w tym samym folderze."
    exit 1
fi

# Wczytuje zmienne z .env i eksportuje je dla procesów potomnych
# Używamy 'export', aby zmienne były widoczne dla 'docker-compose'
# `grep` usuwa komentarze, `xargs` formatuje to dla 'export'
export $(grep -v '^#' .env | xargs)

# Sprawdzenie czy zmienne sa zaladowane
if [ -z "$AWS_ACCOUNT_ID" ]; then
    echo "BLAD: AWS_ACCOUNT_ID nie jest zdefiniowane w .env!"
    exit 1
fi
if [ -z "$AWS_REGION" ]; then
    echo "BLAD: AWS_REGION nie jest zdefiniowane w .env!"
    exit 1
fi

echo "Uzywam konta: $AWS_ACCOUNT_ID w regionie: $AWS_REGION"
echo ""

# --- 2. Logowanie do AWS ECR ---
echo "--- Logowanie do AWS ECR... ---"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "Logowanie do ECR zakonczone pomyslnie."
echo ""

# --- 3. Budowanie obrazow ---
echo "--- Budowanie nowych obrazow (docker-compose build)... ---"
docker-compose build

echo "Budowanie zakonczone pomyslnie."
echo ""

# --- 4. Wypychanie obrazow do ECR ---
echo "--- Wypychanie obrazow do ECR (docker-compose push)... ---"
# docker-compose jest na tyle mądry, że 'push' wypchnie obrazy
# zdefiniowane w sekcji 'image:'
docker-compose push
echo "Wypychanie zakonczone pomyslnie."
echo ""

# --- DODAJ TE LINIE ---
echo "--- Wymuszanie nowego wdrozenia w AWS Fargate... ---"
aws ecs update-service --cluster egg-clicker-cluster --service egg-clicker-backend-service --force-new-deployment
aws ecs update-service --cluster egg-clicker-cluster --service egg-clicker-frontend-service --force-new-deployment

echo ""
echo "=========================================================="
echo "  SUKCES! Nowe wersje sa w ECR i Fargate sie aktualizuje."
echo "=========================================================="
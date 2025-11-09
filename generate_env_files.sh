#!/bin/bash
#
# Ten skrypt uruchamia terraform output i generuje wszystkie
# potrzebne pliki .env dla projektu.
#
# Wymaga zainstalowanego `jq` (https://stedolan.github.io/jq/)

set -e # Zatrzymaj skrypt, jeśli wystąpi błąd

echo "Przechodzenie do folderu terraform..."
cd terraform

# Sprawdź, czy jq jest zainstalowane
if ! command -v jq &> /dev/null
then
    echo "BLAD: `jq` nie jest zainstalowane. Jest wymagane do parsowania JSON."
    echo "Pobierz je ze strony: https://stedolan.github.io/jq/"
    exit 1
fi

echo "Pobieranie outputów z Terraform (jako JSON)..."
TF_OUTPUT=$(terraform output -json)

echo "Wyciąganie wartości..."
# Używamy `jq -r` aby dostać "surową" wartość bez cudzysłowów
AWS_ACCOUNT_ID=$(echo $TF_OUTPUT | jq -r .aws_account_id.value)
AWS_REGION=$(echo $TF_OUTPUT | jq -r .aws_region.value)
COGNITO_POOL_ID=$(echo $TF_OUTPUT | jq -r .cognito_user_pool_id.value)
COGNITO_CLIENT_ID=$(echo $TF_OUTPUT | jq -r .cognito_app_client_id.value)

# Wróć do głównego folderu
cd ..
echo "Generowanie plików .env..."

# 1. Główny .env (dla skryptów wdrażania)
cat > .env << EOL
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}
AWS_REGION=${AWS_REGION}

REACT_APP_AWS_REGION=${AWS_REGION}
REACT_APP_COGNITO_USER_POOL_ID=${COGNITO_POOL_ID}
REACT_APP_COGNITO_APP_CLIENT_ID=${COGNITO_CLIENT_ID}
EOL
echo "Stworzono: ./.env"

# 2. frontend/.env (dla `npm start`)
cat > frontend/.env << EOL
REACT_APP_AWS_REGION=${AWS_REGION}
REACT_APP_COGNITO_USER_POOL_ID=${COGNITO_POOL_ID}
REACT_APP_COGNITO_APP_CLIENT_ID=${COGNITO_CLIENT_ID}
EOL
echo "Stworzono: ./frontend/.env"

# 3. backend/.env (dla `node src/index.js`)
cat > backend/.env << EOL
AWS_REGION=${AWS_REGION}
COGNITO_USER_POOL_ID=${COGNITO_POOL_ID}
COGNITO_APP_CLIENT_ID=${COGNITO_CLIENT_ID}
EOL
echo "Stworzono: ./backend/.env"

echo "---"
echo "Gotowe! Wszystkie trzy pliki .env zostały pomyślnie wygenerowane."
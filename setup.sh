#!/bin/bash
#
# Ten skrypt automatyzuje caly proces wdrozenia:
# 1. Uruchamia `terraform apply -auto-approve`
# 2. Uruchamia `generate_env_files.sh`
# 3. Uruchamia `push_to_ecr.sh`
#
# Upewnij się, że ten skrypt ma uprawnienia do uruchamiania:
# chmod +x setup.sh

# Zatrzymuje skrypt, jeśli jakakolwiek komenda zawiedzie
set -e

echo "--- Starting Full Setup... ---"

# --- Etap 1: Terraform Apply ---
echo "--- Step 1: Deploying Infrastructure (terraform apply) ---"
cd terraform

# Uzywamy -auto-approve, aby pominac pytanie "yes"
terraform apply -auto-approve

echo "Infrastructure deployed successfully."
cd ..

# --- Etap 2: Generowanie .env ---
echo "--- Step 2: Generating .env files ---"
# Dajemy skryptowi uprawnienia do uruchomienia, na wszelki wypadek
chmod +x ./generate_env_files.sh
./generate_env_files.sh

# --- Etap 3: Wypychanie obrazow ---
echo "--- Step 3: Building and Pushing Docker images (push_to_ecr) ---"
# Dajemy skryptowi uprawnienia do uruchomienia, na wszelki wypadek
chmod +x ./push_to_ecr.sh
./push_to_ecr.sh

echo "---"
echo "SETUP COMPLETE! Your application is live on AWS."
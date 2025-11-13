#!/bin/bash

set -e

echo "--- Starting Full Setup... ---"


# --- Etap 0: Instalowanie zależności dla Lambda ---
echo "--- Step 1: Install lambda dependencies  ---"
cd lambda_functions/podium_checker
npm install
echo "Lambda dependencies installed successfully."
cd ..
cd ..

# --- Etap 2: Terraform Apply ---
echo "--- Step 2: Deploying Infrastructure (terraform apply) ---"
cd terraform
terraform apply -auto-approve
echo "Infrastructure deployed successfully."
cd ..

# --- Etap 3: Generowanie .env ---
echo "--- Step 3: Generating .env files ---"
chmod +x ./generate_env_files.sh
./generate_env_files.sh

# --- Etap 4: Wypychanie obrazow ---
echo "--- Step 4: Building and Pushing Docker images (push_to_ecr) ---"
chmod +x ./push_to_ecr.sh
./push_to_ecr.sh

# --- Etap 5: Pobieranie adresu URL ---
echo "--- Step 5: Fetching Application URL ---"
cd terraform
# Uzywamy -raw aby dostac tylko czysty tekst
alb_dns=$(terraform output -raw alb_dns_name)
cd ..

# --- Gotowe! ---
echo "---"
echo "SETUP COMPLETE! Your application is live on AWS."
echo "Application URL: http://${alb_dns}"
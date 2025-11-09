# 1. Konfiguracja samego Terraform
terraform {
  required_providers {
    # Informujemy Terraform, że będziemy używać dostawcy "aws"
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Używamy najnowszej stabilnej wersji
    }
  }
}

# 2. Konfiguracja dostawcy AWS
# To jest "serce" połączenia. Terraform automatycznie
# użyje danych, które skonfigurowałeś przez "aws configure" 
provider "aws" {
  region = "us-east-1" # Użyj regionu ze swojego Learner Lab (np. us-east-1)
  
  # UWAGA: Jeśli "aws sts get-caller-identity" nie działało bezbłędnie
  # i wymagało ręcznego ustawienia tokena sesji,
  # będziemy musieli dodać go tutaj. Na razie zakładamy,
  # że AWS CLI przechowuje go poprawnie.
}

# 3. Definicja naszego pierwszego zasobu (Resursu)
# Tworzymy bucket S3 , który przechowa nasze pliki
resource "aws_s3_bucket" "egg_clicker_files" {
  
  # WAŻNE: Zmień tę nazwę na globalnie unikalną!
  bucket = "egg-clicker-bucket-266586"

  # Dodajemy tagi - dobra praktyka do oznaczania zasobów
  tags = {
    Name        = "EggClicker Asset Storage"
    Project     = "Egg Clicker"
    ManagedBy   = "Terraform"
  }
}

# 1. Repozytorium dla obrazu backendu
resource "aws_ecr_repository" "egg_clicker_backend" {
  name = "egg-clicker-backend" # Nazwa repozytorium w AWS

  tags = {
    Name        = "EggClicker Backend Repo"
    Project     = "Egg Clicker"
    ManagedBy   = "Terraform"
  }
}

# 2. Repozytorium dla obrazu frontendu
resource "aws_ecr_repository" "egg_clicker_frontend" {
  name = "egg-clicker-frontend" # Nazwa repozytorium w AWS

  tags = {
    Name        = "EggClicker Frontend Repo"
    Project     = "Egg Clicker"
    ManagedBy   = "Terraform"
  }
}   
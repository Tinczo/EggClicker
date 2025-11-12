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

  force_destroy = true

  # Dodajemy tagi - dobra praktyka do oznaczania zasobów
  tags = {
    Name        = "EggClicker Asset Storage"
    Project     = "Egg Clicker"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "egg_clicker_files_access" {
  bucket = aws_s3_bucket.egg_clicker_files.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# 2. Dodajemy Politykę Bucketa, która pozwala na publiczny ODCZYT
resource "aws_s3_bucket_policy" "egg_clicker_files_policy" {
  bucket = aws_s3_bucket.egg_clicker_files.id

  # Ta polityka zezwala na operację "GetObject" (pobieranie pliku)
  # każdemu (*) dla każdego obiektu (`/*`) w tym buckecie.
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.egg_clicker_files.arn}/*"
      },
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.egg_clicker_files_access]
}

# 1. Repozytorium dla obrazu backendu
resource "aws_ecr_repository" "egg_clicker_backend" {
  name = "egg-clicker-backend" # Nazwa repozytorium w AWS

  force_delete = true

  tags = {
    Name        = "EggClicker Backend Repo"
    Project     = "Egg Clicker"
    ManagedBy   = "Terraform"
  }
}

# 2. Repozytorium dla obrazu frontendu
resource "aws_ecr_repository" "egg_clicker_frontend" {
  name = "egg-clicker-frontend" # Nazwa repozytorium w AWS

  force_delete = true
  
  tags = {
    Name        = "EggClicker Frontend Repo"
    Project     = "Egg Clicker"
    ManagedBy   = "Terraform"
  }
}

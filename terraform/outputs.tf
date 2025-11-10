# Zwraca ID naszej sieci VPC
output "vpc_id" {
  description = "ID of the EggClicker VPC"
  value       = aws_vpc.egg_clicker_vpc.id
}

# Zwraca listę ID naszych publicznych podsieci
output "public_subnet_ids" {
  description = "List of Public Subnet IDs"
  value       = [aws_subnet.public_a.id, aws_subnet.public_b.id]
}

# Zwraca publiczny adres DNS naszej Bramy (ALB)
output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = aws_cognito_user_pool.egg_clicker_pool.id
}

output "cognito_app_client_id" {
  description = "ID of the Cognito App Client"
  value       = aws_cognito_user_pool_client.app_client.id
}

# Pobieramy ID konta z danych AWS
output "aws_account_id" {
  description = "AWS Account ID"
  value       = data.aws_caller_identity.current.account_id
}

# Pobieramy region z danych AWS
output "aws_region" {
  description = "AWS Region"
  value       = data.aws_region.current.name
}

output "s3_bucket_name" {
  description = "Nazwa bucketa S3 na pliki multimedialne"
  value       = aws_s3_bucket.egg_clicker_files.bucket
}
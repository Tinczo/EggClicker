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
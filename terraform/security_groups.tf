# 1. Grupa Bezpieczeństwa dla naszej Bramy (ALB)
resource "aws_security_group" "alb_sg" {
  name        = "egg-clicker-alb-sg"
  description = "Security group for the ALB"
  vpc_id      = aws_vpc.egg_clicker_vpc.id

  # Reguła WEJŚCIOWA (Ingress):
  # Wpuszczaj ruch HTTP z dowolnego miejsca w internecie
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # "0.0.0.0/0" oznacza "cały internet"
  }

  # Reguła WYJŚCIOWA (Egress):
  # Pozwalaj na dowolny ruch wychodzący (np. do naszej aplikacji)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1" # "-1" oznacza "dowolny protokół"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "EggClicker-ALB-SG"
  }
}

# 2. Grupa Bezpieczeństwa dla naszej Aplikacji (Fargate)
resource "aws_security_group" "fargate_sg" {
  name        = "egg-clicker-fargate-sg"
  description = "Security group for Fargate services"
  vpc_id      = aws_vpc.egg_clicker_vpc.id

  # Reguła WEJŚCIOWA (Ingress):
  # Wpuszczaj ruch TYLKO z naszej grupy bezpieczeństwa ALB
  ingress {
    from_port       = 0 # Dowolny port
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.alb_sg.id] # Ważne!
  }

  # Reguła WYJŚCIOWA (Egress):
  # Pozwalaj naszej aplikacji łączyć się z internetem
  # (np. żeby pobrać obrazy z ECR albo łączyć się z AWS API)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "EggClicker-Fargate-SG"
  }
}
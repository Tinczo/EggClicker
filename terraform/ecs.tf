# 1. Klaster ECS - nasz główny "obszar roboczy"
resource "aws_ecs_cluster" "main" {
  name = "egg-clicker-cluster"

  tags = {
    Name = "EggClicker-Cluster"
  }
}

# ----------------------------------------
# --- DEFINICJA APLIKACJI (PLANY) ---
# ----------------------------------------

# 2. Plan dla Backendu
resource "aws_ecs_task_definition" "backend" {
  family                   = "egg-clicker-backend"
  requires_compatibilities = ["FARGATE"] # Mówimy, że to Fargate
  network_mode             = "awsvpc"    # Wymagane dla Fargate
  cpu                      = 256         # 1/4 vCPU
  memory                   = 512         # 0.5 GB RAM

  # --- TUTAJ JEST KLUCZOWA ZMIANA ---
  # Używamy Twojej roli `LabRole` jako roli wykonawczej
  execution_role_arn = var.lab_role_arn

  # Definicja naszego kontenera
  container_definitions = jsonencode([
    {
      name  = "egg-clicker-backend-container"

      # Pełny adres obrazu w ECR (używamy naszych zmiennych!)
      image = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/egg-clicker-backend:latest"

      # Porty, które kontener udostępnia
      portMappings = [
        {
          containerPort = 3001 # Nasz Express działa na 3001
          hostPort      = 3001
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.backend_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs" # Przedrostek dla strumieni logów
        }
      }
    }
  ])
}

# 3. Plan dla Frontendu
resource "aws_ecs_task_definition" "frontend" {
  family                   = "egg-clicker-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512

  # --- TUTAJ JEST KLUCZOWA ZMIANA ---
  # Również używamy Twojej `LabRole`
  execution_role_arn       = var.lab_role_arn

  container_definitions = jsonencode([
    {
      name  = "egg-clicker-frontend-container"

      # Adres obrazu frontendu w ECR
      image = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/egg-clicker-frontend:latest"

      portMappings = [
        {
          containerPort = 80 # Nasz Nginx działa na 80
          hostPort      = 80
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.frontend_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# ----------------------------------------
# --- URUCHOMIENIE APLIKACJI (MENEDŻEROWIE) ---
# ----------------------------------------

# 4. Menedżer (Usługa) dla Backendu
resource "aws_ecs_service" "backend" {
  name            = "egg-clicker-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1       # Chcemy 1 działającą kopię
  launch_type     = "FARGATE"

  # Konfiguracja sieciowa
  network_configuration {
    subnets         = [aws_subnet.public_a.id, aws_subnet.public_b.id] # Gdzie ma działać
    security_groups = [aws_security_group.fargate_sg.id]     # Jakie ma mieć "ogrodzenie"
    assign_public_ip = true # Daj mu publiczne IP (potrzebne do pobrania obrazu z ECR)
  }

  # Podłączenie do naszej "bramy" (ALB)
  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "egg-clicker-backend-container"
    container_port   = 3001
  }

  # Poinformuj Terraform, aby poczekał na stworzenie bramy
  depends_on = [aws_lb_listener.http]
}

# 5. Menedżer (Usługa) dla Frontendu
resource "aws_ecs_service" "frontend" {
  name            = "egg-clicker-frontend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups = [aws_security_group.fargate_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "egg-clicker-frontend-container"
    container_port   = 80
  }

  depends_on = [aws_lb_listener.http]
}
# Pojemnik na logi dla naszego backendu
resource "aws_cloudwatch_log_group" "backend_logs" {
  name = "/ecs/egg-clicker-backend" # Używamy konwencji nazewnictwa /ecs/

  # Jak długo przechowywać logi (np. 7 dni)
  retention_in_days = 7

  tags = {
    Name    = "EggClicker-Backend-Logs"
    Project = "Egg Clicker"
  }
}

# Pojemnik na logi dla naszego frontendu (ten jest dla nas kluczowy!)
resource "aws_cloudwatch_log_group" "frontend_logs" {
  name = "/ecs/egg-clicker-frontend"
  retention_in_days = 7

  tags = {
    Name    = "EggClicker-Frontend-Logs"
    Project = "Egg Clicker"
  }
}
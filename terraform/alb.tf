# 1. Definicja samej Bramy (Application Load Balancer)
resource "aws_lb" "main" {
  name               = "egg-clicker-lb"
  internal           = false # Chcemy, aby był dostępny z internetu
  load_balancer_type = "application"
  
  # Podłączamy go do naszego "ogrodzenia" (Security Group)
  security_groups    = [aws_security_group.alb_sg.id]
  
  # Umieszczamy go na naszych publicznych "pod-działkach" (Subnetach)
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]

  tags = {
    Name = "EggClicker-ALB"
  }
}

# 2. "Drzwi" (Target Groups) - na razie puste
# Definiujemy, dokąd brama ma kierować ruch

# Drzwi do frontendu
resource "aws_lb_target_group" "frontend" {
  name        = "egg-clicker-frontend-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.egg_clicker_vpc.id
  target_type = "ip" # Ważne dla Fargate

  # Sprawdzanie "zdrowia" - czy frontend odpowiada
  health_check {
    path = "/"
  }
}

# Drzwi do backendu
resource "aws_lb_target_group" "backend" {
  name        = "egg-clicker-backend-tg"
  port        = 3001 # Nasz backend działa na porcie 3001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.egg_clicker_vpc.id
  target_type = "ip"

  # Sprawdzanie "zdrowia" - czy backend odpowiada
  health_check {
    path = "/api/health" # Używamy jednego z naszych endpointów GET
  }
}

# 3. "Recepcjonista" (Listener)
# Mówi bramie, aby nasłuchiwała na porcie 80 (HTTP)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # Domyślna akcja: jeśli żadna reguła nie pasuje,
  # wyślij do frontendu.
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
}

# 4. "Instrukcje dla Recepcjonisty" (Listener Rule)
# Nasza główna reguła routingu
resource "aws_lb_listener_rule" "api_rule" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100 # Niższy numer = wyższy priorytet

  # AKCJA: Przekieruj do backendu
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }

  # WARUNEK: Tylko jeśli ścieżka zaczyna się od "/api/*"
  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
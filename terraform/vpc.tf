# Definicja naszej głównej sieci (Virtual Private Cloud)
resource "aws_vpc" "egg_clicker_vpc" {
  cidr_block = "10.0.0.0/16" # "Rozmiar" naszej działki (65,536 adresów IP)
  
  # Chcemy, aby nasze instancje miały publiczne nazwy DNS
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name      = "EggClicker-VPC"
    Project   = "Egg Clicker"
    ManagedBy = "Terraform"
  }
}

# --- Podsieci Publiczne ---
# Tworzymy dwie podsieci w różnych Strefach Dostępności (dla odporności na awarie)

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.egg_clicker_vpc.id
  cidr_block              = "10.0.1.0/24"    # Podsieć nr 1
  availability_zone       = "${data.aws_region.current.name}a" # np. us-east-1a
  map_public_ip_on_launch = true             # Nadawaj publiczne IP automatycznie

  tags = {
    Name = "EggClicker-Public-Subnet-A"
  }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.egg_clicker_vpc.id
  cidr_block              = "10.0.2.0/24"    # Podsieć nr 2
  availability_zone       = "${data.aws_region.current.name}b" # np. us-east-1b
  map_public_ip_on_launch = true             # Nadawaj publiczne IP automatycznie

  tags = {
    Name = "EggClicker-Public-Subnet-B"
  }
}

# --- Dostęp do Internetu ---

# Brama Internetowa (nasze "wyjście na świat")
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.egg_clicker_vpc.id

  tags = {
    Name = "EggClicker-IGW"
  }
}

# Tablica routingu (mapa dróg)
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.egg_clicker_vpc.id

  # Reguła: cały ruch (0.0.0.0/0) ma iść do naszej Bramy Internetowej
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "EggClicker-Public-RouteTable"
  }
}

# Powiązanie naszej mapy dróg z podsieciami
resource "aws_route_table_association" "a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public_rt.id
}

# --- Dane pomocnicze ---
# Pobiera informacje o regionie, w którym pracujemy
data "aws_region" "current" {}

data "aws_caller_identity" "current" {}
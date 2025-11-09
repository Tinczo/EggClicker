resource "aws_cognito_user_pool" "egg_clicker_pool" {
  name = "EggClickerUserPool"

  username_attributes = ["email"]
  auto_verified_attributes = ["email"]

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  schema {
    name                     = "email"
    required                 = true
    attribute_data_type      = "String"
    mutable                  = false
  }

  # Konfiguracja haseł
  password_policy {
    minimum_length    = 6
    require_lowercase = false
    require_uppercase = false
    require_numbers   = true
    require_symbols   = false # Uprośćmy to trochę
  }


  tags = {
    Name    = "EggClicker-UserPool"
    Project = "Egg Clicker"
  }
}

# 2. "Drzwi Wejściowe" (User Pool Client)
# To jest "klient", który pozwoli naszemu Reactowi (bez backendu)
# łączyć się z Cognito i uwierzytelniać użytkowników.
resource "aws_cognito_user_pool_client" "app_client" {
  name = "egg-clicker-app-client"
  user_pool_id = aws_cognito_user_pool.egg_clicker_pool.id

  # WAŻNE: Musimy wyłączyć generowanie "sekretu" klienta.
  # Aplikacje webowe (JavaScript) nie potrafią bezpiecznie przechować sekretu.
  generate_secret = false

  # Zezwalamy na bezpieczny przepływ SRP (dla logowania) oraz na odświeżanie tokena.
  explicit_auth_flows = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
}
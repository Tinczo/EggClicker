# ----------------------------------------
# --- Baza Danych DynamoDB  ---
# ----------------------------------------

resource "aws_dynamodb_table" "egg_clicker_table" {
  name         = "EggClickerData"
  billing_mode = "PAY_PER_REQUEST" # Płacimy tylko za to, co użyjemy (idealne!)

  # Definiujemy nasz klucz główny (jak "ID" w SQL)
  # Będziemy trzymać różne dane, identyfikując je po "ItemID"
  attribute {
    name = "ItemID"
    type = "S" # S = String (Ciąg znaków)
  }

  hash_key = "ItemID" # Informujemy DynamoDB, że "ItemID" to nasz klucz

  tags = {
    Name    = "EggClicker-Data-Table"
    Project = "Egg Clicker"
  }
}
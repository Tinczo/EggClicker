resource "aws_dynamodb_table" "egg_clicker_table" {
  name         = "EggClickerData"
  billing_mode = "PAY_PER_REQUEST" 

  # Klucz główny (bez zmian)
  hash_key = "ItemID"
  attribute {
    name = "ItemID"
    type = "S"
  }
  
  attribute {
    name = "leaderboard_pk" # Nowy klucz partycji dla GSI
    type = "S"
  }
  attribute {
    name = "clickCount" # Teraz klucz sortowania dla GSI
    type = "N"
  }

  global_secondary_index {
    name            = "LeaderboardIndex" # Nowa, lepsza nazwa
    
    hash_key        = "leaderboard_pk"
    range_key       = "clickCount"
    
    projection_type = "INCLUDE"
    non_key_attributes = ["username", "avatarUrl"] 
  }

  tags = {
    Name    = "EggClicker-Data-Table"
    Project = "Egg Clicker"
  }
}

resource "aws_dynamodb_table" "egg_clicker_state" {
  name         = "EggClickerState"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "StateID"
  attribute {
    name = "StateID"
    type = "S"
  }

  tags = {
    Name    = "EggClicker-State-Table"
    Project = "Egg Clicker"
  }
}
# A. Pakowanie kodu do ZIP
data "archive_file" "podium_checker_zip" {
  type        = "zip"
  source_dir  = "../lambda_functions/podium_checker" # Ścieżka do naszego nowego kodu
  output_path = "${path.module}/podium_checker.zip"
}

# B. Definicja funkcji Lambda
resource "aws_lambda_function" "podium_checker" {
  filename      = data.archive_file.podium_checker_zip.output_path
  function_name = "egg-clicker-podium-checker"
  role          = var.lab_role_arn # Używamy `LabRole`
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  timeout       = 30 # Dajmy jej 30 sekund

  # Przekazujemy nazwy naszych tabel do kodu
  environment {
    variables = {
      MAIN_TABLE_NAME  = aws_dynamodb_table.egg_clicker_table.name
      STATE_TABLE_NAME = aws_dynamodb_table.egg_clicker_state.name
    }
  }
}

resource "aws_cloudwatch_event_rule" "lambda_timer" {
  name                = "egg-clicker-podium-timer"
  description         = "Uruchamia Lambdę 'podium_checker' co 1 minutę"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule = aws_cloudwatch_event_rule.lambda_timer.name
  arn  = aws_lambda_function.podium_checker.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.podium_checker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_timer.arn
}
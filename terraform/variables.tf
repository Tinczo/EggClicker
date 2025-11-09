variable "aws_account_id" {
  description = "AWS Account ID"
  type        = string
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
}

variable "lab_role_arn" {
  description = "ARN of the existing LabRole provided by the lab environment"
  type        = string
}
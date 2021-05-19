terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.27"
    }
  }
  required_version = ">= 0.14.9"
}

provider "aws" {
  profile = "default"
  region  = "us-east-1"
}

resource "aws_dynamodb_table" "ddbtable" {
  name             = "booksTableTf" # TODO: use .tfvars
  hash_key         = "id"
  billing_mode   = "PROVISIONED"
  read_capacity  = 2
  write_capacity = 2
  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "lambda_policy"
  role = "${aws_iam_role.role_for_lambda.id}"
  policy = file("iam/policy.json")
}


resource "aws_iam_role" "role_for_lambda" {
  name = "lambdaRole"
  assume_role_policy = file("iam/assume_role_policy.json")
}


resource "aws_lambda_function" "bookLambda" {
  function_name = "bookFunctionTf"
  filename = "tflambda.zip"
  # s3_bucket     = "iacshowdown2021"
  # s3_key        = "tflambda.zip"
  role          = "${aws_iam_role.role_for_lambda.arn}"
  handler       = "tflambda.handler"
  runtime       = "nodejs12.x"
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.bookLambda.function_name}"
  principal     = "apigateway.amazonaws.com"
  source_arn = "${aws_api_gateway_rest_api.apiLambda.execution_arn}/*/*"
}

resource "aws_api_gateway_rest_api" "apiLambda" {
  name        = "bookAPIv2"
  description = "Books API using TF"
}


resource "aws_api_gateway_resource" "Resource" {
  rest_api_id = "${aws_api_gateway_rest_api.apiLambda.id}"
  parent_id   = "${aws_api_gateway_rest_api.apiLambda.root_resource_id}"
  path_part   = "books"
}


resource "aws_api_gateway_method" "Method" {
  rest_api_id   = "${aws_api_gateway_rest_api.apiLambda.id}"
  resource_id   = "${aws_api_gateway_resource.Resource.id}"
  http_method   = "ANY"
  authorization = "NONE"
}


resource "aws_api_gateway_integration" "lambdaIntegration" {
  rest_api_id = "${aws_api_gateway_rest_api.apiLambda.id}"
  resource_id = "${aws_api_gateway_resource.Resource.id}"
  http_method = "${aws_api_gateway_method.Method.http_method}"
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = "${aws_lambda_function.bookLambda.invoke_arn}"
}


resource "aws_api_gateway_method_response" "lambdaAPIResponse" {
  rest_api_id = "${aws_api_gateway_rest_api.apiLambda.id}"
  resource_id = "${aws_api_gateway_resource.Resource.id}"
  http_method = "${aws_api_gateway_method.Method.http_method}"
  status_code = "200"
}


# Configure the API Gateway and Lambda functions response
resource "aws_api_gateway_integration_response" "lambdaAPIIntegrationResponse" {
  rest_api_id = "${aws_api_gateway_rest_api.apiLambda.id}"
  resource_id = "${aws_api_gateway_resource.Resource.id}"
  http_method = "${aws_api_gateway_method.Method.http_method}"
  status_code = "${aws_api_gateway_method_response.lambdaAPIResponse.status_code}"

  depends_on = [
    aws_api_gateway_integration.lambdaIntegration
  ]
}

resource "aws_api_gateway_deployment" "apideploy" {
  depends_on = [
    aws_api_gateway_integration.lambdaIntegration,
    aws_api_gateway_integration_response.lambdaAPIIntegrationResponse
  ]

  rest_api_id = "${aws_api_gateway_rest_api.apiLambda.id}"
  stage_name  = "Prod"
}


output "base_url" {
  value = "${aws_api_gateway_deployment.apideploy.invoke_url}"
}
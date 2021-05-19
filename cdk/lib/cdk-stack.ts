import * as path from 'path';
import * as cdk from '@aws-cdk/core';

// serverless
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB instance
    const dynamoTable = new dynamodb.Table(this, 'bookTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: 'books',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambdas
    const getAllLambda = new lambda.Function(this, 'getAllFunction', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'functions')),
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.getAllBooks',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'id',
      },
    });

    const getOneLambda = new lambda.Function(this, 'getOneFunction', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'functions')),
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.getBookById',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'id',
      },
    });

    const createOneLambda = new lambda.Function(this, 'createOneFunction', {
      code: lambda.Code.fromAsset(path.join(__dirname, 'functions')),
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.createBook',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: 'id',
      },
    });

    // Grant permission to lambdas
    dynamoTable.grantReadWriteData(getAllLambda);
    dynamoTable.grantReadWriteData(getOneLambda);
    dynamoTable.grantReadWriteData(createOneLambda);

    // APIG layer
    const api = new apigw.RestApi(this, 'booksAPI', {
      restApiName: 'Books API',
    });

    // api.root is '/'
    const books = api.root.addResource('books');
    const singleBook = books.addResource('{id}');

    const getAllIntegration = new apigw.LambdaIntegration(getAllLambda);
    books.addMethod('GET', getAllIntegration);

    const createOneIntegration = new apigw.LambdaIntegration(createOneLambda);
    books.addMethod('POST', createOneIntegration);

    const getOneIntegration = new apigw.LambdaIntegration(getOneLambda);
    singleBook.addMethod('GET', getOneIntegration);
  }
}

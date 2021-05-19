const dynamodb = require('aws-sdk/clients/dynamodb');

const docClient = new dynamodb.DocumentClient();
const tableName = process.env.TABLE_NAME;

// GET all books
exports.getAllBooks = async (event) => {
  const params = {
    TableName: tableName,
  };

  const data = await docClient.scan(params).promise();
  const response = {
    statusCode: 200,
    body: JSON.stringify(data.Items),
  };

  return response;
};

// GET a single book by ID
exports.getBookById = async (event) => {
  const params = {
    TableName: tableName,
    Key: { id: event.pathParameters.id },
  };

  const data = await docClient.get(params).promise();
  const response = {
    statusCode: 200,
    body: JSON.stringify(data.Item),
  };

  return response;
};

// Create a book
exports.createBook = async (event) => {
  const body = JSON.parse(event.body);
  const { id, name } = body;

  const params = {
    TableName: tableName,
    Item: { id, name },
  };

  await docClient.put(params).promise();

  const response = {
    statusCode: 200,
    body: JSON.stringify(body),
  };

  return response;
};

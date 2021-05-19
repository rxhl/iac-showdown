const dynamodb = require('aws-sdk/clients/dynamodb');

const docClient = new dynamodb.DocumentClient();
const tableName = 'booksTableTf';

exports.handler = async (event) => {
  if (event.httpMethod === 'GET') {
    const params = {
      TableName: tableName,
    };

    const data = await docClient.scan(params).promise();
    const response = {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };

    return response;
  }

  if (event.httpMethod === 'POST') {
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
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      msg: 'invalid method',
    }),
  };
};

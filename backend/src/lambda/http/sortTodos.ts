import 'source-map-support/register'
import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda'
import { getSortedTodos } from '../../helpers/todos'

export const sortTodos: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const { userId } = event.requestContext.authorizer
    const { sortField, sortDirection } = event.queryStringParameters

    const todos = await getSortedTodos(userId, sortField, sortDirection)

    return {
      statusCode: 200,
      body: JSON.stringify(todos)
    }
  } catch (error) {
    console.error('Error sorting todos:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    }
  }
}

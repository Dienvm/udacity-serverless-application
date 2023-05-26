import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getSortedTodos } from '../../helpers/todos'
import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const userId = getUserId(event)
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
)

handler.use(
  cors({
    credentials: true
  })
)

import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { getTodoByUserId } from '../../helpers/businessLogic/todos'
import { getUserId } from '../utils';

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    const todo = await getTodoByUserId(getUserId(event))
    return {
      statusCode: 200,
      body: JSON.stringify({
        items: todo
      })
    }
  })

handler.use(
  cors({
    credentials: true
  })
)

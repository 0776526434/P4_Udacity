import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { updateTodo } from '../../helpers/businessLogic/todos'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'

import { getUserId } from '../utils'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const id = event.pathParameters.todoId
    const updated: UpdateTodoRequest = JSON.parse(event.body)
    // TODO: Update a TODO item with the provided id using values in the "updated" object
    const userId = getUserId(event);
    await updateTodo(userId , id, updated)
    return {
      statusCode: 202,
      body: JSON.stringify(updated)
    }
  }
)

handler
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )

import { TodosAccess } from '../../helpers/dataLayer/todosAcess'
import { TodoItem } from '../../models/TodoItem'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { AttachmentUtils } from '../../helpers/fileStorage/attachmentUtils';
import { createLogger } from '../../utils/logger'
import * as uuid from 'uuid'

const logger = createLogger('Todos')

// TODO: Implement businessLogic
const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

export async function getTodoByUserId(userId :string): Promise<TodoItem[]> {
  return todosAccess.getTodoByUserId(userId)
}

export async function deleteTodoByTodoId(userId: string, todoId: string) {
  todosAccess.deleteTodosByTodoId(userId, todoId)
}

export async function updateTodo(userId: string, todoId :string, updateTodo :UpdateTodoRequest ) {
  todosAccess.updateTodo(userId, todoId, updateTodo)
}

export async function createAttachmentPre(userId: string, todoId :string) : Promise<string> {
  logger.info('Create attachment by user', userId, todoId)
  return attachmentUtils.getAttachmentUrl(todoId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {

  const itemId = uuid.v4()

  return await todosAccess.createTodo({
    todoId: itemId,
    createdAt: new Date().toISOString(),
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    attachmentUrl: await attachmentUtils.createAttachmentURL(itemId),
    userId: userId,
    ...createTodoRequest
  })
}
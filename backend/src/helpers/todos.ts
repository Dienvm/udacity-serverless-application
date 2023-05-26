import { AttachmentUtils } from '../helpers/attachmentUtils'
import { TodosAccess } from '../helpers/todosAcess'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const todosAccess = new TodosAccess()
const logger = createLogger('TodosLogic')
const attachmentUtils = new AttachmentUtils()

export async function getTodos(
  userId: string,
  searchQuery: string
): Promise<TodoItem[]> {
  return todosAccess.getTodos(userId, searchQuery)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  logger.info('Creating a todo item')
  const todoId = uuid.v4()
  const s3AttachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
  const newTodo: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    attachmentUrl: s3AttachmentUrl,
    done: false,
    important: false,
    ...createTodoRequest
  }

  return todosAccess.createTodoItem(newTodo)
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
): Promise<UpdateTodoRequest> {
  logger.info('Updating a todo item')
  const item = await todosAccess.getTodoItem(todoId, userId)

  if (!item) throw new Error('Item not found')

  if (item.userId !== userId) {
    throw new Error('User not authorized to update item')
  }

  // Update the important property in the item based on the updateTodoRequest
  item.important = updateTodoRequest.important

  return todosAccess.updateTodoItem(userId, todoId, updateTodoRequest)
}

export async function deleteTodo(
  todoId: string,
  userId: string
): Promise<void> {
  logger.info('Deleting a todo item')

  const item = await todosAccess.getTodoItem(todoId, userId)

  if (!item) throw new Error('Item not found')

  if (item.userId !== userId) {
    throw new Error('User not authorized to update item')
  }
  return todosAccess.deleteTodoItem(todoId, userId)
}

export async function createAttachmentPresignUrl(
  todoId: string
): Promise<string> {
  logger.info('Generating upload url')
  return attachmentUtils.generateUploadUrl(todoId)
}

export async function getSortedTodos(
  userId: string,
  sortField: string,
  sortDirection: string
): Promise<TodoItem[]> {
  logger.info('Getting sorted todos')

  return todosAccess.sortTodosItem(userId, sortField, sortDirection)
}

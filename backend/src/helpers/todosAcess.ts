import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) {}

  async getTodos(userId: string, searchQuery?: string): Promise<TodoItem[]> {
    logger.info('Getting all todos')

    let queryExpression: any = {
      TableName: this.todosTable,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: true
    }

    if (searchQuery) {
      queryExpression.FilterExpression = 'contains (#n, :searchQuery)'
      queryExpression.ExpressionAttributeNames = {
        '#n': 'name'
      }
      queryExpression.ExpressionAttributeValues[':searchQuery'] = searchQuery
    }

    const result = await this.docClient.query(queryExpression).promise()

    const items = result.Items
    return items as TodoItem[]
  }

  async getTodoItem(todoId: string, userId: string): Promise<TodoItem> {
    logger.info('Getting a todo item')

    const result = await this.docClient
      .get({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        }
      })
      .promise()

    return result.Item as TodoItem
  }

  async createTodoItem(todoItem: TodoItem): Promise<TodoItem> {
    logger.info('Creating a todo item')

    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: todoItem
      })
      .promise()

    return todoItem as TodoItem
  }

  async updateTodoItem(
    userId: string,
    todoId: string,
    todoUpdate: TodoUpdate
  ): Promise<TodoUpdate> {
    logger.info('Updating a todo item')

    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        },
        UpdateExpression:
          'set #name = :name, dueDate = :dueDate, done = :done, important = :important',
        ExpressionAttributeValues: {
          ':name': todoUpdate.name,
          ':dueDate': todoUpdate.dueDate,
          ':done': todoUpdate.done,
          ':important': todoUpdate.important
        },
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()

    return todoUpdate as TodoUpdate
  }

  async deleteTodoItem(todoId: string, userId: string): Promise<void> {
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        }
      })
      .promise()
  }

  async updateTodoAttachmentUrl(
    todoId: string,
    userId: string,
    attachmentUrl: string
  ): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: {
          todoId,
          userId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      })
      .promise()
  }

  async sortTodosItem(
    userId: string,
    sortField: string,
    sortDirection: string
  ): Promise<TodoItem[]> {
    logger.info('Getting sorted todos')

    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: sortDirection.toUpperCase() === 'ASC',
        ProjectionExpression:
          'userId, todoId, createdAt, #name, dueDate, done, important, category',
        ExpressionAttributeNames: {
          '#name': 'name'
        }
      })
      .promise()

    const items = result.Items as TodoItem[]

    const sortedTodos = [...items]

    let compareFn: (a: TodoItem, b: TodoItem) => number
    if (sortField === 'name') {
      compareFn = (a, b) => a.name.localeCompare(b.name)
    } else if (sortField === 'dueDate') {
      compareFn = (a, b) => {
        const dueDateA = new Date(a.dueDate).getTime() / 1000
        const dueDateB = new Date(b.dueDate).getTime() / 1000
        return dueDateA - dueDateB
      }
    } else {
      compareFn = (a, b) => a.name.localeCompare(b.name)
    }

    if (sortDirection === 'asc') {
      sortedTodos.sort(compareFn)
    } else if (sortDirection === 'desc') {
      sortedTodos.sort((a, b) => compareFn(b, a))
    }

    return sortedTodos
  }
}

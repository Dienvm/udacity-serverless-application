export interface Todo {
  todoId: string
  createdAt: string
  name: string
  dueDate: string
  done: boolean
  important?: boolean
  attachmentUrl?: string
  sortField?: string
  sortDirection?: string
}

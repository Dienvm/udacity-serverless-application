export interface CreateTodoRequest {
  name: string
  dueDate: string
  // category: string
  sortField?: string
  sortDirection?: string
}

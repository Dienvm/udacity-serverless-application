import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import {
  createTodo,
  deleteTodo,
  getTodos,
  patchTodo,
  sortTodos
} from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  searchQuery: string
}

export const Todos: React.FC<TodosProps> = ({ auth, history }) => {
  const [todos, setTodos] = React.useState<Todo[]>([])
  const [newTodoName, setNewTodoName] = React.useState('')
  const [loadingTodos, setLoadingTodos] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortField, setSortField] = React.useState('')
  const [sortDirection, setSortDirection] = React.useState('')

  React.useEffect(() => {
    const fetchTodos = async () => {
      try {
        const fetchedTodos = await getTodos(auth.getIdToken())
        setTodos(fetchedTodos)
        setLoadingTodos(false)
      } catch (e) {
        alert(`Failed to fetch todos: ${(e as Error).message}`)
      }
    }

    fetchTodos()
  }, [auth])

  React.useEffect(() => {
    const handleSort = async () => {
      try {
        const sortedTodos = await sortTodos(
          auth.getIdToken(),
          sortDirection,
          sortField
        )

        if (sortedTodos) {
          setTodos(sortedTodos)
          setLoadingTodos(false)
        }
      } catch (e) {
        alert(`Failed to fetch todos: ${(e as Error).message}`)
      }
    }

    if (sortField && sortDirection) handleSort()
  }, [auth, sortField, sortDirection])

  React.useEffect(() => {
    if (searchQuery) {
      const fetchTodos = async () => {
        try {
          const fetchedTodos = await getTodos(auth.getIdToken(), searchQuery)
          setTodos(fetchedTodos)
          setLoadingTodos(false)
        } catch (e) {
          alert(`Failed to fetch todos: ${(e as Error).message}`)
        }
      }

      fetchTodos()
    }
  }, [searchQuery, auth])

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.trim()) {
      setNewTodoName(event.target.value)
    }
  }

  const handleSort = async (field: string) => {
    if (field === sortField) {
      // Toggle the sort direction if the same field is clicked again
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set the new sort field and default sort direction
      setSortField(field)
      setSortDirection('asc')
    }

    // const sortedTodos = await sortTodos(
    //   auth.getIdToken(),
    //   sortDirection,
    //   sortField
    // )

    // console.log({ sortedTodos })

    // if (sortedTodos) {
    //   setTodos(sortedTodos)
    //   setLoadingTodos(false)
    // }
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value.trim()) {
      setSearchQuery(event.target.value)
    }
  }

  const onEditButtonClick = (todoId: string) => {
    history.push(`/todos/${todoId}/edit`)
  }

  const onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      if (newTodoName.trim()) {
        const dueDate = calculateDueDate()
        const newTodo = await createTodo(auth.getIdToken(), {
          name: newTodoName,
          dueDate,
          sortField,
          sortDirection
        })
        setTodos([...todos, newTodo])
        setNewTodoName('')
      }
    } catch {
      alert('Todo creation failed')
    }
  }

  const onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(auth.getIdToken(), todoId)
      setTodos(todos.filter((todo) => todo.todoId !== todoId))
    } catch {
      alert('Todo deletion failed')
    }
  }

  const onTodoCheck = async (pos: number) => {
    try {
      const todo = todos[pos]
      await patchTodo(auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done,
        important: todo.important as boolean,
        sortField,
        sortDirection
      })
      setTodos(
        update(todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      )
    } catch {
      alert('Todo update failed')
    }
  }

  const onTodoMarkImportant = async (pos: number) => {
    try {
      const todo = todos[pos]
      await patchTodo(auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: todo.done,
        important: !todo.important // Toggle the important value
      })
      setTodos(
        update(todos, {
          [pos]: { important: { $set: !todo.important } }
        })
      )
    } catch {
      alert('Todo update failed')
    }
  }

  const calculateDueDate = (): string => {
    const currentDate = new Date()
    const dueDate = new Date()
    dueDate.setDate(currentDate.getDate() + 7) // Set due date as 7 days from current date
    return dateFormat(dueDate, 'yyyy-mm-dd') as string
  }

  const renderTodosList = () => {
    return (
      <Grid.Row>
        <Grid.Row>
          <Grid.Column width={8}>
            <Input
              icon="search"
              placeholder="Search todos..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </Grid.Column>

          <Grid.Column width={8}>
            <div>
              Sort by:
              <Button
                icon
                color={sortField === 'name' ? 'blue' : undefined}
                onClick={() => handleSort('name')}
              >
                Name
                {sortField === 'name' && (
                  <Icon
                    name={`angle ${sortDirection === 'asc' ? 'up' : 'down'}`}
                  />
                )}
              </Button>
              <Button
                icon
                color={sortField === 'dueDate' ? 'blue' : undefined}
                onClick={() => handleSort('dueDate')}
              >
                Due Date
                {sortField === 'dueDate' && (
                  <Icon
                    name={`angle ${sortDirection === 'asc' ? 'up' : 'down'}`}
                  />
                )}
              </Button>
            </div>
          </Grid.Column>
        </Grid.Row>

        <Grid.Column width={16}>
          {todos.map((todo, pos) => {
            return (
              <div key={todo.todoId}>
                <Divider />
                <Grid>
                  <Grid.Column width={1}>
                    <Checkbox
                      onChange={() => onTodoCheck(pos)}
                      checked={todo.done}
                    />
                  </Grid.Column>
                  <Grid.Column width={10} verticalAlign="middle">
                    {todo.name}
                    <div>
                      {todo.attachmentUrl && (
                        <Image src={todo.attachmentUrl} size="small" wrapped />
                      )}
                    </div>
                  </Grid.Column>
                  <Grid.Column width={2} floated="right">
                    {dateFormat(todo.dueDate, 'yyyy-mm-dd')}
                  </Grid.Column>
                  <Grid.Column width={3} floated="right">
                    <Button
                      icon
                      color={todo.important ? 'yellow' : undefined}
                      onClick={() => onTodoMarkImportant(pos)}
                    >
                      <Icon name="star" />
                    </Button>
                    <Button
                      icon
                      color="blue"
                      onClick={() => onEditButtonClick(todo.todoId)}
                    >
                      <Icon name="pencil" />
                    </Button>
                    <Button
                      icon
                      color="red"
                      onClick={() => onTodoDelete(todo.todoId)}
                    >
                      <Icon name="delete" />
                    </Button>
                  </Grid.Column>
                </Grid>
              </div>
            )
          })}
        </Grid.Column>
      </Grid.Row>
    )
  }

  return (
    <div>
      <Header as="h1">Todo List</Header>

      {loadingTodos ? (
        <Loader indeterminate active inline="centered">
          Loading Todos
        </Loader>
      ) : (
        <Grid padded>
          {renderTodosList()}
          <Grid.Row>
            <Grid.Column width={16}>
              <Input
                action={{
                  color: 'teal',
                  labelPosition: 'left',
                  icon: 'add',
                  content: 'New todo',
                  onClick: onTodoCreate
                }}
                fluid
                actionPosition="left"
                placeholder="Todo name"
                onChange={handleNameChange}
                value={newTodoName}
              />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      )}
    </div>
  )
}

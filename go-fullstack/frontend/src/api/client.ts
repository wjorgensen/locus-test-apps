import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error')
    }
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }

  async getTodos(): Promise<Todo[]> {
    return this.request('/api/todos')
  }

  async getTodo(id: number): Promise<Todo> {
    return this.request(`/api/todos/${id}`)
  }

  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    return this.request('/api/todos', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTodo(id: number, data: UpdateTodoRequest): Promise<Todo> {
    return this.request(`/api/todos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteTodo(id: number): Promise<void> {
    await this.request(`/api/todos/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient(API_URL)

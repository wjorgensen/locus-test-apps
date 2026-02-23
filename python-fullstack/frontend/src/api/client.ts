const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface CreateTodoRequest {
  title: string;
}

export interface UpdateTodoRequest {
  title?: string;
  completed?: boolean;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(response.status, error.detail || 'Unknown error');
  }
  return response.json();
}

export const api = {
  async checkHealth(): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_URL}/health`);
    return handleResponse(response);
  },

  async getTodos(): Promise<Todo[]> {
    const response = await fetch(`${API_URL}/todos`);
    return handleResponse(response);
  },

  async getTodo(id: number): Promise<Todo> {
    const response = await fetch(`${API_URL}/todos/${id}`);
    return handleResponse(response);
  },

  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    const response = await fetch(`${API_URL}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateTodo(id: number, data: UpdateTodoRequest): Promise<Todo> {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteTodo(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/todos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new ApiError(response.status, error.detail || 'Unknown error');
    }
  },
};

export { ApiError };

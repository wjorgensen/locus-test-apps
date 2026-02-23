import { useState, useEffect } from 'react';
import { api, Todo } from '../api/client';
import './TodoList.css';

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkConnection();
    loadTodos();
  }, []);

  const checkConnection = async () => {
    try {
      await api.checkHealth();
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
      setError('Failed to connect to backend');
    }
  };

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await api.getTodos();
      setTodos(data);
      setError(null);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const todo = await api.createTodo({ title: newTodo.trim() });
      setTodos([...todos, todo]);
      setNewTodo('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      const updated = await api.updateTodo(todo.id, {
        completed: !todo.completed,
      });
      setTodos(todos.map((t) => (t.id === todo.id ? updated : t)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteTodo(id);
      setTodos(todos.filter((t) => t.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  if (loading) {
    return <div className="loading">Loading todos...</div>;
  }

  return (
    <div className="todo-list">
      <div className="connection-status">
        <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Connected' : '● Disconnected'}
        </span>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadTodos} className="retry-button">
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleCreate} className="todo-form">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
          className="todo-input"
          disabled={!isConnected}
        />
        <button type="submit" className="add-button" disabled={!isConnected}>
          Add Todo
        </button>
      </form>

      <div className="todos">
        {todos.length === 0 ? (
          <p className="empty-state">No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <div className="todo-content">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo)}
                  className="todo-checkbox"
                />
                <span className="todo-title">{todo.title}</span>
              </div>
              <button onClick={() => handleDelete(todo.id)} className="delete-button">
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      <div className="todo-stats">
        <span>
          {todos.filter((t) => !t.completed).length} of {todos.length} remaining
        </span>
      </div>
    </div>
  );
}

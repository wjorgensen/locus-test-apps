<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TodoItem from './TodoItem.vue'
import { apiClient } from '../api/client'
import type { Todo } from '../types'

const todos = ref<Todo[]>([])
const newTodoTitle = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

const loadTodos = async () => {
  isLoading.value = true
  error.value = null

  try {
    todos.value = await apiClient.getTodos()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load todos'
    console.error('Error loading todos:', err)
  } finally {
    isLoading.value = false
  }
}

const createTodo = async () => {
  const title = newTodoTitle.value.trim()
  if (!title) return

  error.value = null

  try {
    const newTodo = await apiClient.createTodo({ title })
    todos.value.unshift(newTodo)
    newTodoTitle.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to create todo'
    console.error('Error creating todo:', err)
  }
}

const handleUpdate = async (id: number, updates: { title?: string; completed?: boolean }) => {
  error.value = null

  try {
    const updatedTodo = await apiClient.updateTodo(id, updates)
    const index = todos.value.findIndex(t => t.id === id)
    if (index !== -1) {
      todos.value[index] = updatedTodo
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update todo'
    console.error('Error updating todo:', err)
    // Reload todos to revert UI changes
    await loadTodos()
  }
}

const handleDelete = async (id: number) => {
  error.value = null

  try {
    await apiClient.deleteTodo(id)
    todos.value = todos.value.filter(t => t.id !== id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete todo'
    console.error('Error deleting todo:', err)
    // Reload todos in case of error
    await loadTodos()
  }
}

const handleSubmit = (e: Event) => {
  e.preventDefault()
  createTodo()
}

onMounted(() => {
  loadTodos()
})
</script>

<template>
  <div class="todo-list-container">
    <div class="error-banner" v-if="error">
      {{ error }}
      <button @click="error = null" class="close-button">×</button>
    </div>

    <form @submit="handleSubmit" class="todo-form">
      <input
        v-model="newTodoTitle"
        type="text"
        placeholder="What needs to be done?"
        class="todo-input"
        :disabled="isLoading"
      />
      <button type="submit" :disabled="!newTodoTitle.trim() || isLoading" class="add-button">
        Add
      </button>
    </form>

    <div class="todo-stats">
      <span>{{ todos.length }} {{ todos.length === 1 ? 'item' : 'items' }}</span>
      <span v-if="todos.length > 0">
        {{ todos.filter(t => t.completed).length }} completed
      </span>
    </div>

    <div v-if="isLoading && todos.length === 0" class="loading">
      Loading todos...
    </div>

    <div v-else-if="todos.length === 0" class="empty-state">
      <p>No todos yet. Add one above to get started!</p>
    </div>

    <ul v-else class="todo-list">
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @update="handleUpdate"
        @delete="handleDelete"
      />
    </ul>
  </div>
</template>

<style scoped>
.todo-list-container {
  width: 100%;
}

.error-banner {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #ef4444;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: #dc2626;
}

.todo-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.todo-input {
  flex: 1;
}

.add-button {
  background-color: #646cff;
  color: white;
  border: none;
}

.add-button:hover:not(:disabled) {
  background-color: #535bf2;
}

.add-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.todo-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: rgba(255, 255, 255, 0.5);
}

.todo-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (prefers-color-scheme: light) {
  .todo-stats {
    color: rgba(0, 0, 0, 0.6);
  }

  .loading,
  .empty-state {
    color: rgba(0, 0, 0, 0.5);
  }
}
</style>

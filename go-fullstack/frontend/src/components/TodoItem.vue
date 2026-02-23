<script setup lang="ts">
import { ref } from 'vue'
import type { Todo } from '../types'

interface Props {
  todo: Todo
}

interface Emits {
  (e: 'update', id: number, updates: { title?: string; completed?: boolean }): void
  (e: 'delete', id: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isEditing = ref(false)
const editTitle = ref(props.todo.title)

const toggleCompleted = () => {
  emit('update', props.todo.id, { completed: !props.todo.completed })
}

const startEdit = () => {
  isEditing.value = true
  editTitle.value = props.todo.title
}

const cancelEdit = () => {
  isEditing.value = false
  editTitle.value = props.todo.title
}

const saveEdit = () => {
  const title = editTitle.value.trim()
  if (!title) return

  if (title !== props.todo.title) {
    emit('update', props.todo.id, { title })
  }

  isEditing.value = false
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    saveEdit()
  } else if (e.key === 'Escape') {
    cancelEdit()
  }
}

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this todo?')) {
    emit('delete', props.todo.id)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
</script>

<template>
  <li class="todo-item" :class="{ completed: todo.completed }">
    <div class="todo-content">
      <input
        type="checkbox"
        :checked="todo.completed"
        @change="toggleCompleted"
        class="todo-checkbox"
      />

      <div v-if="!isEditing" class="todo-text" @dblclick="startEdit">
        <span class="todo-title">{{ todo.title }}</span>
        <span class="todo-date">{{ formatDate(todo.created_at) }}</span>
      </div>

      <input
        v-else
        v-model="editTitle"
        type="text"
        class="todo-edit-input"
        @blur="saveEdit"
        @keydown="handleKeydown"
        ref="editInput"
      />
    </div>

    <div class="todo-actions">
      <button
        v-if="!isEditing"
        @click="startEdit"
        class="action-button edit-button"
        title="Edit"
      >
        ✎
      </button>

      <button
        @click="handleDelete"
        class="action-button delete-button"
        title="Delete"
      >
        ×
      </button>
    </div>
  </li>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.todo-item:hover {
  background-color: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.todo-item.completed {
  opacity: 0.6;
}

.todo-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.todo-checkbox {
  flex-shrink: 0;
}

.todo-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
  cursor: text;
}

.todo-title {
  font-size: 1rem;
  word-break: break-word;
}

.completed .todo-title {
  text-decoration: line-through;
}

.todo-date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.todo-edit-input {
  flex: 1;
  font-size: 1rem;
}

.todo-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.action-button {
  padding: 0.25rem 0.5rem;
  font-size: 1.2rem;
  background: none;
  border: 1px solid transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.edit-button {
  color: #646cff;
}

.edit-button:hover {
  background-color: rgba(100, 108, 255, 0.1);
  border-color: #646cff;
}

.delete-button {
  color: #ef4444;
  font-size: 1.5rem;
}

.delete-button:hover {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}

@media (prefers-color-scheme: light) {
  .todo-item {
    background-color: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.1);
  }

  .todo-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
    border-color: rgba(0, 0, 0, 0.2);
  }

  .todo-date {
    color: rgba(0, 0, 0, 0.4);
  }
}
</style>

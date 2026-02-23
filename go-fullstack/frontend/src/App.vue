<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TodoList from './components/TodoList.vue'
import { apiClient } from './api/client'

const isConnected = ref<boolean | null>(null)
const connectionError = ref<string>('')
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const checkConnection = async () => {
  try {
    await apiClient.healthCheck()
    isConnected.value = true
    connectionError.value = ''
  } catch (error) {
    isConnected.value = false
    connectionError.value = error instanceof Error ? error.message : 'Unknown error'
  }
}

onMounted(() => {
  checkConnection()
  // Check connection every 30 seconds
  setInterval(checkConnection, 30000)
})
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Todo App</h1>
      <div class="connection-status" :class="{
        connected: isConnected === true,
        disconnected: isConnected === false,
        checking: isConnected === null
      }">
        <span class="status-dot"></span>
        <span v-if="isConnected === true">Connected to backend</span>
        <span v-else-if="isConnected === false">
          Disconnected: {{ connectionError }}
        </span>
        <span v-else>Checking connection...</span>
      </div>
      <p class="api-url">API: {{ apiUrl }}</p>
    </header>

    <main class="app-main">
      <TodoList v-if="isConnected" />
      <div v-else-if="isConnected === false" class="error-message">
        <h2>Unable to connect to backend</h2>
        <p>{{ connectionError }}</p>
        <button @click="checkConnection">Retry Connection</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.app-header {
  text-align: center;
  margin-bottom: 2rem;
}

.app-header h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #646cff 0%, #42d392 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  margin: 1rem auto;
  max-width: fit-content;
}

.connection-status.connected {
  background-color: rgba(66, 211, 146, 0.1);
  color: #42d392;
}

.connection-status.disconnected {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.connection-status.checking {
  background-color: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.connected .status-dot {
  background-color: #42d392;
}

.disconnected .status-dot {
  background-color: #ef4444;
}

.checking .status-dot {
  background-color: #fbbf24;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.api-url {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.5rem;
}

.app-main {
  min-height: 400px;
}

.error-message {
  text-align: center;
  padding: 2rem;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
}

.error-message h2 {
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-message p {
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.error-message button {
  background-color: #ef4444;
  color: white;
  border: none;
}

.error-message button:hover {
  background-color: #dc2626;
}

@media (prefers-color-scheme: light) {
  .api-url {
    color: rgba(0, 0, 0, 0.5);
  }

  .error-message p {
    color: rgba(0, 0, 0, 0.7);
  }
}
</style>

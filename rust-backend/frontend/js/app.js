/**
 * Main Application Logic
 * Handles UI interactions and state management
 */

import CONFIG from './config.js';
import todoAPI, { apiClient, APIError } from './api.js';

/**
 * Application State
 */
const state = {
    todos: [],
    filter: 'all', // 'all' | 'active' | 'completed'
    isConnected: false,
    isLoading: false
};

/**
 * DOM Elements
 */
const elements = {
    todoForm: document.getElementById('todoForm'),
    todoInput: document.getElementById('todoInput'),
    todoList: document.getElementById('todoList'),
    emptyState: document.getElementById('emptyState'),
    errorState: document.getElementById('errorState'),
    loadingState: document.getElementById('loadingState'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    todoCount: document.getElementById('todoCount'),
    clearCompleted: document.getElementById('clearCompleted'),
    filterBtns: document.querySelectorAll('.filter-btn')
};

/**
 * Initialize the application
 */
async function init() {
    setupEventListeners();
    await checkConnection();
    if (state.isConnected) {
        await loadTodos();
        startHealthCheck();
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Form submission
    elements.todoForm.addEventListener('submit', handleAddTodo);

    // Retry button
    elements.retryBtn.addEventListener('click', async () => {
        await checkConnection();
        if (state.isConnected) {
            await loadTodos();
        }
    });

    // Clear completed button
    elements.clearCompleted.addEventListener('click', handleClearCompleted);

    // Filter buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            setFilter(filter);
        });
    });
}

/**
 * Check backend connection
 */
async function checkConnection() {
    updateConnectionStatus('connecting');

    try {
        const health = await apiClient.checkHealth();
        if (health.healthy) {
            state.isConnected = true;
            updateConnectionStatus('connected');
            hideError();
            return true;
        } else {
            throw new Error(health.error || 'Health check failed');
        }
    } catch (error) {
        state.isConnected = false;
        updateConnectionStatus('error');
        showError(error.message || 'Failed to connect to backend');
        return false;
    }
}

/**
 * Update connection status UI
 */
function updateConnectionStatus(status) {
    const statusTexts = {
        connecting: 'Connecting...',
        connected: 'Connected',
        error: 'Disconnected'
    };

    elements.statusText.textContent = statusTexts[status] || 'Unknown';
    elements.statusDot.className = `status-dot ${status === 'connected' ? 'connected' : status === 'error' ? 'error' : ''}`;
}

/**
 * Start periodic health checks
 */
function startHealthCheck() {
    setInterval(async () => {
        await checkConnection();
    }, CONFIG.HEALTH_CHECK_INTERVAL);
}

/**
 * Load todos from API
 */
async function loadTodos() {
    setLoading(true);

    try {
        const todos = await todoAPI.getAll();
        state.todos = todos || [];
        renderTodos();
    } catch (error) {
        console.error('Failed to load todos:', error);
        showError(error.message || 'Failed to load todos');
    } finally {
        setLoading(false);
    }
}

/**
 * Handle add todo
 */
async function handleAddTodo(e) {
    e.preventDefault();

    const title = elements.todoInput.value.trim();
    if (!title) return;

    try {
        const newTodo = await todoAPI.create(title);
        state.todos.unshift(newTodo);
        elements.todoInput.value = '';
        renderTodos();
    } catch (error) {
        console.error('Failed to create todo:', error);
        alert(`Failed to create todo: ${error.message}`);
    }
}

/**
 * Handle toggle todo completion
 */
async function handleToggleTodo(id) {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;

    const previousCompleted = todo.completed;

    // Optimistic update
    todo.completed = !todo.completed;
    renderTodos();

    try {
        await todoAPI.toggleComplete(id, todo.completed);
    } catch (error) {
        console.error('Failed to toggle todo:', error);
        // Rollback on error
        todo.completed = previousCompleted;
        renderTodos();
        alert(`Failed to update todo: ${error.message}`);
    }
}

/**
 * Handle delete todo
 */
async function handleDeleteTodo(id) {
    const index = state.todos.findIndex(t => t.id === id);
    if (index === -1) return;

    const deletedTodo = state.todos[index];

    // Optimistic update
    state.todos.splice(index, 1);
    renderTodos();

    try {
        await todoAPI.delete(id);
    } catch (error) {
        console.error('Failed to delete todo:', error);
        // Rollback on error
        state.todos.splice(index, 0, deletedTodo);
        renderTodos();
        alert(`Failed to delete todo: ${error.message}`);
    }
}

/**
 * Handle clear completed todos
 */
async function handleClearCompleted() {
    const completedIds = state.todos
        .filter(todo => todo.completed)
        .map(todo => todo.id);

    if (completedIds.length === 0) return;

    const confirmDelete = confirm(`Delete ${completedIds.length} completed todo(s)?`);
    if (!confirmDelete) return;

    const previousTodos = [...state.todos];

    // Optimistic update
    state.todos = state.todos.filter(todo => !todo.completed);
    renderTodos();

    try {
        await todoAPI.deleteCompleted(completedIds);
    } catch (error) {
        console.error('Failed to clear completed todos:', error);
        // Rollback on error
        state.todos = previousTodos;
        renderTodos();
        alert(`Failed to clear completed todos: ${error.message}`);
    }
}

/**
 * Set filter
 */
function setFilter(filter) {
    state.filter = filter;

    // Update active filter button
    elements.filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    renderTodos();
}

/**
 * Get filtered todos
 */
function getFilteredTodos() {
    switch (state.filter) {
        case 'active':
            return state.todos.filter(todo => !todo.completed);
        case 'completed':
            return state.todos.filter(todo => todo.completed);
        default:
            return state.todos;
    }
}

/**
 * Render todos
 */
function renderTodos() {
    const filteredTodos = getFilteredTodos();

    // Update counter
    const activeCount = state.todos.filter(todo => !todo.completed).length;
    elements.todoCount.textContent = activeCount;

    // Show/hide clear completed button
    const hasCompleted = state.todos.some(todo => todo.completed);
    elements.clearCompleted.style.opacity = hasCompleted ? '1' : '0.5';
    elements.clearCompleted.style.pointerEvents = hasCompleted ? 'auto' : 'none';

    // Handle empty state
    if (filteredTodos.length === 0) {
        elements.todoList.innerHTML = '';
        elements.emptyState.classList.remove('hidden');
        return;
    }

    elements.emptyState.classList.add('hidden');

    // Render todo items
    elements.todoList.innerHTML = filteredTodos.map(todo => createTodoElement(todo)).join('');

    // Attach event listeners
    filteredTodos.forEach(todo => {
        const todoElement = document.getElementById(`todo-${todo.id}`);
        if (!todoElement) return;

        const checkbox = todoElement.querySelector('.todo-checkbox input');
        const deleteBtn = todoElement.querySelector('.btn-delete');

        checkbox.addEventListener('change', () => handleToggleTodo(todo.id));
        deleteBtn.addEventListener('click', () => handleDeleteTodo(todo.id));
    });
}

/**
 * Create todo element HTML
 */
function createTodoElement(todo) {
    return `
        <div id="todo-${todo.id}" class="todo-item ${todo.completed ? 'completed' : ''}" role="listitem">
            <label class="todo-checkbox">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} aria-label="Mark as ${todo.completed ? 'incomplete' : 'complete'}">
                <span class="checkbox-custom"></span>
            </label>
            <span class="todo-text">${escapeHtml(todo.title)}</span>
            <button class="btn-icon btn-delete" aria-label="Delete todo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"></path>
                </svg>
            </button>
        </div>
    `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show error state
 */
function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorState.classList.remove('hidden');
    elements.todoList.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
}

/**
 * Hide error state
 */
function hideError() {
    elements.errorState.classList.add('hidden');
    elements.todoList.classList.remove('hidden');
}

/**
 * Set loading state
 */
function setLoading(loading) {
    state.isLoading = loading;

    if (loading) {
        elements.loadingState.classList.remove('hidden');
        elements.todoList.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
        elements.errorState.classList.add('hidden');
    } else {
        elements.loadingState.classList.add('hidden');
        elements.todoList.classList.remove('hidden');
    }
}

/**
 * Start the application
 */
document.addEventListener('DOMContentLoaded', init);

// Export for testing or external use
export { state, loadTodos, handleAddTodo, handleToggleTodo, handleDeleteTodo };

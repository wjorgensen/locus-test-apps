/**
 * API Client Module
 * Handles all HTTP communication with the backend API
 */

import CONFIG from './config.js';

/**
 * Custom error class for API errors
 */
class APIError extends Error {
    constructor(message, status, response) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.response = response;
    }
}

/**
 * API Client Class
 */
class APIClient {
    constructor(baseURL = CONFIG.API_BASE_URL) {
        this.baseURL = baseURL;
        this.timeout = CONFIG.REQUEST_TIMEOUT;
    }

    /**
     * Make a fetch request with timeout and error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            clearTimeout(timeoutId);

            // Handle non-OK responses
            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (e) {
                    // If response is not JSON, use default error message
                }
                throw new APIError(errorMessage, response.status, response);
            }

            // Handle empty responses (e.g., 204 No Content)
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return null;
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            // Handle abort/timeout
            if (error.name === 'AbortError') {
                throw new APIError('Request timeout', 408, null);
            }

            // Handle network errors
            if (error instanceof TypeError) {
                throw new APIError('Network error: Unable to connect to server', 0, null);
            }

            // Re-throw API errors
            if (error instanceof APIError) {
                throw error;
            }

            // Handle other errors
            throw new APIError(error.message || 'Unknown error occurred', 0, null);
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * PATCH request
     */
    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Health check
     */
    async checkHealth() {
        try {
            await this.get(CONFIG.ENDPOINTS.HEALTH);
            return { healthy: true };
        } catch (error) {
            return {
                healthy: false,
                error: error.message
            };
        }
    }
}

/**
 * Todo API Service
 */
class TodoAPI {
    constructor(client) {
        this.client = client;
    }

    /**
     * Get all todos
     */
    async getAll() {
        return this.client.get(CONFIG.ENDPOINTS.TODOS);
    }

    /**
     * Get a single todo by ID
     */
    async getById(id) {
        return this.client.get(`${CONFIG.ENDPOINTS.TODOS}/${id}`);
    }

    /**
     * Create a new todo
     */
    async create(title) {
        return this.client.post(CONFIG.ENDPOINTS.TODOS, { title });
    }

    /**
     * Update a todo
     */
    async update(id, data) {
        return this.client.put(`${CONFIG.ENDPOINTS.TODOS}/${id}`, data);
    }

    /**
     * Toggle todo completion status
     */
    async toggleComplete(id, completed) {
        return this.client.patch(`${CONFIG.ENDPOINTS.TODOS}/${id}`, { completed });
    }

    /**
     * Delete a todo
     */
    async delete(id) {
        return this.client.delete(`${CONFIG.ENDPOINTS.TODOS}/${id}`);
    }

    /**
     * Delete all completed todos
     */
    async deleteCompleted(completedIds) {
        const deletePromises = completedIds.map(id => this.delete(id));
        return Promise.all(deletePromises);
    }
}

// Create singleton instances
const apiClient = new APIClient();
const todoAPI = new TodoAPI(apiClient);

// Export instances and classes
export { apiClient, todoAPI, APIClient, TodoAPI, APIError };
export default todoAPI;

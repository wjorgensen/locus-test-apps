/**
 * Application Configuration
 *
 * Configuration can be overridden by setting window.CONFIG before loading this script.
 * For example:
 *
 * <script>
 *   window.CONFIG = {
 *     API_BASE_URL: 'https://api.example.com'
 *   };
 * </script>
 */

const defaultConfig = {
    // API base URL - default to localhost, override in production
    API_BASE_URL: 'http://localhost:8080',

    // API endpoints
    ENDPOINTS: {
        TODOS: '/todos',
        HEALTH: '/health'
    },

    // Request settings
    REQUEST_TIMEOUT: 10000, // 10 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second

    // UI settings
    DEBOUNCE_DELAY: 300, // milliseconds
    TOAST_DURATION: 3000, // 3 seconds

    // Health check interval (milliseconds)
    HEALTH_CHECK_INTERVAL: 30000 // 30 seconds
};

// Merge with any pre-existing CONFIG
window.CONFIG = {
    ...defaultConfig,
    ...(window.CONFIG || {})
};

// Freeze the config to prevent accidental modifications
Object.freeze(window.CONFIG);
Object.freeze(window.CONFIG.ENDPOINTS);

// Export for module usage
export default window.CONFIG;

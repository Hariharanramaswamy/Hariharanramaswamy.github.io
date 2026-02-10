/**
 * config.js
 * Centralized Service Configuration
 */

(function () {
    const hostname = window.location.hostname;

    // Default to production relative path
    let apiBase = '/api';

    // Local Development Override
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        apiBase = 'http://localhost:8080/api';
    }

    // Freeze configuration to prevent tampering
    Object.defineProperty(window, 'API_BASE', {
        value: apiBase,
        writable: false,
        configurable: false
    });

    console.log(`[Config] API Base URL set to: ${window.API_BASE}`);
})();

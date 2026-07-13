// ============================================================
// ByteLens — Structured Logger Utility
// Provides timestamped, prefixed log output for all modules
// ============================================================

/**
 * Creates a logger instance with a module prefix.
 * @param {string} moduleName - Name of the module (e.g., 'Bot', 'API', 'Webhook')
 * @returns {object} Logger with info, warn, error, success, debug methods
 */
function createLogger(moduleName) {
    const prefix = `[${moduleName}]`;

    function timestamp() {
        return new Date().toISOString();
    }

    return {
        info: (...args) => console.log(`${timestamp()} ℹ️  ${prefix}`, ...args),
        warn: (...args) => console.warn(`${timestamp()} ⚠️  ${prefix}`, ...args),
        error: (...args) => console.error(`${timestamp()} ❌ ${prefix}`, ...args),
        success: (...args) => console.log(`${timestamp()} ✅ ${prefix}`, ...args),
        debug: (...args) => {
            if (process.env.DEBUG === 'true') {
                console.log(`${timestamp()} 🐛 ${prefix}`, ...args);
            }
        },
    };
}

module.exports = { createLogger };

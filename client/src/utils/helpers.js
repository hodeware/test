// Helper utilities for the application

const Helpers = {
    /**
     * Trigger a click event on an element
     * @param {HTMLElement} element - The element to click
     */
    click: function(element) {
        if (element && typeof element.click === 'function') {
            element.click();
        }
    },

    /**
     * Create a deep copy of an object
     * @param {Object} obj - The object to copy
     * @returns {Object} The copied object
     */
    deepCopy: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Debounce a function call
     * @param {Function} func - The function to debounce
     * @param {number} wait - The wait time in milliseconds
     * @returns {Function} The debounced function
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Format file size to human readable format
     * @param {number} bytes - The size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Generate a unique ID
     * @returns {string} A unique ID
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Check if a value is empty
     * @param {*} value - The value to check
     * @returns {boolean} True if empty
     */
    isEmpty: function(value) {
        return value === null ||
               value === undefined ||
               value === '' ||
               (Array.isArray(value) && value.length === 0) ||
               (typeof value === 'object' && Object.keys(value).length === 0);
    },

    /**
     * Escape HTML special characters
     * @param {string} text - The text to escape
     * @returns {string} Escaped text
     */
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
};

export default Helpers;

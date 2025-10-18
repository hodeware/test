/**
 * Toast notification utility
 * Shows temporary notifications at the top-right of the screen
 */

let toastContainer = null;

function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = ensureToastContainer();

  const toast = document.createElement('div');
  toast.className = `transform transition-all duration-300 ease-in-out translate-x-0 opacity-100
    max-w-md bg-white rounded-lg shadow-lg border-l-4 p-4 flex items-start gap-3`;

  // Set border color based on type
  const colors = {
    success: 'border-green-500',
    error: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-blue-500'
  };
  toast.classList.add(colors[type] || colors.info);

  // Icon based on type
  const icons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
  };
  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  toast.innerHTML = `
    <span class="material-icons ${iconColors[type] || iconColors.info}" style="font-size: 24px;">
      ${icons[type] || icons.info}
    </span>
    <div class="flex-1">
      <p class="text-gray-900 font-medium">${message}</p>
    </div>
    <button class="text-gray-400 hover:text-gray-600 transition-colors" onclick="this.parentElement.remove()">
      <span class="material-icons" style="font-size: 20px;">close</span>
    </button>
  `;

  // Animate in
  toast.style.transform = 'translateX(400px)';
  toast.style.opacity = '0';

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });

  // Auto dismiss
  if (duration > 0) {
    setTimeout(() => {
      toast.style.transform = 'translateX(400px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
}

export default { showToast };

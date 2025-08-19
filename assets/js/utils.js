/*
  Utilidades y helpers para la aplicación
*/

// Validación de archivos CSV
function validateCSVFile(file) {
  const config = window.APP_CONFIG?.DATA || {};
  const maxSize = config.MAX_FILE_SIZE || 50 * 1024 * 1024;
  const supportedFormats = config.SUPPORTED_FORMATS || ['.csv'];
  
  if (file.size > maxSize) {
    return { valid: false, error: `El archivo es muy grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB` };
  }
  
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!supportedFormats.includes(extension)) {
    return { valid: false, error: `Formato no soportado. Use: ${supportedFormats.join(', ')}` };
  }
  
  return { valid: true };
}

// Formateo de números con unidades
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Formateo de fechas
function formatDate(date, locale = 'es-CO') {
  if (!date) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  } catch (e) {
    return '—';
  }
}

// Debounce mejorado
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle para scroll events
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// LocalStorage con fallback
const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Error removing from localStorage:', e);
      return false;
    }
  }
};

// Detección de características del navegador
const browserSupport = {
  webGL: (() => {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  })(),
  
  localStorage: (() => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  })(),
  
  intersectionObserver: 'IntersectionObserver' in window,
  
  fetch: 'fetch' in window
};

// Notificaciones del sistema
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
  
  const colors = {
    info: 'bg-blue-500 text-white',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-black',
    error: 'bg-red-500 text-white'
  };
  
  notification.className += ` ${colors[type] || colors.info}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => notification.classList.remove('translate-x-full'), 100);
  
  // Auto-remover
  setTimeout(() => {
    notification.classList.add('translate-x-full');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// Exportar utilidades globalmente
window.IAUtils = {
  validateCSVFile,
  formatBytes,
  formatDate,
  debounce,
  throttle,
  storage,
  browserSupport,
  showNotification
};

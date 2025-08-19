/*
  Configuración global de la aplicación
*/

window.APP_CONFIG = {
  // Configuración de la tabla
  TABLE: {
    PAGE_SIZE: 10,
    SEARCH_DEBOUNCE: 300,
    MAX_PAGES_SHOWN: 5
  },
  
  // Configuración de los gráficos
  CHARTS: {
    RENDER_DELAY: 200, // ms entre cada gráfico
    DEFAULT_HEIGHT: 360,
    COLORS: {
      PRIMARY: '#2563EB',
      SECONDARY: '#0EA5E9',
      ACCENT: '#22C55E',
      SUCCESS: '#22C55E',
      WARNING: '#f59e0b',
      INFO: '#60a5fa'
    }
  },
  
  // Configuración de animaciones
  ANIMATIONS: {
    COUNTER_DURATION: 900,
    RIPPLE_DURATION: 450,
    CARD_HOVER_DELAY: 200
  },
  
  // Configuración de datos
  DATA: {
    CSV_PATH: 'assets/data/googleplaystore.csv',
    SUPPORTED_FORMATS: ['.csv'],
    MAX_FILE_SIZE: 50 * 1024 * 1024 // 50MB
  },
  
  // Configuración de UI
  UI: {
    THEME_KEY: 'ia-theme',
    SCROLL_THRESHOLD: 400,
    MOBILE_BREAKPOINT: 768
  },
  
  // Mensajes de error
  MESSAGES: {
    CSV_LOAD_ERROR: 'No se pudo cargar el CSV',
    CSV_PARSE_ERROR: 'No fue posible leer el CSV subido',
    NO_DATA: 'Sin datos válidos',
    PROCESSING_ERROR: 'Error al procesar datos',
    NO_PAID_APPS: 'No hay apps de pago',
    NO_VALID_DATES: 'Sin fechas válidas'
  }
};

// Configuración de Plotly
window.PLOTLY_CONFIG = {
  displaylogo: false,
  responsive: true,
  toImageButtonOptions: {
    format: 'png',
    filename: 'chart',
    width: 1280,
    height: 720
  },
  modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
  modeBarButtonsToAdd: [{
    name: 'Descargar PNG',
    icon: Plotly.Icons.download,
    click: function(gd) {
      Plotly.downloadImage(gd, {
        format: 'png',
        filename: gd.layout.title?.text?.toLowerCase().replace(/\s+/g, '_') || 'chart',
        width: 1280,
        height: 720
      });
    }
  }]
};

// Configuración de Tailwind (si se usa)
if (window.tailwind) {
  window.tailwind.config = {
    theme: {
      extend: {
        colors: {
          primary: '#2563EB',
          secondary: '#0EA5E9',
          accent: '#22C55E',
          bgdark: '#0B1220',
          bgsoft: '#0F172A',
          textmain: '#E5E7EB'
        },
        borderRadius: {
          '2xl': '1rem',
          '3xl': '1.5rem'
        },
        boxShadow: {
          'soft': '0 10px 25px rgba(0,0,0,0.25)'
        },
        animation: {
          'spin': 'spin 1s linear infinite',
          'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }
      }
    }
  };
}

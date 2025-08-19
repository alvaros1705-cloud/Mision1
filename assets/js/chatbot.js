/*
  Chatbot IA para Proyecto Misión 1
  Responde preguntas sobre depuración de datos, creación de página web, análisis de base de datos y metodología
*/

class ProyectoMision1Chatbot {
  constructor() {
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.setupEventListeners();
  }

  initializeKnowledgeBase() {
    return {
      // Base de conocimiento sobre depuración de datos
      dataCleaning: {
        keywords: ['depuración', 'limpieza', 'datos', 'csv', 'limpiar', 'procesar', 'filtrar', 'duplicados', 'nulos', 'outliers'],
        responses: [
          {
            question: '¿Cómo se hizo la depuración de los datos?',
            answer: `La depuración de datos siguió esta metodología sistemática:

1. **Importación y Exploración**: Se cargó el CSV usando PapaParse y se exploró la estructura inicial
2. **Limpieza de Columnas**:
   - Installs: Se removieron símbolos "+" y "," y se convirtió a números
   - Price: Se eliminó el símbolo "$" y se normalizó a USD
   - Rating: Se validó que esté entre 0-5 y se manejaron valores NaN
   - Size: Se normalizó a MB (k → 0.001MB, M → 1MB)
   - Android Ver: Se extrajo la versión principal (ej: "4.1 and up" → 4.1)
3. **Eliminación de Duplicados**: Se removieron apps duplicadas por App + Category
4. **Filtrado de Datos Críticos**: Se eliminaron filas sin App o Category
5. **Manejo de Valores Faltantes**: Se procesaron campos como "Varies with device" → null`
          },
          {
            question: '¿Qué herramientas se usaron para la limpieza?',
            answer: `Para la limpieza de datos se utilizaron:

• **PapaParse**: Librería JavaScript para parsing de CSV
• **Funciones personalizadas**: parseInstalls(), parsePrice(), parseRating(), parseSizeMB()
• **Filtros lógicos**: deduplicateBy(), groupBy(), sumBy(), meanBy()
• **Validación**: clamp() para rangos, isNaN() para valores numéricos
• **Transformación**: conversión de formatos, normalización de unidades`
          }
        ]
      },

      // Base de conocimiento sobre creación de la página web
      webDevelopment: {
        keywords: ['página', 'web', 'sitio', 'desarrollo', 'html', 'css', 'javascript', 'plotly', 'responsive', 'diseño', 'frontend'],
        responses: [
          {
            question: '¿Cómo se creó la página web?',
            answer: `La página web se desarrolló siguiendo estas etapas:

1. **Arquitectura Frontend**:
   - HTML5 semántico con estructura modular
   - CSS3 con variables CSS para tema consistente
   - JavaScript vanilla (sin frameworks) para funcionalidad
   - Enfoque mobile-first con responsive design

2. **Tecnologías Utilizadas**:
   - Plotly.js para gráficos interactivos
   - Tailwind CSS (via CDN) para utilidades
   - PapaParse para procesamiento de CSV
   - Lottie para animaciones del hero

3. **Características Principales**:
   - 8 gráficos interactivos con Plotly
   - Sistema de KPIs con contadores animados
   - Tabla con búsqueda y paginación
   - Tema claro/oscuro con persistencia
   - Navegación sticky con scrollspy`
          },
          {
            question: '¿Qué librerías se usaron?',
            answer: `Las librerías principales utilizadas son:

• **Plotly.js 2.30.0**: Gráficos interactivos y exportación PNG
• **PapaParse 5.4.1**: Parsing y procesamiento de CSV
• **Lottie 5.12.2**: Animaciones vectoriales del hero
• **Tailwind CSS**: Framework de utilidades CSS (via CDN)
• **Fonts**: Inter de Google Fonts para tipografía

Todas las librerías se cargan via CDN con atributo defer para optimizar el rendimiento.`
          }
        ]
      },

      // Base de conocimiento sobre análisis de base de datos
      dataAnalysis: {
        keywords: ['análisis', 'gráficos', 'kpis', 'estadísticas', 'insights', 'visualización', 'datos', 'chart', 'dashboard'],
        responses: [
          {
            question: '¿Qué gráficos se crearon?',
            answer: `Se desarrollaron 8 gráficos interactivos principales:

1. **Top 10 Categorías por Descargas**: Barras horizontales con total de instalaciones
2. **Descargas por Content Rating**: Distribución por grupos de edad
3. **Categorías Más Costosas**: Análisis de apps de pago por categoría
4. **Relación Descargas vs Reseñas**: Scatter plot con correlación y tendencia
5. **Apps por Categoría**: Conteo de aplicaciones por categoría
6. **Actualizaciones por Año**: Línea temporal de actualizaciones
7. **Requerimientos Android**: Distribución de versiones mínimas
8. **Installs por Rango de Precio**: Análisis de monetización

Cada gráfico incluye tooltips personalizados, botones de descarga PNG y insights automáticos.`
          },
          {
            question: '¿Qué KPIs se calcularon?',
            answer: `Los KPIs principales calculados son:

• **Total de Apps**: Conteo total de aplicaciones únicas
• **Rating Promedio**: Calificación media de todas las apps
• **Instalaciones Totales**: Suma de todas las descargas
• **% Apps de Pago**: Proporción de aplicaciones monetizadas
• **Categorías Únicas**: Número de categorías diferentes
• **Año con Más Actualizaciones**: Período de mayor actividad

Los KPIs se calculan en tiempo real y se muestran con contadores animados para mejor UX.`
          }
        ]
      },

      // Base de conocimiento sobre metodología del proyecto
      projectMethodology: {
        keywords: ['metodología', 'proyecto', 'método', 'proceso', 'enfoque', 'estrategia', 'plan', 'fases', 'etapas'],
        responses: [
          {
            question: '¿Cuál fue la metodología del proyecto?',
            answer: `La metodología del proyecto siguió este flujo sistemático:

**Fase 1: Preparación**
- Importar librerías necesarias (Plotly, PapaParse, Lottie)
- Configurar entorno de desarrollo

**Fase 2: Carga y Exploración**
- Cargar dataset CSV de Google Play Store
- Explorar estructura y contenido inicial
- Identificar columnas y tipos de datos

**Fase 3: Limpieza y Preprocesamiento**
- Revisar valores nulos y faltantes
- Eliminar duplicados por App + Category
- Corregir inconsistencias de formato
- Detectar y manejar outliers
- Normalizar unidades (MB, USD, versiones)

**Fase 4: Análisis y Visualización**
- Calcular KPIs y estadísticas
- Generar 8 gráficos interactivos
- Crear insights automáticos
- Implementar funcionalidades de exportación

**Fase 5: Desarrollo Web**
- Crear interfaz responsive
- Implementar tema claro/oscuro
- Añadir funcionalidades interactivas
- Optimizar rendimiento y accesibilidad`
          },
          {
            question: '¿Qué tecnologías se eligieron y por qué?',
            answer: `La selección de tecnologías se basó en estos criterios:

**Frontend Vanilla (HTML/CSS/JS)**:
• Sin dependencias de build tools
• Fácil despliegue y mantenimiento
• Compatibilidad universal de navegadores

**Plotly.js para Gráficos**:
• Librería JavaScript pura (no requiere Python)
• Gráficos interactivos profesionales
• Exportación nativa a PNG
• API simple y documentada

**PapaParse para CSV**:
• Parsing robusto de archivos CSV
• Manejo de encoding y caracteres especiales
• Funciona en navegador sin backend

**Tailwind CSS**:
• Sistema de utilidades para desarrollo rápido
• Responsive design integrado
• Tema consistente y mantenible

**Lottie para Animaciones**:
• Animaciones vectoriales ligeras
• Mejora la experiencia del usuario
• Archivos JSON pequeños y escalables`
          }
        ]
      },

      // Base de conocimiento sobre funcionalidades específicas
      features: {
        keywords: ['funcionalidad', 'característica', 'feature', 'búsqueda', 'filtros', 'exportar', 'descargar', 'tema', 'responsive'],
        responses: [
          {
            question: '¿Qué funcionalidades tiene la página?',
            answer: `La página incluye estas funcionalidades principales:

**Gestión de Datos**:
• Carga automática de CSV desde assets/data/
• Upload manual de archivos CSV
• Exportación de datos filtrados
• Búsqueda en tiempo real con debounce

**Visualización Interactiva**:
• 8 gráficos con Plotly.js
• Descarga de gráficos como PNG
• KPIs con contadores animados
• Tabla con paginación y filtros

**Experiencia de Usuario**:
• Tema claro/oscuro con persistencia
• Navegación sticky con scrollspy
• Tabs responsive para móviles
• Botón "Volver arriba" flotante
• Animaciones y microinteracciones

**Accesibilidad**:
• Navegación por teclado
• ARIA labels y roles
• Contraste WCAG AA
• Responsive design mobile-first`
          }
        ]
      }
    };
  }

  setupEventListeners() {
    const chatToggle = document.getElementById('chatToggle');
    const chatInterface = document.getElementById('chatInterface');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    if (chatToggle) {
      chatToggle.addEventListener('click', () => {
        chatInterface.classList.toggle('chat-hidden');
        if (!chatInterface.classList.contains('chat-hidden')) {
          chatInput.focus();
        }
      });
    }

    if (chatClose) {
      chatClose.addEventListener('click', () => {
        chatInterface.classList.add('chat-hidden');
      });
    }

    if (chatSend) {
      chatSend.addEventListener('click', () => this.handleUserMessage());
    }

    if (chatInput) {
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleUserMessage();
        }
      });
    }
  }

  handleUserMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Agregar mensaje del usuario
    this.addMessage(message, 'user');
    input.value = '';

    // Deshabilitar botón mientras procesa
    const sendBtn = document.getElementById('chatSend');
    sendBtn.disabled = true;

    // Simular procesamiento
    setTimeout(() => {
      const response = this.generateResponse(message);
      this.addMessage(response, 'bot');
      sendBtn.disabled = false;
    }, 500);
  }

  addMessage(content, type) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content;
    
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll al final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  generateResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Buscar en la base de conocimiento
    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      if (this.messageMatchesCategory(message, data.keywords)) {
        return this.getBestResponse(message, data.responses);
      }
    }

    // Respuesta por defecto
    return this.getDefaultResponse(message);
  }

  messageMatchesCategory(message, keywords) {
    return keywords.some(keyword => message.includes(keyword));
  }

  getBestResponse(message, responses) {
    // Buscar la respuesta más relevante
    for (const response of responses) {
      if (message.includes(response.question.toLowerCase().replace(/[¿?]/g, ''))) {
        return response.answer;
      }
    }
    
    // Si no hay match exacto, devolver la primera respuesta
    return responses[0].answer;
  }

  getDefaultResponse(message) {
    // Respuestas inteligentes por defecto
    if (message.includes('hola') || message.includes('hello')) {
      return '¡Hola! Soy tu asistente IA para el proyecto de Google Play Store. ¿En qué puedo ayudarte?';
    }
    
    if (message.includes('gracias') || message.includes('thanks')) {
      return '¡De nada! Estoy aquí para ayudarte con cualquier pregunta sobre el proyecto.';
    }
    
    if (message.includes('ayuda') || message.includes('help')) {
      return `Puedo ayudarte con:
• 📊 Depuración y limpieza de datos
• 🌐 Desarrollo de la página web
• 📈 Análisis de gráficos y KPIs
• 📋 Metodología del proyecto

¿Sobre qué tema tienes dudas?`;
    }

    return `Entiendo tu pregunta sobre "${message}". Te sugiero que me preguntes específicamente sobre:
• La depuración de datos del CSV
• La creación de la página web
• Los gráficos y análisis
• La metodología del proyecto

¿Podrías reformular tu pregunta de manera más específica?`;
  }
}

// Inicializar chatbot cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new ProyectoMision1Chatbot();
});

# Insight Apps | Talento Tech IA (Misión I)

Proyecto web estático para analizar el dataset de Google Play (googleplaystore.csv) con limpieza en el cliente y 8 gráficos interactivos con Plotly.

## Estructura

- `index.html`
- `assets/css/styles.css`
- `assets/js/app.js`
- `assets/js/charts.js`
- `assets/data/googleplaystore.csv` (puedes reemplazarlo por el tuyo)
- `assets/img/` (favicon y avatars)
- `assets/lottie/ai.json`

## Requisitos y stack

- HTML5/CSS3/JS puro.
- PapaParse (CDN) para leer CSV en cliente.
- Plotly.js (CDN) para gráficos.
- Tailwind CSS (CDN) opcional para utilidades responsive.
- Sin backend. Abrir `index.html` con doble clic.

## Uso

1. Abre `index.html` en el navegador (doble clic). No requiere servidor.
2. Cambia el archivo `assets/data/googleplaystore.csv` por el tuyo si deseas.
3. Los KPIs y gráficos se recalculan automáticamente.

## CSV esperado (columnas)

`App, Category, Rating, Reviews, Size, Installs, Type, Price, Content Rating, Genres, Last Updated, Android Ver, Current Ver`

## Funcionalidades

- Carga y limpieza de datos en el cliente (normaliza `Installs`, `Price`, `Reviews`, `Rating`, `Size`→MB, `Android Ver`, `Last Updated`→año y elimina duplicados App+Category).
- Tabla previa (10 filas) con búsqueda y paginación.
- KPIs con contadores animados.
- 8 gráficos interactivos (Plotly) con botón de descarga PNG.
- Modo oscuro por defecto con toggle persistente.
- Accesibilidad básica (focus visible, aria-labels, contraste AA).

## Variante React+Vite (opcional)

Si deseas una variante con React+Vite, crea una carpeta aparte y monta los mismos módulos de limpieza; esta versión está lista para usarse sin servidor.

## Créditos

MISIÓN I — Bootcamp IA Talento Tech Oriente, Cúcuta 2025.

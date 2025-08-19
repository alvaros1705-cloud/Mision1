/*
  App core: carga CSV (PapaParse), limpieza, KPIs, tabla, UI (tema, navbar, tabs, scrollspy, ripple) y helpers reutilizables.
*/

// ----------------------------- Config -----------------------------
const DATA_PATH = 'assets/data/googleplaystore.csv';
const STATE = {
  rawRows: [],
  cleanRows: [],
  filteredRows: [],
  table: { page: 1, pageSize: 10, query: '' },
  charts: {},
};

// ----------------------------- Utils -----------------------------
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-CO').format(Math.round(n));
}

function formatPrice(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return 'USD 0';
  return `USD ${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(n)}`;
}

function groupBy(array, keyFn) {
  const map = new Map();
  for (const item of array) {
    const key = keyFn(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item); else map.set(key, [item]);
  }
  return map;
}

function sumBy(array, valFn) {
  let acc = 0;
  for (const item of array) acc += Number(valFn(item)) || 0;
  return acc;
}

function meanBy(array, valFn) {
  const vals = array.map(valFn).filter(v => Number.isFinite(v));
  if (!vals.length) return NaN;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function medianBy(array, valFn) {
  const vals = array.map(valFn).filter(v => Number.isFinite(v)).sort((a, b) => a - b);
  if (!vals.length) return NaN;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

function countBy(array, keyFn) {
  const counts = new Map();
  for (const item of array) {
    const k = keyFn(item);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return counts;
}

// Debounce helper para búsqueda
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ----------------------------- Parsing helpers -----------------------------
function parseInstalls(v) {
  if (typeof v !== 'string') return Number(v) || 0;
  return Number(v.replace(/[+,]/g, '')) || 0;
}

function parsePrice(v) {
  if (typeof v !== 'string') return Number(v) || 0;
  return Number(v.replace(/[$]/g, '')) || 0;
}

function parseReviews(v) {
  return Number(v) || 0;
}

function parseRating(v) {
  const n = Number(v);
  return Number.isFinite(n) ? clamp(n, 0, 5) : NaN;
}

function parseSizeMB(v) {
  if (!v || typeof v !== 'string') return null;
  const s = v.trim();
  if (!s || /varies/i.test(s)) return null;
  if (s.endsWith('k') || s.endsWith('K')) {
    const n = Number(s.slice(0, -1));
    return Number.isFinite(n) ? n / 1000 : null;
  }
  if (s.endsWith('M') || s.endsWith('m')) {
    const n = Number(s.slice(0, -1));
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseAndroidVer(v) {
  if (!v) return null;
  const m = String(v).match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function parseLastUpdatedYear(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.getFullYear() : null;
}

function deduplicateBy(rows, keyFns) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const key = keyFns.map(fn => String(fn(r)).toLowerCase()).join('||');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

// ----------------------------- KPI card factory -----------------------------
function createCardKPI(title, value, icon) {
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs text-white/60">${title}</p>
        <p class="mt-1 text-2xl font-extrabold" data-counter>${value}</p>
      </div>
      <div class="text-2xl" aria-hidden="true">${icon || '📊'}</div>
    </div>
  `;
  return el;
}

// Animated counters
function animateCounter(el, toValue, duration = 900) {
  const start = performance.now();
  const from = 0;
  function frame(t) {
    const p = clamp((t - start) / duration, 0, 1);
    const val = from + (toValue - from) * p;
    el.textContent = formatNumber(val);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ----------------------------- Plot helpers -----------------------------
function createChart(containerId, plotlyData, layout = {}, config = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const statusEl = el.querySelector('.chart-status');
  if (statusEl) statusEl.remove();
  const baseLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: getComputedStyle(document.body).color },
    margin: { t: 48, r: 24, b: 48, l: 56 },
  };
  const baseConfig = { displaylogo: false, responsive: true, toImageButtonOptions: { format: 'png', filename: containerId } };
  return Plotly.newPlot(el, plotlyData, { ...baseLayout, ...layout }, { ...baseConfig, ...config }).then(() => {
    STATE.charts[containerId] = el;
  });
}

function downloadChartAsPng(containerId, filename) {
  const el = STATE.charts[containerId] || document.getElementById(containerId);
  if (!el) return;
  Plotly.downloadImage(el, { format: 'png', filename: filename || containerId, width: 1280, height: 720 });
}

// ----------------------------- UI: theme, ripple, nav, tabs, back-to-top -----------------------------
function setupTheme() {
  const key = 'ia-theme';
  const saved = localStorage.getItem(key);
  const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  const isLight = saved ? saved === 'light' : prefersLight === true ? false : false;
  document.body.classList.toggle('light', isLight);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const next = document.body.classList.toggle('light');
      localStorage.setItem(key, next ? 'light' : 'dark');
    });
  }
}

function setupRipple() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('.btn');
    if (!target) return;
    const circle = document.createElement('span');
    const diameter = Math.max(target.clientWidth, target.clientHeight);
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - target.getBoundingClientRect().left - diameter / 2}px`;
    circle.style.top = `${e.clientY - target.getBoundingClientRect().top - diameter / 2}px`;
    circle.className = 'ripple';
    target.appendChild(circle);
    setTimeout(() => circle.remove(), 450);
  });
}

function setupNavbar() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('hidden'));
  }

  const links = Array.from(document.querySelectorAll('#scrollspy a.nav-link'));
  const sectionIds = links.map(a => a.getAttribute('href')).filter(Boolean).map(h => h.replace('#', ''));
  const sectionMap = new Map(sectionIds.map(id => [id, document.getElementById(id)]));

  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
      }
    }
  }, { rootMargin: '-50% 0px -50% 0px', threshold: [0, 1] });

  for (const [id, el] of sectionMap) if (el) io.observe(el);
}

function setupTabsMobile() {
  const buttons = document.querySelectorAll('.tab-btn');
  if (!buttons.length) return;
  buttons.forEach(btn => btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const targetSel = btn.getAttribute('data-target');
    const sections = ['#dataset', '#kpis', '#graficos'];
    sections.forEach(sel => {
      const sec = document.querySelector(sel);
      if (!sec) return;
      sec.style.display = (sel === targetSel) ? '' : 'none';
    });
  }));
}

function setupBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 400);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function setupDownloadButtons() {
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      btn.textContent = '⬇ Descargando...';
      btn.disabled = true;
      downloadChartAsPng(target, target);
      setTimeout(() => {
        btn.textContent = '⬇ PNG';
        btn.disabled = false;
      }, 2000);
    });
  });
}

// ----------------------------- Table (preview) -----------------------------
function applySearchFilter() {
  const q = STATE.table.query.trim().toLowerCase();
  const rows = STATE.cleanRows;
  if (!q) {
    STATE.filteredRows = rows;
  } else {
    STATE.filteredRows = rows.filter(r => (
      (r.App || '').toLowerCase().includes(q) ||
      (r.Category || '').toLowerCase().includes(q) ||
      String(r.Type || '').toLowerCase().includes(q)
    ));
  }
  STATE.table.page = 1;
}

function renderTable() {
  const body = document.getElementById('tableBody');
  const pageInfo = document.getElementById('pageInfo');
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  if (!body) return;
  const start = (STATE.table.page - 1) * STATE.table.pageSize;
  const pageRows = STATE.filteredRows.slice(start, start + STATE.table.pageSize);
  const totalPages = Math.max(1, Math.ceil(STATE.filteredRows.length / STATE.table.pageSize));

  if (!pageRows.length) {
    body.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-white/60">Sin datos válidos</td></tr>`;
  } else {
    body.innerHTML = pageRows.map(r => `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="px-3 py-2 whitespace-nowrap">${r.App || ''}</td>
        <td class="px-3 py-2 whitespace-nowrap">${r.Category || ''}</td>
        <td class="px-3 py-2">${Number.isFinite(r.Rating) ? r.Rating.toFixed(2) : '—'}</td>
        <td class="px-3 py-2">${formatNumber(r.Installs)}</td>
        <td class="px-3 py-2">${r.Type || ''}</td>
        <td class="px-3 py-2">${r.Type === 'Paid' ? formatPrice(r.Price) : 'Gratis'}</td>
      </tr>
    `).join('');
  }
  
  // Actualizar info de página y estado de botones
  if (pageInfo) pageInfo.textContent = `Página ${STATE.table.page} de ${totalPages}`;
  if (prev) prev.disabled = STATE.table.page <= 1;
  if (next) next.disabled = STATE.table.page >= totalPages;
  
  // Añadir clases visuales para botones deshabilitados
  if (prev) prev.classList.toggle('opacity-50', STATE.table.page <= 1);
  if (next) next.classList.toggle('opacity-50', STATE.table.page >= totalPages);
}

function setupTableControls() {
  const search = document.getElementById('tableSearch');
  const prev = document.getElementById('prevPage');
  const next = document.getElementById('nextPage');
  if (search) {
    search.addEventListener('input', debounce(() => { 
      STATE.table.query = search.value; 
      applySearchFilter(); 
      renderTable(); 
    }, 300));
  }
  if (prev) prev.addEventListener('click', () => { STATE.table.page = Math.max(1, STATE.table.page - 1); renderTable(); });
  if (next) next.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(STATE.filteredRows.length / STATE.table.pageSize));
    STATE.table.page = Math.min(totalPages, STATE.table.page + 1);
    renderTable();
  });
}

// ----------------------------- Data cleaning pipeline -----------------------------
function cleanRows(raw) {
  const rows = raw.map(r => ({
    App: r['App']?.trim() || '',
    Category: r['Category']?.trim() || '',
    Rating: parseRating(r['Rating']),
    Reviews: parseReviews(r['Reviews']),
    SizeMB: parseSizeMB(r['Size']),
    Installs: parseInstalls(r['Installs']),
    Type: (r['Type'] || '').trim(),
    Price: parsePrice(r['Price']),
    ContentRating: (r['Content Rating'] || '').trim(),
    Genres: (r['Genres'] || '').trim(),
    LastUpdated: r['Last Updated'] ? new Date(r['Last Updated']) : null,
    UpdateYear: parseLastUpdatedYear(r['Last Updated']),
    AndroidVer: parseAndroidVer(r['Android Ver']),
    CurrentVer: (r['Current Ver'] || '').trim(),
  })).filter(r => r.App && r.Category); // filtrar vacíos críticos

  // Filtrar filas con datos obviamente incorrectos (como la fila "1.9" del dataset original)
  const cleanRows = rows.filter(r => {
    // Filtrar categorías que son números (errores de datos)
    if (!isNaN(Number(r.Category)) && r.Category !== '') return false;
    
    // Filtrar ratings fuera del rango válido (1-5)
    if (r.Rating && (r.Rating < 1 || r.Rating > 5)) return false;
    
    // Filtrar apps con nombres muy cortos o sospechosos
    if (r.App.length < 2) return false;
    
    return true;
  });

  // Eliminar duplicados basándose en App y Category
  const dedup = deduplicateBy(cleanRows, [r => r.App, r => r.Category]);
  
  console.log(`Datos originales: ${raw.length} filas`);
  console.log(`Después de limpieza básica: ${rows.length} filas`);
  console.log(`Después de filtrado de errores: ${cleanRows.length} filas`);
  console.log(`Después de eliminación de duplicados: ${dedup.length} filas`);
  
  return dedup;
}

// ----------------------------- KPIs -----------------------------
function computeAndRenderKPIs(rows) {
  const container = document.getElementById('kpiCards');
  if (!container) return;
  container.innerHTML = '';
  
  // KPIs principales más relevantes para Google Play Store
  const totalApps = rows.length;
  const totalInstalls = sumBy(rows, r => r.Installs);
  const totalReviews = sumBy(rows, r => r.Reviews);
  
  // Rating promedio (solo apps con rating válido)
  const appsWithRating = rows.filter(r => Number.isFinite(r.Rating) && r.Rating > 0);
  const meanRating = meanBy(appsWithRating, r => r.Rating);
  
  // Apps de pago vs gratuitas
  const paidApps = rows.filter(r => r.Type === 'Paid');
  const freeApps = rows.filter(r => r.Type !== 'Paid');
  const paidPercentage = totalApps ? (paidApps.length / totalApps) * 100 : 0;
  
  // Categorías únicas
  const uniqueCategories = new Set(rows.map(r => r.Category)).size;
  
  // Apps con mayor número de instalaciones
  const topInstalls = rows.sort((a, b) => (b.Installs || 0) - (a.Installs || 0)).slice(0, 1)[0];
  const topAppName = topInstalls ? topInstalls.App : 'N/A';
  
  // Apps con mayor rating
  const topRating = appsWithRating.sort((a, b) => (b.Rating || 0) - (a.Rating || 0)).slice(0, 1)[0];
  const topRatingApp = topRating ? topRating.App : 'N/A';
  
  // Apps con mayor número de reseñas
  const topReviews = rows.sort((a, b) => (b.Reviews || 0) - (a.Reviews || 0)).slice(0, 1)[0];
  const topReviewsApp = topReviews ? topReviews.App : 'N/A';
  
  // Categoría más popular (por número de apps)
  const categoryCounts = countBy(rows, r => r.Category);
  const mostPopularCategory = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];
  const topCategoryName = mostPopularCategory ? mostPopularCategory[0] : 'N/A';
  const topCategoryCount = mostPopularCategory ? mostPopularCategory[1] : 0;
  
  // Apps actualizadas recientemente (último año)
  const currentYear = new Date().getFullYear();
  const recentUpdates = rows.filter(r => r.UpdateYear === currentYear).length;
  
  // Apps premium (de pago) con mayor precio
  const premiumApps = paidApps.filter(r => r.Price > 0);
  const avgPremiumPrice = premiumApps.length ? meanBy(premiumApps, r => r.Price) : 0;
  const mostExpensiveApp = premiumApps.sort((a, b) => (b.Price || 0) - (a.Price || 0))[0];
  const mostExpensiveAppName = mostExpensiveApp ? mostExpensiveApp.App : 'N/A';
  
  // Apps con mayor tamaño
  const appsWithSize = rows.filter(r => r.SizeMB && r.SizeMB > 0);
  const avgAppSize = appsWithSize.length ? meanBy(appsWithSize, r => r.SizeMB) : 0;
  
  // Apps con requisitos de Android más recientes
  const appsWithAndroidVer = rows.filter(r => r.AndroidVer && r.AndroidVer > 0);
  const avgAndroidVer = appsWithAndroidVer.length ? meanBy(appsWithAndroidVer, r => r.AndroidVer) : 0;

  const cards = [
    createCardKPI('Total de Apps', formatNumber(totalApps), '📱'),
    createCardKPI('Instalaciones Totales', formatNumber(totalInstalls), '⬇'),
    createCardKPI('Reseñas Totales', formatNumber(totalReviews), '💬'),
    createCardKPI('Rating Promedio', meanRating ? meanRating.toFixed(2) : '—', '⭐'),
    createCardKPI('% Apps de Pago', `${paidPercentage.toFixed(1)}%`, '💵'),
    createCardKPI('Categorías Únicas', formatNumber(uniqueCategories), '🗂'),
    createCardKPI('App Más Descargada', topAppName.length > 15 ? topAppName.substring(0, 15) + '...' : topAppName, '🔥'),
    createCardKPI('App Mejor Calificada', topRatingApp.length > 15 ? topRatingApp.substring(0, 15) + '...' : topRatingApp, '🏆'),
    createCardKPI('Categoría Más Popular', `${topCategoryName} (${topCategoryCount})`, '📊'),
    createCardKPI('Apps Actualizadas 2024', formatNumber(recentUpdates), '🔄'),
    createCardKPI('Precio Promedio Premium', avgPremiumPrice ? `$${avgPremiumPrice.toFixed(2)}` : '—', '💰'),
    createCardKPI('App Más Cara', mostExpensiveAppName.length > 15 ? mostExpensiveAppName.substring(0, 15) + '...' : mostExpensiveAppName, '💎')
  ];
  
  for (const c of cards) container.appendChild(c);
  
  // Animar contadores numéricos
  container.querySelectorAll('[data-counter]').forEach(el => {
    const raw = el.textContent.replace(/[^0-9.]/g, '');
    const target = Number(raw) || 0;
    if (target > 0) {
      animateCounter(el, target);
    }
  });
}

// Exportar datos filtrados como CSV
function exportFilteredData() {
  if (!STATE.filteredRows.length) {
    alert('No hay datos para exportar');
    return;
  }
  
  const headers = [
    'App', 'Category', 'Rating', 'Reviews', 'Size (MB)', 'Installs', 
    'Type', 'Price (USD)', 'Content Rating', 'Genres', 'Last Updated', 
    'Current Version', 'Android Version'
  ];
  
  const csvContent = [
    headers.join(','),
    ...STATE.filteredRows.map(row => [
      `"${(row.App || '').replace(/"/g, '""')}"`,
      `"${(row.Category || '').replace(/"/g, '""')}"`,
      row.Rating || '',
      row.Reviews || '',
      row.SizeMB ? row.SizeMB.toFixed(2) : '',
      row.Installs || '',
      row.Type || '',
      row.Type === 'Paid' ? row.Price.toFixed(2) : '0',
      `"${(row.ContentRating || '').replace(/"/g, '""')}"`,
      `"${(row.Genres || '').replace(/"/g, '""')}"`,
      row.LastUpdated ? row.LastUpdated.toLocaleDateString() : '',
      `"${(row.CurrentVer || '').replace(/"/g, '""')}"`,
      row.AndroidVer || ''
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `googleplaystore_${STATE.filteredRows.length}_apps_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  // Mostrar confirmación
  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
  notification.textContent = `✅ Exportado ${STATE.filteredRows.length} apps`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Mostrar estadísticas del dataset
function showDatasetStats() {
  const stats = {
    total: STATE.cleanRows.length,
    categories: new Set(STATE.cleanRows.map(r => r.Category)).size,
    paid: STATE.cleanRows.filter(r => r.Type === 'Paid').length,
    free: STATE.cleanRows.filter(r => r.Type !== 'Paid').length,
    avgRating: meanBy(STATE.cleanRows.filter(r => Number.isFinite(r.Rating) && r.Rating > 0), r => r.Rating),
    totalInstalls: sumBy(STATE.cleanRows, r => r.Installs),
    totalReviews: sumBy(STATE.cleanRows, r => r.Reviews),
    avgPrice: meanBy(STATE.cleanRows.filter(r => r.Type === 'Paid' && r.Price > 0), r => r.Price),
    avgSize: meanBy(STATE.cleanRows.filter(r => r.SizeMB && r.SizeMB > 0), r => r.SizeMB),
    avgAndroidVer: meanBy(STATE.cleanRows.filter(r => r.AndroidVer && r.AndroidVer > 0), r => r.AndroidVer)
  };
  
  // Encontrar la categoría con más apps
  const categoryCounts = countBy(STATE.cleanRows, r => r.Category);
  const topCategory = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0];
  
  // Encontrar la app más descargada
  const topApp = STATE.cleanRows.sort((a, b) => (b.Installs || 0) - (a.Installs || 0))[0];
  
  const statsHtml = `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div class="text-center p-4 bg-white/5 rounded-lg border border-white/10">
        <div class="text-3xl font-bold text-secondary">${formatNumber(stats.total)}</div>
        <div class="text-sm text-white/70">Total Apps</div>
        <div class="text-xs text-white/50 mt-1">${stats.paid} pagas, ${stats.free} gratis</div>
      </div>
      
      <div class="text-center p-4 bg-white/5 rounded-lg border border-white/10">
        <div class="text-3xl font-bold text-accent">${formatNumber(stats.categories)}</div>
        <div class="text-sm text-white/70">Categorías</div>
        <div class="text-xs text-white/50 mt-1">Top: ${topCategory ? topCategory[0] : 'N/A'}</div>
      </div>
      
      <div class="text-center p-4 bg-white/5 rounded-lg border border-white/10">
        <div class="text-3xl font-bold text-primary">${formatNumber(stats.totalInstalls)}</div>
        <div class="text-sm text-white/70">Total Installs</div>
        <div class="text-xs text-white/50 mt-1">${topApp ? topApp.App.substring(0, 20) + '...' : 'N/A'}</div>
      </div>
      
      <div class="text-center p-4 bg-white/5 rounded-lg border border-white/10">
        <div class="text-3xl font-bold text-yellow-400">${stats.avgRating ? stats.avgRating.toFixed(2) : '—'}</div>
        <div class="text-sm text-white/70">Rating Promedio</div>
        <div class="text-xs text-white/50 mt-1">${formatNumber(stats.totalReviews)} reseñas</div>
      </div>
    </div>
    
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      <div class="text-center p-3 bg-white/5 rounded-lg border border-white/10">
        <div class="text-xl font-bold text-green-400">${stats.avgPrice ? `$${stats.avgPrice.toFixed(2)}` : '—'}</div>
        <div class="text-xs text-white/70">Precio Promedio Premium</div>
      </div>
      
      <div class="text-center p-3 bg-white/5 rounded-lg border border-white/10">
        <div class="text-xl font-bold text-blue-400">${stats.avgSize ? `${stats.avgSize.toFixed(1)}MB` : '—'}</div>
        <div class="text-xs text-white/70">Tamaño Promedio</div>
      </div>
      
      <div class="text-center p-3 bg-white/5 rounded-lg border border-white/10">
        <div class="text-xl font-bold text-purple-400">${stats.avgAndroidVer ? stats.avgAndroidVer.toFixed(1) : '—'}</div>
        <div class="text-xs text-white/70">Android Ver Promedio</div>
      </div>
    </div>
  `;
  
  const statsContainer = document.getElementById('datasetStats');
  if (statsContainer) statsContainer.innerHTML = statsHtml;
}

// ----------------------------- Lottie -----------------------------
function setupLottie() {
  const el = document.getElementById('lottie-hero');
  if (!el || !window.lottie) return;
  try {
    window.lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'assets/lottie/ai.json'
    });
  } catch (e) {
    // ignore, non-critical
  }
}

// ----------------------------- Boot -----------------------------
async function loadCSV() {
  return new Promise((resolve, reject) => {
    Papa.parse(DATA_PATH, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (res) => resolve(res.data),
      error: (err) => reject(err)
    });
  });
}

async function init() {
  document.getElementById('yearCopy').textContent = new Date().getFullYear();
  setupTheme();
  setupRipple();
  setupNavbar();
  setupTabsMobile();
  setupBackToTop();
  setupDownloadButtons();
  setupLottie();
  setupTableControls();

  try {
    const raw = await loadCSV();
    STATE.rawRows = raw;
    STATE.cleanRows = cleanRows(raw);
    STATE.filteredRows = STATE.cleanRows;
    computeAndRenderKPIs(STATE.cleanRows);
    applySearchFilter();
    renderTable();
    showDatasetStats();
    if (window.renderAllCharts) {
      window.renderAllCharts(STATE.cleanRows);
    }
  } catch (e) {
    console.error('Error cargando CSV', e);
    const body = document.getElementById('tableBody');
    if (body) body.innerHTML = `<tr><td colspan="6" class="px-4 py-6 text-center text-white/60">No se pudo cargar el CSV</td></tr>`;
  }

  // resize charts
  window.addEventListener('resize', () => {
    for (const el of Object.values(STATE.charts)) Plotly.Plots.resize(el);
  });
}

window.addEventListener('DOMContentLoaded', init);

// expose helpers globally for charts.js
window.IAHelpers = { groupBy, sumBy, meanBy, medianBy, countBy, formatNumber, formatPrice, createChart };
window.downloadChartAsPng = downloadChartAsPng;
window.exportFilteredData = exportFilteredData;

// CSV manual (fallback)
document.addEventListener('change', (e) => {
  const input = e.target.closest('#csvUpload');
  if (!input || !input.files || !input.files[0]) return;
  const file = input.files[0];
  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  loadingMsg.innerHTML = '<div class="bg-bgsoft p-6 rounded-lg text-center"><div class="animate-spin w-8 h-8 border-4 border-primary border-t-transparent mx-auto mb-4"></div><p>Procesando CSV...</p></div>';
  document.body.appendChild(loadingMsg);

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (res) => {
      STATE.rawRows = res.data || [];
      STATE.cleanRows = cleanRows(STATE.rawRows);
      STATE.filteredRows = STATE.cleanRows;
      computeAndRenderKPIs(STATE.cleanRows);
      applySearchFilter();
      renderTable();
      showDatasetStats();
      if (window.renderAllCharts) window.renderAllCharts(STATE.cleanRows);
      loadingMsg.remove();
    },
    error: () => {
      loadingMsg.remove();
      alert('No fue posible leer el CSV subido');
    }
  });
});



/*
  charts.js: crea los 8 gráficos con Plotly.
  Para cada gráfico se documenta el pipeline de datos.
*/

(function(){
  const { groupBy, sumBy, meanBy, medianBy, countBy, formatNumber, formatPrice, createChart } = window.IAHelpers || {};

  function setStatus(containerId, msg){
    const el = document.getElementById(containerId);
    if (!el) return;
    const status = el.querySelector('.chart-status');
    if (status) status.textContent = msg;
  }

  function writeInsights(id, bullets){
    const box = document.getElementById(`insight-${id}`);
    if (!box) return;
    box.innerHTML = '<div class="mt-2 text-sm"><p class="font-semibold mb-1">Qué vemos:</p><ul class="list-disc list-inside space-y-1">' + bullets.map(b => `<li>${b}</li>`).join('') + '</ul></div>';
  }

  // 1) Top 10 categorías por descargas
  function chartTopCategoriesByInstalls(rows){
    const container = 'chart-1';
    setStatus(container, 'Procesando…');
    try {
      // Agrupar por Category, sumar Installs, ordenar desc y tomar top 10
      const map = groupBy(rows, r => r.Category);
      const agg = Array.from(map.entries()).map(([cat, arr]) => ({ category: cat, installs: sumBy(arr, r => r.Installs) }));
      const top = agg.sort((a,b) => b.installs - a.installs).slice(0, 10);
      if (!top.length) return setStatus(container, 'Sin datos válidos');
      
      const data = [{
        type: 'bar',
        x: top.map(t => t.installs).reverse(),
        y: top.map(t => t.category).reverse(),
        orientation: 'h',
        text: top.map(t => formatNumber(t.installs)).reverse(),
        textposition: 'auto',
        marker: { color: '#2563EB' },
        hovertemplate: '<b>%{y}</b><br>Installs: %{x:,.0f}<extra></extra>'
      }];
      
      const layout = { 
        title: 'Top 10 categorías por descargas (Installs)', 
        xaxis: { title: 'Installs (suma)' }, 
        yaxis: { title: '' },
        hovermode: 'closest'
      };
      
      createChart(container, data, layout);
      const last = top[top.length-1]?.category || '';
      writeInsights(1, [
        `Las categorías líderes concentran una porción significativa de instalaciones.`,
        `En este dataset, la categoría en último lugar del top es ${last}.`,
      ]);
    } catch (e) {
      console.error('Error en chart 1:', e);
      setStatus(container, 'Error al procesar datos');
    }
  }

  // 2) Descargas por Content Rating
  function chartInstallsByContentRating(rows){
    const container = 'chart-2';
    setStatus(container, 'Procesando…');
    try {
      const map = groupBy(rows, r => r.ContentRating || 'Desconocido');
      const agg = Array.from(map.entries()).map(([cr, arr]) => ({ cr, installs: sumBy(arr, r => r.Installs) }));
      const data = [{ 
        type: 'bar', 
        x: agg.map(a => a.cr), 
        y: agg.map(a => a.installs), 
        marker: { color: '#0EA5E9' }, 
        text: agg.map(a => formatNumber(a.installs)), 
        textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>Installs: %{y:,.0f}<extra></extra>'
      }];
      
      const layout = { 
        title: 'Descargas por grupo de edad (Content Rating)', 
        xaxis: { title: 'Content Rating' }, 
        yaxis: { title: 'Installs (suma)' },
        hovermode: 'closest'
      };
      
      createChart(container, data, layout);
      const maxCR = agg.slice().sort((a,b)=>b.installs-a.installs)[0]?.cr;
      writeInsights(2, [
        `El grupo ${maxCR || '—'} concentra más descargas.`,
        `Las diferencias sugieren perfiles etarios con distinta adopción.`
      ]);
    } catch (e) {
      console.error('Error en chart 2:', e);
      setStatus(container, 'Error al procesar datos');
    }
  }

  // 3) Categorías más costosas (Paid) — precio promedio por categoría (Top 10) y mediana al tooltip
  function chartPriciestCategoriesPaid(rows){
    const container = 'chart-3';
    setStatus(container, 'Procesando…');
    try {
      const paid = rows.filter(r => r.Type === 'Paid' && Number.isFinite(r.Price) && r.Price > 0);
      if (!paid.length) return setStatus(container, 'No hay apps de pago');
      
      const map = groupBy(paid, r => r.Category);
      const agg = Array.from(map.entries()).map(([cat, arr]) => ({ 
        category: cat, 
        avg: meanBy(arr, r => r.Price), 
        med: medianBy(arr, r => r.Price),
        count: arr.length
      })).filter(x => Number.isFinite(x.avg));
      
      const top = agg.sort((a,b) => b.avg - a.avg).slice(0, 10);
      if (!top.length) return setStatus(container, 'Sin datos válidos');
      
      const data = [{ 
        type: 'bar', 
        x: top.map(t => t.category), 
        y: top.map(t => t.avg), 
        marker: { color: '#22C55E' }, 
        hovertemplate: '<b>%{x}</b><br>Promedio: $%{y:.2f}<br>Mediana: $%{customdata:.2f}<br>Apps: %{text}<extra></extra>',
        customdata: top.map(t => t.med),
        text: top.map(t => t.count)
      }];
      
      const layout = { 
        title: 'Categorías más costosas (Paid) — precio promedio', 
        xaxis: { title: 'Categoría' }, 
        yaxis: { title: 'Precio promedio (USD)' },
        hovermode: 'closest'
      };
      
      createChart(container, data, layout);
      const maxCat = top[0]?.category;
      writeInsights(3, [
        `Las apps de pago en ${maxCat || '—'} tienden a precios más altos.`,
        `Otras categorías muestran precios más accesibles.`
      ]);
    } catch (e) {
      console.error('Error en chart 3:', e);
      setStatus(container, 'Error al procesar datos');
    }
  }

  // 4) Relación descargas vs reseñas (log-log) + tendencia + r
  function chartInstallsVsReviews(rows){
    const container = 'chart-4';
    setStatus(container, 'Procesando…');
    try {
      const pts = rows.map(r => ({ x: r.Reviews, y: r.Installs })).filter(p => p.x > 0 && p.y > 0);
      if (!pts.length) return setStatus(container, 'Sin datos válidos');
      
      const scatter = { 
        type: 'scattergl', 
        mode: 'markers', 
        x: pts.map(p=>p.x), 
        y: pts.map(p=>p.y), 
        marker: { color: '#93c5fd', size: 6, opacity: 0.7 },
        hovertemplate: '<b>App</b><br>Reviews: %{x:,.0f}<br>Installs: %{y:,.0f}<extra></extra>'
      };
      
      // correlación y tendencia sobre logs
      const lx = pts.map(p => Math.log10(p.x));
      const ly = pts.map(p => Math.log10(p.y));
      const mx = meanBy(lx, v => v);
      const my = meanBy(ly, v => v);
      const cov = lx.reduce((a, v, i) => a + (v - mx) * (ly[i] - my), 0);
      const sx = Math.sqrt(lx.reduce((a, v) => a + Math.pow(v - mx, 2), 0));
      const sy = Math.sqrt(ly.reduce((a, v) => a + Math.pow(v - my, 2), 0));
      const r = (sx && sy) ? (cov / (sx * sy)) : 0;
      const b = cov / (lx.reduce((a, v) => a + Math.pow(v - mx, 2), 0) || 1);
      const a = my - b * mx;
      
      // construir línea en el espacio original
      const xLine = [Math.min(...pts.map(p=>p.x)), Math.max(...pts.map(p=>p.x))];
      const yLine = xLine.map(xx => Math.pow(10, a + b * Math.log10(xx)));
      const trend = { 
        type: 'scatter', 
        mode: 'lines', 
        x: xLine, 
        y: yLine, 
        line: { color: '#2563EB', width: 2 },
        hovertemplate: 'Tendencia<extra></extra>'
      };
      
      const data = [scatter, trend];
      const layout = { 
        title: `Descargas vs Reseñas (r ≈ ${Number.isFinite(r) ? r.toFixed(2) : '0'})`, 
        xaxis: { title: 'Reviews (log)', type: 'log' }, 
        yaxis: { title: 'Installs (log)', type: 'log' }, 
        showlegend: false, 
        hovermode: 'closest',
        annotations: [{ 
          xref: 'paper', 
          yref: 'paper', 
          x: 0.02, 
          y: 0.98, 
          text: `r ≈ ${Number.isFinite(r) ? r.toFixed(2) : '0'}`, 
          showarrow: false, 
          bgcolor: 'rgba(37,99,235,.2)', 
          bordercolor: '#2563EB', 
          borderwidth: 1, 
          font: { size: 12 } 
        }] 
      };
      
      createChart(container, data, layout);
      writeInsights(4, [
        'Existe relación positiva: más descargas se asocian a más reseñas.',
        'La línea de tendencia refuerza la proporcionalidad en escala log.'
      ]);
    } catch (e) {
      console.error('Error en chart 4:', e);
      setStatus(container, 'Error al procesar datos');
    }
  }

  // 5) Número de apps por categoría (conteo)
  function chartAppsByCategory(rows){
    const container = 'chart-5';
    setStatus(container, 'Procesando…');
    try {
      const counts = Array.from(countBy(rows, r => r.Category).entries()).map(([cat, n]) => ({ cat, n })).sort((a,b)=>b.n-a.n);
      const data = [{ 
        type: 'bar', 
        x: counts.map(c=>c.cat), 
        y: counts.map(c=>c.n), 
        marker: { color: '#60a5fa' },
        hovertemplate: '<b>%{x}</b><br>Apps: %{y}<extra></extra>'
      }];
      
      const layout = { 
        title: 'Número de apps por categoría', 
        xaxis: { title: 'Categoría' }, 
        yaxis: { title: 'Número de apps' },
        hovermode: 'closest'
      };
      
      createChart(container, data, layout);
      const top = counts[0]?.cat;
      writeInsights(5, [
        `La categoría ${top || '—'} destaca en volumen de apps.`,
        'La distribución sugiere áreas saturadas vs nichos.'
      ]);
    } catch (e) {
      console.error('Error en chart 5:', e);
      setStatus(container, 'Error al procesar datos');
    }
  }

  // 6) Actualizaciones por año
  function chartUpdatesByYear(rows){
    const container = 'chart-6';
    setStatus(container, 'Procesando…');
    try {
      const valid = rows.filter(r => r.UpdateYear);
      if (!valid.length) return setStatus(container, 'Sin fechas válidas');
      
      const counts = Array.from(countBy(valid, r => r.UpdateYear).entries()).sort((a,b)=>a[0]-b[0]);
      const data = [{ 
        type: 'scatter', 
        mode: 'lines+markers', 
        x: counts.map(c=>c[0]), 
        y: counts.map(c=>c[1]), 
        fill: 'tozeroy', 
        line: { color: '#a78bfa' },
        hovertemplate: '<b>Año %{x}</b><br>Apps: %{y}<extra></extra>'
      }];
      
      const layout = { 
        title: 'Actualizaciones por año', 
        xaxis: { title: 'Año' }, 
        yaxis: { title: 'Número de apps' },
        hovermode: 'closest'
      };
      
      createChart(container, data, layout);
      const peak = counts.slice().sort((a,b)=>b[1]-a[1])[0]?.[0];
      writeInsights(6, [
        `El pico de actualizaciones se observa alrededor de ${peak || '—'}.`,
        'La actividad puede reflejar adopción de nuevas versiones de Android.'
      ]);
    } catch (e) {
      console.error('Error en chart 6:', e);
      setStatus(container, 'Error al procesar datos');
    }
  }

  // 7) Distribución de requerimientos de Android
  function chartAndroidRequirement(rows){
    const container = 'chart-7';
    setStatus(container, 'Procesando…');
    try {
      const valid = rows.filter(r => Number.isFinite(r.AndroidVer));
      if (!valid.length) return setStatus(container, 'Sin datos válidos');
      
      const major = valid.map(r => Math.floor(r.AndroidVer));
      const counts = Array.from(countBy(major, v => v).entries()).sort((a,b)=>a[0]-b[0]);
      const data = [{ 
        type: 'bar', 
        x: counts.map(c=>String(c[0])), 
        y: counts.map(c=>c[1]), 
        marker: { color: '#34d399' },
        hovertemplate: '<b>Android %{x}</b><br>Apps: %{y}<extra></extra>'
      }];
      
      const layout = { 
        title: 'Distribución de requerimientos de Android (versión mayor)', 
        xaxis: { title: 'Versión mayor' }, 
        yaxis: { title: 'Número de apps' },
        hovermode: 'closest'
      };
      
      createChart(container, data, layout);
      const min = counts[0]?.[0];
      writeInsights(7, [
        `Predomina Android ≥ ${min || ''}.`,
        'La mayoría de apps apunta a versiones modernas.'
      ]);
    } catch (e) {
      console.error('Error en chart 7:', e);
      setStatus(container, 'Error al procesar datos');
    }
  }

  // 8) Installs por rangos de precio
  function chartInstallsByPriceBins(rows){
    const container = 'chart-8';
    setStatus(container, 'Procesando…');
    try {
      const paid = rows.filter(r => Number.isFinite(r.Price));
      if (!paid.length) return setStatus(container, 'Sin apps de pago');
      
      const bins = [
        { label: '[0, 1)', from: 0, to: 1 },
        { label: '[1, 5)', from: 1, to: 5 },
        { label: '[5, 10)', from: 5, to: 10 },
        { label: '10+', from: 10, to: Infinity },
      ];
      
      const agg = bins.map(b => ({ 
        label: b.label, 
        installs: sumBy(paid.filter(r => r.Price >= b.from && r.Price < b.to), r => r.Installs) 
      }));
      
      const data = [{ 
        type: 'bar', 
        x: agg.map(a=>a.label), 
        y: agg.map(a=>a.installs), 
        marker: { color: '#f59e0b' }, 
        text: agg.map(a=>formatNumber(a.installs)), 
        textposition: 'outside',
        hovertemplate: '<b>%{x}</b><br>Installs: %{y:,.0f}<extra></extra>'
      }];
      
      const layout = { 
        title: 'Installs por rangos de precio (USD)', 
        xaxis: { title: 'Rango de precio' }, 
        yaxis: { title: 'Installs (suma)' },
        hovermode: 'closest'
      };
      
      createChart(container, data, layout);
      const top = agg.slice().sort((a,b)=>b.installs-a.installs)[0]?.label;
      writeInsights(8, [
        `El rango ${top || '—'} concentra más instalaciones.`,
        'Las apps económicas atraen mayor volumen.'
      ]);
    } catch (e) {
      console.error('Error en chart 8:', e);
      setStatus(container, 'Error al procesar datos');
    }
  }

  function renderAllCharts(rows){
    // Renderizar con delay para mejor UX
    const charts = [
      () => chartTopCategoriesByInstalls(rows),
      () => chartInstallsByContentRating(rows),
      () => chartPriciestCategoriesPaid(rows),
      () => chartInstallsVsReviews(rows),
      () => chartAppsByCategory(rows),
      () => chartUpdatesByYear(rows),
      () => chartAndroidRequirement(rows),
      () => chartInstallsByPriceBins(rows)
    ];
    
    charts.forEach((chartFn, index) => {
      setTimeout(chartFn, index * 200); // 200ms entre cada gráfico
    });
  }

  window.renderAllCharts = renderAllCharts;
})();



/**
 * charts.js — Componentes de gráfico reutilizáveis
 */

const Charts = (() => {

  /**
   * Gráfico de barras vertical
   * @param {string|HTMLElement} container - ID ou elemento
   * @param {number[]} values
   * @param {object} opts
   */
  function barChart(container, values, opts = {}) {
    const el = typeof container === 'string'
      ? document.getElementById(container)
      : container;
    if (!el) return;

    const {
      labels   = [],
      color    = '#8D9298',
      height   = 64,
      emptyColor = '#E8E0D0',
    } = opts;

    const max  = Math.max(...values.filter(v => v > 0), 1);
    el.style.height  = height + 'px';
    el.className     = 'barchart';
    el.style.alignItems = 'flex-end';
    el.innerHTML     = '';

    values.forEach((v, i) => {
      const col  = document.createElement('div');
      col.className = 'bcol';
      col.style.height = '100%';

      const fill = document.createElement('div');
      fill.className    = 'bfill';
      fill.style.background = v > 0 ? color : emptyColor;
      fill.style.height = v > 0 ? `${(v / max * 85).toFixed(1)}%` : '3px';

      col.appendChild(fill);

      if (labels[i] !== undefined) {
        const lbl = document.createElement('span');
        lbl.className   = 'blbl';
        lbl.textContent = labels[i];
        col.appendChild(lbl);
      }

      el.appendChild(col);
    });
  }

  /**
   * Sparkline SVG inline
   * @param {number[]} values
   * @param {object} opts
   * @returns {string} SVG HTML string
   */
  function sparkline(values, opts = {}) {
    const {
      width  = 120,
      height = 30,
      color  = '#A5AA94',
      stroke = 2,
    } = opts;

    const valid = values.filter(v => v > 0);
    if (!valid.length) return '';

    const min   = Math.min(...valid);
    const max   = Math.max(...valid);
    const range = max - min || 1;
    const n     = values.length;

    const pts = values.map((v, i) => {
      const x = (i / (n - 1)) * width;
      const y = v > 0
        ? height - ((v - min) / range) * (height * 0.85) - height * 0.05
        : height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}"
      preserveAspectRatio="none">
      <polyline points="${pts}" fill="none" stroke="${color}"
        stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  return { barChart, sparkline };
})();

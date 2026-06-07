/**
 * utils.js — Funções utilitárias
 */

const Utils = (() => {
  const DN = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const MN = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const MN_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  return {
    // ── DATA ──────────────────────────────────────────────
    dateKey(date = new Date()) {
      return date.toISOString().slice(0, 10); // 'YYYY-MM-DD'
    },

    formatDate(date = new Date()) {
      return `${DN[date.getDay()]}, ${date.getDate()} de ${MN_SHORT[date.getMonth()]}`;
    },

    formatMonth(date = new Date()) {
      return `${MN[date.getMonth()]} ${date.getFullYear()}`;
    },

    lastNDays(n) {
      const days = [];
      for (let i = n - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(this.dateKey(d));
      }
      return days;
    },

    dayShort(dateStr) {
      const d = new Date(dateStr + 'T12:00:00');
      return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()];
    },

    // ── NÚMEROS ───────────────────────────────────────────
    clamp(val, min, max) { return Math.max(min, Math.min(max, val)); },

    pct(val, max) { return this.clamp((val / max) * 100, 0, 100); },

    round1(n) { return Math.round(n * 10) / 10; },

    formatKg(n)  { return n?.toFixed(1) ?? '—'; },
    formatL(ml)  { return (ml / 1000).toFixed(2); },

    // ── DOM ───────────────────────────────────────────────
    el(id) { return document.getElementById(id); },

    html(id, content) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = content;
    },

    create(tag, cls, content = '') {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (content) el.innerHTML = content;
      return el;
    },

    // ── RELÓGIO ───────────────────────────────────────────
    startClock(elId) {
      const update = () => {
        const t = new Date();
        const h = t.getHours();
        const m = t.getMinutes().toString().padStart(2, '0');
        const el = document.getElementById(elId);
        if (el) el.textContent = `${h}:${m}`;
      };
      update();
      setInterval(update, 30_000);
    },

    // ── SVG PROGRESS RING ─────────────────────────────────
    /**
     * Gera um SVG de anel de progresso.
     * @param {number} pct - 0 a 100
     * @param {number} size - tamanho em px
     * @param {number} stroke - espessura
     * @param {string} color - cor do progresso
     * @param {string} trackColor - cor do fundo
     */
    progressRing(pct, size = 80, stroke = 7, color = '#7A836A', trackColor = '#E8E0D0') {
      const r    = (size - stroke) / 2;
      const circ = 2 * Math.PI * r;
      const off  = circ * (1 - this.clamp(pct, 0, 100) / 100);
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
             style="transform:rotate(-90deg)">
          <circle cx="${size/2}" cy="${size/2}" r="${r}"
            fill="none" stroke="${trackColor}" stroke-width="${stroke}"/>
          <circle cx="${size/2}" cy="${size/2}" r="${r}"
            fill="none" stroke="${color}" stroke-width="${stroke}"
            stroke-dasharray="${circ.toFixed(2)}"
            stroke-dashoffset="${off.toFixed(2)}"
            stroke-linecap="round"
            style="transition:stroke-dashoffset .5s ease"/>
        </svg>`;
    },

    // ── GREETING ──────────────────────────────────────────
    greeting() {
      const h = new Date().getHours();
      if (h < 12) return 'Bom dia';
      if (h < 18) return 'Boa tarde';
      return 'Boa noite';
    },

    // ── SCORE ─────────────────────────────────────────────
    calcScore(habits, waterPct, config) {
      const weights = config || { sleep: 25, water: 20, workout: 30, protein: 15, meals: 10 };
      let score = 0;
      if (habits.sleep)   score += weights.sleep;
      if (waterPct >= 80) score += weights.water;
      else if (waterPct >= 50) score += Math.round(weights.water * 0.5);
      if (habits.workout) score += weights.workout;
      if (habits.protein) score += weights.protein;
      if (habits.meals)   score += weights.meals;
      return score;
    },
  };
})();

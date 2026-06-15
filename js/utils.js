/**
 * utils.js — Funções utilitárias
 */

/**
 * LabCatalog — catálogo de marcadores laboratoriais (Fase 3 / Painel de
 * Saúde Metabólica). Cada marcador mapeia para uma coluna de `lab_results`.
 * `fixed: true` = aparece sempre no topo do painel.
 * `ref: [min, max]` = faixa de referência usada apenas para indicar
 * tendência visual (alto/baixo/ok) — não é orientação clínica.
 */
const LabCatalog = {
  categories: ['Metabólico', 'Lipídico', 'Hepático/Renal', 'Tireoide', 'Hormonal', 'Vitaminas & Minerais', 'Hematológico'],

  markers: {
    glicemia_jejum:     { label: 'Glicemia de Jejum',    unit: 'mg/dL',  cat: 'Metabólico', dec: 0, ref: [70, 99],    fixed: true },
    hba1c:              { label: 'HbA1c',                unit: '%',      cat: 'Metabólico', dec: 1, ref: [4, 5.6],    fixed: true },
    insulina_jejum:     { label: 'Insulina de Jejum',    unit: 'µU/mL',  cat: 'Metabólico', dec: 1, ref: [2.6, 24.9] },
    homa_ir:            { label: 'HOMA-IR',              unit: '',       cat: 'Metabólico', dec: 2, ref: [0, 2.7] },

    ldl:                { label: 'LDL',                  unit: 'mg/dL',  cat: 'Lipídico', dec: 0, ref: [0, 130],  fixed: true },
    hdl:                { label: 'HDL',                  unit: 'mg/dL',  cat: 'Lipídico', dec: 0, ref: [50, 999], fixed: true },
    triglicerideos:     { label: 'Triglicerídeos',       unit: 'mg/dL',  cat: 'Lipídico', dec: 0, ref: [0, 150],  fixed: true },
    colesterol_total:   { label: 'Colesterol Total',     unit: 'mg/dL',  cat: 'Lipídico', dec: 0, ref: [0, 190] },
    apob:               { label: 'ApoB',                 unit: 'mg/dL',  cat: 'Lipídico', dec: 0, ref: [0, 90] },
    lpa:                { label: 'Lp(a)',                 unit: 'mg/dL',  cat: 'Lipídico', dec: 0, ref: [0, 30] },

    ast:                { label: 'AST (TGO)',            unit: 'U/L',    cat: 'Hepático/Renal', dec: 0, ref: [5, 34] },
    alt:                { label: 'ALT (TGP)',            unit: 'U/L',    cat: 'Hepático/Renal', dec: 0, ref: [5, 49] },
    ggt:                { label: 'GGT',                  unit: 'U/L',    cat: 'Hepático/Renal', dec: 0, ref: [5, 36] },
    creatinina:         { label: 'Creatinina',           unit: 'mg/dL',  cat: 'Hepático/Renal', dec: 2, ref: [0.6, 1.1] },
    ureia:              { label: 'Ureia',                unit: 'mg/dL',  cat: 'Hepático/Renal', dec: 0, ref: [15, 40] },
    acido_urico:        { label: 'Ácido Úrico',          unit: 'mg/dL',  cat: 'Hepático/Renal', dec: 1, ref: [2.4, 6.0] },

    tsh:                { label: 'TSH',                  unit: 'µUI/mL', cat: 'Tireoide', dec: 2, ref: [0.4, 4.0] },
    t4_livre:           { label: 'T4 Livre',             unit: 'ng/dL',  cat: 'Tireoide', dec: 2, ref: [0.7, 1.8] },
    anti_tpo:           { label: 'Anti-TPO',             unit: 'UI/mL',  cat: 'Tireoide', dec: 1, ref: [0, 34] },

    prolactina:         { label: 'Prolactina',           unit: 'ng/mL',  cat: 'Hormonal', dec: 1, ref: [4.8, 23.3] },
    amh:                { label: 'AMH',                  unit: 'ng/mL',  cat: 'Hormonal', dec: 2, ref: [1.0, 4.0] },
    fsh:                { label: 'FSH',                  unit: 'mUI/mL', cat: 'Hormonal', dec: 1, ref: [3.5, 12.5] },
    lh:                 { label: 'LH',                   unit: 'mUI/mL', cat: 'Hormonal', dec: 1, ref: [2.4, 12.6] },
    e2:                 { label: 'Estradiol (E2)',       unit: 'pg/mL',  cat: 'Hormonal', dec: 1, ref: [12.5, 166] },
    progesterona_lutea: { label: 'Progesterona (lútea)', unit: 'ng/mL',  cat: 'Hormonal', dec: 1, ref: [1.7, 27] },

    vitamina_d:         { label: 'Vitamina D',           unit: 'ng/mL',  cat: 'Vitaminas & Minerais', dec: 1, ref: [30, 100] },
    b12:                { label: 'Vitamina B12',         unit: 'pg/mL',  cat: 'Vitaminas & Minerais', dec: 0, ref: [200, 900] },
    ferritina:          { label: 'Ferritina',            unit: 'ng/mL',  cat: 'Vitaminas & Minerais', dec: 0, ref: [15, 150] },
    folato:             { label: 'Folato',               unit: 'ng/mL',  cat: 'Vitaminas & Minerais', dec: 1, ref: [3, 17] },
    magnesio:           { label: 'Magnésio',             unit: 'mg/dL',  cat: 'Vitaminas & Minerais', dec: 1, ref: [1.7, 2.2] },
    zinco:              { label: 'Zinco',                unit: 'µg/dL',  cat: 'Vitaminas & Minerais', dec: 0, ref: [70, 120] },
    ferro:              { label: 'Ferro Sérico',         unit: 'µg/dL',  cat: 'Vitaminas & Minerais', dec: 0, ref: [60, 170] },

    hemoglobina:        { label: 'Hemoglobina',          unit: 'g/dL',   cat: 'Hematológico', dec: 1, ref: [12, 15.5] },
    hematocrito:        { label: 'Hematócrito',          unit: '%',      cat: 'Hematológico', dec: 1, ref: [36, 46] },
    ck:                 { label: 'CK',                   unit: 'U/L',    cat: 'Hematológico', dec: 0, ref: [26, 192] },
    pcr_us:             { label: 'PCR ultrassensível',   unit: 'mg/L',   cat: 'Hematológico', dec: 2, ref: [0, 3.0] },
    homocisteina:       { label: 'Homocisteína',         unit: 'µmol/L', cat: 'Hematológico', dec: 1, ref: [0, 15] },
  },

  /** 'low' | 'ok' | 'high' | null (sem faixa de referência) */
  status(key, value) {
    const m = this.markers[key];
    if (!m || !m.ref || value === null || value === undefined) return null;
    const [lo, hi] = m.ref;
    if (value < lo) return 'low';
    if (value > hi) return 'high';
    return 'ok';
  },

  fixedKeys() {
    return Object.entries(this.markers).filter(([, m]) => m.fixed).map(([k]) => k);
  },

  byCategory(cat) {
    return Object.entries(this.markers)
      .filter(([, m]) => m.cat === cat)
      .map(([key, m]) => ({ key, ...m }));
  },
};

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

    formatNum(n, dec = 0) {
      if (n === null || n === undefined || Number.isNaN(n)) return '—';
      return Number(n).toFixed(dec);
    },

    formatDateShort(dateStr) {
      const d = new Date(dateStr + 'T12:00:00');
      return `${d.getDate()} ${MN_SHORT[d.getMonth()]}`;
    },

    daysAgo(dateStr) {
      const ms = Date.now() - new Date(dateStr + 'T12:00:00').getTime();
      return Math.floor(ms / 86400000);
    },

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

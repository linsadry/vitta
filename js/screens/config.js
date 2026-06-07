/**
 * screens/config.js — Configurações e metas
 */

const ScreenConfig = (() => {

  function renderField(id, label, value, type = 'text', unit = '', hint = '') {
    return `
      <div style="margin-bottom:14px">
        <label style="font-size:11px;color:#7A7570;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.07em">
          ${label}${unit ? ` <span style="color:#A5AA94;text-transform:none;font-weight:400">(${unit})</span>` : ''}
        </label>
        <input class="form-input" id="${id}" type="${type}" value="${value}"
          ${type === 'number' ? 'step="any"' : ''}>
        ${hint ? `<p style="font-size:10px;color:#A5AA94;margin-top:4px">${hint}</p>` : ''}
      </div>`;
  }

  function render() {
    const u = DefaultData.user;
    // Ler prefs salvas (ou usar defaults)
    const name     = Storage.prefs.get('user_name',      u.name);
    const water    = Storage.prefs.get('goal_water_ml',  u.waterGoalMl);
    const kcal     = Storage.prefs.get('goal_kcal',      u.kcalGoal);
    const protein  = Storage.prefs.get('goal_protein_g', u.proteinGoalG);
    const steps    = Storage.prefs.get('goal_steps',     u.stepsGoal);
    const sleep    = Storage.prefs.get('goal_sleep_h',   u.sleepGoalH);

    // Dados manuais de hoje (para o que o Health não exporta via browser)
    const sleepH   = Storage.prefs.get('sleep_hours_today', '');
    const bedtime  = Storage.prefs.get('sleep_bedtime',     '');
    const wakeup   = Storage.prefs.get('sleep_wakeup',      '');
    const stepsN   = Storage.prefs.get('steps_today',       0);

    document.getElementById('configContent').innerHTML = `

      <!-- METAS -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Metas diárias</p>
        ${renderField('cfgName',    'Nome',         name,    'text')}
        ${renderField('cfgWater',   'Água',         water/1000, 'number', 'litros')}
        ${renderField('cfgKcal',    'Calorias',     kcal,    'number', 'kcal')}
        ${renderField('cfgProtein', 'Proteína',     protein, 'number', 'g')}
        ${renderField('cfgSteps',   'Passos',       steps,   'number', 'passos')}
        ${renderField('cfgSleep',   'Sono',         sleep,   'number', 'horas')}
        <button class="mainbtn" id="saveGoalsBtn" style="background:#7A836A;margin-top:4px">Salvar metas</button>
      </div>

      <!-- REGISTRO MANUAL (dados que não vêm do Health via browser) -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Registro manual de hoje</p>
        <p style="font-size:11px;color:#A5AA94;margin-bottom:14px;line-height:1.5">
          O Safari ainda não expõe a API do Apple Health para web apps.
          Registre aqui manualmente os dados do app Saúde.
        </p>

        <label style="font-size:11px;color:#7A7570;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.07em">Sono — horas dormidas</label>
        <input class="form-input" id="cfgSleepH" type="number" step="0.1" min="0" max="24"
          value="${sleepH}" placeholder="Ex: 7.5" style="margin-bottom:10px">

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <label style="font-size:11px;color:#7A7570;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.07em">Dormi às</label>
            <input class="form-input" id="cfgBedtime" type="time" value="${bedtime}">
          </div>
          <div>
            <label style="font-size:11px;color:#7A7570;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.07em">Acordei às</label>
            <input class="form-input" id="cfgWakeup" type="time" value="${wakeup}">
          </div>
        </div>

        <label style="font-size:11px;color:#7A7570;display:block;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.07em">Passos hoje</label>
        <input class="form-input" id="cfgStepsToday" type="number" min="0"
          value="${stepsN || ''}" placeholder="Ex: 8340" style="margin-bottom:14px">

        <button class="mainbtn" id="saveDailyBtn" style="background:#8D9298">Salvar dados do dia</button>
      </div>

      <!-- ZONA DE PERIGO -->
      <div class="card" style="margin-bottom:12px;border:1px solid #E8E0D0">
        <p class="caps" style="color:#C9845A">Dados</p>
        <p style="font-size:12px;color:#7A7570;margin-bottom:14px;line-height:1.5">
          Todos os dados ficam armazenados localmente neste dispositivo.
          Limpar apaga tudo permanentemente.
        </p>
        <button class="mainbtn" id="clearDataBtn"
          style="background:#FAF8F4;color:#C9845A;border:1px solid #E8E0D0">
          Limpar todos os dados
        </button>
      </div>

      <p style="font-size:10px;color:#A5AA94;text-align:center;padding-bottom:8px">
        Fitness OS · Dados 100% locais · Nenhuma informação enviada a servidores
      </p>`;

    // Salvar metas
    document.getElementById('saveGoalsBtn').addEventListener('click', () => {
      const waterL = parseFloat(document.getElementById('cfgWater').value);
      Storage.prefs.set('user_name',      document.getElementById('cfgName').value.trim() || u.name);
      Storage.prefs.set('goal_water_ml',  Math.round((waterL || u.waterGoalMl/1000) * 1000));
      Storage.prefs.set('goal_kcal',      parseInt(document.getElementById('cfgKcal').value)    || u.kcalGoal);
      Storage.prefs.set('goal_protein_g', parseInt(document.getElementById('cfgProtein').value) || u.proteinGoalG);
      Storage.prefs.set('goal_steps',     parseInt(document.getElementById('cfgSteps').value)   || u.stepsGoal);
      Storage.prefs.set('goal_sleep_h',   parseFloat(document.getElementById('cfgSleep').value) || u.sleepGoalH);
      showToast('Metas salvas ✓');
    });

    // Salvar dados diários
    document.getElementById('saveDailyBtn').addEventListener('click', () => {
      const h = parseFloat(document.getElementById('cfgSleepH').value);
      if (h) Storage.prefs.set('sleep_hours_today', h);
      const bed = document.getElementById('cfgBedtime').value;
      if (bed) Storage.prefs.set('sleep_bedtime', bed);
      const wake = document.getElementById('cfgWakeup').value;
      if (wake) Storage.prefs.set('sleep_wakeup', wake);
      const s = parseInt(document.getElementById('cfgStepsToday').value);
      if (s) Storage.prefs.set('steps_today', s);
      showToast('Dados do dia salvos ✓');
    });

    // Limpar dados
    document.getElementById('clearDataBtn').addEventListener('click', () => {
      if (!confirm('Apagar TODOS os dados permanentemente?')) return;
      Storage.clearAll().then(() => {
        showToast('Dados apagados');
        Router.go('dash');
      });
    });
  }

  // Toast de feedback
  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = `
        position:fixed;bottom:110px;left:50%;transform:translateX(-50%);
        background:#2C2B28;color:#F4F1EC;padding:10px 20px;border-radius:20px;
        font-size:13px;font-family:'DM Sans',sans-serif;font-weight:500;
        z-index:200;opacity:0;transition:opacity .25s;pointer-events:none;
        white-space:nowrap;
      `;
      document.getElementById('app').appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 2000);
  }

  return { render, showToast };
})();

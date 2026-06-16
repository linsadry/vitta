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
    const name     = Storage.prefs.get('user_name',      u.name);
    const water    = Storage.prefs.get('goal_water_ml',  u.waterGoalMl);
    const kcal     = Storage.prefs.get('goal_kcal',      u.kcalGoal);
    const protein  = Storage.prefs.get('goal_protein_g', u.proteinGoalG);
    const steps    = Storage.prefs.get('goal_steps',     u.stepsGoal);
    const sleep    = Storage.prefs.get('goal_sleep_h',   u.sleepGoalH);
    const strength = Storage.prefs.get('goal_strength_week', 4);
    const walk     = Storage.prefs.get('goal_walk_week',     5);

    const sleepH   = Storage.prefs.get('sleep_hours_today', '');
    const bedtime  = Storage.prefs.get('sleep_bedtime',     '');
    const wakeup   = Storage.prefs.get('sleep_wakeup',      '');
    const stepsN   = Storage.prefs.get('steps_today',       0);

    document.getElementById('configContent').innerHTML = `

      <!-- CONTA -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Conta</p>
        <p style="font-size:13px;color:#2C2B28;margin-bottom:2px" id="cfgAccountEmail">—</p>
        <p style="font-size:11px;color:#A5AA94;margin-bottom:14px">Sincronizado via Sistema Íris (Supabase)</p>
        <div style="display:flex;gap:8px">
          <button class="btn-adj" id="changePinBtn" style="flex:1">Alterar PIN</button>
          <button class="btn-adj" id="logoutBtn" style="flex:1;color:#C9845A">Sair</button>
        </div>
      </div>

      <!-- METAS DIÁRIAS -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Metas diárias</p>
        ${renderField('cfgName',    'Nome',         name,       'text')}
        ${renderField('cfgWater',   'Água',         water/1000, 'number', 'litros')}
        ${renderField('cfgKcal',    'Calorias',     kcal,       'number', 'kcal')}
        ${renderField('cfgProtein', 'Proteína',     protein,    'number', 'g')}
        ${renderField('cfgSteps',   'Passos',       steps,      'number', 'passos')}
        ${renderField('cfgSleep',   'Sono',         sleep,      'number', 'horas')}
      </div>

      <!-- METAS SEMANAIS -->
      <div class="card" style="margin-bottom:12px">
        <p class="caps">Metas semanais</p>
        ${renderField('cfgStrength', 'Musculação', strength, 'number', 'sessões/semana',
          'Quantas sessões de musculação por semana você quer atingir.')}
        ${renderField('cfgWalk',     'Cardio',     walk,     'number', 'sessões/semana',
          'Caminhadas, corridas ou cardio por semana.')}
        <button class="mainbtn" id="saveGoalsBtn" style="background:#3E6770;margin-top:4px">Salvar metas</button>
      </div>

      <!-- REGISTRO MANUAL -->
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
          Seus dados ficam salvos na sua conta (Supabase) e sincronizam entre
          seus dispositivos. Limpar apaga os registros do app permanentemente,
          mas mantém seu login e PIN.
        </p>
        <button class="mainbtn" id="clearDataBtn"
          style="background:#FAF8F4;color:#C9845A;border:1px solid #E8E0D0">
          Limpar todos os dados
        </button>
      </div>

      <p style="font-size:10px;color:#A5AA94;text-align:center;padding-bottom:8px">
        Vitta+ · Sistema Íris · Dados privados, protegidos por login + PIN
      </p>`;

    document.getElementById('changePinBtn').addEventListener('click', () => {
      ScreenAuth.showPinSetup(() => {
        ScreenAuth.hideOverlays();
        render();
        showToast('PIN atualizado ✓');
      });
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      if (!confirm('Sair da sua conta neste dispositivo?')) return;
      await Storage.auth.signOut();
      location.reload();
    });

    document.getElementById('saveGoalsBtn').addEventListener('click', () => {
      const waterL = parseFloat(document.getElementById('cfgWater').value);
      Storage.prefs.set('user_name',           document.getElementById('cfgName').value.trim() || u.name);
      Storage.prefs.set('goal_water_ml',       Math.round((waterL || u.waterGoalMl/1000) * 1000));
      Storage.prefs.set('goal_kcal',           parseInt(document.getElementById('cfgKcal').value)     || u.kcalGoal);
      Storage.prefs.set('goal_protein_g',      parseInt(document.getElementById('cfgProtein').value)  || u.proteinGoalG);
      Storage.prefs.set('goal_steps',          parseInt(document.getElementById('cfgSteps').value)    || u.stepsGoal);
      Storage.prefs.set('goal_sleep_h',        parseFloat(document.getElementById('cfgSleep').value)  || u.sleepGoalH);
      Storage.prefs.set('goal_strength_week',  parseInt(document.getElementById('cfgStrength').value) || 4);
      Storage.prefs.set('goal_walk_week',      parseInt(document.getElementById('cfgWalk').value)     || 5);
      showToast('Metas salvas ✓');
    });

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

    document.getElementById('clearDataBtn').addEventListener('click', () => {
      if (!confirm('Apagar TODOS os dados permanentemente?')) return;
      Storage.clearAll().then(() => {
        showToast('Dados apagados');
        Router.go('dash');
      });
    });

    const emailEl = document.getElementById('cfgAccountEmail');
    Promise.race([
      Storage.auth.getSession(),
      new Promise(resolve => setTimeout(() => resolve(null), 3000)),
    ]).then(session => {
      if (emailEl) emailEl.textContent = session?.user?.email || '—';
    }).catch(() => {
      if (emailEl) emailEl.textContent = '—';
    });
  }

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

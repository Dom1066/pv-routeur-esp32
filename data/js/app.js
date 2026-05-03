/* ========================================
   PV Router - SPA Application
   ======================================== */

const App = {
  refreshTimer: null,
  logTimer: null,
  logId: 0,
  currentPage: null,

  init() {
    this.initTheme();
    this.initClock();
    this.initMenuToggle();
    this.route(location.hash || '#dashboard');
    window.addEventListener('hashchange', () => this.route(location.hash));
  },

  // ---------- Routing ----------
  route(hash) {
    this.stopRefresh();
    const page = hash.replace('#', '') || 'dashboard';
    this.currentPage = page;
    document.querySelectorAll('#sidebar nav a[href^="#"]').forEach(a =>
      a.classList.toggle('active', a.getAttribute('href') === '#' + page)
    );
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('show');

    const pages = {
      dashboard: () => this.loadDashboard(),
      config: () => this.loadConfig(),
      wifi: () => this.loadWifi(),
      mqtt: () => this.loadMqtt(),
      minuteur: () => this.loadMinuteur(),
      envoy: () => this.loadEnvoy(),
      log: () => this.loadLog(),
      backup: () => this.loadBackup(),
    };
    const loader = pages[page];
    if (loader) {
      document.getElementById('pageContent').innerHTML = '<div class="spinner"></div>';
      loader();
    }
  },

  // ---------- Dashboard ----------
  async loadDashboard() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">Dashboard</h2>
      <div class="card-grid">
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon blue"><svg viewBox="0 0 16 16"><use href="/icons.svg#icon-bolt"/></svg></div>
            <div class="stat-info">
              <div class="stat-label">Reseau</div>
              <div class="stat-value" id="dash-state">--</div>
              <div class="stat-sub" id="dash-watt">-- W</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon green"><svg viewBox="0 0 16 16"><use href="/icons.svg#icon-bolt"/></svg></div>
            <div class="stat-info">
              <div class="stat-label">Puissance Routee</div>
              <div class="stat-value" id="dash-dimmer">-- W</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon cyan"><svg viewBox="0 0 16 16"><use href="/icons.svg#icon-thermometer"/></svg></div>
            <div class="stat-info">
              <div class="stat-label">Temperature</div>
              <div class="stat-value" id="dash-temp">-- °C</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-grid">
        <div class="card">
          <div class="card-header">Reseau</div>
          <div class="card-body">
            <div class="gauge-container">
              <svg class="gauge-svg" viewBox="0 0 160 100">
                <path class="gauge-bg" d="M20,80 A60,60 0 0,1 140,80"/>
                <path class="gauge-fill" id="gaugeNet" d="M20,80 A60,60 0 0,1 140,80" stroke="var(--primary)"/>
                <text class="gauge-text" x="80" y="72" id="gaugeNetVal">0</text>
                <text class="gauge-label" x="80" y="92">W</text>
              </svg>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">Puissance Routee</div>
          <div class="card-body">
            <div class="gauge-container">
              <svg class="gauge-svg" viewBox="0 0 160 100">
                <path class="gauge-bg" d="M20,80 A60,60 0 0,1 140,80"/>
                <path class="gauge-fill" id="gaugePower" d="M20,80 A60,60 0 0,1 140,80" stroke="var(--success)"/>
                <text class="gauge-text" x="80" y="72" id="gaugePowerVal">0</text>
                <text class="gauge-label" x="80" y="92">W</text>
              </svg>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">Temperature Dallas</div>
          <div class="card-body">
            <div class="gauge-container">
              <svg class="gauge-svg" viewBox="0 0 160 100">
                <path class="gauge-bg" d="M20,80 A60,60 0 0,1 140,80"/>
                <path class="gauge-fill" id="gaugeTemp" d="M20,80 A60,60 0 0,1 140,80" stroke="var(--info)"/>
                <text class="gauge-text" x="80" y="72" id="gaugeTempVal">0</text>
                <text class="gauge-label" x="80" y="92">°C</text>
              </svg>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">Etats</div>
          <div class="card-body">
            <div class="state-list">
              <div class="state-item">
                <span class="state-label">Minuteur</span>
                <span class="state-value off" id="st-minuteur">N/A</span>
              </div>
              <div class="state-item">
                <span class="state-label">Dallas</span>
                <span class="state-value off" id="st-dallas">N/A</span>
              </div>
              <div class="state-item">
                <span class="state-label">T°max</span>
                <span class="state-value off" id="st-security">N/A</span>
              </div>
              <div class="state-item">
                <span class="state-label">Relais 1</span>
                <span class="state-value off" id="st-relay1">N/A</span>
              </div>
              <div class="state-item">
                <span class="state-label">Relais 2</span>
                <span class="state-value off" id="st-relay2">N/A</span>
              </div>
              <div class="state-item">
                <div>
                  <span class="state-label">Boost</span>
                  <div class="state-sub" id="st-boost-info">max: N/A°C</div>
                </div>
                <span class="state-value off clickable" id="st-boost" data-action="boost">N/A</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    this.initGauges();
    document.querySelectorAll('[data-action]').forEach(el =>
      el.addEventListener('click', () => this.toggleAction(el.dataset.action))
    );
    await this.refreshDashboard();
    this.refreshTimer = setInterval(() => this.refreshDashboard(), 2000);
  },

  initGauges() {
    const arc = Math.PI * 60;
    document.querySelectorAll('.gauge-fill').forEach(el => {
      el.style.strokeDasharray = arc;
      el.style.strokeDashoffset = arc;
    });
  },

  setGauge(id, value, min, max, colors) {
    const el = document.getElementById(id);
    if (!el) return;
    const arc = Math.PI * 60;
    const range = max - min;
    const pct = range > 0 ? Math.max(0, Math.min(1, (value - min) / range)) : 0;
    el.style.strokeDashoffset = arc * (1 - pct);
    if (colors) {
      const c = pct < 0.4 ? colors[0] : pct < 0.7 ? colors[1] : colors[2];
      el.setAttribute('stroke', c);
    }
  },

  async refreshDashboard() {
    try {
      const res = await fetch('/state');
      const d = await res.json();
      this.updateDashboard(d);
    } catch (e) { console.error('State error:', e); }
  },

  updateDashboard(d) {
    const watt = parseInt(d.watt) || 0;
    const dimmer = parseInt(d.dimmer) || 0;
    const temp = parseFloat(d.temperature) || 0;

    // Stat cards
    const stEl = document.getElementById('dash-state');
    if (stEl) stEl.textContent = d.state || '--';
    const wEl = document.getElementById('dash-watt');
    if (wEl) wEl.textContent = watt + ' W';
    const dEl = document.getElementById('dash-dimmer');
    if (dEl) dEl.textContent = dimmer + ' W';
    const tEl = document.getElementById('dash-temp');
    if (tEl) tEl.textContent = temp.toFixed(1) + ' °C';

    // Gauges - Reseau: -100 to 400 range
    this.setGauge('gaugeNet', watt, -100, 400, ['var(--danger)', 'var(--success)', 'var(--warning)']);
    const gn = document.getElementById('gaugeNetVal');
    if (gn) gn.textContent = watt;

    // Power: 0 to 1500
    this.setGauge('gaugePower', dimmer, 0, 1500, ['var(--danger)', 'var(--warning)', 'var(--success)']);
    const gp = document.getElementById('gaugePowerVal');
    if (gp) gp.textContent = dimmer;

    // Temp: 0 to 90
    this.setGauge('gaugeTemp', temp, 0, 90, ['var(--warning)', 'var(--success)', 'var(--danger)']);
    const gt = document.getElementById('gaugeTempVal');
    if (gt) gt.textContent = Math.round(temp);

    // States
    this.setState('st-minuteur', d.minuteur == 1 || d.minuteur === true, 'Minuteur', 'Non actif', 'warn', 'off');
    this.setState('st-dallas', d.dallas == 0 || d.dallas === false, 'Connect', 'Disconnect', 'on', 'danger');
    this.setState('st-security', d.security == 0 || d.security === false, 'OK', 'Refroidissement', 'on', 'danger');
    this.setState('st-relay1', d.relay1 == 1 || d.relay1 === true, 'ON', 'OFF', 'on', 'off');
    this.setState('st-relay2', d.relay2 == 1 || d.relay2 === true, 'ON', 'OFF', 'on', 'off');

    const boostOn = d.boost == 1 || d.boost === true;
    this.setState('st-boost', boostOn, 'ON', 'OFF', 'on', 'off');
    const bi = document.getElementById('st-boost-info');
    if (bi) {
      const mt = d.boost_max_temp || 'N/A';
      bi.textContent = boostOn && d.boost_endtime
        ? `Fin: ${d.boost_endtime} - max: ${mt}°C` : `max: ${mt}°C`;
    }

    // Sidebar info
    const v = document.getElementById('sidebar-version');
    if (v && d.version) v.textContent = d.version;
    const r = document.getElementById('sidebar-rssi');
    if (r && d.RSSI !== undefined) r.textContent = 'RSSI: ' + d.RSSI + ' dBm';
    const n = document.getElementById('sidebar-name');
    if (n && d.name) { n.textContent = d.name; document.title = 'PV Router - ' + d.name; }
  },

  setState(id, active, onText, offText, onClass, offClass) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = active ? onText : offText;
    el.className = 'state-value ' + (active ? onClass : offClass);
    if (el.dataset.action) el.classList.add('clickable');
  },

  async toggleAction(action) {
    try {
      if (action === 'boost') await fetch('/boost');
      else if (action === 'screen') await fetch('/get?servermode=screen');
      setTimeout(() => this.refreshDashboard(), 500);
    } catch (e) { console.error('Toggle error:', e); }
  },

  // ---------- Config ----------
  async loadConfig() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">Configuration</h2>
      <div style="display:flex;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="btn-apply">Appliquer</button>
        <button class="btn btn-success btn-sm" id="btn-save">Sauvegarder sur la flash</button>
        <button class="btn btn-outline btn-sm" id="btn-screen" data-action="screen">ON/OFF OLED</button>
      </div>
      <div id="config-status" class="alert alert-success" style="display:none"></div>
      <form id="configForm">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">Dimmer Distant</div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>Dimmer IP</label>
                <input type="text" class="form-control" id="dimmer" placeholder="none">
                <div class="help" id="dimmer-link"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">Dimmer Local</div>
          <div class="card-body">
            <div class="form-check">
              <input type="checkbox" id="dimmerlocal">
              <label for="dimmerlocal">Activer Dimmer Local</label>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Limiteur local (%)</label>
                <input type="number" class="form-control" id="Fusiblelocal">
              </div>
              <div class="form-group">
                <label>Charge connectee (W)</label>
                <input type="number" class="form-control" id="resistance">
              </div>
              <div class="form-group">
                <label>Max Temp (°C)</label>
                <input type="number" class="form-control" id="maxtemp">
              </div>
              <div class="form-group">
                <label>Min Temp (°C)</label>
                <input type="number" class="form-control" id="mintemp">
              </div>
              <div class="form-group">
                <label>Trigger (%)</label>
                <input type="number" class="form-control" id="trigger">
              </div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">PV Routeur</div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>Delta - Limite Conso (W)</label>
                <input type="number" class="form-control" id="delta">
                <div class="help">Le routage diminuera en dessous</div>
              </div>
              <div class="form-group">
                <label>Delta Neg - Limite Injection (W)</label>
                <input type="number" class="form-control" id="deltaneg">
                <div class="help">Le routage augmentera au dessus</div>
              </div>
              <div class="form-group">
                <label>Facteur de correction</label>
                <input type="text" class="form-control" id="facteur">
                <div class="help">Default: 0.86</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Voltage (V)</label>
                <input type="number" class="form-control" id="voltage">
              </div>
              <div class="form-group">
                <label>Offset (W)</label>
                <input type="number" class="form-control" id="offset">
                <div class="help">Conseille: -130</div>
              </div>
              <div class="form-group">
                <label>SCT (A/1V)</label>
                <input type="number" class="form-control" id="SCT_13">
              </div>
            </div>
            <div class="form-check">
              <input type="checkbox" id="polarity">
              <label for="polarity">Inversion de la mesure (+/-)</label>
            </div>
            <div class="form-row" style="margin-top:1rem">
              <div class="form-group">
                <label>Screen switch off (s)</label>
                <input type="number" class="form-control" id="screentime">
                <div class="help">0 = toujours allume</div>
              </div>
            </div>
            <div class="form-check">
              <input type="checkbox" id="flip">
              <label for="flip">Flip screen</label>
            </div>
          </div>
        </div>
      </form>
    `;

    try {
      const res = await fetch('/config');
      const data = await res.json();
      for (const key in data) {
        const el = document.getElementById(key);
        if (el) {
          if (el.type === 'checkbox') el.checked = data[key];
          else el.value = data[key];
        }
      }
      // Dimmer link
      const dv = data.dimmer;
      if (dv && dv !== 'none') {
        document.getElementById('dimmer-link').innerHTML =
          `<a href="http://${this.esc(dv)}" target="_blank" rel="noopener">http://${this.esc(dv)}</a>`;
      }
    } catch (e) { console.error('Config load error:', e); }

    document.getElementById('btn-apply').addEventListener('click', () => this.applyConfig());
    document.getElementById('btn-save').addEventListener('click', () => this.saveFlash('config-status'));
    document.getElementById('btn-screen').addEventListener('click', () => this.toggleAction('screen'));

    // Checkboxes that need servermode
    ['dimmerlocal', 'polarity', 'flip'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        fetch('/get?servermode=' + id);
      });
    });

    document.getElementById('dimmer').addEventListener('input', function () {
      const v = this.value;
      const link = document.getElementById('dimmer-link');
      if (v && v !== 'none') {
        link.innerHTML = `<a href="http://${App.esc(v)}" target="_blank" rel="noopener">http://${App.esc(v)}</a>`;
      } else link.innerHTML = '';
    });
  },

  async applyConfig() {
    const params = new URLSearchParams();
    ['dimmer', 'delta', 'deltaneg', 'facteur', 'resistance', 'screentime',
     'Fusiblelocal', 'maxtemp', 'voltage', 'offset', 'SCT_13', 'trigger', 'mintemp'].forEach(f => {
      const el = document.getElementById(f);
      if (el) params.set(f, el.value);
    });
    try {
      await fetch('/get?' + params.toString());
      this.showStatus('config-status', 'Configuration appliquee');
    } catch (e) { this.showStatus('config-status', 'Erreur', true); }
  },

  // ---------- WiFi ----------
  async loadWifi() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">Configuration WiFi</h2>
      <div id="wifi-status" class="alert alert-success" style="display:none"></div>
      <div class="card" style="max-width:500px">
        <div class="card-header">WiFi</div>
        <div class="card-body">
          <form id="wifiForm">
            <div class="form-group">
              <label>SSID</label>
              <input type="text" class="form-control" id="ssid">
            </div>
            <div class="form-group">
              <label>Mot de passe</label>
              <input type="password" class="form-control" id="password">
            </div>
            <div class="form-check">
              <input type="checkbox" id="no_ap">
              <label for="no_ap">Desactiver le mode AP</label>
            </div>
            <div class="help" style="margin:1rem 0;color:var(--danger)">Attention: le mode AP sera desactive apres reboot et ne pourra pas etre reactive si vous changez de reseau.</div>
            <button type="submit" class="btn btn-primary btn-sm">Appliquer</button>
          </form>
        </div>
      </div>
    `;

    try {
      const res = await fetch('/getwifi');
      const data = await res.json();
      for (const key in data) {
        const el = document.getElementById(key);
        if (el) {
          if (el.type === 'checkbox') el.checked = data[key];
          else el.value = data[key];
        }
      }
    } catch (e) { console.error('WiFi load error:', e); }

    document.getElementById('wifiForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const params = new URLSearchParams({
        ssid: document.getElementById('ssid').value,
        password: document.getElementById('password').value,
        no_ap: document.getElementById('no_ap').checked,
      });
      try {
        await fetch('/get?' + params.toString());
        this.showStatus('wifi-status', 'Configuration appliquee');
      } catch (err) { this.showStatus('wifi-status', 'Erreur', true); }
    });
  },

  // ---------- MQTT ----------
  async loadMqtt() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">Configuration MQTT</h2>
      <div style="display:flex;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="btn-apply-mqtt">Appliquer</button>
        <button class="btn btn-success btn-sm" id="btn-save-mqtt">Sauvegarder</button>
      </div>
      <div id="mqtt-status" class="alert alert-success" style="display:none"></div>
      <form id="mqttForm">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">Connexion MQTT</div>
          <div class="card-body">
            <div class="form-check">
              <input type="checkbox" id="MQTT">
              <label for="MQTT">Activer MQTT</label>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Serveur</label><input type="text" class="form-control" id="server"></div>
              <div class="form-group"><label>Port</label><input type="number" class="form-control" id="port"></div>
              <div class="form-group"><label>Topic</label><input type="text" class="form-control" id="topic"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>User</label><input type="text" class="form-control" id="user"></div>
              <div class="form-group"><label>Password</label><input type="password" class="form-control" id="password"></div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">Domoticz IDX</div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group"><label>IDX Grid Power</label><input type="number" class="form-control" id="IDX"></div>
              <div class="form-group"><label>IDX Routed Power</label><input type="number" class="form-control" id="IDXDIMMER"></div>
              <div class="form-group"><label>IDX Temperature</label><input type="number" class="form-control" id="IDXDALLAS"></div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">Home Assistant</div>
          <div class="card-body">
            <div class="form-check">
              <input type="checkbox" id="HA">
              <label for="HA">Activer HA MQTT</label>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">Shelly</div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>Shelly EM IP (ou "none")</label>
                <input type="text" class="form-control" id="EM" placeholder="none">
              </div>
            </div>
            <div class="form-check">
              <input type="checkbox" id="TRI">
              <label for="TRI">Triphase (Shelly 3EM)</label>
            </div>
          </div>
        </div>
      </form>
    `;

    try {
      const res = await fetch('/getmqtt');
      const data = await res.json();
      for (const key in data) {
        const el = document.getElementById(key);
        if (el) {
          if (el.type === 'checkbox') el.checked = data[key];
          else el.value = data[key];
        }
      }
    } catch (e) { console.error('MQTT load error:', e); }

    // Checkboxes via servermode
    ['MQTT', 'HA', 'TRI'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        fetch('/get?servermode=' + id);
      });
    });

    document.getElementById('btn-apply-mqtt').addEventListener('click', async () => {
      const params = new URLSearchParams();
      params.set('mqttserver', document.getElementById('server').value);
      params.set('mqttport', document.getElementById('port').value);
      params.set('publish', document.getElementById('topic').value);
      params.set('mqttuser', document.getElementById('user').value);
      params.set('mqttpassword', document.getElementById('password').value);
      params.set('idx', document.getElementById('IDX').value);
      params.set('idxdimmer', document.getElementById('IDXDIMMER').value);
      params.set('idxdallas', document.getElementById('IDXDALLAS').value);
      params.set('EM', document.getElementById('EM').value);
      try {
        await fetch('/get?' + params.toString());
        this.showStatus('mqtt-status', 'Configuration appliquee');
      } catch (e) { this.showStatus('mqtt-status', 'Erreur', true); }
    });

    document.getElementById('btn-save-mqtt').addEventListener('click', () => this.saveFlash('mqtt-status'));
  },

  // ---------- Minuteur ----------
  async loadMinuteur() {
    const tabs = ['dimmer', 'batterie', 'relay1', 'relay2'];
    const labels = { dimmer: 'Dimmer', batterie: 'Batterie', relay1: 'Relais 1', relay2: 'Relais 2' };

    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">Minuteur d'appoint</h2>
      <div id="minuteur-status" class="alert alert-success" style="display:none"></div>
      <div class="card">
        <div class="card-header">
          <div class="tabs" style="border:none;margin:0">
            ${tabs.map((t, i) => `<button class="tab-btn ${i === 0 ? 'active' : ''}" data-tab="${t}">${labels[t]}</button>`).join('')}
          </div>
        </div>
        <div class="card-body">
          ${tabs.map((t, i) => `
            <div class="tab-panel ${i === 0 ? 'active' : ''}" id="tab-${t}">
              <form id="form-${t}">
                <div class="form-row">
                  <div class="form-group">
                    <label>Heure de demarrage (HH:MM)</label>
                    <input type="text" class="form-control" id="heure_demarrage_${t}" placeholder="HH:MM">
                  </div>
                  <div class="form-group">
                    <label>Heure d'arret (HH:MM)</label>
                    <input type="text" class="form-control" id="heure_arret_${t}" placeholder="HH:MM">
                  </div>
                  <div class="form-group">
                    <label>${t === 'batterie' ? "Temperature d'activation (°C)" : 'Temperature consigne (°C)'}</label>
                    <input type="number" class="form-control" id="temperature_${t}">
                  </div>
                  ${t === 'dimmer' ? `<div class="form-group"><label>Puissance (%)</label><input type="number" class="form-control" id="puissance_${t}"></div>` : ''}
                  ${t === 'batterie' ? `<div class="form-group"><label>Offset delta batterie (W)</label><input type="number" class="form-control" id="puissance_${t}"><div class="help">Valeur recommandee: 100W</div></div>` : ''}
                </div>
                <button type="submit" class="btn btn-primary btn-sm" style="margin-top:.5rem">Appliquer ${labels[t]}</button>
              </form>
              ${t === 'batterie' ? `<div style="margin-top:1rem;font-size:.82rem;color:var(--text-muted)"><p>Ce minuteur modifie le declenchement de la regulation pour donner la priorite a la charge batterie quand la temperature depasse la consigne.</p></div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });

    // Load
    for (const t of tabs) {
      try {
        const res = await fetch('/getminuteur?' + t);
        const data = await res.json();
        ['heure_demarrage', 'heure_arret', 'temperature', 'puissance'].forEach(f => {
          const el = document.getElementById(f + '_' + t);
          if (el && data[f] !== undefined) el.value = data[f];
        });
      } catch (e) { console.error('Minuteur load:', e); }
    }

    // Submit
    for (const t of tabs) {
      document.getElementById('form-' + t).addEventListener('submit', async (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        params.set('heure_demarrage', document.getElementById('heure_demarrage_' + t).value);
        params.set('heure_arret', document.getElementById('heure_arret_' + t).value);
        params.set('temperature', document.getElementById('temperature_' + t).value);
        const pEl = document.getElementById('puissance_' + t);
        if (pEl) params.set('puissance', pEl.value);
        try {
          await fetch('/setminuteur?' + t + '&' + params.toString());
          this.showStatus('minuteur-status', labels[t] + ' applique');
        } catch (err) { this.showStatus('minuteur-status', 'Erreur', true); }
      });
    }
  },

  // ---------- Envoy ----------
  async loadEnvoy() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">Configuration Enphase/Envoy</h2>
      <div id="envoy-status" class="alert alert-success" style="display:none"></div>
      <div class="card" style="max-width:500px">
        <div class="card-header">Envoy</div>
        <div class="card-body">
          <form id="envoyForm">
            <div class="form-group"><label>Serveur</label><input type="text" class="form-control" id="envoy-server"></div>
            <div class="form-group"><label>Port</label><input type="text" class="form-control" id="envoy-port"></div>
            <div class="form-group"><label>Modele</label><input type="text" class="form-control" id="envoy-modele"></div>
            <div class="form-group"><label>Version</label><input type="number" class="form-control" id="envoy-version"></div>
            <div class="form-group"><label>Token</label><input type="text" class="form-control" id="envoy-token"></div>
            <button type="submit" class="btn btn-primary btn-sm" style="margin-top:.5rem">Appliquer</button>
          </form>
        </div>
      </div>
    `;

    try {
      const res = await fetch('/enphase.json');
      if (res.ok) {
        const data = await res.json();
        const map = { 'envoy-server': 'IP_ENPHASE', 'envoy-port': 'PORT_ENPHASE', 'envoy-modele': 'Type', 'envoy-version': 'version', 'envoy-token': 'token' };
        for (const [elId, key] of Object.entries(map)) {
          const el = document.getElementById(elId);
          if (el && data[key] !== undefined) el.value = data[key];
        }
      }
    } catch (e) { console.error('Envoy load:', e); }

    document.getElementById('envoyForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const params = new URLSearchParams({
        envoyserver: document.getElementById('envoy-server').value,
        envoyport: document.getElementById('envoy-port').value,
        envmodele: document.getElementById('envoy-modele').value,
        envversion: document.getElementById('envoy-version').value,
        envtoken: document.getElementById('envoy-token').value,
      });
      try {
        await fetch('/get?' + params.toString());
        this.showStatus('envoy-status', 'Configuration appliquee');
      } catch (err) { this.showStatus('envoy-status', 'Erreur', true); }
    });
  },

  // ---------- Log ----------
  loadLog() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">Console Logs</h2>
      <textarea class="log-console" id="logArea" readonly></textarea>
    `;
    this.logId = 0;
    this.fetchLog();
  },

  async fetchLog() {
    if (this.currentPage !== 'log') return;
    try {
      const res = await fetch('/cs?c2=' + this.logId);
      const text = await res.text();
      const parts = text.split(/\}1/);
      this.logId = parts.shift();
      if (parts.shift() === '0') {
        const area = document.getElementById('logArea');
        if (area) area.value = '';
      }
      const content = parts.shift();
      if (content && content.length > 0) {
        const area = document.getElementById('logArea');
        if (area) { area.value += content; area.scrollTop = area.scrollHeight; }
      }
    } catch (e) { console.error('Log error:', e); }
    this.logTimer = setTimeout(() => this.fetchLog(), 2500);
  },

  // ---------- Backup ----------
  loadBackup() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">Sauvegarde &amp; Restauration</h2>
      <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">
        <div class="card">
          <div class="card-header">Sauvegarder</div>
          <div class="card-body" style="text-align:center">
            <button class="btn btn-primary" id="btn-backup">
              <svg viewBox="0 0 16 16"><use href="/icons.svg#icon-backup"/></svg>
              Telecharger la sauvegarde
            </button>
            <div id="backup-log" style="margin-top:1rem;font-size:.82rem;text-align:left"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">Restaurer</div>
          <div class="card-body" style="text-align:center">
            <div class="form-group">
              <input type="file" class="form-control" id="restoreFile" accept=".json">
            </div>
            <button class="btn btn-primary btn-sm" id="btn-restore">Restaurer</button>
            <div style="margin-top:.75rem">
              <button class="btn btn-outline btn-sm" id="btn-save-restore">Sauvegarder sur la flash</button>
            </div>
            <div id="restore-log" style="margin-top:1rem;font-size:.82rem;text-align:left"></div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-backup').addEventListener('click', () => this.doBackup());
    document.getElementById('btn-restore').addEventListener('click', () => this.doRestore());
    document.getElementById('btn-save-restore').addEventListener('click', async () => {
      try {
        await fetch('/get?save=yes');
        this.appendLog('restore-log', 'Configuration sauvegardee sur la flash', 'success');
      } catch (e) {
        this.appendLog('restore-log', 'Erreur', 'danger');
      }
    });
  },

  async doBackup() {
    const log = 'backup-log';
    document.getElementById(log).innerHTML = '';
    const requests = [
      { title: 'Config generale', url: '/config', key: 'general' },
      { title: 'Config MQTT', url: '/getmqtt', key: 'mqtt' },
      { title: 'Minuteur dimmer', url: '/getminuteur?dimmer', key: 'dimmer_timer' },
      { title: 'Minuteur batterie', url: '/getminuteur?batterie', key: 'batterie_timer' },
      { title: 'Minuteur relais 1', url: '/getminuteur?relay1', key: 'relay1_timer' },
      { title: 'Minuteur relais 2', url: '/getminuteur?relay2', key: 'relay2_timer' },
    ];

    const backup = {};
    let hasError = false;

    for (const req of requests) {
      this.appendLog(log, req.title + '...', 'info');
      try {
        const res = await fetch(req.url);
        backup[req.key] = await res.json();
        this.replaceLastLog(log, req.title + ' OK', 'success');
      } catch (e) {
        this.replaceLastLog(log, req.title + ' ERREUR', 'danger');
        hasError = true;
      }
    }

    if (!hasError) {
      const now = new Date().toISOString().replace(/[TZ]/g, '-').replace(/\..+/, '');
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${now}-pvrouter-backup.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      this.appendLog(log, 'Telechargement lance', 'success');
    }
  },

  async doRestore() {
    const log = 'restore-log';
    document.getElementById(log).innerHTML = '';
    const input = document.getElementById('restoreFile');
    if (!input.files.length) {
      this.appendLog(log, 'Selectionnez un fichier', 'warn');
      return;
    }

    let data;
    try {
      const text = await input.files[0].text();
      data = JSON.parse(text);
      this.appendLog(log, 'Fichier charge', 'success');
    } catch (e) {
      this.appendLog(log, 'Fichier invalide ou corrompu', 'danger');
      return;
    }

    const toBool = v => v === true || v === 'true' || v === 1 || v === '1' || v === 'on';
    const generalToggles = ['dimmerlocal', 'polarity', 'flip'];
    const mqttToggles = ['MQTT', 'HA', 'TRI'];
    const mqttRemap = {
      server: 'mqttserver', port: 'mqttport', topic: 'publish',
      user: 'mqttuser', password: 'mqttpassword',
      IDX: 'idx', IDXDIMMER: 'idxdimmer', IDXDALLAS: 'idxdallas',
    };

    let currentGeneral = {};
    let currentMqtt = {};
    try { currentGeneral = await (await fetch('/config')).json(); } catch (e) {}
    try { currentMqtt = await (await fetch('/getmqtt')).json(); } catch (e) {}

    // Config generale (sans les toggles servermode)
    if (data.general) {
      this.appendLog(log, 'Config generale...', 'info');
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data.general)) {
        if (generalToggles.includes(k)) continue;
        params.set(k, v);
      }
      try {
        await fetch('/get?' + params.toString());
        this.replaceLastLog(log, 'Config generale OK', 'success');
      } catch (e) { this.replaceLastLog(log, 'Config generale ERREUR', 'danger'); }
    } else {
      this.appendLog(log, 'Config generale : absente du fichier', 'warn');
    }

    // Config MQTT (sans les toggles servermode, avec remap)
    if (data.mqtt) {
      this.appendLog(log, 'Config MQTT...', 'info');
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data.mqtt)) {
        if (mqttToggles.includes(k)) continue;
        params.set(mqttRemap[k] || k, v);
      }
      try {
        await fetch('/get?' + params.toString());
        this.replaceLastLog(log, 'Config MQTT OK', 'success');
      } catch (e) { this.replaceLastLog(log, 'Config MQTT ERREUR', 'danger'); }
    } else {
      this.appendLog(log, 'Config MQTT : absente du fichier', 'warn');
    }

    // Toggles servermode (bascule si l'etat differe)
    const applyToggle = async (key, target, current, label) => {
      if (target === undefined || current === undefined) return;
      if (toBool(target) === toBool(current)) return;
      try {
        await fetch('/get?servermode=' + key);
        this.appendLog(log, label + ' bascule -> ' + (toBool(target) ? 'ON' : 'OFF'), 'success');
      } catch (e) { this.appendLog(log, label + ' ERREUR', 'danger'); }
    };
    for (const key of generalToggles) {
      if (data.general) await applyToggle(key, data.general[key], currentGeneral[key], key);
    }
    for (const key of mqttToggles) {
      if (data.mqtt) await applyToggle(key, data.mqtt[key], currentMqtt[key], key);
    }

    // Minuteurs
    const timers = [
      ['dimmer_timer', 'dimmer', 'Minuteur dimmer'],
      ['batterie_timer', 'batterie', 'Minuteur batterie'],
      ['relay1_timer', 'relay1', 'Minuteur relais 1'],
      ['relay2_timer', 'relay2', 'Minuteur relais 2'],
    ];
    for (const [field, type, label] of timers) {
      if (!data[field]) {
        this.appendLog(log, label + ' : absent du fichier', 'warn');
        continue;
      }
      this.appendLog(log, label + '...', 'info');
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data[field])) params.set(k, v);
      try {
        await fetch('/setminuteur?' + type + '&' + params.toString());
        this.replaceLastLog(log, label + ' OK', 'success');
      } catch (e) { this.replaceLastLog(log, label + ' ERREUR', 'danger'); }
    }

    this.appendLog(log, 'Restauration terminee. Pensez a sauvegarder sur la flash.', 'info');
  },

  appendLog(containerId, text, type) {
    const colors = { success: 'var(--success)', danger: 'var(--danger)', warn: 'var(--warning)', info: 'var(--info)' };
    const icons = { success: '✅', danger: '⛔', warn: '❓', info: '⏳' };
    const el = document.getElementById(containerId);
    if (el) el.innerHTML += `<div style="color:${colors[type] || 'var(--text)'};padding:2px 0">${icons[type] || ''} ${this.esc(text)}</div>`;
  },

  replaceLastLog(containerId, text, type) {
    const el = document.getElementById(containerId);
    if (el && el.lastElementChild) {
      const colors = { success: 'var(--success)', danger: 'var(--danger)', warn: 'var(--warning)', info: 'var(--info)' };
      const icons = { success: '✅', danger: '⛔', warn: '❓', info: '⏳' };
      el.lastElementChild.style.color = colors[type] || 'var(--text)';
      el.lastElementChild.textContent = (icons[type] || '') + ' ' + text;
    }
  },

  // ---------- Helpers ----------
  showStatus(id, msg, isError) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert ' + (isError ? 'alert-danger' : 'alert-success') + ' show';
    setTimeout(() => el.classList.remove('show'), 4000);
  },

  async saveFlash(statusId) {
    try {
      await fetch('/get?save=yes');
      this.showStatus(statusId, 'Configuration sauvegardee sur la flash');
    } catch (e) { this.showStatus(statusId, 'Erreur', true); }
  },

  stopRefresh() {
    if (this.refreshTimer) { clearInterval(this.refreshTimer); this.refreshTimer = null; }
    if (this.logTimer) { clearTimeout(this.logTimer); this.logTimer = null; }
  },

  esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; },

  initTheme() {
    if (localStorage.getItem('theme') === 'dark') document.documentElement.classList.add('dark-theme');
    document.getElementById('themeToggle').addEventListener('click', () => {
      document.documentElement.classList.toggle('dark-theme');
      const isDark = document.documentElement.classList.contains('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      const use = document.querySelector('#themeToggle use');
      if (use) use.setAttribute('href', '/icons.svg#' + (isDark ? 'icon-sun' : 'icon-moon'));
    });
  },

  initClock() {
    const el = document.getElementById('clock');
    const update = () => {
      const d = new Date();
      el.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map(n => String(n).padStart(2, '0')).join(':');
    };
    update();
    setInterval(update, 1000);
  },

  initMenuToggle() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    document.getElementById('menuToggle').addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('show');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());

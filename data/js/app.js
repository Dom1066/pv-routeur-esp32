/* ========================================
   PV Router - SPA Application
   ======================================== */

const App = {
  refreshTimer: null,
  logTimer: null,
  logId: 0,
  currentPage: null,

  init() {
    if (window.I18n) I18n.init();
    this.initTheme();
    this.initClock();
    this.initMenuToggle();
    this.initLang();
    this.initReboot();
    this.route(location.hash || '#dashboard');
    window.addEventListener('hashchange', () => this.route(location.hash));
    document.addEventListener('langchange', () => {
      if (this.currentPage) this.route('#' + this.currentPage);
    });
  },

  t(key, vars) { return window.I18n ? I18n.t(key, vars) : key; },

  initLang() {
    const sel = document.getElementById('langSelect');
    if (!sel || !window.I18n) return;
    sel.value = I18n.current;
    sel.addEventListener('change', () => I18n.set(sel.value));
  },

  initReboot() {
    const btn = document.getElementById('rebootBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (confirm(this.t('common.confirm_reboot_router'))) fetch('/reboot');
    });
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
      <h2 class="page-title">${this.t('page.dashboard')}</h2>
      <div class="card-grid">
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon blue"><svg viewBox="0 0 16 16"><use href="/icons.svg#icon-bolt"/></svg></div>
            <div class="stat-info">
              <div class="stat-label">${this.t('dash.grid')}</div>
              <div class="stat-value" id="dash-state">--</div>
              <div class="stat-sub" id="dash-watt">-- W</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon green"><svg viewBox="0 0 16 16"><use href="/icons.svg#icon-bolt"/></svg></div>
            <div class="stat-info">
              <div class="stat-label">${this.t('dash.routed')}</div>
              <div class="stat-value" id="dash-dimmer">-- W</div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="stat-card">
            <div class="stat-icon cyan"><svg viewBox="0 0 16 16"><use href="/icons.svg#icon-thermometer"/></svg></div>
            <div class="stat-info">
              <div class="stat-label">${this.t('dash.temperature')}</div>
              <div class="stat-value" id="dash-temp">-- °C</div>
            </div>
          </div>
        </div>
      </div>
      <div class="card-grid">
        <div class="card">
          <div class="card-header">${this.t('dash.grid')}</div>
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
          <div class="card-header">${this.t('dash.routed')}</div>
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
          <div class="card-header">${this.t('dash.temperature')} Dallas</div>
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
          <div class="card-header">${this.t('dash.system_states')}</div>
          <div class="card-body">
            <div class="state-list">
              <div class="state-item">
                <span class="state-label">${this.t('dash.timer')}</span>
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
                <span class="state-label">${this.t('dash.relay1')}</span>
                <span class="state-value off" id="st-relay1">N/A</span>
              </div>
              <div class="state-item">
                <span class="state-label">${this.t('dash.relay2')}</span>
                <span class="state-value off" id="st-relay2">N/A</span>
              </div>
              <div class="state-item">
                <div>
                  <span class="state-label">${this.t('dash.boost')}</span>
                  <div class="state-sub" id="st-boost-info">${this.t('state.boost_max', { max: 'N/A' })}</div>
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
    this.setState('st-minuteur', d.minuteur == 1 || d.minuteur === true, this.t('dash.timer'), this.t('state.inactive'), 'warn', 'off');
    this.setState('st-dallas', d.dallas == 0 || d.dallas === false, 'Connect', 'Disconnect', 'on', 'danger');
    this.setState('st-security', d.security == 0 || d.security === false, 'OK', this.t('state.cooling'), 'on', 'danger');
    this.setState('st-relay1', d.relay1 == 1 || d.relay1 === true, this.t('state.on'), this.t('state.off'), 'on', 'off');
    this.setState('st-relay2', d.relay2 == 1 || d.relay2 === true, this.t('state.on'), this.t('state.off'), 'on', 'off');

    const boostOn = d.boost == 1 || d.boost === true;
    this.setState('st-boost', boostOn, this.t('state.on'), this.t('state.off'), 'on', 'off');
    const bi = document.getElementById('st-boost-info');
    if (bi) {
      const mt = d.boost_max_temp || 'N/A';
      bi.textContent = boostOn && d.boost_endtime
        ? this.t('state.boost_info', { end: d.boost_endtime, max: mt })
        : this.t('state.boost_max', { max: mt });
    }

    // Sidebar info
    const v = document.getElementById('sidebar-version');
    if (v && d.version) v.textContent = d.version;
    const r = document.getElementById('sidebar-rssi');
    if (r && d.RSSI !== undefined) r.textContent = 'RSSI: ' + d.RSSI + ' dBm';
    const n = document.getElementById('sidebar-name');
    if (n && d.name) { n.textContent = d.name; document.title = 'PV Router - ' + d.name; }

    // Topbar WiFi badge based on RSSI
    const wifiBadge = document.getElementById('topbar-status');
    if (wifiBadge) {
      const connected = d.RSSI !== undefined && d.RSSI !== null && d.RSSI !== 0 && d.RSSI !== -127;
      wifiBadge.classList.toggle('on', connected);
      wifiBadge.classList.toggle('off', !connected);
    }
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
      <h2 class="page-title">${this.t('page.config')}</h2>
      <div style="display:flex;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="btn-apply">${this.t('btn.apply')}</button>
        <button class="btn btn-success btn-sm" id="btn-save">${this.t('btn.save_flash')}</button>
        <button class="btn btn-outline btn-sm" id="btn-screen" data-action="screen">${this.t('btn.onoff_oled')}</button>
      </div>
      <div id="config-status" class="alert alert-success" style="display:none"></div>
      <form id="configForm">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">${this.t('config.remote_dimmer')}</div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>${this.t('form.dimmer_ip')}</label>
                <input type="text" class="form-control" id="dimmer" placeholder="none">
                <div class="help" id="dimmer-link"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">${this.t('config.local_dimmer_card')}</div>
          <div class="card-body">
            <div class="form-check">
              <input type="checkbox" id="dimmerlocal">
              <label for="dimmerlocal">${this.t('form.activate_local_dimmer')}</label>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>${this.t('form.local_limiter')}</label>
                <input type="number" class="form-control" id="Fusiblelocal">
              </div>
              <div class="form-group">
                <label>${this.t('form.connected_load')}</label>
                <input type="number" class="form-control" id="resistance">
              </div>
              <div class="form-group"> 
                <label>${this.t('form.connected_load2')}</label>
                <input type="number" class="form-control" id="resistance2">
              </div>
              <div class="form-group">
                <label>${this.t('form.connected_load3')}</label>
                <input type="number" class="form-control" id="resistance3">
              </div>  
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>${this.t('form.max_temp')}</label>
                <input type="number" class="form-control" id="maxtemp">
              </div>
              <div class="form-group">
                <label>${this.t('form.min_temp')}</label>
                <input type="number" class="form-control" id="mintemp">
              </div>
              <div class="form-group">
                <label>${this.t('form.trigger')}</label>
                <input type="number" class="form-control" id="trigger">
              </div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">${this.t('config.pv_router')}</div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>${this.t('form.delta_label')}</label>
                <input type="number" class="form-control" id="delta">
                <div class="help">${this.t('form.delta_help')}</div>
              </div>
              <div class="form-group">
                <label>${this.t('form.deltaneg_label')}</label>
                <input type="number" class="form-control" id="deltaneg">
                <div class="help">${this.t('form.deltaneg_help')}</div>
              </div>
              <div class="form-group">
                <label>${this.t('form.factor_label')}</label>
                <input type="text" class="form-control" id="facteur">
                <div class="help">${this.t('form.factor_help')}</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>${this.t('form.voltage_label')}</label>
                <input type="number" class="form-control" id="voltage">
              </div>
              <div class="form-group">
                <label>${this.t('form.offset_label')}</label>
                <input type="number" class="form-control" id="offset">
                <div class="help">${this.t('form.offset_help')}</div>
              </div>
              <div class="form-group">
                <label>${this.t('form.sct_label')}</label>
                <input type="number" class="form-control" id="SCT_13">
              </div>
            </div>
            <div class="form-check">
              <input type="checkbox" id="polarity">
              <label for="polarity">${this.t('form.polarity_invert')}</label>
            </div>
            <div class="form-row" style="margin-top:1rem">
              <div class="form-group">
                <label>${this.t('form.screen_off_label')}</label>
                <input type="number" class="form-control" id="screentime">
                <div class="help">${this.t('form.screen_off_help')}</div>
              </div>
            </div>
            <div class="form-check">
              <input type="checkbox" id="flip">
              <label for="flip">${this.t('form.flip_screen')}</label>
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
    ['dimmer', 'delta', 'deltaneg', 'facteur', 'resistance', 'resistance2', 'resistance3', 'screentime',
     'Fusiblelocal', 'maxtemp', 'voltage', 'offset', 'SCT_13', 'trigger', 'mintemp'].forEach(f => {
      const el = document.getElementById(f);
      if (el) params.set(f, el.value);
    });
    try {
      await fetch('/get?' + params.toString());
      this.showStatus('config-status', this.t('status.applied'));
    } catch (e) { this.showStatus('config-status', this.t('status.error'), true); }
  },

  // ---------- WiFi ----------
  async loadWifi() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">${this.t('page.wifi')}</h2>
      <div id="wifi-status" class="alert alert-success" style="display:none"></div>
      <div class="card" style="max-width:500px">
        <div class="card-header">${this.t('wifi.connection')}</div>
        <div class="card-body">
          <form id="wifiForm">
            <div class="form-group">
              <label>${this.t('wifi.ssid')}</label>
              <input type="text" class="form-control" id="ssid">
            </div>
            <div class="form-group">
              <label>${this.t('wifi.password')}</label>
              <input type="password" class="form-control" id="password">
            </div>
            <div class="form-check">
              <input type="checkbox" id="no_ap">
              <label for="no_ap">${this.t('wifi.disable_ap')}</label>
            </div>
            <div class="help" style="margin:1rem 0;color:var(--danger)">${this.t('wifi.ap_warning')}</div>
            <button type="submit" class="btn btn-primary btn-sm">${this.t('btn.apply')}</button>
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
        this.showStatus('wifi-status', this.t('status.applied'));
      } catch (err) { this.showStatus('wifi-status', this.t('status.error'), true); }
    });
  },

  // ---------- MQTT ----------
  async loadMqtt() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">${this.t('page.mqtt')}</h2>
      <div style="display:flex;gap:.75rem;margin-bottom:1rem;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" id="btn-apply-mqtt">${this.t('btn.apply')}</button>
        <button class="btn btn-success btn-sm" id="btn-save-mqtt">${this.t('btn.save')}</button>
      </div>
      <div id="mqtt-status" class="alert alert-success" style="display:none"></div>
      <form id="mqttForm">
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">${this.t('card.connection_mqtt')}</div>
          <div class="card-body">
            <div class="form-check">
              <input type="checkbox" id="MQTT">
              <label for="MQTT">${this.t('form.activate_mqtt')}</label>
            </div>
            <div class="form-row">
              <div class="form-group"><label>${this.t('form.server')}</label><input type="text" class="form-control" id="server"></div>
              <div class="form-group"><label>${this.t('form.port')}</label><input type="number" class="form-control" id="port"></div>
              <div class="form-group"><label>${this.t('form.topic')}</label><input type="text" class="form-control" id="topic"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>${this.t('form.user')}</label><input type="text" class="form-control" id="user"></div>
              <div class="form-group"><label>${this.t('form.password')}</label><input type="password" class="form-control" id="password"></div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">${this.t('card.domoticz_idx')}</div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group"><label>${this.t('form.idx_grid_label')}</label><input type="number" class="form-control" id="IDX"></div>
              <div class="form-group"><label>${this.t('form.idx_routed_label')}</label><input type="number" class="form-control" id="IDXDIMMER"></div>
              <div class="form-group"><label>${this.t('form.idx_dallas_label')}</label><input type="number" class="form-control" id="IDXDALLAS"></div>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">${this.t('card.home_assistant')}</div>
          <div class="card-body">
            <div class="form-check">
              <input type="checkbox" id="HA">
              <label for="HA">${this.t('form.activate_ha')}</label>
            </div>
          </div>
        </div>
        <div class="card" style="margin-bottom:1rem">
          <div class="card-header">${this.t('card.shelly')}</div>
          <div class="card-body">
            <div class="form-row">
              <div class="form-group">
                <label>${this.t('form.shelly_em_ip')}</label>
                <input type="text" class="form-control" id="EM" placeholder="none">
              </div>
            </div>
            <div class="form-check">
              <input type="checkbox" id="TRI">
              <label for="TRI">${this.t('form.triphase')}</label>
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
        this.showStatus('mqtt-status', this.t('status.applied'));
      } catch (e) { this.showStatus('mqtt-status', this.t('status.error'), true); }
    });

    document.getElementById('btn-save-mqtt').addEventListener('click', () => this.saveFlash('mqtt-status'));
  },

  // ---------- Minuteur ----------
  async loadMinuteur() {
    const tabs = ['dimmer', 'batterie', 'relay1', 'relay2'];
    const labels = {
      dimmer: this.t('tab.dimmer'),
      batterie: this.t('tab.batterie'),
      relay1: this.t('tab.relay1'),
      relay2: this.t('tab.relay2'),
    };

    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">${this.t('page.minuteur')}</h2>
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
                    <label>${this.t('form.heure_demarrage')}</label>
                    <input type="text" class="form-control" id="heure_demarrage_${t}" placeholder="HH:MM">
                  </div>
                  <div class="form-group">
                    <label>${this.t('form.heure_arret')}</label>
                    <input type="text" class="form-control" id="heure_arret_${t}" placeholder="HH:MM">
                  </div>
                  <div class="form-group">
                    <label>${t === 'batterie' ? this.t('form.battery_temp') : this.t('form.temperature_consigne')}</label>
                    <input type="number" class="form-control" id="temperature_${t}">
                  </div>
                  ${t === 'dimmer' ? `<div class="form-group"><label>${this.t('form.puissance')}</label><input type="number" class="form-control" id="puissance_${t}"></div>` : ''}
                  ${t === 'batterie' ? `<div class="form-group"><label>${this.t('form.battery_offset')}</label><input type="number" class="form-control" id="puissance_${t}"><div class="help">${this.t('form.battery_offset_help')}</div></div>` : ''}
                </div>
                <button type="submit" class="btn btn-primary btn-sm" style="margin-top:.5rem">${this.t('btn.apply_target', { target: labels[t] })}</button>
              </form>
              ${t === 'batterie' ? `<div style="margin-top:1rem;font-size:.82rem;color:var(--text-muted)"><p>${this.t('minuteur.batterie_help')}</p></div>` : ''}
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
          this.showStatus('minuteur-status', this.t('status.applied_target', { target: labels[t] }));
        } catch (err) { this.showStatus('minuteur-status', this.t('status.error'), true); }
      });
    }
  },

  // ---------- Envoy ----------
  async loadEnvoy() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">${this.t('page.envoy')}</h2>
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
        this.showStatus('envoy-status', this.t('status.applied'));
      } catch (err) { this.showStatus('envoy-status', this.t('status.error'), true); }
    });
  },

  // ---------- Log ----------
  loadLog() {
    document.getElementById('pageContent').innerHTML = `
      <h2 class="page-title">${this.t('page.log')}</h2>
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
      <h2 class="page-title">${this.t('page.backup')}</h2>
      <div class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">
        <div class="card">
          <div class="card-header">${this.t('backup.card_backup')}</div>
          <div class="card-body" style="text-align:center">
            <button class="btn btn-primary" id="btn-backup">
              <svg viewBox="0 0 16 16"><use href="/icons.svg#icon-backup"/></svg>
              ${this.t('btn.download_backup')}
            </button>
            <div id="backup-log" style="margin-top:1rem;font-size:.82rem;text-align:left"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">${this.t('backup.card_restore')}</div>
          <div class="card-body" style="text-align:center">
            <div class="form-group">
              <input type="file" class="form-control" id="restoreFile" accept=".json">
            </div>
            <button class="btn btn-primary btn-sm" id="btn-restore">${this.t('btn.restore')}</button>
            <div style="margin-top:.75rem">
              <button class="btn btn-outline btn-sm" id="btn-save-restore">${this.t('btn.save_flash')}</button>
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
        this.appendLog('restore-log', this.t('status.saved_flash'), 'success');
      } catch (e) {
        this.appendLog('restore-log', this.t('status.error'), 'danger');
      }
    });
  },

  async doBackup() {
    const log = 'backup-log';
    document.getElementById(log).innerHTML = '';
    const requests = [
      { title: this.t('backup.req.general'), url: '/config', key: 'general' },
      { title: this.t('backup.req.mqtt'), url: '/getmqtt', key: 'mqtt' },
      { title: this.t('backup.req.timer_dimmer'), url: '/getminuteur?dimmer', key: 'dimmer_timer' },
      { title: this.t('backup.req.timer_batterie'), url: '/getminuteur?batterie', key: 'batterie_timer' },
      { title: this.t('backup.req.timer_relay1'), url: '/getminuteur?relay1', key: 'relay1_timer' },
      { title: this.t('backup.req.timer_relay2'), url: '/getminuteur?relay2', key: 'relay2_timer' },
    ];

    const backup = {};
    let hasError = false;

    for (const req of requests) {
      this.appendLog(log, this.t('backup.loading', { title: req.title }), 'info');
      try {
        const res = await fetch(req.url);
        backup[req.key] = await res.json();
        this.replaceLastLog(log, this.t('backup.ok', { title: req.title }), 'success');
      } catch (e) {
        this.replaceLastLog(log, this.t('backup.fail', { title: req.title }), 'danger');
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
      this.appendLog(log, this.t('backup.download_started'), 'success');
    }
  },

  async doRestore() {
    const log = 'restore-log';
    document.getElementById(log).innerHTML = '';
    const input = document.getElementById('restoreFile');
    if (!input.files.length) {
      this.appendLog(log, this.t('backup.select_file'), 'warn');
      return;
    }

    let data;
    try {
      const text = await input.files[0].text();
      data = JSON.parse(text);
      this.appendLog(log, this.t('backup.file_loaded'), 'success');
    } catch (e) {
      this.appendLog(log, this.t('backup.file_invalid'), 'danger');
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

    const titleGen = this.t('backup.req.general');
    const titleMqtt = this.t('backup.req.mqtt');

    // Config generale (sans les toggles servermode)
    if (data.general) {
      this.appendLog(log, this.t('backup.loading', { title: titleGen }), 'info');
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data.general)) {
        if (generalToggles.includes(k)) continue;
        params.set(k, v);
      }
      try {
        await fetch('/get?' + params.toString());
        this.replaceLastLog(log, this.t('backup.ok', { title: titleGen }), 'success');
      } catch (e) { this.replaceLastLog(log, this.t('backup.fail', { title: titleGen }), 'danger'); }
    } else {
      this.appendLog(log, this.t('backup.absent', { title: titleGen }), 'warn');
    }

    // Config MQTT (sans les toggles servermode, avec remap)
    if (data.mqtt) {
      this.appendLog(log, this.t('backup.loading', { title: titleMqtt }), 'info');
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data.mqtt)) {
        if (mqttToggles.includes(k)) continue;
        params.set(mqttRemap[k] || k, v);
      }
      try {
        await fetch('/get?' + params.toString());
        this.replaceLastLog(log, this.t('backup.ok', { title: titleMqtt }), 'success');
      } catch (e) { this.replaceLastLog(log, this.t('backup.fail', { title: titleMqtt }), 'danger'); }
    } else {
      this.appendLog(log, this.t('backup.absent', { title: titleMqtt }), 'warn');
    }

    // Toggles servermode (bascule si l'etat differe)
    const applyToggle = async (key, target, current, label) => {
      if (target === undefined || current === undefined) return;
      if (toBool(target) === toBool(current)) return;
      try {
        await fetch('/get?servermode=' + key);
        this.appendLog(log, this.t('backup.toggle_to', { key: label, state: toBool(target) ? this.t('state.on') : this.t('state.off') }), 'success');
      } catch (e) { this.appendLog(log, this.t('backup.fail', { title: label }), 'danger'); }
    };
    for (const key of generalToggles) {
      if (data.general) await applyToggle(key, data.general[key], currentGeneral[key], key);
    }
    for (const key of mqttToggles) {
      if (data.mqtt) await applyToggle(key, data.mqtt[key], currentMqtt[key], key);
    }

    // Minuteurs
    const timers = [
      ['dimmer_timer', 'dimmer', this.t('backup.req.timer_dimmer')],
      ['batterie_timer', 'batterie', this.t('backup.req.timer_batterie')],
      ['relay1_timer', 'relay1', this.t('backup.req.timer_relay1')],
      ['relay2_timer', 'relay2', this.t('backup.req.timer_relay2')],
    ];
    for (const [field, type, label] of timers) {
      if (!data[field]) {
        this.appendLog(log, this.t('backup.absent', { title: label }), 'warn');
        continue;
      }
      this.appendLog(log, this.t('backup.loading', { title: label }), 'info');
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data[field])) params.set(k, v);
      try {
        await fetch('/setminuteur?' + type + '&' + params.toString());
        this.replaceLastLog(log, this.t('backup.ok', { title: label }), 'success');
      } catch (e) { this.replaceLastLog(log, this.t('backup.fail', { title: label }), 'danger'); }
    }

    this.appendLog(log, this.t('backup.restore_done'), 'info');
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
      this.showStatus(statusId, this.t('status.saved_flash'));
    } catch (e) { this.showStatus(statusId, this.t('status.error'), true); }
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

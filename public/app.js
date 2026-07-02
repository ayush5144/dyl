/* dyl — minimal Twilio dialer frontend */

// [name, ISO, dial code]
const COUNTRIES = [
  ['Afghanistan', 'AF', '+93'], ['Albania', 'AL', '+355'], ['Algeria', 'DZ', '+213'],
  ['Argentina', 'AR', '+54'], ['Armenia', 'AM', '+374'], ['Australia', 'AU', '+61'],
  ['Austria', 'AT', '+43'], ['Azerbaijan', 'AZ', '+994'], ['Bahrain', 'BH', '+973'],
  ['Bangladesh', 'BD', '+880'], ['Belarus', 'BY', '+375'], ['Belgium', 'BE', '+32'],
  ['Bolivia', 'BO', '+591'], ['Bosnia & Herzegovina', 'BA', '+387'], ['Botswana', 'BW', '+267'],
  ['Brazil', 'BR', '+55'], ['Bulgaria', 'BG', '+359'], ['Cambodia', 'KH', '+855'],
  ['Cameroon', 'CM', '+237'], ['Canada', 'CA', '+1'], ['Chile', 'CL', '+56'],
  ['China', 'CN', '+86'], ['Colombia', 'CO', '+57'], ['Costa Rica', 'CR', '+506'],
  ['Croatia', 'HR', '+385'], ['Cyprus', 'CY', '+357'], ['Czech Republic', 'CZ', '+420'],
  ['Denmark', 'DK', '+45'], ['Dominican Republic', 'DO', '+1'], ['Ecuador', 'EC', '+593'],
  ['Egypt', 'EG', '+20'], ['El Salvador', 'SV', '+503'], ['Estonia', 'EE', '+372'],
  ['Ethiopia', 'ET', '+251'], ['Finland', 'FI', '+358'], ['France', 'FR', '+33'],
  ['Georgia', 'GE', '+995'], ['Germany', 'DE', '+49'], ['Ghana', 'GH', '+233'],
  ['Greece', 'GR', '+30'], ['Guatemala', 'GT', '+502'], ['Honduras', 'HN', '+504'],
  ['Hong Kong', 'HK', '+852'], ['Hungary', 'HU', '+36'], ['Iceland', 'IS', '+354'],
  ['India', 'IN', '+91'], ['Indonesia', 'ID', '+62'], ['Iraq', 'IQ', '+964'],
  ['Ireland', 'IE', '+353'], ['Israel', 'IL', '+972'], ['Italy', 'IT', '+39'],
  ['Jamaica', 'JM', '+1'], ['Japan', 'JP', '+81'], ['Jordan', 'JO', '+962'],
  ['Kazakhstan', 'KZ', '+7'], ['Kenya', 'KE', '+254'], ['Kuwait', 'KW', '+965'],
  ['Laos', 'LA', '+856'], ['Latvia', 'LV', '+371'], ['Lebanon', 'LB', '+961'],
  ['Lithuania', 'LT', '+370'], ['Luxembourg', 'LU', '+352'], ['Macau', 'MO', '+853'],
  ['Malaysia', 'MY', '+60'], ['Maldives', 'MV', '+960'], ['Malta', 'MT', '+356'],
  ['Mexico', 'MX', '+52'], ['Moldova', 'MD', '+373'], ['Monaco', 'MC', '+377'],
  ['Mongolia', 'MN', '+976'], ['Morocco', 'MA', '+212'], ['Myanmar', 'MM', '+95'],
  ['Nepal', 'NP', '+977'], ['Netherlands', 'NL', '+31'], ['New Zealand', 'NZ', '+64'],
  ['Nicaragua', 'NI', '+505'], ['Nigeria', 'NG', '+234'], ['North Macedonia', 'MK', '+389'],
  ['Norway', 'NO', '+47'], ['Oman', 'OM', '+968'], ['Pakistan', 'PK', '+92'],
  ['Panama', 'PA', '+507'], ['Paraguay', 'PY', '+595'], ['Peru', 'PE', '+51'],
  ['Philippines', 'PH', '+63'], ['Poland', 'PL', '+48'], ['Portugal', 'PT', '+351'],
  ['Qatar', 'QA', '+974'], ['Romania', 'RO', '+40'], ['Russia', 'RU', '+7'],
  ['Rwanda', 'RW', '+250'], ['Saudi Arabia', 'SA', '+966'], ['Senegal', 'SN', '+221'],
  ['Serbia', 'RS', '+381'], ['Singapore', 'SG', '+65'], ['Slovakia', 'SK', '+421'],
  ['Slovenia', 'SI', '+386'], ['South Africa', 'ZA', '+27'], ['South Korea', 'KR', '+82'],
  ['Spain', 'ES', '+34'], ['Sri Lanka', 'LK', '+94'], ['Sweden', 'SE', '+46'],
  ['Switzerland', 'CH', '+41'], ['Taiwan', 'TW', '+886'], ['Tanzania', 'TZ', '+255'],
  ['Thailand', 'TH', '+66'], ['Tunisia', 'TN', '+216'], ['Turkey', 'TR', '+90'],
  ['Uganda', 'UG', '+256'], ['Ukraine', 'UA', '+380'], ['United Arab Emirates', 'AE', '+971'],
  ['United Kingdom', 'GB', '+44'], ['United States', 'US', '+1'], ['Uruguay', 'UY', '+598'],
  ['Uzbekistan', 'UZ', '+998'], ['Venezuela', 'VE', '+58'], ['Vietnam', 'VN', '+84'],
  ['Yemen', 'YE', '+967'], ['Zambia', 'ZM', '+260'], ['Zimbabwe', 'ZW', '+263']
];

const $ = (id) => document.getElementById(id);

function flagEmoji(iso) {
  return String.fromCodePoint(...[...iso].map((ch) => 127397 + ch.charCodeAt(0)));
}

/* Searchable country-code picker. Search by country name (any starting
   letters), ISO code, or dial code. allowNone adds a "no prefix" choice,
   meaning the number must be entered in full international format. */
function countryPicker(mountId, storageKey, { allowNone = false } = {}) {
  const mount = $(mountId);
  mount.className = 'cpicker';
  mount.innerHTML = `
    <button type="button" class="cpicker-btn"></button>
    <div class="cpicker-drop hidden">
      <input type="text" class="cpicker-search" placeholder="Search country…" />
      <div class="cpicker-list"></div>
    </div>`;
  const btn = mount.querySelector('.cpicker-btn');
  const drop = mount.querySelector('.cpicker-drop');
  const search = mount.querySelector('.cpicker-search');
  const listEl = mount.querySelector('.cpicker-list');

  const saved = localStorage.getItem(storageKey);
  let selected =
    saved === 'none' && allowNone
      ? null
      : COUNTRIES.find((c) => c[1] === saved) || COUNTRIES.find((c) => c[1] === 'US');

  const picker = {
    get dial() { return selected ? selected[2] : ''; },
    get iso() { return selected ? selected[1] : null; },
    onChange: null
  };

  function renderBtn() {
    btn.textContent = selected ? `${flagEmoji(selected[1])} ${selected[2]}` : '🌐 —';
    btn.title = selected ? selected[0] : 'No prefix — enter full number with +';
  }

  function choose(country) {
    selected = country;
    localStorage.setItem(storageKey, country ? country[1] : 'none');
    renderBtn();
    drop.classList.add('hidden');
    if (picker.onChange) picker.onChange();
  }

  function matches(q) {
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(([name, iso, dial]) => {
      const n = name.toLowerCase();
      return (
        n.startsWith(q) ||
        n.split(/[\s&]+/).some((w) => w.startsWith(q)) ||
        iso.toLowerCase().startsWith(q) ||
        dial.replace('+', '').startsWith(q.replace('+', ''))
      );
    });
  }

  function renderList() {
    const q = search.value.trim().toLowerCase();
    listEl.innerHTML = '';
    if (allowNone && !q) {
      const none = document.createElement('div');
      none.className = 'cpicker-item';
      none.innerHTML = `🌐 No prefix <span>full number</span>`;
      none.addEventListener('click', () => choose(null));
      listEl.appendChild(none);
    }
    for (const country of matches(q)) {
      const item = document.createElement('div');
      item.className = 'cpicker-item';
      const label = document.createElement('b');
      label.textContent = `${flagEmoji(country[1])} ${country[0]}`;
      const code = document.createElement('span');
      code.textContent = country[2];
      item.append(label, code);
      item.addEventListener('click', () => choose(country));
      listEl.appendChild(item);
    }
    if (!listEl.children.length) {
      listEl.innerHTML = '<div class="cpicker-empty">No match</div>';
    }
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.cpicker-drop').forEach((d) => {
      if (d !== drop) d.classList.add('hidden');
    });
    drop.classList.toggle('hidden');
    if (!drop.classList.contains('hidden')) {
      search.value = '';
      renderList();
      search.focus();
    }
  });
  search.addEventListener('input', renderList);
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = listEl.querySelector('.cpicker-item');
      if (first) first.click();
    } else if (e.key === 'Escape') {
      drop.classList.add('hidden');
    }
  });
  document.addEventListener('click', (e) => {
    if (!mount.contains(e.target)) drop.classList.add('hidden');
  });

  renderBtn();
  return picker;
}

/* Combine raw input with the picker's prefix and validate via libphonenumber.
   Returns { ok, full, country, reason }. */
function validateNumber(raw, picker) {
  raw = (raw || '').trim();
  if (!raw) return { ok: false, reason: '' };
  let full;
  if (raw.startsWith('+')) {
    full = '+' + raw.slice(1).replace(/\D/g, '');
  } else if (picker.dial) {
    full = picker.dial + raw.replace(/\D/g, '').replace(/^0+/, '');
  } else {
    return { ok: false, reason: 'No country selected — enter the full number starting with +' };
  }
  const parsed = libphonenumber.parsePhoneNumberFromString(full);
  if (!parsed || !parsed.isValid()) {
    return { ok: false, full, reason: 'Invalid number' };
  }
  const country = COUNTRIES.find((c) => c[1] === parsed.country);
  return { ok: true, full: parsed.number, country: country ? country[0] : parsed.country };
}

const state = {
  cfg: null,
  device: null,
  call: null,
  tab: 'recents',
  timer: null,
  seconds: 0,
  muted: false,
  dialCountry: null, // picker instances, set in wire()
  smsCountry: null,
  queue: JSON.parse(localStorage.getItem('dyl-queue') || '[]')
};

/* ---------- helpers ---------- */

async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(s) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  return m ? `${m}m ${s % 60}s` : `${s}s`;
}

function updateDialValidity() {
  const v = validateNumber($('dial-input').value, state.dialCountry);
  const hint = $('dial-hint');
  if (!$('dial-input').value.trim()) {
    hint.textContent = '';
    hint.classList.remove('bad');
  } else if (v.ok) {
    hint.textContent = `${v.full} · ${v.country}`;
    hint.classList.remove('bad');
  } else {
    hint.textContent = v.reason;
    hint.classList.add('bad');
  }
  $('call-btn').disabled = !v.ok;
  return v;
}

function toast(msg) {
  const hint = $('dial-hint');
  hint.textContent = msg;
  hint.classList.add('bad');
  setTimeout(() => {
    if (hint.textContent === msg) {
      hint.textContent = '';
      hint.classList.remove('bad');
    }
  }, 5000);
}

/* ---------- Twilio Device ---------- */

async function initDevice() {
  if (state.device) {
    state.device.destroy();
    state.device = null;
  }
  const { token } = await api('/token');
  const device = new Twilio.Device(token, {
    codecPreferences: ['opus', 'pcmu'],
    closeProtection: true
  });

  device.on('registered', () => {
    $('status-dot').classList.add('on');
    $('status-dot').title = 'Connected';
  });
  device.on('unregistered', () => {
    $('status-dot').classList.remove('on');
    $('status-dot').title = 'Disconnected';
  });
  device.on('error', (e) => {
    console.error('Device error', e);
    toast('Twilio error: ' + (e.message || e.code));
  });
  device.on('tokenWillExpire', async () => {
    const { token } = await api('/token');
    device.updateToken(token);
  });
  device.on('incoming', (call) => {
    state.call = call;
    showOverlay(call.parameters.From || 'Unknown', 'Incoming call', 'incoming');
    call.on('disconnect', endCallUi);
    call.on('cancel', endCallUi);
    call.on('reject', endCallUi);
  });

  await device.register();
  state.device = device;
}

/* ---------- Call UI ---------- */

function showOverlay(number, status, mode) {
  $('call-number').textContent = number;
  $('call-status').textContent = status;
  $('active-actions').classList.toggle('hidden', mode === 'incoming');
  $('incoming-actions').classList.toggle('hidden', mode !== 'incoming');
  $('mini-pad').classList.add('hidden');
  $('overlay').classList.remove('hidden');
}

function startTimer() {
  state.seconds = 0;
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    state.seconds++;
    const m = String(Math.floor(state.seconds / 60)).padStart(2, '0');
    const s = String(state.seconds % 60).padStart(2, '0');
    $('call-status').textContent = `${m}:${s}`;
  }, 1000);
}

function endCallUi() {
  clearInterval(state.timer);
  state.timer = null;
  state.call = null;
  state.muted = false;
  $('mute-btn').classList.remove('active');
  $('overlay').classList.add('hidden');
  if (state.tab === 'recents') setTimeout(loadTab, 1500);
  // Tee up the next queued number so a cold-call run flows: end call → Call.
  if (state.queue.length && !$('dial-input').value.trim()) {
    $('dial-input').value = state.queue.shift();
    saveQueue();
    updateDialValidity();
  }
}

/* ---------- Dial queue ---------- */

function saveQueue() {
  localStorage.setItem('dyl-queue', JSON.stringify(state.queue));
  renderQueue();
}

function renderQueue() {
  const el = $('queue');
  el.innerHTML = '';
  state.queue.forEach((num, i) => {
    const row = document.createElement('div');
    row.className = 'queue-item';
    const label = document.createElement('span');
    label.textContent = num;
    const callBtn = document.createElement('button');
    callBtn.textContent = 'Call';
    callBtn.addEventListener('click', () => {
      state.queue.splice(i, 1);
      saveQueue();
      makeCall(num).catch((e) => toast(e.message));
    });
    const rm = document.createElement('button');
    rm.textContent = '✕';
    rm.className = 'rm';
    rm.addEventListener('click', () => {
      state.queue.splice(i, 1);
      saveQueue();
    });
    row.append(label, callBtn, rm);
    el.appendChild(row);
  });
}

function addToQueue() {
  const v = validateNumber($('dial-input').value, state.dialCountry);
  if (!v.ok) return toast(v.reason || 'Enter a valid number first');
  if (state.queue.includes(v.full)) return toast('Already in queue');
  state.queue.push(v.full);
  saveQueue();
  $('dial-input').value = '';
  updateDialValidity();
}

async function makeCall(number) {
  let to = number;
  if (!to) {
    const v = validateNumber($('dial-input').value, state.dialCountry);
    if (!v.ok) return toast(v.reason || 'Enter a valid number first');
    to = v.full;
  }
  if (!state.device) return toast('Not connected — check settings');
  showOverlay(to, 'Calling…', 'outgoing');
  const call = await state.device.connect({
    params: { To: to, CallerId: state.cfg.number || '' }
  });
  state.call = call;
  call.on('accept', startTimer);
  call.on('disconnect', endCallUi);
  call.on('cancel', endCallUi);
  call.on('error', (e) => {
    toast('Call error: ' + (e.message || e.code));
    endCallUi();
  });
}

/* ---------- Tabs ---------- */

function row(icon, iconCls, title, sub, meta, onClick) {
  const div = document.createElement('div');
  div.className = 'row';
  div.innerHTML = `
    <div class="icon ${iconCls}">${icon}</div>
    <div class="main"><div class="title"></div><div class="sub"></div></div>
    <div class="meta"></div>`;
  div.querySelector('.title').textContent = title;
  div.querySelector('.sub').textContent = sub;
  div.querySelector('.meta').textContent = meta;
  if (onClick) div.addEventListener('click', onClick);
  return div;
}

function setNumberInDialer(num) {
  $('dial-input').value = num;
  updateDialValidity();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function loadTab() {
  const list = $('list');
  list.innerHTML = '<div class="empty">Loading…</div>';
  $('composer').classList.toggle('hidden', state.tab !== 'messages');
  try {
    if (state.tab === 'recents') {
      const { calls } = await api('/calls');
      list.innerHTML = '';
      if (!calls.length) list.innerHTML = '<div class="empty">No calls yet</div>';
      for (const c of calls) {
        const missed = c.direction === 'inbound' && ['no-answer', 'busy', 'failed', 'canceled'].includes(c.status);
        const icon = c.direction === 'inbound' ? '↙' : '↗';
        const iconCls = missed ? 'missed' : c.direction === 'inbound' ? 'in' : 'out';
        const other = c.direction === 'inbound' ? c.from : c.to;
        const sub = `${c.direction === 'inbound' ? 'Incoming' : 'Outgoing'} · ${missed ? 'missed' : c.status}${c.duration ? ' · ' + fmtDuration(c.duration) : ''}`;
        list.appendChild(row(icon, iconCls, other, sub, fmtTime(c.startTime), () => setNumberInDialer(other)));
      }
    } else if (state.tab === 'messages') {
      const { messages } = await api('/messages');
      list.innerHTML = '';
      if (!messages.length) list.innerHTML = '<div class="empty">No messages yet</div>';
      for (const m of messages) {
        const icon = m.direction === 'inbound' ? '↙' : '↗';
        const iconCls = m.direction === 'inbound' ? 'in' : 'out';
        const other = m.direction === 'inbound' ? m.from : m.to;
        list.appendChild(row(icon, iconCls, other, m.body, fmtTime(m.date), () => {
          $('sms-to').value = other;
          $('sms-body').focus();
        }));
      }
    } else if (state.tab === 'leads') {
      const { leads, headers } = await api('/leads');
      list.innerHTML = '';
      if (!leads.length) {
        list.innerHTML = '<div class="empty">No leads. Add your Google Sheet URL in settings.</div>';
        return;
      }
      const phoneKey = headers.find((h) => /phone|mobile|cell|number|contact/i.test(h)) || headers[1];
      const nameKey = headers.find((h) => /name/i.test(h)) || headers[0];
      for (const lead of leads) {
        const phone = lead[phoneKey] || '';
        const extras = headers
          .filter((h) => h !== phoneKey && h !== nameKey && lead[h])
          .map((h) => lead[h])
          .join(' · ');
        list.appendChild(row('☎', 'out', lead[nameKey] || phone, extras, phone, () => {
          if (phone) setNumberInDialer(phone.startsWith('+') ? phone : phone.replace(/\D/g, ''));
        }));
      }
    }
  } catch (e) {
    list.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'empty';
    div.textContent = e.message;
    list.appendChild(div);
  }
}

/* ---------- Settings ---------- */

function openSettings() {
  $('cfg-sheet').value = state.cfg?.sheetUrl || '';
  $('cfg-incoming').checked = !!state.cfg?.incomingEnabled;
  $('cfg-status').textContent = state.cfg?.configured
    ? `Connected as ${state.cfg.accountSid}` : '';
  $('settings-modal').classList.remove('hidden');
}

async function saveSettings() {
  const sid = $('cfg-sid').value.trim();
  const token = $('cfg-token').value.trim();
  const sheetUrl = $('cfg-sheet').value.trim();
  const btn = $('cfg-save');
  const status = $('cfg-status');
  btn.disabled = true;
  try {
    if (sid || token) {
      if (!sid || !token) throw new Error('Enter both Account SID and Auth Token');
      status.textContent = 'Setting up Twilio (first run deploys a small helper, ~30s)…';
      state.cfg = await api('/setup', { method: 'POST', body: { accountSid: sid, authToken: token, sheetUrl } });
    } else if (state.cfg?.configured) {
      state.cfg = await api('/settings', { method: 'POST', body: { sheetUrl } });
    } else {
      throw new Error('Enter your Twilio Account SID and Auth Token');
    }
    if ($('cfg-incoming').checked !== !!state.cfg.incomingEnabled) {
      const { incomingEnabled } = await api('/incoming-routing', {
        method: 'POST',
        body: { enabled: $('cfg-incoming').checked }
      });
      state.cfg.incomingEnabled = incomingEnabled;
    }
    renderNumbers();
    await initDevice();
    $('settings-modal').classList.add('hidden');
    $('cfg-sid').value = '';
    $('cfg-token').value = '';
    loadTab();
  } catch (e) {
    status.textContent = e.message;
  } finally {
    btn.disabled = false;
  }
}

function renderNumbers() {
  const sel = $('number-select');
  sel.innerHTML = '';
  for (const n of state.cfg.numbers || []) {
    const opt = document.createElement('option');
    opt.value = n.phoneNumber;
    opt.textContent = n.phoneNumber;
    sel.appendChild(opt);
  }
  if (!state.cfg.numbers?.length) {
    const opt = document.createElement('option');
    opt.textContent = 'No numbers';
    sel.appendChild(opt);
  }
  if (state.cfg.number) sel.value = state.cfg.number;
}

/* ---------- wiring ---------- */

function wire() {
  state.dialCountry = countryPicker('dial-country', 'dyl-dial-country', { allowNone: true });
  state.smsCountry = countryPicker('sms-country', 'dyl-sms-country', { allowNone: true });
  state.dialCountry.onChange = updateDialValidity;

  $('pad').addEventListener('click', (e) => {
    const key = e.target.closest('button')?.dataset.key;
    if (!key) return;
    if (state.call) {
      state.call.sendDigits(key);
    } else {
      $('dial-input').value += key;
      updateDialValidity();
    }
  });

  $('mini-pad').addEventListener('click', (e) => {
    const key = e.target.closest('button')?.dataset.key;
    if (key && state.call) state.call.sendDigits(key);
  });

  $('backspace-btn').addEventListener('click', () => {
    $('dial-input').value = $('dial-input').value.slice(0, -1);
    updateDialValidity();
  });

  $('dial-input').addEventListener('input', updateDialValidity);
  $('call-btn').addEventListener('click', () => makeCall().catch((e) => toast(e.message)));
  $('dial-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') makeCall().catch((err) => toast(err.message));
  });
  $('queue-add').addEventListener('click', addToQueue);

  $('hangup-btn').addEventListener('click', () => state.call?.disconnect());
  $('mute-btn').addEventListener('click', () => {
    if (!state.call) return;
    state.muted = !state.muted;
    state.call.mute(state.muted);
    $('mute-btn').classList.toggle('active', state.muted);
  });
  $('keypad-btn').addEventListener('click', () => $('mini-pad').classList.toggle('hidden'));
  $('accept-btn').addEventListener('click', () => {
    if (!state.call) return;
    state.call.accept();
    $('active-actions').classList.remove('hidden');
    $('incoming-actions').classList.add('hidden');
    startTimer();
  });
  $('reject-btn').addEventListener('click', () => state.call?.reject());

  document.querySelectorAll('.tab').forEach((t) =>
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      state.tab = t.dataset.tab;
      loadTab();
    })
  );
  $('refresh-btn').addEventListener('click', loadTab);

  $('settings-btn').addEventListener('click', openSettings);
  $('cfg-save').addEventListener('click', saveSettings);
  $('settings-modal').addEventListener('click', (e) => {
    if (e.target === $('settings-modal') && state.cfg?.configured) {
      $('settings-modal').classList.add('hidden');
    }
  });

  $('number-select').addEventListener('change', async (e) => {
    try {
      await api('/number', { method: 'POST', body: { number: e.target.value } });
      state.cfg.number = e.target.value;
    } catch (err) {
      toast(err.message);
    }
  });

  const sendSms = async () => {
    const body = $('sms-body').value.trim();
    if (!body) return;
    const v = validateNumber($('sms-to').value, state.smsCountry);
    if (!v.ok) {
      $('sms-to').classList.add('invalid');
      return;
    }
    $('sms-to').classList.remove('invalid');
    try {
      await api('/messages', { method: 'POST', body: { to: v.full, body } });
      $('sms-body').value = '';
      loadTab();
    } catch (e) {
      alert(e.message);
    }
  };
  $('sms-send').addEventListener('click', sendSms);
  $('sms-body').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendSms();
  });
  $('sms-to').addEventListener('input', () => {
    const v = validateNumber($('sms-to').value, state.smsCountry);
    $('sms-to').classList.toggle('invalid', !!$('sms-to').value.trim() && !v.ok);
  });
}

async function init() {
  wire();
  renderQueue();
  updateDialValidity();
  state.cfg = await api('/config');
  renderNumbers();
  if (!state.cfg.configured) {
    openSettings();
  } else {
    initDevice().catch((e) => toast('Could not connect: ' + e.message));
    loadTab();
  }
}

init();

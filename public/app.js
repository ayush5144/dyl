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

/* Representative IANA timezone(s) per country, for the "their local time"
   readout. Multi-timezone countries get their main business zones. */
const COUNTRY_TZ = {
  AF: [['Asia/Kabul']], AL: [['Europe/Tirane']], DZ: [['Africa/Algiers']],
  AR: [['America/Argentina/Buenos_Aires']], AM: [['Asia/Yerevan']],
  AU: [['Australia/Sydney', 'Sydney'], ['Australia/Perth', 'Perth']],
  AT: [['Europe/Vienna']], AZ: [['Asia/Baku']], BH: [['Asia/Bahrain']],
  BD: [['Asia/Dhaka']], BY: [['Europe/Minsk']], BE: [['Europe/Brussels']],
  BO: [['America/La_Paz']], BA: [['Europe/Sarajevo']], BW: [['Africa/Gaborone']],
  BR: [['America/Sao_Paulo']], BG: [['Europe/Sofia']], KH: [['Asia/Phnom_Penh']],
  CM: [['Africa/Douala']],
  CA: [['America/Toronto', 'ET'], ['America/Vancouver', 'PT']],
  CL: [['America/Santiago']], CN: [['Asia/Shanghai']], CO: [['America/Bogota']],
  CR: [['America/Costa_Rica']], HR: [['Europe/Zagreb']], CY: [['Asia/Nicosia']],
  CZ: [['Europe/Prague']], DK: [['Europe/Copenhagen']], DO: [['America/Santo_Domingo']],
  EC: [['America/Guayaquil']], EG: [['Africa/Cairo']], SV: [['America/El_Salvador']],
  EE: [['Europe/Tallinn']], ET: [['Africa/Addis_Ababa']], FI: [['Europe/Helsinki']],
  FR: [['Europe/Paris']], GE: [['Asia/Tbilisi']], DE: [['Europe/Berlin']],
  GH: [['Africa/Accra']], GR: [['Europe/Athens']], GT: [['America/Guatemala']],
  HN: [['America/Tegucigalpa']], HK: [['Asia/Hong_Kong']], HU: [['Europe/Budapest']],
  IS: [['Atlantic/Reykjavik']], IN: [['Asia/Kolkata']], ID: [['Asia/Jakarta']],
  IQ: [['Asia/Baghdad']], IE: [['Europe/Dublin']], IL: [['Asia/Jerusalem']],
  IT: [['Europe/Rome']], JM: [['America/Jamaica']], JP: [['Asia/Tokyo']],
  JO: [['Asia/Amman']], KZ: [['Asia/Almaty']], KE: [['Africa/Nairobi']],
  KW: [['Asia/Kuwait']], LA: [['Asia/Vientiane']], LV: [['Europe/Riga']],
  LB: [['Asia/Beirut']], LT: [['Europe/Vilnius']], LU: [['Europe/Luxembourg']],
  MO: [['Asia/Macau']], MY: [['Asia/Kuala_Lumpur']], MV: [['Indian/Maldives']],
  MT: [['Europe/Malta']], MX: [['America/Mexico_City']], MD: [['Europe/Chisinau']],
  MC: [['Europe/Monaco']], MN: [['Asia/Ulaanbaatar']], MA: [['Africa/Casablanca']],
  MM: [['Asia/Yangon']], NP: [['Asia/Kathmandu']], NL: [['Europe/Amsterdam']],
  NZ: [['Pacific/Auckland']], NI: [['America/Managua']], NG: [['Africa/Lagos']],
  MK: [['Europe/Skopje']], NO: [['Europe/Oslo']], OM: [['Asia/Muscat']],
  PK: [['Asia/Karachi']], PA: [['America/Panama']], PY: [['America/Asuncion']],
  PE: [['America/Lima']], PH: [['Asia/Manila']], PL: [['Europe/Warsaw']],
  PT: [['Europe/Lisbon']], QA: [['Asia/Qatar']], RO: [['Europe/Bucharest']],
  RU: [['Europe/Moscow', 'Moscow']], RW: [['Africa/Kigali']], SA: [['Asia/Riyadh']],
  SN: [['Africa/Dakar']], RS: [['Europe/Belgrade']], SG: [['Asia/Singapore']],
  SK: [['Europe/Bratislava']], SI: [['Europe/Ljubljana']], ZA: [['Africa/Johannesburg']],
  KR: [['Asia/Seoul']], ES: [['Europe/Madrid']], LK: [['Asia/Colombo']],
  SE: [['Europe/Stockholm']], CH: [['Europe/Zurich']], TW: [['Asia/Taipei']],
  TZ: [['Africa/Dar_es_Salaam']], TH: [['Asia/Bangkok']], TN: [['Africa/Tunis']],
  TR: [['Europe/Istanbul']], UG: [['Africa/Kampala']], UA: [['Europe/Kiev']],
  AE: [['Asia/Dubai']], GB: [['Europe/London']],
  US: [['America/New_York', 'ET'], ['America/Chicago', 'CT'], ['America/Los_Angeles', 'PT']],
  UY: [['America/Montevideo']], UZ: [['Asia/Tashkent']], VE: [['America/Caracas']],
  VN: [['Asia/Ho_Chi_Minh']], YE: [['Asia/Aden']], ZM: [['Africa/Lusaka']],
  ZW: [['Africa/Harare']]
};

const $ = (id) => document.getElementById(id);

function flagEmoji(iso) {
  return String.fromCodePoint(...[...iso].map((ch) => 127397 + ch.charCodeAt(0)));
}

/* Searchable country-code picker. Search by country name (any starting
   letters), ISO code, or dial code. allowNone adds a "no prefix" choice,
   meaning the number must be entered in full international format. */
function countryPicker(mountId, storageKey, { allowNone = false, showDial = true } = {}) {
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
    btn.textContent = selected
      ? (showDial ? `${flagEmoji(selected[1])} ${selected[2]}` : flagEmoji(selected[1]))
      : '🌐 —';
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
  return {
    ok: true,
    full: parsed.number,
    iso: parsed.country,
    country: country ? country[0] : parsed.country
  };
}

/* Navbar clock: local time of the chosen country next to the caller's own. */
function updateClocks() {
  const line = $('clock-line');
  const iso = state.clockCountry ? state.clockCountry.iso : null;
  const opts = { hour: 'numeric', minute: '2-digit' };
  const mine = new Date().toLocaleTimeString([], opts);
  let theirs = '';
  if (iso && COUNTRY_TZ[iso]) {
    try {
      theirs =
        COUNTRY_TZ[iso]
          .map(([tz, label]) =>
            new Date().toLocaleTimeString([], { ...opts, timeZone: tz }) +
            (label ? ` ${label}` : '')
          )
          .join(' · ') + '  —  ';
    } catch {
      theirs = '';
    }
  }
  line.textContent = `${theirs}You ${mine}`;
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
  queue: JSON.parse(localStorage.getItem('dyl-queue') || '[]'),
  leads: [],
  leadKeys: null,
  leadsWritable: false,
  activeLead: null, // lead being called; triggers the outcome form on hangup
  manualCall: null, // non-lead call; offers saving as a new sheet row
  outcome: null
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

/* What time it was on the other party's side when the call happened,
   derived from their number's country (primary zone). Empty when unknown
   or same as the caller's own time. */
function calleeTime(number, date) {
  const p = libphonenumber.parsePhoneNumberFromString(number || '');
  if (!p || !p.country || !COUNTRY_TZ[p.country] || !date) return '';
  const [tz, label] = COUNTRY_TZ[p.country][0];
  const opts = { hour: 'numeric', minute: '2-digit' };
  const theirs = new Date(date).toLocaleTimeString([], { ...opts, timeZone: tz });
  if (theirs === new Date(date).toLocaleTimeString([], opts)) return '';
  return `${flagEmoji(p.country)} ${theirs}${label ? ' ' + label : ''}`;
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
    setTimeout(ensureRegistered, 3000);
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

/* Keep the device registered so incoming calls always ring: tokens expire
   hourly and laptop sleep kills the connection silently. Re-register
   whenever we notice the device dropped. */
async function ensureRegistered() {
  const d = state.device;
  if (!d || state.call || d.state === 'registered' || d.state === 'registering') return;
  try {
    const { token } = await api('/token');
    d.updateToken(token);
    await d.register();
  } catch (e) {
    console.error('re-register failed', e);
  }
}

/* ---------- Call UI ---------- */

function showOverlay(number, status, mode) {
  $('call-number').textContent = number;
  $('call-status').textContent = status;
  $('active-actions').classList.toggle('hidden', mode === 'incoming');
  $('incoming-actions').classList.toggle('hidden', mode !== 'incoming');
  $('outcome-box').classList.add('hidden');
  $('lead-context').classList.add('hidden');
  $('mini-pad').classList.add('hidden');
  $('speaker-menu').classList.add('hidden');
  $('keypad-btn').classList.remove('active');
  const lead = mode !== 'incoming' && state.activeLead;
  $('call-sub').textContent = lead
    ? [lead.title, lead.company].filter(Boolean).join(' · ')
    : '';
  // Outgoing calls dock to the corner so the rest of the app (lead editor,
  // notes, tabs) stays usable during the call. Incoming rings centered.
  $('overlay').classList.toggle('docked', mode === 'outgoing');
  $('overlay').classList.remove('hidden');
}

/* Audio output ("speaker") picker for the active call. Lists the machine's
   output devices via Twilio's AudioHelper; picking one routes call audio
   there (e.g. built-in speakers vs headphones). */
async function toggleSpeakerMenu() {
  const menu = $('speaker-menu');
  if (!menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
    $('speaker-btn').classList.remove('active');
    return;
  }
  const audio = state.device && state.device.audio;
  menu.innerHTML = '';
  if (!audio || !audio.isOutputSelectionSupported) {
    const note = document.createElement('div');
    note.className = 'speaker-note';
    note.textContent = 'Audio output selection is not supported in this browser — use Chrome.';
    menu.appendChild(note);
  } else {
    const active = new Set([...audio.speakerDevices.get()].map((d) => d.deviceId));
    audio.availableOutputDevices.forEach((dev, id) => {
      const item = document.createElement('button');
      item.className = 'speaker-item' + (active.has(id) ? ' selected' : '');
      item.textContent = dev.label || 'Audio output';
      item.addEventListener('click', async () => {
        try {
          await audio.speakerDevices.set(id);
        } catch (e) {
          toast('Could not switch output: ' + e.message);
        }
        menu.classList.add('hidden');
        $('speaker-btn').classList.remove('active');
      });
      menu.appendChild(item);
    });
  }
  $('mini-pad').classList.add('hidden');
  $('keypad-btn').classList.remove('active');
  menu.classList.remove('hidden');
  $('speaker-btn').classList.add('active');
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
  if (state.activeLead || (state.manualCall && state.cfg?.appsScriptUrl)) {
    showOutcomeForm();
  } else {
    state.manualCall = null;
    $('overlay').classList.add('hidden');
    $('overlay').classList.remove('docked');
  }
  if (state.tab === 'recents') setTimeout(loadTab, 1500);
  // Tee up the next queued number so a cold-call run flows: end call → Call.
  if (state.queue.length && !$('dial-input').value.trim()) {
    $('dial-input').value = state.queue.shift();
    saveQueue();
    updateDialValidity();
  }
}

/* ---------- Lead calling & outcomes ---------- */

function showOutcomeForm() {
  state.outcome = null;
  const lead = state.activeLead;
  $('call-status').textContent = lead
    ? 'Call ended — log the outcome'
    : 'Call ended — save to your sheet?';
  $('active-actions').classList.add('hidden');
  $('incoming-actions').classList.add('hidden');
  $('mini-pad').classList.add('hidden');
  $('speaker-menu').classList.add('hidden');
  $('outcome-box').classList.remove('hidden');
  if (lead) {
    // Notes prefill: prefer what was typed in the lead's open editor during
    // the call (auto-saved there), else the lead's stored notes.
    const openEditor = document
      .querySelector(`.lead-block[data-row="${lead._row}"] .lead-detail textarea`);
    $('call-notes').value = openEditor ? openEditor.value : lead.notes || '';
  } else {
    // Unknown number: offer to append it to the sheet as a new lead
    $('call-notes').value = '';
    $('outcome-name').value = '';
  }
  $('outcome-name').classList.toggle('hidden', !!lead);
  $('lead-opener').classList.add('hidden');
  $('lead-context').classList.remove('hidden');
  $('outcome-chips').querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
  $('outcome-save').textContent = lead ? 'Save' : 'Add to sheet';
  $('outcome-skip').textContent = lead ? 'Skip' : "Don't save";
  $('overlay').classList.remove('docked');
  $('overlay').classList.remove('hidden');
}

function closeLeadOverlay() {
  state.activeLead = null;
  state.manualCall = null;
  $('overlay').classList.add('hidden');
  $('overlay').classList.remove('docked');
  $('lead-context').classList.add('hidden');
  $('call-sub').textContent = '';
  if (state.tab === 'leads') loadTab();
}

async function callLead(lead) {
  if (state.call) return toast('Already on a call');
  const v = validateNumber(lead.phone, state.dialCountry);
  if (!v.ok) return toast(`${lead.name}: invalid number (${lead.phone})`);
  state.activeLead = lead;
  showOverlay(lead.name || v.full, 'Calling…', 'outgoing');
  expandLead(lead._row);
  try {
    await makeCall(v.full, true);
  } catch (e) {
    state.activeLead = null;
    toast(e.message);
    $('overlay').classList.add('hidden');
    $('overlay').classList.remove('docked');
  }
}

/* Open the lead's inline editor (if the Leads tab is showing) so notes can
   be taken in it during the call. */
function expandLead(row) {
  const entry = state.leadBlocks && state.leadBlocks.get(row);
  if (entry && !entry.block.querySelector('.lead-detail')) {
    toggleLeadDetail(entry.block, entry.lead);
  }
}

async function saveOutcome() {
  const lead = state.activeLead;
  const manual = state.manualCall;
  if (!lead && !manual) return;
  const btn = $('outcome-save');
  btn.disabled = true;
  try {
    if (!state.leadKeys) await fetchLeads();
    const k = state.leadKeys;
    const updates = {
      [k.status]: 'Called',
      [k.lastCalled]: new Date().toLocaleString(),
      [k.notes]: $('call-notes').value.trim()
    };
    if (state.outcome) updates[k.outcome] = state.outcome;
    if (lead) {
      await api('/lead-update', { method: 'POST', body: { row: lead._row, updates } });
    } else {
      if (k.phone) updates[k.phone] = manual.phone;
      const name = $('outcome-name').value.trim();
      if (name) updates[k.name] = name;
      await api('/lead-add', { method: 'POST', body: { updates } });
    }
    closeLeadOverlay();
  } catch (e) {
    $('call-status').textContent = e.message;
  } finally {
    btn.disabled = false;
  }
}

/* Normalize sheet rows into lead objects using detected column names. */
function detectLeadKeys(headers) {
  const find = (re) => headers.find((h) => re.test(h));
  return {
    name: find(/^name$/i) || headers[0],
    phone: find(/mobile|phone|number|contact/i),
    title: find(/^title$/i),
    company: find(/company/i),
    status: find(/^status$/i) || 'Status',
    outcome: find(/^outcome$/i) || 'Outcome',
    notes: find(/^notes$/i) || 'Notes',
    lastCalled: find(/last.?called/i) || 'Last Called',
    opener: find(/opener|pitch|script/i),
    priority: find(/^priority$/i)
  };
}

async function fetchLeads() {
  const { leads, headers, writable } = await api('/leads');
  state.leadsWritable = !!writable;
  state.leadKeys = detectLeadKeys(headers || []);
  const k = state.leadKeys;
  state.leads = (leads || []).map((raw) => ({
    _row: raw._row,
    raw,
    name: raw[k.name] || '',
    phone: k.phone ? raw[k.phone] || '' : '',
    title: k.title ? raw[k.title] || '' : '',
    company: k.company ? raw[k.company] || '' : '',
    status: raw[k.status] || '',
    outcome: raw[k.outcome] || '',
    notes: raw[k.notes] || '',
    opener: k.opener ? raw[k.opener] || '' : '',
    priority: k.priority ? raw[k.priority] || '' : ''
  }));
  return state.leads;
}

function outcomeBadgeClass(lead) {
  const o = (lead.outcome || '').toLowerCase();
  if (/interested$/.test(o) && !/not/.test(o)) return 'good';
  if (/callback/.test(o)) return 'warn';
  if (/not interested|wrong/.test(o)) return 'bad';
  return '';
}

/* ---------- Expandable lead editor ---------- */

const STATUS_OPTIONS = ['', 'Not Called', 'Called', 'Callback', 'Do Not Call'];
const OUTCOME_OPTIONS = ['', 'Answered', 'No Answer', 'Voicemail', 'Callback', 'Interested', 'Not Interested', 'Wrong Number'];

function makeSelect(options, current) {
  const sel = document.createElement('select');
  const opts = options.includes(current) ? options : [...options, current];
  for (const o of opts) {
    const opt = document.createElement('option');
    opt.value = o;
    opt.textContent = o || '—';
    sel.appendChild(opt);
  }
  sel.value = current;
  return sel;
}

function fieldValue(v) {
  const span = document.createElement('span');
  span.className = 'v';
  if (/^https?:\/\//i.test(v)) {
    const a = document.createElement('a');
    a.href = v;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = v.replace(/^https?:\/\/(www\.)?/i, '').slice(0, 45);
    span.appendChild(a);
  } else if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
    const a = document.createElement('a');
    a.href = 'mailto:' + v;
    a.textContent = v;
    span.appendChild(a);
  } else {
    span.textContent = v;
  }
  return span;
}

function buildLeadBlock(lead) {
  const block = document.createElement('div');
  block.className = 'lead-block';
  block.dataset.row = lead._row;
  if (state.leadBlocks) state.leadBlocks.set(lead._row, { block, lead });

  const row = document.createElement('div');
  row.className = 'row lead-row';
  row.innerHTML = `
    <div class="main">
      <div class="title"></div>
      <div class="sub"></div>
    </div>
    <span class="badge"></span>
    <button class="icon-btn lead-call" title="Call now"><i data-lucide="phone"></i></button>
    <i data-lucide="chevron-down" class="chev"></i>`;
  row.querySelector('.title').textContent = lead.name || lead.phone;
  row.querySelector('.sub').textContent =
    [lead.title, lead.company, lead.phone].filter(Boolean).join(' · ');
  const badgeEl = row.querySelector('.badge');
  badgeEl.textContent = lead.outcome || lead.status || 'New';
  badgeEl.classList.add(outcomeBadgeClass(lead) || 'neutral');

  row.querySelector('.lead-call').addEventListener('click', (e) => {
    e.stopPropagation();
    callLead(lead);
  });
  row.addEventListener('click', () => toggleLeadDetail(block, lead));

  block.appendChild(row);
  return block;
}

function toggleLeadDetail(block, lead) {
  const open = block.querySelector('.lead-detail');
  if (open) {
    open.remove();
    block.classList.remove('open');
    return;
  }
  // accordion: one open at a time
  document.querySelectorAll('.lead-detail').forEach((d) => {
    d.closest('.lead-block')?.classList.remove('open');
    d.remove();
  });
  block.classList.add('open');
  block.appendChild(buildLeadDetail(block, lead));
  lucide.createIcons();
  block.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function buildLeadDetail(block, lead) {
  const k = state.leadKeys;
  const detail = document.createElement('div');
  detail.className = 'lead-detail';

  // Read-only columns (everything not shown in the row or editable below)
  const shown = new Set([k.name, k.title, k.company, k.phone, k.status, k.outcome, k.notes, k.lastCalled]);
  const fields = document.createElement('div');
  fields.className = 'lead-fields';
  for (const h of Object.keys(lead.raw)) {
    if (h === '_row' || shown.has(h) || !String(lead.raw[h]).trim()) continue;
    const f = document.createElement('div');
    f.className = 'field';
    const key = document.createElement('span');
    key.className = 'k';
    key.textContent = h;
    f.append(key, fieldValue(String(lead.raw[h])));
    fields.appendChild(f);
  }
  detail.appendChild(fields);

  // Editable workflow fields — auto-saved
  const edit = document.createElement('div');
  edit.className = 'lead-edit';

  const statusSel = makeSelect(STATUS_OPTIONS, lead.status);
  const outcomeSel = makeSelect(OUTCOME_OPTIONS, lead.outcome);
  const lastInput = document.createElement('input');
  lastInput.type = 'text';
  lastInput.value = lead.raw[k.lastCalled] || '';
  lastInput.placeholder = 'Last called';
  const nowBtn = document.createElement('button');
  nowBtn.className = 'ghost';
  nowBtn.textContent = 'Now';
  const notes = document.createElement('textarea');
  notes.rows = 3;
  notes.placeholder = 'Notes…';
  notes.value = lead.notes || '';
  const saveState = document.createElement('span');
  saveState.className = 'save-state';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'ghost save-now';
  saveBtn.textContent = 'Save';

  const labeled = (text, el, extra) => {
    const l = document.createElement('label');
    l.className = 'edit-field';
    const s = document.createElement('span');
    s.textContent = text;
    l.append(s, el);
    if (extra) l.appendChild(extra);
    return l;
  };
  const controls = document.createElement('div');
  controls.className = 'edit-row';
  controls.append(
    labeled('Status', statusSel),
    labeled('Outcome', outcomeSel),
    labeled('Last called', lastInput, nowBtn)
  );
  const saveRow = document.createElement('div');
  saveRow.className = 'save-row';
  saveRow.append(saveState, saveBtn);
  edit.append(controls, notes, saveRow);
  detail.appendChild(edit);

  let timer = null;
  const save = async () => {
    clearTimeout(timer);
    saveState.textContent = 'Saving…';
    saveState.classList.remove('bad');
    const updates = {
      [k.status]: statusSel.value,
      [k.outcome]: outcomeSel.value,
      [k.notes]: notes.value.trim(),
      [k.lastCalled]: lastInput.value.trim()
    };
    try {
      await api('/lead-update', { method: 'POST', body: { row: lead._row, updates } });
      lead.status = statusSel.value;
      lead.outcome = outcomeSel.value;
      lead.notes = notes.value.trim();
      lead.raw[k.lastCalled] = lastInput.value.trim();
      const badgeEl = block.querySelector('.badge');
      badgeEl.textContent = lead.outcome || lead.status || 'New';
      badgeEl.className = 'badge ' + (outcomeBadgeClass(lead) || 'neutral');
      saveState.textContent = 'Saved ✓';
      setTimeout(() => {
        if (saveState.textContent === 'Saved ✓') saveState.textContent = '';
      }, 2500);
    } catch (e) {
      saveState.textContent = 'Not saved: ' + e.message;
      saveState.classList.add('bad');
    }
  };
  const debouncedSave = () => {
    clearTimeout(timer);
    saveState.textContent = 'Typing…';
    timer = setTimeout(save, 1200);
  };

  const onPick = () => {
    // picking a status/outcome stamps "last called" if it's still empty
    if ((statusSel.value || outcomeSel.value) && !lastInput.value.trim()) {
      lastInput.value = new Date().toLocaleString();
    }
    save();
  };
  statusSel.addEventListener('change', onPick);
  outcomeSel.addEventListener('change', onPick);
  lastInput.addEventListener('input', debouncedSave);
  nowBtn.addEventListener('click', () => {
    lastInput.value = new Date().toLocaleString();
    save();
  });
  notes.addEventListener('input', debouncedSave);
  notes.addEventListener('blur', () => {
    if (timer) save();
  });
  saveBtn.addEventListener('click', save);

  if (!state.leadsWritable) {
    edit.querySelectorAll('select, input, textarea, button').forEach((el) => (el.disabled = true));
    saveState.textContent = 'Read-only — connect the Apps Script URL in settings to edit';
  }
  return detail;
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

async function makeCall(number, keepOverlay) {
  if (state.call) {
    toast('Already on a call');
    if (keepOverlay) throw new Error('Already on a call');
    return;
  }
  let to = number;
  if (!to) {
    const v = validateNumber($('dial-input').value, state.dialCountry);
    if (!v.ok) return toast(v.reason || 'Enter a valid number first');
    to = v.full;
  }
  if (!state.device) {
    toast('Not connected — check settings');
    if (keepOverlay) throw new Error('Not connected — check settings');
    return;
  }
  if (!keepOverlay) {
    state.activeLead = null;
    state.manualCall = { phone: to };
    showOverlay(to, 'Calling…', 'outgoing');
  }
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
        const theirs = calleeTime(other, c.startTime);
        const meta = fmtTime(c.startTime) + (theirs ? '\n' + theirs : '');
        list.appendChild(row(icon, iconCls, other, sub, meta, () => setNumberInDialer(other)));
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
      const leads = await fetchLeads();
      list.innerHTML = '';
      if (!leads.length) {
        list.innerHTML =
          '<div class="empty">No leads. Connect your sheet in settings (Apps Script URL for two-way sync).</div>';
        return;
      }
      state.leadBlocks = new Map();
      for (const lead of leads) list.appendChild(buildLeadBlock(lead));
      lucide.createIcons();
    }
  } catch (e) {
    list.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'empty';
    div.textContent = e.message;
    list.appendChild(div);
  }
}

/* ---------- Search ---------- */

/* Search leads by name/company/title or by number (paste a number anywhere
   to see whose it is — works from any tab). */
async function runSearch() {
  const q = $('search-input').value.trim();
  $('search-clear').classList.toggle('hidden', !q);
  if (!q) return loadTab();
  const list = $('list');
  $('composer').classList.add('hidden');
  if (!state.leads.length) {
    list.innerHTML = '<div class="empty">Loading leads…</div>';
    try {
      await fetchLeads();
    } catch (e) {
      list.innerHTML = '';
      const div = document.createElement('div');
      div.className = 'empty';
      div.textContent = e.message;
      list.appendChild(div);
      return;
    }
    if ($('search-input').value.trim() !== q) return; // query changed meanwhile
  }
  const ql = q.toLowerCase();
  const qDigits = q.replace(/\D/g, '').replace(/^0+/, '');
  const matches = state.leads.filter((l) => {
    const leadDigits = (l.phone || '').replace(/\D/g, '');
    if (qDigits.length >= 5 && leadDigits.includes(qDigits)) return true;
    return [l.name, l.company, l.title, l.phone].some(
      (v) => v && v.toLowerCase().includes(ql)
    );
  });
  list.innerHTML = '';
  state.leadBlocks = new Map();
  if (!matches.length) {
    const div = document.createElement('div');
    div.className = 'empty';
    div.textContent =
      qDigits.length >= 6
        ? 'This number is not in your leads — after calling it you can add it from the outcome popup.'
        : 'No leads match.';
    list.appendChild(div);
    return;
  }
  for (const lead of matches) list.appendChild(buildLeadBlock(lead));
  lucide.createIcons();
}

/* ---------- Settings ---------- */

async function openSettings() {
  // Always show the currently saved values, not this tab's possibly stale
  // copy — otherwise re-saving can silently revert someone else's update.
  try {
    state.cfg = await api('/config');
  } catch {}
  $('cfg-sheet').value = state.cfg?.sheetUrl || '';
  $('cfg-appsscript').value = state.cfg?.appsScriptUrl || '';
  $('cfg-incoming').checked = !!state.cfg?.incomingEnabled;
  $('cfg-status').textContent = state.cfg?.configured
    ? `Connected as ${state.cfg.accountSid}` : '';
  $('settings-modal').classList.remove('hidden');
}

async function saveSettings() {
  const sid = $('cfg-sid').value.trim();
  const token = $('cfg-token').value.trim();
  const sheetUrl = $('cfg-sheet').value.trim();
  const appsScriptUrl = $('cfg-appsscript').value.trim();
  const btn = $('cfg-save');
  const status = $('cfg-status');
  btn.disabled = true;
  try {
    if (sid || token) {
      if (!sid || !token) throw new Error('Enter both Account SID and Auth Token');
      status.textContent = 'Setting up Twilio (first run deploys a small helper, ~30s)…';
      state.cfg = await api('/setup', {
        method: 'POST',
        body: { accountSid: sid, authToken: token, sheetUrl, appsScriptUrl }
      });
    } else if (state.cfg?.configured) {
      state.cfg = await api('/settings', { method: 'POST', body: { sheetUrl, appsScriptUrl } });
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
  state.clockCountry = countryPicker('clock-country', 'dyl-clock-country', { showDial: false });
  state.dialCountry.onChange = updateDialValidity;
  state.clockCountry.onChange = updateClocks;

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
  $('keypad-btn').addEventListener('click', () => {
    const shown = $('mini-pad').classList.toggle('hidden');
    $('keypad-btn').classList.toggle('active', !shown);
    $('speaker-menu').classList.add('hidden');
    $('speaker-btn').classList.remove('active');
  });
  $('speaker-btn').addEventListener('click', toggleSpeakerMenu);
  $('accept-btn').addEventListener('click', () => {
    if (!state.call) return;
    state.call.accept();
    // accepted incoming calls can be logged to the sheet too
    const from = (state.call.parameters && state.call.parameters.From) || '';
    state.manualCall = from ? { phone: from } : null;
    $('active-actions').classList.remove('hidden');
    $('incoming-actions').classList.add('hidden');
    $('overlay').classList.add('docked');
    startTimer();
  });
  $('reject-btn').addEventListener('click', () => state.call?.reject());

  document.querySelectorAll('.tab').forEach((t) =>
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
      t.classList.add('active');
      state.tab = t.dataset.tab;
      $('search-input').value = '';
      $('search-clear').classList.add('hidden');
      loadTab();
    })
  );
  $('refresh-btn').addEventListener('click', loadTab);

  let searchTimer = null;
  $('search-input').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 250);
  });
  $('search-clear').addEventListener('click', () => {
    $('search-input').value = '';
    $('search-clear').classList.add('hidden');
    loadTab();
  });

  $('outcome-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const already = btn.classList.contains('selected');
    $('outcome-chips').querySelectorAll('button').forEach((b) => b.classList.remove('selected'));
    state.outcome = already ? null : btn.dataset.outcome;
    if (!already) btn.classList.add('selected');
  });
  $('outcome-save').addEventListener('click', saveOutcome);
  $('outcome-skip').addEventListener('click', closeLeadOverlay);

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
  lucide.createIcons();
  renderQueue();
  updateDialValidity();
  updateClocks();
  setInterval(updateClocks, 30000);
  setInterval(ensureRegistered, 20000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) ensureRegistered();
  });
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

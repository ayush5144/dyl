const express = require('express');
const fs = require('fs');
const path = require('path');
const twilio = require('twilio');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const { ensureSetup, CLIENT_IDENTITY } = require('./setup');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const PORT = process.env.PORT || 3333;

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

// The web-app URL must be the /exec deployment link, not the script editor
// link — pasting the wrong one is an easy mistake that fails confusingly.
function checkAppsScriptUrl(url) {
  if (url && !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) {
    throw new Error(
      'That looks like the Apps Script editor link. Use the Web app URL ending in /exec (Deploy → Manage deployments).'
    );
  }
}

function isConfigured(cfg) {
  return !!(cfg.accountSid && cfg.authToken && cfg.apiKeySid && cfg.apiKeySecret && cfg.twimlAppSid);
}

function getClient(cfg) {
  return twilio(cfg.accountSid, cfg.authToken);
}

function publicConfig(cfg) {
  return {
    configured: isConfigured(cfg),
    accountSid: cfg.accountSid ? cfg.accountSid.slice(0, 6) + '…' + cfg.accountSid.slice(-4) : null,
    number: cfg.number || null,
    numbers: cfg.numbers || [],
    sheetUrl: cfg.sheetUrl || '',
    appsScriptUrl: cfg.appsScriptUrl || '',
    incomingEnabled: !!cfg.incomingEnabled,
    identity: CLIENT_IDENTITY
  };
}

async function refreshNumbers(cfg) {
  const nums = await getClient(cfg).incomingPhoneNumbers.list({ limit: 100 });
  cfg.numbers = nums.map((n) => ({
    sid: n.sid,
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName
  }));
  if (!cfg.number && cfg.numbers.length) cfg.number = cfg.numbers[0].phoneNumber;
  if (cfg.number && !cfg.numbers.some((n) => n.phoneNumber === cfg.number)) {
    cfg.number = cfg.numbers.length ? cfg.numbers[0].phoneNumber : null;
  }
}

// ---- Google Sheet leads ----

// Apps Script occasionally returns a transient HTML error page; retry once
// before giving up.
async function fetchAppsScript(cfg, opts, failHint) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(cfg.appsScriptUrl, { redirect: 'follow', ...opts });
    const text = await r.text();
    if (!text.trimStart().startsWith('<')) {
      const data = JSON.parse(text);
      if (data.error) throw new Error(data.error + (failHint || ''));
      return data;
    }
    if (attempt === 0) await new Promise((res) => setTimeout(res, 1200));
  }
  throw new Error('Apps Script did not return JSON — check the URL is the /exec deployment with access "Anyone".');
}
function toCsvUrl(url) {
  const m = url.match(/docs\.google\.com\/spreadsheets\/d\/([\w-]+)/);
  if (!m) return url; // assume it's already a CSV link
  const gid = (url.match(/[#?&]gid=(\d+)/) || [])[1];
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cur);
      cur = '';
    } else if (c === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else if (c !== '\r') {
      cur += c;
    }
  }
  if (cur !== '' || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/vendor/twilio.min.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules/@twilio/voice-sdk/dist/twilio.min.js'));
});

app.get('/vendor/libphonenumber.min.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules/libphonenumber-js/bundle/libphonenumber-js.min.js'));
});

app.get('/vendor/lucide.min.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules/lucide/dist/umd/lucide.min.js'));
});

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Something went wrong' });
  });

app.get('/api/config', (req, res) => {
  res.json(publicConfig(loadConfig()));
});

app.post(
  '/api/setup',
  wrap(async (req, res) => {
    const { accountSid, authToken, sheetUrl } = req.body;
    if (!accountSid || !authToken) {
      return res.status(400).json({ error: 'Account SID and Auth Token are required' });
    }
    let cfg = loadConfig();
    if (cfg.accountSid && cfg.accountSid !== accountSid) {
      cfg = {}; // switching accounts: drop resources tied to the old one
    }
    cfg.accountSid = accountSid.trim();
    cfg.authToken = authToken.trim();
    if (sheetUrl !== undefined) cfg.sheetUrl = sheetUrl.trim();
    if (req.body.appsScriptUrl !== undefined) {
      checkAppsScriptUrl(req.body.appsScriptUrl.trim());
      cfg.appsScriptUrl = req.body.appsScriptUrl.trim();
    }
    await ensureSetup(cfg);
    await refreshNumbers(cfg);
    saveConfig(cfg);
    res.json(publicConfig(cfg));
  })
);

app.post(
  '/api/settings',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    if (req.body.sheetUrl !== undefined) cfg.sheetUrl = req.body.sheetUrl.trim();
    if (req.body.appsScriptUrl !== undefined) {
      checkAppsScriptUrl(req.body.appsScriptUrl.trim());
      cfg.appsScriptUrl = req.body.appsScriptUrl.trim();
    }
    saveConfig(cfg);
    res.json(publicConfig(cfg));
  })
);

app.get(
  '/api/token',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    if (!isConfigured(cfg)) return res.status(400).json({ error: 'Not configured' });
    const AccessToken = twilio.jwt.AccessToken;
    const token = new AccessToken(cfg.accountSid, cfg.apiKeySid, cfg.apiKeySecret, {
      identity: CLIENT_IDENTITY,
      ttl: 3600
    });
    token.addGrant(
      new AccessToken.VoiceGrant({
        outgoingApplicationSid: cfg.twimlAppSid,
        incomingAllow: true
      })
    );
    res.json({ token: token.toJwt(), identity: CLIENT_IDENTITY });
  })
);

app.get(
  '/api/numbers',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    await refreshNumbers(cfg);
    saveConfig(cfg);
    res.json({ number: cfg.number, numbers: cfg.numbers });
  })
);

app.post(
  '/api/number',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    const found = (cfg.numbers || []).find((n) => n.phoneNumber === req.body.number);
    if (!found) return res.status(400).json({ error: 'Unknown number' });
    cfg.number = found.phoneNumber;
    // Incoming routing follows the active number so calls keep ringing here
    if (cfg.incomingEnabled && cfg.domainName) {
      const client = getClient(cfg);
      const incomingUrl = `https://${cfg.domainName}/incoming`;
      const current = await client.incomingPhoneNumbers(found.sid).fetch();
      if (current.voiceUrl !== incomingUrl) {
        cfg.prevVoiceUrls = cfg.prevVoiceUrls || {};
        if (current.voiceUrl) cfg.prevVoiceUrls[found.sid] = current.voiceUrl;
        await client.incomingPhoneNumbers(found.sid).update({ voiceUrl: incomingUrl, voiceMethod: 'POST' });
      }
    }
    saveConfig(cfg);
    res.json({ number: cfg.number });
  })
);

// Point (or un-point) the active number's voice webhook at our incoming
// function so inbound calls ring in the browser.
app.post(
  '/api/incoming-routing',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    const client = getClient(cfg);
    const num = (cfg.numbers || []).find((n) => n.phoneNumber === cfg.number);
    if (!num) return res.status(400).json({ error: 'No active number' });
    const incomingUrl = `https://${cfg.domainName}/incoming`;
    if (req.body.enabled) {
      const current = await client.incomingPhoneNumbers(num.sid).fetch();
      cfg.prevVoiceUrls = cfg.prevVoiceUrls || {};
      if (current.voiceUrl && current.voiceUrl !== incomingUrl) {
        cfg.prevVoiceUrls[num.sid] = current.voiceUrl;
      }
      await client.incomingPhoneNumbers(num.sid).update({ voiceUrl: incomingUrl, voiceMethod: 'POST' });
      cfg.incomingEnabled = true;
    } else {
      const prev = (cfg.prevVoiceUrls || {})[num.sid] || '';
      await client.incomingPhoneNumbers(num.sid).update({ voiceUrl: prev, voiceMethod: 'POST' });
      cfg.incomingEnabled = false;
    }
    saveConfig(cfg);
    res.json({ incomingEnabled: cfg.incomingEnabled });
  })
);

app.get(
  '/api/calls',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    const calls = await getClient(cfg).calls.list({ limit: 80 });
    const items = calls
      .filter(
        (c) =>
          !(c.from || '').startsWith('client:') &&
          !(c.to || '').startsWith('client:')
      )
      .slice(0, 50)
      .map((c) => ({
        sid: c.sid,
        direction: c.direction === 'inbound' ? 'inbound' : 'outbound',
        from: c.from,
        to: c.to,
        status: c.status,
        duration: Number(c.duration || 0),
        startTime: c.startTime
      }));
    res.json({ calls: items });
  })
);

app.get(
  '/api/messages',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    const msgs = await getClient(cfg).messages.list({ limit: 50 });
    res.json({
      messages: msgs.map((m) => ({
        sid: m.sid,
        direction: m.direction === 'inbound' ? 'inbound' : 'outbound',
        from: m.from,
        to: m.to,
        body: m.body,
        status: m.status,
        date: m.dateSent || m.dateCreated
      }))
    });
  })
);

app.post(
  '/api/messages',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    const { to, body } = req.body;
    if (!to || !body) return res.status(400).json({ error: 'To and body are required' });
    if (!cfg.number) return res.status(400).json({ error: 'No active number to send from' });
    const parsed = parsePhoneNumberFromString(to);
    if (!parsed || !parsed.isValid()) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    const msg = await getClient(cfg).messages.create({ from: cfg.number, to: parsed.number, body });
    res.json({ sid: msg.sid, status: msg.status });
  })
);

app.get(
  '/api/leads',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    if (cfg.appsScriptUrl) {
      const data = await fetchAppsScript(cfg);
      return res.json({ leads: data.leads, headers: data.headers, writable: true });
    }
    if (!cfg.sheetUrl) return res.json({ leads: [], headers: [], writable: false });
    const r = await fetch(toCsvUrl(cfg.sheetUrl), { redirect: 'follow' });
    if (!r.ok) throw new Error(`Could not fetch sheet (${r.status}). Is it shared as "Anyone with the link"?`);
    const text = await r.text();
    if (text.trimStart().startsWith('<')) {
      throw new Error('Sheet is not public. Share it as "Anyone with the link can view".');
    }
    const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''));
    if (!rows.length) return res.json({ leads: [], headers: [], writable: false });
    // Skip any title/banner rows: the header row is the one with a "Name" cell.
    let hi = rows.findIndex((r) => r.some((c) => /^name$/i.test(c.trim())));
    if (hi === -1) hi = 0;
    const headers = rows[hi].map((h) => h.trim());
    const leads = rows.slice(hi + 1).map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        if (h) obj[h] = (r[i] || '').trim();
      });
      return obj;
    });
    res.json({ leads, headers: headers.filter(Boolean), writable: false });
  })
);

app.post(
  '/api/lead-add',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    if (!cfg.appsScriptUrl) {
      return res.status(400).json({ error: 'Adding leads needs the Apps Script connection (see settings)' });
    }
    const { updates } = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'updates is required' });
    }
    const data = await fetchAppsScript(
      cfg,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ append: true, updates })
      },
      " — if your sheet's script predates lead-adding, paste the latest appsscript/Code.gs and deploy a new version."
    );
    res.json({ ok: true, row: data.row });
  })
);

app.post(
  '/api/lead-update',
  wrap(async (req, res) => {
    const cfg = loadConfig();
    if (!cfg.appsScriptUrl) {
      return res.status(400).json({ error: 'Lead updates need the Apps Script connection (see settings)' });
    }
    const { row, updates } = req.body;
    if (!row || !updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'row and updates are required' });
    }
    await fetchAppsScript(cfg, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ row, updates })
    });
    res.json({ ok: true });
  })
);

app.listen(PORT, () => {
  console.log(`dyl running → http://localhost:${PORT}`);
});

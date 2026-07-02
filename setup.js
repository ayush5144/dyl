// One-time Twilio provisioning: API key, serverless TwiML functions, TwiML app.
// Runs when the user saves credentials. Everything is created inside the
// user's own Twilio account so no ngrok/tunnel is needed for outbound calls.
const twilio = require('twilio');

const CLIENT_IDENTITY = 'dyl';

const OUTGOING_FN = `exports.handler = function (context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const to = (event.To || '').trim();
  const callerId = event.CallerId || event.From;
  if (!to) {
    twiml.say('No number provided.');
  } else if (/^\\+?[\\d\\s\\-().]+$/.test(to)) {
    const dial = twiml.dial({ callerId: callerId, answerOnBridge: true });
    dial.number(to);
  } else {
    const dial = twiml.dial({ callerId: callerId });
    dial.client(to);
  }
  return callback(null, twiml);
};
`;

const INCOMING_FN = `exports.handler = function (context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const dial = twiml.dial({ answerOnBridge: true });
  dial.client('${CLIENT_IDENTITY}');
  return callback(null, twiml);
};
`;

async function uploadFunctionVersion(cfg, serviceSid, functionSid, fnPath, code) {
  const form = new FormData();
  form.append('Path', fnPath);
  form.append('Visibility', 'protected');
  form.append('Content', new Blob([code], { type: 'application/javascript' }), 'fn.js');
  const res = await fetch(
    `https://serverless-upload.twilio.com/v1/Services/${serviceSid}/Functions/${functionSid}/Versions`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${cfg.accountSid}:${cfg.authToken}`).toString('base64')
      },
      body: form
    }
  );
  if (!res.ok) {
    throw new Error(`Function upload failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()).sid;
}

async function waitForBuild(client, serviceSid, buildSid) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const status = await client.serverless.v1
      .services(serviceSid)
      .builds(buildSid)
      .buildStatus()
      .fetch();
    if (status.status === 'completed') return;
    if (status.status === 'failed') throw new Error('Twilio function build failed');
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Timed out waiting for Twilio function build');
}

// Provisions (idempotently) and mutates cfg with the created resource SIDs.
async function ensureSetup(cfg) {
  const client = twilio(cfg.accountSid, cfg.authToken);

  // Validate credentials early with a cheap call.
  await client.api.v2010.accounts(cfg.accountSid).fetch();

  if (!cfg.apiKeySid || !cfg.apiKeySecret) {
    const key = await client.newKeys.create({ friendlyName: 'dyl dialer' });
    cfg.apiKeySid = key.sid;
    cfg.apiKeySecret = key.secret;
  }

  let service = null;
  if (cfg.serviceSid) {
    service = await client.serverless.v1.services(cfg.serviceSid).fetch().catch(() => null);
  }
  if (!service) {
    service = await client.serverless.v1.services('dyl-dialer').fetch().catch(() => null);
  }
  if (!service) {
    service = await client.serverless.v1.services.create({
      uniqueName: 'dyl-dialer',
      friendlyName: 'dyl dialer',
      includeCredentials: false
    });
  }
  cfg.serviceSid = service.sid;

  if (!cfg.domainName) {
    const svc = client.serverless.v1.services(service.sid);
    const voiceFn = await svc.functions.create({ friendlyName: 'dyl voice' });
    const incomingFn = await svc.functions.create({ friendlyName: 'dyl incoming' });
    const voiceVersion = await uploadFunctionVersion(cfg, service.sid, voiceFn.sid, '/voice', OUTGOING_FN);
    const incomingVersion = await uploadFunctionVersion(cfg, service.sid, incomingFn.sid, '/incoming', INCOMING_FN);
    const build = await svc.builds.create({ functionVersions: [voiceVersion, incomingVersion] });
    await waitForBuild(client, service.sid, build.sid);

    let env = (await svc.environments.list()).find((e) => e.uniqueName === 'production');
    if (!env) {
      env = await svc.environments.create({ uniqueName: 'production', domainSuffix: 'prod' });
    }
    await svc.environments(env.sid).deployments.create({ buildSid: build.sid });
    cfg.domainName = env.domainName;
  }

  const voiceUrl = `https://${cfg.domainName}/voice`;
  if (cfg.twimlAppSid) {
    await client.applications(cfg.twimlAppSid).update({ voiceUrl, voiceMethod: 'POST' }).catch(async () => {
      cfg.twimlAppSid = null;
    });
  }
  if (!cfg.twimlAppSid) {
    const app = await client.applications.create({
      friendlyName: 'dyl dialer',
      voiceUrl,
      voiceMethod: 'POST'
    });
    cfg.twimlAppSid = app.sid;
  }

  return cfg;
}

module.exports = { ensureSetup, CLIENT_IDENTITY };

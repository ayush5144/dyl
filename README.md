# dyl

A clean, minimal Twilio dialer that runs on your machine. Built for cold calling: dial pad, browser-based calls, a dial queue, call history, SMS, and leads pulled straight from a Google Sheet.

No ngrok. No tunnels. No hosted backend. Enter your Twilio credentials once and start dialing.

## Features

- **Dial pad** with searchable country-code picker — search by country name, first letters, ISO code, or dial code
- **Browser calling** (Twilio Voice SDK) with mute, in-call keypad (DTMF works for IVR menus), and call timer
- **Dial queue** — stack up multiple numbers; when a call ends the next one auto-loads, so it's end call → Call → repeat
- **Number validation** via Google's libphonenumber — invalid numbers can't be dialed or messaged, validated live as you type
- **Recents** — all incoming/outgoing calls with missed-call highlighting, duration, and click-to-redial
- **SMS** — send and receive, with its own country-code picker and validation
- **Leads from Google Sheets** — point it at a sheet, click a lead to load its number into the dialer
- **Multiple Twilio numbers** — switch which number you're calling from in the header
- **Incoming calls in the browser** — optional toggle, with accept/decline UI

## Quick start

```bash
git clone https://github.com/ayush5144/dyl.git
cd dyl
./start.sh        # installs deps if needed, starts the server, opens the browser
```

Or manually: `npm install && npm start`, then open http://localhost:3333.

To stop: `./stop.sh`

## One-time setup

1. Grab your **Account SID** and **Auth Token** from the [Twilio Console](https://console.twilio.com) home page.
2. Paste them into the settings modal that opens on first launch and hit **Save**. First save takes ~30 seconds.
3. Allow microphone access when you place your first call.

That's it. Everything is stored locally in `config.json` (gitignored — your credentials never leave your machine except to talk to Twilio).

### How it works without ngrok

Twilio needs a public webhook to know what to dial when your browser places a call. Instead of tunneling to your laptop, dyl deploys two tiny [Twilio Functions](https://www.twilio.com/docs/serverless/functions-assets/functions) into **your own Twilio account** during setup (hosted by Twilio at a `*.twil.io` URL):

- `/voice` — handles the outbound dial webhook
- `/incoming` — rings your browser when someone calls your Twilio number

It also creates an API key and a TwiML app, all automatically and idempotently. Call/SMS history doesn't need webhooks at all — it's read from Twilio's REST API.

## Leads from Google Sheets

Two ways to connect, set in settings:

### Apps Script URL (recommended — two-way sync)

Read *and* write: call outcomes, notes, status, and last-called timestamps are written
back to your sheet. Click a lead to expand its inline editor (auto-saves as you type,
with a manual Save button too). Calling a lead expands its editor so you can take notes
mid-call; after hangup, an outcome form saves everything back. Calls to numbers *not*
in your list get the same form and are appended to the sheet as new rows.

Setup (one time, ~2 minutes):

1. Open your leads Google Sheet → **Extensions → Apps Script**
2. Delete the placeholder code and paste in [`appsscript/Code.gs`](appsscript/Code.gs)
3. **Deploy → New deployment** → gear icon → **Web app**
4. Set *Execute as: Me* and *Who has access: **Anyone*** → **Deploy** → authorize when asked
5. Copy the Web app URL (ends in `/exec`) and paste it into dyl's settings

Header rows are auto-detected (title banners above the table are fine). Missing
workflow columns (Status / Outcome / Notes / Last Called) are created automatically.

**Updating the script later** (e.g. after pulling a newer Code.gs): paste the new code
over the old one, then **Deploy → Manage deployments → ✏️ edit → Version: New version →
Deploy**. The /exec URL stays the same, so dyl needs no settings change.

### Sheet URL (read-only fallback)

- Share the sheet as **"Anyone with the link can view"**
- Needs a phone column (any header matching phone/mobile/number/contact)
- No write-back: statuses and notes can't be saved

## Incoming calls

Toggle **"Ring incoming calls in this browser"** in settings. This points your active number's voice webhook at the deployed Twilio Function. Turning it off restores whatever webhook the number had before.

## Notes

- The country prefix applies when the number you type doesn't start with `+`. Numbers starting with `+` are dialed as-is.
- Set the SMS country picker to "No prefix" to always type full international numbers.
- Trial Twilio accounts can only call verified numbers and play a trial notice before each call.
- Data lives in `config.json` (Twilio credentials + provisioned resource SIDs) and browser localStorage (dial queue, country preferences).

## Stack

Node.js + Express, vanilla JS frontend, [@twilio/voice-sdk](https://www.npmjs.com/package/@twilio/voice-sdk), [libphonenumber-js](https://www.npmjs.com/package/libphonenumber-js). No build step, no framework.

## License

MIT

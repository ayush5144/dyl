#!/bin/bash
# Start the dyl dialer in the background and open it in the browser.
cd "$(dirname "$0")"

PORT="${PORT:-3333}"

if lsof -ti :"$PORT" >/dev/null 2>&1; then
  echo "dyl is already running → http://localhost:$PORT"
  open "http://localhost:$PORT"
  exit 0
fi

if [ ! -d node_modules ]; then
  echo "Installing dependencies…"
  npm install --silent
fi

nohup node server.js > dyl.log 2>&1 &
echo $! > .dyl.pid

# Wait for the server to come up (max ~5s)
for _ in $(seq 1 25); do
  if curl -s -o /dev/null "http://localhost:$PORT/api/config"; then
    echo "dyl running → http://localhost:$PORT (logs: dyl.log)"
    open "http://localhost:$PORT"
    exit 0
  fi
  sleep 0.2
done

echo "dyl failed to start — check dyl.log"
exit 1

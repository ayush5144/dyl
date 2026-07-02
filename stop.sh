#!/bin/bash
# Stop the dyl dialer and anything else holding its port.
cd "$(dirname "$0")"

PORT="${PORT:-3333}"
STOPPED=0

# Kill the process we started (if the pid file exists)
if [ -f .dyl.pid ]; then
  PID=$(cat .dyl.pid)
  if kill "$PID" 2>/dev/null; then
    STOPPED=1
  fi
  rm -f .dyl.pid
fi

# Kill any leftover dyl server processes (e.g. started manually)
for PID in $(pgrep -f "node .*dev/dyl/server\.js"; lsof -ti :"$PORT" 2>/dev/null); do
  if kill "$PID" 2>/dev/null; then
    STOPPED=1
  fi
done

if [ "$STOPPED" = 1 ]; then
  echo "dyl stopped."
else
  echo "dyl was not running."
fi

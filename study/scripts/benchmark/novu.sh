#!/bin/bash
echo 'Analyzing project novu'
node  --max-old-space-size=8192 index.js --project  ../benchmark/novu/apps/dashboard/src --root ../benchmark/novu/apps/dashboard/src/main.tsx > output.log
node ./study/index.js "update-results" novu

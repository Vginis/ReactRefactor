#!/bin/bash

echo 'Analyzing project cal.com'
node  --max-old-space-size=8192 index.js  --project ../benchmark/cal.com/apps/web --root ../benchmark/cal.com/apps/web/app/page.tsx > output.log
node ./study/index.js "update-results" cal.com

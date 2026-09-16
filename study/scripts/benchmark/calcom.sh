#!/bin/bash
node  --max-old-space-size=8192 index.js  --project ../benchmark/nunes/cal.diy/apps/web --root ../benchmark/nunes/cal.diy/apps/web/app/page.tsx > output.log
node ./study/index.js "update-results" cal.com

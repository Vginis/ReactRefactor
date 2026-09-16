#!/bin/bash
node  --max-old-space-size=8192 index.js --project ../benchmark/lobehub/src --root ../benchmark/lobehub/src/app/desktop/layout.tsx > output.log
node ./study/index.js "update-results" "lobe-chat"

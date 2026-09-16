#!/bin/bash

echo 'Analyzing project lobe-chat'
node  --max-old-space-size=8192 index.js --project ../benchmark/lobe-chat/src --root ../benchmark/lobe-chat/src/app/desktop/layout.tsx > output.log
node ./study/index.js "update-results" "lobe-chat"

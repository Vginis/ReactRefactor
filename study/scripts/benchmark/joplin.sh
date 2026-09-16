#!/bin/bash
echo 'Analyzing project joplin'
node --max-old-space-size=8192 index.js  --project ../benchmark/joplin/packages/app-desktop --root ../benchmark/joplin/packages/app-desktop/app.ts > output.log
node ./study/index.js "update-results" joplin

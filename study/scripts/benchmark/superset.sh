#!/bin/bash

echo 'Analyzing project superset'
node --max-old-space-size=8192 index.js --project ../benchmark/superset/superset-frontend/src/ --root ../benchmark/superset/superset-frontend/src/profile/index.tsx > output.log
node ./study/index.js "update-results" superset

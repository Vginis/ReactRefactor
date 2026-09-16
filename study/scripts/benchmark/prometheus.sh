#!/bin/bash
node --max-old-space-size=8192 index.js --project ../benchmark/prometheus/web/ui/react-app/src --root ../benchmark/prometheus/web/ui/react-app/src/App.tsx > output.log
node ./study/index.js "update-results" prometheus
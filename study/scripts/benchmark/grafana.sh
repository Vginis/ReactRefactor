#!/bin/bash

echo 'Analyzing project grafana'
node  --max-old-space-size=8192 index.js  --project ../benchmark/grafana/public/app --root ../benchmark/grafana/public/app/AppWrapper.tsx > output.log
node ./study/index.js "update-results" grafana

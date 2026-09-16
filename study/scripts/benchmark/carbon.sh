#!/bin/bash
# node  --max-old-space-size=8192 index.js  ../benchmark/carbon ../benchmark/carbon/pages/index.js > output.log

echo 'Analyzing project carbon'
node  --max-old-space-size=8192 index.js  --project ../benchmark/carbon --root ../benchmark/carbon/pages/index.js > output.log

node ./study/index.js "update-results" carbon

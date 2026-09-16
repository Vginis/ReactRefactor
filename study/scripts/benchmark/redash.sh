#!/bin/bash

echo 'Analyzing project redash'
node  --max-old-space-size=8192 index.js  --project ../benchmark/redash/client/app --root ../benchmark/redash/client/app/index.js > output.log
node ./study/index.js "update-results" redash

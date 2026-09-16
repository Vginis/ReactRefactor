#!/bin/bash
node  --max-old-space-size=8192 index.js --project ../benchmark/metabase/frontend/src/metabase/ --root ../benchmark/metabase/frontend/src/metabase/App.tsx > output.log
node ./study/index.js "update-results" metabase

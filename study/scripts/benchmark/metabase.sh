#!/bin/bash
node  --max-old-space-size=8192 index.js  ../benchmark/metabase/frontend/src/metabase/ ../benchmark/metabase/frontend/src/metabase/App.tsx > output.log
node ./study/index.js "update-results" metabase

#!/bin/bash
node  --max-old-space-size=8192 index.js  ../benchmark/redash/client/app ../benchmark/redash/client/app/index.js > output.log
node ./study/index.js "update-results" redash

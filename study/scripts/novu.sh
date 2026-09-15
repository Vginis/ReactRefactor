#!/bin/bash
node  --max-old-space-size=8192 index.js  ../benchmark/nunes/novu/apps/dashboard/src ../benchmark/nunes/novu/apps/dashboard/src/main.tsx > output.log
node ./study/index.js "update-results" novu

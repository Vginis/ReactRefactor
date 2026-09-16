#!/bin/bash

echo 'Analyzing project plane'
node  --max-old-space-size=8192 index.js --project  ../benchmark/plane/apps/web --root ../benchmark/plane/apps/web/app/layout.tsx --prefix-mappings "@=core @/plane-web=ce"  > output.log
node ./study/index.js "update-results" plane


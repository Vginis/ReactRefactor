#!/bin/bash
# node  --max-old-space-size=8192 index.js  ../benchmark/nunes/plane/apps/web ../benchmark/nunes/apps/web/app/root.tsx > output.log

node  --max-old-space-size=8192 index.js --project  ../benchmark/plane/apps/web --root ../benchmark/plane/apps/web/app/root.tsx --prefix-mappings @//=core @//plane-web=ce


node ./study/index.js "update-results" plane
#node  --max-old-space-size=8192 index.js  ../benchmark/nunes/plane/apps/space ../benchmark/nunes/apps/space/app/root.tsx

#!/bin/bash
node  --max-old-space-size=8192 index.js  --project ../benchmark/nunes/affine/packages/frontend --root ../benchmark/nunes/affine/packages/frontend/apps/electron/src/main/index.ts > output.log

node ./study/index.js "update-results" affine

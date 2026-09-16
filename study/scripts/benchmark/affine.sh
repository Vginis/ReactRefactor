#!/bin/bash
node  --max-old-space-size=8192 index.js  --project ../benchmark/affine/packages/frontend --root ../benchmark/affine/packages/frontend/apps/electron/src/main/index.ts > output.log

node ./study/index.js "update-results" affine

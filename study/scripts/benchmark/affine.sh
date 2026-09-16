#!/bin/bash
echo 'Analyzing project affine'
node  --max-old-space-size=8192 index.js  --project ../benchmark/affine/packages/frontend --root ../benchmark/affine/packages/frontend/apps/electron/src/main/index.ts --prefix-mappings "@affine/core=core/src @affine/component=component/src @affine/electron=apps/electron/src" > output.log

node ./study/index.js "update-results" affine

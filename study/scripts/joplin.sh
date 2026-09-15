#!/bin/bash
node --max-old-space-size=8192 index.js  ../benchmark/joplin/packages/app-desktop ../benchmark/joplin/packages/app-desktop/app.ts > output.log
node ./study/index.js "update-results" joplin

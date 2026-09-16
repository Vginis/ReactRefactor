#!/bin/bash
node  --max-old-space-size=8192 index.js  ../benchmark/mastodon/app/javascript ../benchmark/mastodon/app/javascript/mastodon/main.tsx > output.log
node ./study/index.js "update-results" mastodon

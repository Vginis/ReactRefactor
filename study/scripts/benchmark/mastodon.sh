#!/bin/bash

echo 'Analyzing project mastodon'
node  --max-old-space-size=8192 index.js  --project ../benchmark/mastodon/app/javascript --root ../benchmark/mastodon/app/javascript/mastodon/main.tsx > output.log
node ./study/index.js "update-results" mastodon

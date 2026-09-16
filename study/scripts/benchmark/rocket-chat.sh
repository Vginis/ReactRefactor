#!/bin/bash
node  --max-old-space-size=8192 index.js --project ../benchmark/Rocket.Chat/apps/meteor/client --root ../benchmark/Rocket.Chat/apps/meteor/client/main.ts > output.log
node ./study/index.js "update-results" Rocket.Chat

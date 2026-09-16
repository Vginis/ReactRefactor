#!/bin/bash
node --max-old-space-size=8192 index.js --project ../benchmark/mitmproxy/web/src/js --root ../benchmark/mitmproxy/web/src/js/app.jsx > output.log
node ./study/index.js "update-results" mitmproxy

#!/bin/bash
node --max-old-space-size=8192 index.js  ../benchmark/mitmproxy/web/src/js ../benchmark/mitmproxy/web/src/js/app.jsx Response,Request

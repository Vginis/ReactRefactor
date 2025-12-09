#!/bin/bash
node --max-old-space-size=8192 index.js ../benchmark/lighthouse/flow-report/src/ ../benchmark/lighthouse/flow-report/src/app.tsx App

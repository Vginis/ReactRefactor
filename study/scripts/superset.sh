#!/bin/bash
node --max-old-space-size=8192 index.js ../benchmark/superset/superset-frontend/src/ ../benchmark/superset/superset-frontend/src/profile/index.tsx App

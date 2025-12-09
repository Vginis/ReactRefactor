#!/bin/bash
node --max-old-space-size=8192 index.js  ../benchmark/prometheus/web/ui/react-app/src ../benchmark/prometheus/web/ui/react-app/src/App.tsx App

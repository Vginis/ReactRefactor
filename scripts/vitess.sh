#!/bin/bash
node --max-old-space-size=8192 index.js   ../benchmark/vitess/web/vtadmin/src/ ../benchmark/vitess/web/vtadmin/src/index.tsx App

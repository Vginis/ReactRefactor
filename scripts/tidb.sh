#!/bin/bash
node --max-old-space-size=8192 index.js  ../benchmark/tidb/br/web/src ../benchmark/tidb/br/web/src/index.tsx App

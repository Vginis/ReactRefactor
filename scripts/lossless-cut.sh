#!/bin/bash
node --max-old-space-size=8192 index.js  ../benchmark/lossless-cut/src/renderer/src ../benchmark/lossless-cut/src/renderer/src/index.tsx App

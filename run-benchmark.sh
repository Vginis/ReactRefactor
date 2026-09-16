#!/bin/bash

# Create working directories
mkdir stats
mkdir stats/tmp
mkdir ../benchmark

# Install Dependencies
npm install

# Clone benchmark projects
npm run clone-benchmark

# Analyze benchmark projects
./study/scripts/benchmark/affine.sh
./study/scripts/benchmark/calcom.sh
./study/scripts/benchmark/carbon.sh
./study/scripts/benchmark/grafana.sh
./study/scripts/benchmark/joplin.sh
./study/scripts/benchmark/lobe-chat.sh
./study/scripts/benchmark/mastodon.sh
./study/scripts/benchmark/metabase.sh
./study/scripts/benchmark/mitmproxy.sh
./study/scripts/benchmark/novu.sh
./study/scripts/benchmark/plane.sh
./study/scripts/benchmark/prometheus.sh
./study/scripts/benchmark/redash.sh
./study/scripts/benchmark/rocket-chat.sh
./study/scripts/benchmark/superset.sh

# Generate latex files with results
npm run latex
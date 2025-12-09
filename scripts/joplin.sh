#!/bin/bash
node --max-old-space-size=8192 index.js  ../benchmark/joplin/ElectronClient/gui ../benchmark/joplin/ElectronClient/gui/Root.jsx MainScreenComponent,ConfigScreenComponent tsx

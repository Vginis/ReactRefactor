#!/bin/bash
node  --max-old-space-size=8192 index.js  ../benchmark/grafana/public/app ../benchmark/grafana/public/app/AppWrapper.tsx SoloPanelPage,DataSourcesListPage,DashboardImportPage,DataSourceSettingsPage,DataSourceDashboards > output.log
node ./study/index.js "update-results" grafana

import { exec } from 'child_process';
import path from 'path';
import * as fs from 'fs';

let projectNames = [];
let componentsCount = [];
let propDrillingsCount = [];
let propDrillingParticipationPercentages = [];
let propDrillingParticipationCount = []
let propDrillingDepths = [];
let compoundPropDrillingsCount = [];
let compoundPropDrillingFamilies = [];
let compositionRefactoringsCount = [];
let contextRefactoringsCount = [];
let totalRefactoringsCount = [];
let pathOccurencesArrays = [];
let propDrillingsWithCommonEndingArray = [];
let propDrillingsWithCommonStartArray = [];

function generatePropDrillingReport(){
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\carbon-main\\carbon-main ..\\testing-projects\\carbon-main\\carbon-main\\pages\\index.js'
        ,'Carbon');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src ..\\testing-projects\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src\\index.js'
        ,'Redux Realworld Example');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\react-proto-master_v2\\react-proto-master_v2\\src ..\\testing-projects\\react-proto-master_v2\\react-proto-master_v2\\src\\index.js'
        ,'React proto');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\project_fitness_app-main\\project_fitness_app-main\\src ..\\testing-projects\\project_fitness_app-main\\project_fitness_app-main\\src\\index.js'
        ,'Project fitness');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\ecommerce-react-master\\ecommerce-react-master\\src ..\\testing-projects\\ecommerce-react-master\\ecommerce-react-master\\src\\index.jsx App'
        ,'Ecommerce React');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\Whisper-main2\\Whisper-main\\client\\src ..\\testing-projects\\Whisper-main2\\Whisper-main\\client\\src\\index.jsx'
        ,'Whisper');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\prometheus-release-2.21\\prometheus-release-2.21\\web\\ui\\react-app\\src\\ ..\\testing-projects\\prometheus-release-2.21\\prometheus-release-2.21\\web\\ui\\react-app\\src\\App.tsx App'
        ,'Prometheus');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\tidb-release-6.5\\tidb-release-6.5\\br\\web\\src\\ ..\\testing-projects\\tidb-release-6.5\\tidb-release-6.5\\br\\web\\src\\index.tsx App'
        ,'TiDB');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\mitmproxy-7.0.x\\mitmproxy-7.0.x\\web\\src\\js\\ ..\\testing-projects\\mitmproxy-7.0.x\\mitmproxy-7.0.x\\web\\src\\js\\app.jsx Response,Request'
        ,'MITM');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\joplin-release-1.0\\joplin-release-1.0\\ElectronClient\\gui\\ ..\\testing-projects\\joplin-release-1.0\\joplin-release-1.0\\ElectronClient\\gui\\Root.jsx MainScreenComponent,ConfigScreenComponent tsx'
        ,'Joplin');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\conky-1.22.1\\conky-1.22.1\\web\\ ..\\testing-projects\\conky-1.22.1\\conky-1.22.1\\web\\index.tsx '
        ,'Conky');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\vitess-22.0.0-rc3\\vitess-22.0.0-rc3\\web\\vtadmin\\src\\ ..\\testing-projects\\vitess-22.0.0-rc3\\vitess-22.0.0-rc3\\web\\vtadmin\\src\\index.tsx App'
        ,'Vitess');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\lossless-cut-master\\lossless-cut-master\\src\\renderer\\src\\ ..\\testing-projects\\lossless-cut-master\\lossless-cut-master\\src\\renderer\\src\\index.tsx App'
        ,'Lossless Cut');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\superset-2021.41.0\\superset-2021.41.0\\superset-frontend\\src\\ ..\\testing-projects\\superset-2021.41.0\\superset-2021.41.0\\superset-frontend\\src\\profile\\index.tsx App'
        ,'Apache Superset');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\lighthouse-main\\lighthouse-main\\flow-report\\src\\ ..\\testing-projects\\lighthouse-main\\lighthouse-main\\flow-report\\src\\app.tsx App'
        ,'Lighthouse');
}
generatePropDrillingReport();

function initGenerationForPropDrillingReport(entryCommand,projectName){
    exec(entryCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return;
        }
      
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
    
        //Component Count
        const componentsCountMatch = stdout.match(/Number of found Components: (\d+)/);
        const componentsCountMatchResult = parseInt(componentsCountMatch[1]);
    
        //Prop Drilling Count 
        const propDrillingsCountMatch = stdout.match(/Found: (\d+) Prop Drilling Occurences/);
        const propDrillingsCountMatchResult = parseInt(propDrillingsCountMatch[1]);
    
        //Component Participation Percentage in Prop Drillings
        const componentsParticipationParticipationMatch = stdout.match(/Components participation percentage in Prop Drillings: (\d+\.\d{2})/);
        const componentsParticipationParticipationMatchResult = parseFloat(componentsParticipationParticipationMatch[1]);
    
        const componentsParticipationCountMatch = stdout.match(/Components participating in Prop Drillings: (\d+)/);
        const componentsParticipationCountMatchResult = parseFloat(componentsParticipationCountMatch[1]);

        //Compound Prop Drillings count
        const compoundPropDrillingCountMatch = stdout.match(/Number of Compound Prop Drillings: (\d+)/);
        const compoundPropDrillingCountMatchResult = parseInt(compoundPropDrillingCountMatch[1]);

        //Prop Drillings by depth
        const propDrillingOfDepth_3 = stdout.match(/Number of Prop Drillings with depth 3: (\d+)/);
        const propDrillingOfDepth_3_result = parseInt(propDrillingOfDepth_3[1]);

        const propDrillingOfDepth_4 = stdout.match(/Number of Prop Drillings with depth 4: (\d+)/);
        const propDrillingOfDepth_4_result = parseInt(propDrillingOfDepth_4[1]);

        const propDrillingOfDepth_5 = stdout.match(/Number of Prop Drillings with depth 5: (\d+)/);
        const propDrillingOfDepth_5_result = parseInt(propDrillingOfDepth_5[1]);

        const propDrillingDepthArray = [propDrillingOfDepth_3_result, propDrillingOfDepth_4_result, propDrillingOfDepth_5_result];

        //Compound Prop Drilling by family
        const compoundPropDrilling_2_properties = stdout.match(/Compound Prop Drilling Families with 2 properties: (\d+)/);
        const compoundPropDrilling_2_properties_result = parseInt(compoundPropDrilling_2_properties[1]);

        const compoundPropDrilling_3_properties = stdout.match(/Compound Prop Drilling Families with 3 properties: (\d+)/);
        const compoundPropDrilling_3_properties_result = parseInt(compoundPropDrilling_3_properties[1]);

        const compoundPropDrilling_multiple_properties = stdout.match(/Compound Prop Drilling Families with more than 4 properties: (\d+)/);
        const compoundPropDrilling_multiple_properties_result = parseInt(compoundPropDrilling_multiple_properties[1]);

        const compoundPropDrillingsFamiliesArray = [compoundPropDrilling_2_properties_result, compoundPropDrilling_3_properties_result, compoundPropDrilling_multiple_properties_result];

        //Refactoring applicability
        const compositionRefactoringCount = stdout.match(/Allowed Refactorings with Component Composition: (\d+)/);
        const compositionRefactoringCountResult = parseInt(compositionRefactoringCount[1]);

        const contextRefactoringCount = stdout.match(/Allowed Refactorings with Context: (\d+)/);
        const contextRefactoringCountResult = parseInt(contextRefactoringCount[1]);

        const totalRefactoringCount = stdout.match(/Possible Refactorings with Context or Composition: (\d+)/);
        const totalRefactoringCountResult = parseInt(totalRefactoringCount[1]);

        //Compound Prop Drilling stats by project
        const compoundPropDrillingsArray = stdout.match(/Path Occurences Array: ([\d,]+)/);
        const compoundPropDrillingsArrayResult = compoundPropDrillingsArray ? compoundPropDrillingsArray[1].split(',').map(Number) : [];
        
        //Prop Drillings with common ending and start
        const propDrillingsWithCommonEnding = stdout.match(/Prop Drillings with common ending: ([\d,]+)/);
        const propDrillingsWithCommonStart = stdout.match(/Prop Drillings with common start: ([\d,]+)/);
        const propDrillingsWithCommonEndingResult = parseInt(propDrillingsWithCommonEnding[1]);
        const propDrillingsWithCommonStartResult = parseInt(propDrillingsWithCommonStart)

        //push elements to lists for csv
        projectNames.push(projectName);
        componentsCount.push(componentsCountMatchResult);
        propDrillingsCount.push(propDrillingsCountMatchResult);
        propDrillingParticipationPercentages.push(componentsParticipationParticipationMatchResult);
        propDrillingParticipationCount.push(componentsParticipationCountMatchResult);
        compoundPropDrillingsCount.push(compoundPropDrillingCountMatchResult);
        propDrillingDepths.push(propDrillingDepthArray);
        compoundPropDrillingFamilies.push(compoundPropDrillingsFamiliesArray);
        compositionRefactoringsCount.push(compositionRefactoringCountResult)
        contextRefactoringsCount.push(contextRefactoringCountResult);
        totalRefactoringsCount.push(totalRefactoringCountResult);
        pathOccurencesArrays.push(compoundPropDrillingsArrayResult);
        propDrillingsWithCommonEndingArray.push(propDrillingsWithCommonEndingResult);
        propDrillingsWithCommonStartArray.push(propDrillingsWithCommonStartResult);
        
        generateCsvForPropDrillingFrequency(projectNames, componentsCount, propDrillingsCount, propDrillingParticipationCount, propDrillingParticipationPercentages);
        generateCsvForPropDrillingDepths(projectNames, propDrillingsCount, propDrillingDepths);
        generateCsvForCompoundPropDrillingsCount(projectNames, propDrillingsCount, compoundPropDrillingsCount);
        generateCsvForCompoundPropDrillingsStats(propDrillingsCount, compoundPropDrillingsCount);
        generateCsvForCompoundPropDrillingsFamilies(projectNames,compoundPropDrillingsCount, compoundPropDrillingFamilies);
        generateCsvForRefactorings(projectNames, compositionRefactoringsCount, contextRefactoringsCount,totalRefactoringsCount);
        generateCsvForCompoundPropDrillingStatsByProject(projectNames, pathOccurencesArrays);
        generateCsvForPropDrillingsWithCommonStartEnding(projectNames, propDrillingsWithCommonEndingArray,propDrillingsWithCommonStartArray);
    });
}

function generateCsvForPropDrillingFrequency(projectNames, componentsCount, propDrillingsCount, propDrillingParticipationCount,propDrillingParticipationPercentages){
    if (projectNames.length !== componentsCount.length || projectNames.length !== propDrillingsCount.length || projectNames.length !== propDrillingParticipationPercentages.length
        || propDrillingParticipationCount.length !== componentsCount.length
    ) {
        console.error("Input arrays must have the same length.");
        return;
    }

    const header = ['Project Name', 'Components', 'Prop Drillings', 'Count Of Components Participating', 'Component Participation Percentage'];
    const rows = projectNames.map((project, index) => {
        return [
          project,
          componentsCount[index],
          propDrillingsCount[index],
          propDrillingParticipationCount[index],
          propDrillingParticipationPercentages[index].toFixed(2)
        ].join(',');
      });
    const csvContent = [header.join(','), ...rows].join('\n');
    const outputPath = path.join('stats/prop_drilling_report.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV file generated at: ${outputPath}`);
}

function generateCsvForPropDrillingDepths(projectNames, propDrillingsCount, depthsArray){
    if (projectNames.length !== propDrillingsCount.length || depthsArray.some(arr => arr.length !== 3)) {
        console.error("Input arrays have invalid length.");
        return;
    }

    const header = ['Project Name', 'Prop Drillings', 'Prop Drillings with Depth 3',
        'Prop Drillings with Depth 4','Prop Drillings with Depth 5'];
    const rows = projectNames.map((project, index) => {
        return [
            project,
            propDrillingsCount[index],
            depthsArray[index][0],
            depthsArray[index][1],
            depthsArray[index][2],
        ].join(',');
        });
    const csvContent = [header.join(','), ...rows].join('\n');
    const outputPath = path.join('stats/prop_drilling_depth_report.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV depths file generated at: ${outputPath}`);
}

function generateCsvForCompoundPropDrillingsCount(projectNames, propDrillingsCount, compoundPropDrillingsCount){
    if (projectNames.length !== compoundPropDrillingsCount.length || projectNames.length !== propDrillingsCount.length) {
        console.error("Input arrays must have the same length.");
        return;
    }

    const header = ['Project Name', 'Prop Drillings', 'Compound Prop Drillings'];
    const rows = projectNames.map((project, index) => {
        return [
            project,
            propDrillingsCount[index],
            compoundPropDrillingsCount[index]
        ].join(',');
        });
    const csvContent = [header.join(','), ...rows].join('\n');
    const outputPath = path.join('stats/compound_prop_drilling_report.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV compound Prop drillings count file generated at: ${outputPath}`);
}

function generateCsvForCompoundPropDrillingsStats(propDrillingsCount, compoundPropDrillingsCount){
    if(propDrillingsCount.length !== compoundPropDrillingsCount.length){
        console.error("Input arrays must have the same length.");
        return;
    }

    const header = ['Prop Drillings', 'Compound Prop Drillings'];
    const rows = [];

    //Add minimum row
    const minRow = ['Minimum', Math.min(...propDrillingsCount), Math.min(...compoundPropDrillingsCount)].join(',');
    rows.push(minRow)

    //Add maximum row
    const maxRow = ['Maximum', Math.max(...propDrillingsCount), Math.max(...compoundPropDrillingsCount)].join(',')
    rows.push(maxRow);

    //Add average row
    const average = propDrillingsCount.reduce((sum, val) => sum + val, 0) / propDrillingsCount.length;
    const average_compound = compoundPropDrillingsCount.reduce((sum, val) => sum + val, 0) / compoundPropDrillingsCount.length;
    const average_row = ['Average', average, average_compound];
    rows.push(average_row);

    //Add standard deviation row
    const squaredDiffs = propDrillingsCount.map(val => Math.pow(val - average, 2));
    const squaredDiffs_compound = compoundPropDrillingsCount.map(val => Math.pow(val - average_compound, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / propDrillingsCount.length;
    const variance_compound = squaredDiffs_compound.reduce((sum, val) => sum + val, 0) / compoundPropDrillingsCount.length;
    const stdDev = Math.sqrt(variance);
    const stdDev_compound = Math.sqrt(variance_compound);
    const stdDev_row = ['Standard Deviation', stdDev, stdDev_compound];
    rows.push(stdDev_row);

    const csvContent = [header.join(','), ...rows].join('\n');
    const outputPath = path.join('stats/compound_prop_drilling_stats_report.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV compound Prop drillings stats file generated at: ${outputPath}`);
}

function generateCsvForCompoundPropDrillingsFamilies(projectNames,compoundPropDrillingsCount, compoundPropDrillingFamilies){
    if(projectNames.length !== compoundPropDrillingsCount.length || projectNames.length !== compoundPropDrillingFamilies.length){
        console.error("Input arrays must have the same length.");
        return;
    }

    const header = ['Compound Prop Drillings', '2 Properties', '3 Properties', 'More than 4 Properties'];
    const rows = projectNames.map((project, index) => {
        return [
            project,
            compoundPropDrillingsCount[index],
            compoundPropDrillingFamilies[index][0],
            compoundPropDrillingFamilies[index][1],
            compoundPropDrillingFamilies[index][2],
        ].join(',');
        });
    const csvContent = [header.join(','), ...rows].join('\n');
    const outputPath = path.join('stats/prop_drilling_families_report.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV depths file generated at: ${outputPath}`);
}

function generateCsvForRefactorings(projectNames, compositionRefactoringsCount, contextRefactoringsCount,totalRefactoringsCount){
    if(projectNames.length !== compositionRefactoringsCount.length || projectNames.length !== contextRefactoringsCount.length
         || totalRefactoringsCount.length !== contextRefactoringsCount.length){
        console.error("Input arrays must have the same length.");
        return;
    }

    const header = ['Project Names', 'Compoenent Composition', 'Context', 'Total'];
    const rows = projectNames.map((project, index) => {
        return [
            project,
            compositionRefactoringsCount[index],
            contextRefactoringsCount[index],
            totalRefactoringsCount[index]
        ].join(',');
        });
    const csvContent = [header.join(','), ...rows].join('\n');
    const outputPath = path.join('stats/prop_drilling_refactoring.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV depths file generated at: ${outputPath}`);
}

function generateCsvForCompoundPropDrillingStatsByProject(projectNames, pathOccurencesArrays){
    const header = ['Project Names', 'Max', 'Min','Average','Standard Deviation'];

    const rows = projectNames.map((project, index) => {
        const average = pathOccurencesArrays[index].reduce((sum, val) => sum + val, 0) / pathOccurencesArrays[index].length
        const squaredDiffs = pathOccurencesArrays[index].map(val => Math.pow(val - average, 2));
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / pathOccurencesArrays[index].length;
        return [
            project,
            Math.max(...pathOccurencesArrays[index]),
            Math.min(...pathOccurencesArrays[index]),
            average,
            Math.sqrt(variance)
        ].join(',');
        });
    
    const csvContent = [header.join(','), ...rows].join('\n');
    const outputPath = path.join('stats/compound_prop_drilling_stats_by_project.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV depths file generated at: ${outputPath}`);
}

function generateCsvForPropDrillingsWithCommonStartEnding(projectNames,propDrillingsWithCommonEndingArray,propDrillingsWithCommonStartArray){
    const header = ['Project Names', 'Prop Drillings with Common Ending', 'Prop Drillings with Common Start'];
    const rows = projectNames.map((project, index) => {
        return [
            project,
            propDrillingsWithCommonEndingArray,
            propDrillingsWithCommonStartArray
        ].join(',');
    });

    const csvContent = [header.join(','), ...rows].join('\n');
    const outputPath = path.join('stats/prop_drillings_with_common_endings_starts.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV common starts/endings file generated at: ${outputPath}`);
}
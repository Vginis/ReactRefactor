import { exec } from 'child_process';
import path from 'path';
import * as fs from 'fs';

let projectNames = [];
let componentsCount = [];
let propDrillingsCount = [];
let propDrillingParticipationPercentages = [];
let propDrillingDepths = [];
let compoundPropDrillingsCount = [];
let compoundPropDrillingFamilies = [];
let compositionRefactoringsCount = [];
let contextRefactoringsCount = [];

function generatePropDrillingReport(){
    //initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\code2\\my-app\\src\\ ..\\testing-projects\\code2\\my-app\\src\\index.js','code2');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\carbon-main\\carbon-main ..\\testing-projects\\carbon-main\\carbon-main\\pages\\index.js'
        ,'Carbon');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src ..\\testing-projects\\react-redux-realworld-example-app-master\\react-redux-realworld-example-app-master\\src\\index.js'
        ,'Redux Realworld Example');
    initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\react-proto-master_v2\\react-proto-master_v2\\src ..\\testing-projects\\react-proto-master_v2\\react-proto-master_v2\\src\\index.js'
        ,'React proto');
    // initGenerationForPropDrillingReport('node index.js ..\\testing-projects\\project_fitness_app-main\\project_fitness_app-main\\src ..\\testing-projects\\project_fitness_app-main\\project_fitness_app-main\\src\\index.js'
    //     ,'Project fitness');
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

        //push elements to lists for csv
        projectNames.push(projectName);
        componentsCount.push(componentsCountMatchResult);
        propDrillingsCount.push(propDrillingsCountMatchResult);
        propDrillingParticipationPercentages.push(componentsParticipationParticipationMatchResult);
        compoundPropDrillingsCount.push(compoundPropDrillingCountMatchResult);
        propDrillingDepths.push(propDrillingDepthArray);
        compoundPropDrillingFamilies.push(compoundPropDrillingsFamiliesArray);
        compositionRefactoringsCount.push(compositionRefactoringCountResult)
        contextRefactoringsCount.push(contextRefactoringCountResult);

        generateCsvForPropDrillingFrequency(projectNames, componentsCount, propDrillingsCount, propDrillingParticipationPercentages);
        generateCsvForPropDrillingDepths(projectNames, propDrillingsCount, propDrillingDepths);
        generateCsvForCompoundPropDrillingsCount(projectNames, propDrillingsCount, compoundPropDrillingsCount);
        generateCsvForCompoundPropDrillingsStats(propDrillingsCount, compoundPropDrillingsCount);
        generateCsvForCompoundPropDrillingsFamilies(projectNames,compoundPropDrillingsCount, compoundPropDrillingFamilies);
        generateCsvForRefactorings(projectNames, compositionRefactoringsCount, contextRefactoringsCount);
    });
}

function generateCsvForPropDrillingFrequency(projectNames, componentsCount, propDrillingsCount, propDrillingParticipationPercentages){
    if (projectNames.length !== componentsCount.length || projectNames.length !== propDrillingsCount.length || projectNames.length !== propDrillingParticipationPercentages.length) {
        console.error("Input arrays must have the same length.");
        return;
    }

    const header = ['Project Name', 'Components', 'Prop Drillings', 'Component Participation Percentage'];
    const rows = projectNames.map((project, index) => {
        return [
          project,
          componentsCount[index],
          propDrillingsCount[index],
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

function generateCsvForRefactorings(projectNames, compositionRefactoringsCount, contextRefactoringsCount){
    if(projectNames.length !== compositionRefactoringsCount.length || projectNames.length !== contextRefactoringsCount.length){
        console.error("Input arrays must have the same length.");
        return;
    }

    const header = ['Project Names', 'Compoenent Composition', 'Context'];
    const rows = projectNames.map((project, index) => {
        return [
            project,
            compositionRefactoringsCount[index],
            contextRefactoringsCount[index]
        ].join(',');
        });
    const csvContent = [header.join(','), ...rows].join('\n');
    const outputPath = path.join('stats/prop_drilling_refactoring.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    console.log(`CSV depths file generated at: ${outputPath}`);
}
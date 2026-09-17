import {
    parseResultsJson,
    countDistinctComponents,
    calculatePropDrillingDepths,
    countCompoundPropDrillings,
    countPropDrillingFamilies,
    countPropDrillingRefactoringStats
} from "../lib/utils/statsJsonCalculation.js";
import { projects } from './benchmark.js'
import PropDrillingInfo from "../lib/json/PropDrillingInfo.js";
import ProjectInfo from "../lib/json/ProjectInfo.js";
import { appendFileSync, writeFileSync } from "fs";
import { generateCSV } from "./csv-export.js";
import * as fs from 'node:fs';
import path from 'path';
import { exit } from "node:process";
import { execSync } from "node:child_process"

const LATEX_OUTPUT_DIR = './study/latex'
const RESULTS_DIR = './study/results'
const BENCHMARKS_DIR = '../benchmark'

const TBL1_DATASET_PROJECTS = `${LATEX_OUTPUT_DIR}/tbl1_dataset_projects.tex`
const TBL2_PROP_DRILL_ADOPTION = `${LATEX_OUTPUT_DIR}/tbl2_prop_drilling_report.tex`
const TBL3_PROP_DRILL_DEPTH_DISTR = `${LATEX_OUTPUT_DIR}/tbl3_prop_drilling_depth_report.tex`
const TBL4_COMP_PROP_DRILL_DISTR = `${LATEX_OUTPUT_DIR}/tbl4_compound_prop_drillings_report.tex`
const TBL5_REFACTORING_CANDIDATES = `${LATEX_OUTPUT_DIR}/tbl5_prop_drillings_refactorings_report.tex`

const args = process.argv.slice(2);
const action = args[0];

const projectList = projects
    .map(p => ProjectInfo.fromJson(p))



if (!action || action === 'latex') {
    parseJSONResults();
    let sortedProjects = projectList.toSorted((a, b) => (b.sloc - a.sloc))
    generateLatexReports(sortedProjects);
} else if (action === 'csv') {
    parseJSONResults();
    generateCSV(projectList, './stats/prop_dillings.csv')
} else if (action === 'pd-dependencies') {

} else if (action === 'update-results') {
    const project = args[1]
    const commitId = getProject(project)?.commitId
    if (!commitId) {
        console.log('Invalid project name')
        exit()
    }
    fs.copyFileSync('./stats/tmp/candidates.json',
        path.join('study', 'results', `candidates-${project}-${commitId}.json`))

    fs.copyFileSync('./output.log',
        path.join('study', 'log', `${project}.out`))
} else if (action === 'clone') {

    projectList.forEach(project => {
        cloneRepo(BENCHMARKS_DIR, project.projectName, project.repo, project.commitId)
    })
}


function cloneRepo(benchmarkDir, projectName, repoId, commitId) {
    try {
        console.log(`Cloning repository ${repoId}@${commitId} ...`)
        if (!fs.existsSync(benchmarkDir)){
            fs.mkdirSync(benchmarkDir)
        }
        if (fs.existsSync(path.join(benchmarkDir, projectName))) {
            console.log(`Project ${projectName} already cloned`)
            return
        }
        let output = execSync(`git clone https://github.com/${repoId} ${projectName}`, { 
            cwd: `${benchmarkDir}`,
            encoding: 'utf8' });
        console.log('Output:\n', output);

        output = execSync(`git checkout ${commitId}`, { 
            cwd: `${benchmarkDir}/${projectName}`,
            encoding: 'utf8' });
    } catch (error) {
        console.error('Execution failed:', error.message);
    }
}

function parseJSONResults() {
    for (const project of projectList) {
        let propDrillingsList = parseResultsJson(
            `${RESULTS_DIR}/${project.resultsFile}`, PropDrillingInfo);
        project.propDrillings = propDrillingsList;
    }
}

function getProject(projName) {
    return projectList.find(project => project.projectName === projName)
}

function generateLatexReports(projects) {
    resetLatexFiles();

    const { totalObjectTable1, totalObjectTable2, totalObjectTable3, totalObjectTable4 } = initTotalRowObjects();

    for (const project of projects) {
        let propDrillingsList = parseResultsJson(`${RESULTS_DIR}/${project.resultsFile}`, PropDrillingInfo);
        project.propDrillings = propDrillingsList
        generateReportForDatasetDescriptions(project);
        generateReportForPropDrillingFrequency(propDrillingsList, project, totalObjectTable1);
        generateReportForPropDrillingDepths(propDrillingsList, project, totalObjectTable2);
        generateReportForCompoundPropDrillings(propDrillingsList, project, totalObjectTable3);
        generateReportForRefactoringPropDrillings(propDrillingsList, project, totalObjectTable4);
    }

    addTotalRowForPropDrillingFrequency(totalObjectTable1);
    addTotalRowForPropDrillingDepths(totalObjectTable2);
    addTotalRowForCompoundPropDrillings(totalObjectTable3);
    addTotalRowForRefactoringPropDrillings(totalObjectTable4);
}

function resetLatexFiles() {
    writeFileSync(TBL1_DATASET_PROJECTS, 
        `% ${"Project".padEnd(13, " ")} | ${"Lang".padEnd(5, " ")} | ${"SLOC".padEnd(9, " ")} | ${"Stars".padEnd(8, " ")}  | CommitId  | ${"Github Repository".padEnd(22, " ")}\n`);

    writeFileSync(TBL2_PROP_DRILL_ADOPTION, 
        `% ${"Project".padEnd(13, " ")} | ${"PDs".padEnd(5, " ")} | ${"Components".padEnd(13, " ")} | Prop Drilling Participants \n`);

    writeFileSync(TBL3_PROP_DRILL_DEPTH_DISTR, 
        `% ${"Project".padEnd(13, " ")} | ${"PDs".padEnd(4, " ")} | ` +
        `${"Depth 1".padEnd(20, " ")} | ${"Depth 2".padEnd(20, " ")} | ${"Depth 3 ".padEnd(24, " ")} \n`
    );
    writeFileSync(TBL4_COMP_PROP_DRILL_DISTR, 
        `% ${"Project".padEnd(13, " ")} | ${"CPDs".padEnd(4, " ")} | ` +
        `${"Breadth 2".padEnd(20, " ")} | ${"Breadth 3".padEnd(20, " ")} | ${"Breadth >= 4".padEnd(20, " ")} ` +
        `| ${"Total Member PDs".padEnd(20, " ")}| ${"Member PDs in |CPD| >= 3".padEnd(20, " ")} \n`
    );
    writeFileSync(TBL5_REFACTORING_CANDIDATES, 
        `% ${"Project".padEnd(13, " ")} | ${"PDs".padEnd(4, " ")} | ` +
        `${"Candidates Context".padEnd(20, " ")} | ${"Candidates Composition".padEnd(20, " ")} | ${"Total Refactoring Candidates".padEnd(5, " ")} \n`);
}

function initTotalRowObjects() {
    const totalObjectTable1 = {
        totalPropDrillings: 0,
        totalComponents: 0,
        pdParticipants: 0
    }

    const totalObjectTable2 = {
        totalPropDrillings: 0,
        depthColumn3: 0,
        depthColumn4: 0,
        depthColumn5: 0
    }

    const totalObjectTable3 = {
        totalPropDrillings: 0,
        totalCompoundPropDrillings: 0,
        breadth2ColumnCount: 0,
        breadth3ColumnCount: 0,
        breadthMutlipleColumnCount: 0,
        memberPdsTotalCount: 0,
        compoundPropDrillingsFamiliesOver3Depth: 0
    }

    const totalObjectTable4 = {
        totalPropDrillings: 0,
        contextRefactoringsCount: 0,
        compositionRefactoringsCount: 0,
        totalRefactoringsCount: 0
    }

    return { totalObjectTable1, totalObjectTable2, totalObjectTable3, totalObjectTable4 }
}

function generateReportForDatasetDescriptions(project) {

    const latexRow =
        `${project.projectName.padEnd(15, " ")} ` +
        `& ${project.lang.padEnd(5, " ")} ` +
        `& ${padStart(project.sloc, 6)} \t` +
        `& ${padStart(project.stars, 5)} \t` +
        `& ${padStart(project.commitId, 8)} \t` +
        `& ${project.repo.padEnd(22, " ")} \\\\\n`;

    appendFileSync(TBL1_DATASET_PROJECTS, latexRow, 'utf8');
}

function generateReportForPropDrillingFrequency(propDrillingsList, project, totalObjectTable1) {
    const propDrillingsCount = propDrillingsList.length;
    const participantsCount = countDistinctComponents(propDrillingsList);
    const ALL_COMPONENTS = project.totalComponents;
    const percentage = ((participantsCount / ALL_COMPONENTS) * 100).toFixed(1);

    const latexRow =
        `${project.projectName.padEnd(15, " ")} ` +
        `& ${padStart(propDrillingsCount, 4)} \t` +
        `& ${padStart(ALL_COMPONENTS, 10)} \t` +
        `& ${valPct(participantsCount, percentage, 4)} \\\\\n`;

    appendFileSync(TBL2_PROP_DRILL_ADOPTION, latexRow, 'utf8');

    totalObjectTable1.totalPropDrillings += propDrillingsCount;
    totalObjectTable1.totalComponents += ALL_COMPONENTS;
    totalObjectTable1.pdParticipants += participantsCount;
}

function addTotalRowForPropDrillingFrequency(totalObjectTable1) {
    const participantsCount = totalObjectTable1.pdParticipants;
    const allComponents = totalObjectTable1.totalComponents;

    const percentage = ((participantsCount / allComponents) * 100).toFixed(1);
    const latexEmptyRow = ' %\\bottomrule \n';
    const latexRow =
        `\\cmidrule{1-4} \n\\textbf{Total} \t` +
        `& ${padStart(totalObjectTable1.totalPropDrillings, 4)} \t` +
        `& ${padStart(allComponents, 10)} \t` +
        `& ${valPct(participantsCount, percentage, 4)} \\\\\n\\cmidrule{1-4}`;

    appendFileSync(TBL2_PROP_DRILL_ADOPTION, latexEmptyRow, 'utf8');
    appendFileSync(TBL2_PROP_DRILL_ADOPTION, latexRow, 'utf8');
}

function padStart(val, places, char = " ") {
    return val.toString().padStart(places, char)
}

function valPct(val, pct, pad) {
    return `\\valpct{${padStart(val, pad)}}{${pct}}`
}

function generateReportForPropDrillingDepths(propDrillingsList, project, totalObjectTable2) {
    const totalPropDrillings = propDrillingsList.length;
    const depthMap = calculatePropDrillingDepths(propDrillingsList);
    const depth3Col = formatDepthColumn(depthMap, 3, totalPropDrillings);
    const depth4Col = formatDepthColumn(depthMap, 4, totalPropDrillings);
    const depth5Col = formatDepthColumn(depthMap, 5, totalPropDrillings);

    const latexRow =
        `${project.projectName.padEnd(15, " ")} ` +
        `& ${padStart(totalPropDrillings, 4)} ` +
        `& ${depth3Col.latexFormat.padEnd(20, " ")} ` +
        `& ${depth4Col.latexFormat.padEnd(20, " ")} ` +
        `& ${depth5Col.latexFormat.padEnd(20, " ")} \\\\\n`;

    appendFileSync(TBL3_PROP_DRILL_DEPTH_DISTR, latexRow, 'utf8');

    totalObjectTable2.totalPropDrillings += totalPropDrillings;
    totalObjectTable2.depthColumn3 += depth3Col.count;
    totalObjectTable2.depthColumn4 += depth4Col.count;
    totalObjectTable2.depthColumn5 += depth5Col.count;
}

function addTotalRowForPropDrillingDepths(totalObjectTable2) {
    const totalPropDrillings = totalObjectTable2.totalPropDrillings;

    const latexEmptyRow = ' %\\bottomrule \n';
    const latexRow =
        `\\cmidrule{1-5} \n` +
        `${"\\textbf{Total}".padEnd(15, " ")} ` +
        `& ${padStart(totalPropDrillings, 4)} ` +
        `& ${valPct(totalObjectTable2.depthColumn3, ((totalObjectTable2.depthColumn3 / totalPropDrillings) * 100).toFixed(1), 4)}  ` +
        `& ${valPct(totalObjectTable2.depthColumn4, ((totalObjectTable2.depthColumn4 / totalPropDrillings) * 100).toFixed(1), 4)}  ` +
        `& ${valPct(totalObjectTable2.depthColumn5, ((totalObjectTable2.depthColumn5 / totalPropDrillings) * 100).toFixed(1), 4)} \\\\\n` +
        `\\cmidrule{1-5} \n`;

    appendFileSync(TBL3_PROP_DRILL_DEPTH_DISTR, latexEmptyRow, 'utf8');
    appendFileSync(TBL3_PROP_DRILL_DEPTH_DISTR, latexRow, 'utf8');
}

function formatDepthColumn(depthsMap, depth, totalPropDrillings) {
    const count = depthsMap.get(depth) ?? 0;

    if (count === 0) {
        return {
            latexFormat: "\\emptyVal{}",
            count: count
        };
    }

    const percentage = ((count / totalPropDrillings) * 100).toFixed(1);
    return {
        latexFormat: valPct(count, percentage, 4), //`\\valpct{${count}}{${percentage}}`,
        count: count
    };
}

function generateReportForCompoundPropDrillings(propDrillingsList, project, totalObjectTable3) {
    const propDrillingsCount = propDrillingsList.length;
    const { compoundPropDrillingsCount, totalCompoundPropDrillings } = countCompoundPropDrillings(propDrillingsList);
    const compoundPropDrillingsFamilies = countPropDrillingFamilies(propDrillingsList);
    const memberPdsTotal = compoundPropDrillingsFamilies.memberPdsTotal;

    const breadth2Column = formatTotalStatsColumn(compoundPropDrillingsCount, compoundPropDrillingsFamilies['twos']);
    const breadth3Column = formatTotalStatsColumn(compoundPropDrillingsCount, compoundPropDrillingsFamilies['threes']);
    const breadthMultipleColumn = formatTotalStatsColumn(compoundPropDrillingsCount, compoundPropDrillingsFamilies['multiples']);

    const compoundPropDrillingsFamiliesOver3Depth = totalCompoundPropDrillings - compoundPropDrillingsFamilies['twos'] * 2
    const latexRow =
        `${project.projectName.padEnd(15, " ")} ` +
        `& ${padStart(compoundPropDrillingsCount, 4)} ` +
        `& ${breadth2Column.latexFormat.padEnd(20, " ")} ` +
        `& ${breadth3Column.latexFormat.padEnd(20, " ")} ` +
        `& ${breadthMultipleColumn.latexFormat.padEnd(20, " ")} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, memberPdsTotal).latexFormat.padEnd(20, " ")} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, compoundPropDrillingsFamiliesOver3Depth).latexFormat.padEnd(20, " ")} \\\\\n`;

    appendFileSync(TBL4_COMP_PROP_DRILL_DISTR, latexRow, 'utf8');

    totalObjectTable3.totalPropDrillings += propDrillingsCount;
    totalObjectTable3.totalCompoundPropDrillings += compoundPropDrillingsCount;
    totalObjectTable3.breadth2ColumnCount += breadth2Column.count;
    totalObjectTable3.breadth3ColumnCount += breadth3Column.count;
    totalObjectTable3.breadthMutlipleColumnCount += breadthMultipleColumn.count;
    totalObjectTable3.memberPdsTotalCount += memberPdsTotal;
    totalObjectTable3.compoundPropDrillingsFamiliesOver3Depth += compoundPropDrillingsFamiliesOver3Depth;
}

function addTotalRowForCompoundPropDrillings(totalObjectTable3) {
    const totalCompoundPropDrillings = totalObjectTable3.totalCompoundPropDrillings;
    const totalPropDrillings = totalObjectTable3.totalPropDrillings;

    const latexEmptyRow = ' %\\bottomrule \n';
    const latexRow =
        `\\cmidrule{1-7} \n\\textbf{Total} \t` +
        `& ${padStart(totalCompoundPropDrillings, 4)} ` +
        `& ${formatTotalStatsColumn(totalCompoundPropDrillings, totalObjectTable3.breadth2ColumnCount).latexFormat}  ` +
        `& ${formatTotalStatsColumn(totalCompoundPropDrillings, totalObjectTable3.breadth3ColumnCount).latexFormat}  ` +
        `& ${formatTotalStatsColumn(totalCompoundPropDrillings, totalObjectTable3.breadthMutlipleColumnCount).latexFormat}  ` +
        `& ${formatTotalStatsColumn(totalPropDrillings, totalObjectTable3.memberPdsTotalCount).latexFormat}  ` +
        `& ${formatTotalStatsColumn(totalPropDrillings, totalObjectTable3.compoundPropDrillingsFamiliesOver3Depth).latexFormat}  \\\\\n\\cmidrule{1-7}`;

    appendFileSync(TBL4_COMP_PROP_DRILL_DISTR, latexEmptyRow, 'utf8');
    appendFileSync(TBL4_COMP_PROP_DRILL_DISTR, latexRow, 'utf8');
}


function formatTotalStatsColumn(total, count) {
    if (count === 0) {
        return {
            latexFormat: "\\emptyVal{}",
            count: 0
        };
    }

    const percentage = ((count / total) * 100).toFixed(1);
    return {
        latexFormat: valPct(count, percentage, 4), //`\\valpct{${count}}{${percentage}}`,
        count: count
    };
}

function generateReportForRefactoringPropDrillings(propDrillingsList, project, totalObjectTable4) {
    const { componentCompositionCount, contextCount, refactorablePropDrillingsCount } = countPropDrillingRefactoringStats(propDrillingsList);
    const propDrillingsCount = propDrillingsList.length;

    const latexRow =
        `${project.projectName.padEnd(15, " ")} ` +
        `& ${padStart(propDrillingsCount, 4)} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, contextCount)
            .latexFormat.padEnd(20, " ")} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, componentCompositionCount)
            .latexFormat.padEnd(20, " ")} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, refactorablePropDrillingsCount)
            .latexFormat.padEnd(20, " ")} \\\\\n`;

    appendFileSync(TBL5_REFACTORING_CANDIDATES, latexRow, 'utf8');

    totalObjectTable4.totalPropDrillings += propDrillingsCount;
    totalObjectTable4.contextRefactoringsCount += contextCount;
    totalObjectTable4.compositionRefactoringsCount += componentCompositionCount;
    totalObjectTable4.totalRefactoringsCount += refactorablePropDrillingsCount;
}

function addTotalRowForRefactoringPropDrillings(totalObjectTable4) {
    const totalPropDrillings = totalObjectTable4.totalPropDrillings;

    const latexEmptyRow = ' %\\bottomrule \n';
    const latexRow =
        `\\cmidrule{1-5} \n` +
        `${"\\textbf{Total}".padEnd(15, " ")} ` +
        `& ${padStart(totalPropDrillings, 4)} ` +
        `& ${formatTotalStatsColumn(totalPropDrillings, totalObjectTable4.contextRefactoringsCount).latexFormat} ` +
        `& ${formatTotalStatsColumn(totalPropDrillings, totalObjectTable4.compositionRefactoringsCount).latexFormat}    ` +
        `& ${formatTotalStatsColumn(totalPropDrillings, totalObjectTable4.totalRefactoringsCount).latexFormat} \\\\\n` +
        `\\cmidrule{1-5} \n`;

    appendFileSync(TBL5_REFACTORING_CANDIDATES, latexEmptyRow, 'utf8');
    appendFileSync(TBL5_REFACTORING_CANDIDATES, latexRow, 'utf8');
}
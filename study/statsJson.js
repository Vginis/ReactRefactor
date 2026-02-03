import { 
    parseResultsJson, 
    countDistinctComponents, 
    calculatePropDrillingDepths, 
    countCompoundPropDrillings, 
    countPropDrillingFamilies,
    countPropDrillingRefactoringStats
} from "../lib/utils/statsJsonCalculation.js";
import { writeFile, appendFile } from "fs/promises";
import {projects} from './benchmark.js'

const LATEX_OUTPUT_DIR = './study/latex'
const RESULTS_DIR = './study/results'
const TBL2_PROP_DRILL_ADOPTION = `${LATEX_OUTPUT_DIR}/prop_drilling_report.tex`
const TBL3_PROP_DRILL_DEPTH_DISTR = `${LATEX_OUTPUT_DIR}/prop_drilling_depth_report.tex`
const TBL4_COMP_PROP_DRILL_DISTR = `${LATEX_OUTPUT_DIR}/compound_prop_drillings_report.tex`
const TBL5_REFACTORING_CANDIDATES = `${LATEX_OUTPUT_DIR}/prop_drillings_refactorings_report.tex`



async function resetLatexFiles() {
    await writeFile(TBL2_PROP_DRILL_ADOPTION, "");
    await writeFile(TBL3_PROP_DRILL_DEPTH_DISTR, "");
    await writeFile(TBL4_COMP_PROP_DRILL_DISTR, "");
    await writeFile(TBL5_REFACTORING_CANDIDATES, "");
}

async function generateReports() {
    for(const project of projects) {
        let propDrillingsList = await parseResultsJson(`${RESULTS_DIR}/${project.resultsFile}`);
        generateReportForPropDrillingFrequency(propDrillingsList, project).catch(console.error);
        generateReportForPropDrillingDepths(propDrillingsList, project);
        generateReportForCompoundPropDrillings(propDrillingsList, project);
        generateReportForRefactoringPropDrillings(propDrillingsList, project);
    }
}
await resetLatexFiles();

generateReports();

async function generateReportForPropDrillingFrequency(propDrillingsList, project){
    const propDrillingsCount = propDrillingsList.length;
    const participantsCount = countDistinctComponents(propDrillingsList);
    const ALL_COMPONENTS = project.totalComponents;
    const percentage = ((participantsCount / ALL_COMPONENTS) * 100).toFixed(1);

    const latexRow =
        `${project.projectName} ` +
        `& ${propDrillingsCount} ` +
        `& ${ALL_COMPONENTS} ` +
        `& \\valpct{${participantsCount}}{${percentage}} \\\\\n`;

    await appendFile(TBL2_PROP_DRILL_ADOPTION, latexRow, 'utf8');
}

async function generateReportForPropDrillingDepths(propDrillingsList, project) {
    const totalPropDrillings = propDrillingsList.length;
    const depthMap = calculatePropDrillingDepths(propDrillingsList);
    const depth3Col = formatDepthColumn(depthMap, 3, totalPropDrillings);
    const depth4Col = formatDepthColumn(depthMap, 4, totalPropDrillings);
    const depth5Col = formatDepthColumn(depthMap, 5, totalPropDrillings);

    const latexRow =
        `${project.projectName} ` +
        `& ${totalPropDrillings} ` +
        `& ${depth3Col} ` +
        `& ${depth4Col} ` +
        `& ${depth5Col} \\\\\n`;

    await appendFile(TBL3_PROP_DRILL_DEPTH_DISTR, latexRow, 'utf8');
}

function formatDepthColumn(depthsMap, depth, totalPropDrillings) {
    const count = depthsMap.get(depth) ?? 0;

    if (count === 0) {
        return "\\emptyVal{}";
    }

    const percentage = ((count / totalPropDrillings) * 100).toFixed(1);
    return `\\valpct{${count}}{${percentage}}`;
}

async function generateReportForCompoundPropDrillings(propDrillingsList, project) {
    const propDrillingsCount = propDrillingsList.length;
    const { compoundPropDrillingsCount, totalCompoundPropDrillings } = countCompoundPropDrillings(propDrillingsList);
    const compoundPropDrillingsFamilies = countPropDrillingFamilies(propDrillingsList);
    
    const breadth2Column = formatCompoundPDFamilyBreadthColumnDistribution(compoundPropDrillingsFamilies, 'twos', compoundPropDrillingsCount);
    const breadth3Column = formatCompoundPDFamilyBreadthColumnDistribution(compoundPropDrillingsFamilies, 'threes', compoundPropDrillingsCount);
    const breadthMultipleColumn = formatCompoundPDFamilyBreadthColumnDistribution(compoundPropDrillingsFamilies, 'multiples', compoundPropDrillingsCount);
    
    const latexRow = 
        `${project.projectName} ` +
        `& ${compoundPropDrillingsCount} ` +
        `& ${breadth2Column} ` +
        `& ${breadth3Column} ` +
        `& ${breadthMultipleColumn} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, totalCompoundPropDrillings)} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, totalCompoundPropDrillings - compoundPropDrillingsFamilies['twos'])} \\\\\n`;

    await appendFile(TBL4_COMP_PROP_DRILL_DISTR, latexRow, 'utf8');
}

function formatCompoundPDFamilyBreadthColumnDistribution(compoundPropDrillingsFamilies, breadth, compoundPropDrillingsCount) {
    const count = compoundPropDrillingsFamilies[breadth] ?? 0;

    if (count === 0) {
        return "\\emptyVal{}";
    }

    const percentage = ((compoundPropDrillingsCount / count) * 100).toFixed(1);
    return `\\valpct{${count}}{${percentage}}`;
}

function formatTotalStatsColumn(total, count) {
    if(count === 0) {
        return "\\emptyVal{}";
    }

    const percentage = ((count / total) * 100).toFixed(1);
    return `\\valpct{${count}}{${percentage}}`;
}

async function generateReportForRefactoringPropDrillings(propDrillingsList, project) {
    const { componentCompositionCount, contextCount, refactorablePropDrillingsCount } = countPropDrillingRefactoringStats(propDrillingsList);
    const propDrillingsCount = propDrillingsList.length;

    const latexRow = 
        `${project.projectName} ` +
        `& ${propDrillingsCount} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, contextCount)} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, componentCompositionCount)} ` + 
        `& ${formatTotalStatsColumn(propDrillingsCount, refactorablePropDrillingsCount)} \\\\\n`;

    await appendFile(TBL5_REFACTORING_CANDIDATES, latexRow, 'utf8');
}
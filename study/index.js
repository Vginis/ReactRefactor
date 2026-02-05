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

const LATEX_OUTPUT_DIR = './study/latex'
const RESULTS_DIR = './study/results'

const TBL2_PROP_DRILL_ADOPTION = `${LATEX_OUTPUT_DIR}/tbl2_prop_drilling_report.tex`
const TBL3_PROP_DRILL_DEPTH_DISTR = `${LATEX_OUTPUT_DIR}/tbl3_prop_drilling_depth_report.tex`
const TBL4_COMP_PROP_DRILL_DISTR = `${LATEX_OUTPUT_DIR}/tbl4_compound_prop_drillings_report.tex`
const TBL5_REFACTORING_CANDIDATES = `${LATEX_OUTPUT_DIR}/tbl5_prop_drillings_refactorings_report.tex`

const projectList = projects
    .map(p => ProjectInfo.fromJson(p))


let sortedProjects = projectList.toSorted((a, b) => (b.sloc - a.sloc))


generateLatexReports(sortedProjects);


function generateLatexReports(projects) {
    resetLatexFiles();

    for (const project of projects) {
        let propDrillingsList = parseResultsJson(`${RESULTS_DIR}/${project.resultsFile}`, PropDrillingInfo);
        project.propDrillings = propDrillingsList
        generateReportForPropDrillingFrequency(propDrillingsList, project)
        generateReportForPropDrillingDepths(propDrillingsList, project);
        generateReportForCompoundPropDrillings(propDrillingsList, project);
        generateReportForRefactoringPropDrillings(propDrillingsList, project);
    }
}

function resetLatexFiles() {
    writeFileSync(TBL2_PROP_DRILL_ADOPTION, "");
    writeFileSync(TBL3_PROP_DRILL_DEPTH_DISTR, "");
    writeFileSync(TBL4_COMP_PROP_DRILL_DISTR, "");
    writeFileSync(TBL5_REFACTORING_CANDIDATES, "");
}

function generateReportForPropDrillingFrequency(propDrillingsList, project) {
    const propDrillingsCount = propDrillingsList.length;
    const participantsCount = countDistinctComponents(propDrillingsList);
    const ALL_COMPONENTS = project.totalComponents;
    const percentage = ((participantsCount / ALL_COMPONENTS) * 100).toFixed(1);

    const latexRow =
        `${project.projectName.padEnd(15, " ")} ` +
        `& ${padStart(propDrillingsCount, 4)} \t` +
        `& ${padStart(ALL_COMPONENTS, 4)} \t` +
        `& ${valPct(participantsCount, percentage, 4)} \\\\\n`;

    appendFileSync(TBL2_PROP_DRILL_ADOPTION, latexRow, 'utf8');
}

function padStart(val, places, char = " ") {
    return val.toString().padStart(places, char)
}

function valPct(val, pct, pad) {
    return `\\valpct{${padStart(val, pad)}}{${pct}}`
}

function generateReportForPropDrillingDepths(propDrillingsList, project) {
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

    appendFileSync(TBL3_PROP_DRILL_DEPTH_DISTR, latexRow, 'utf8');
}

function formatDepthColumn(depthsMap, depth, totalPropDrillings) {
    const count = depthsMap.get(depth) ?? 0;

    if (count === 0) {
        return "\\emptyVal{}";
    }

    const percentage = ((count / totalPropDrillings) * 100).toFixed(1);
    return `\\valpct{${count}}{${percentage}}`;
}

function generateReportForCompoundPropDrillings(propDrillingsList, project) {
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

    appendFileSync(TBL4_COMP_PROP_DRILL_DISTR, latexRow, 'utf8');
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
    if (count === 0) {
        return "\\emptyVal{}";
    }

    const percentage = ((count / total) * 100).toFixed(1);
    return `\\valpct{${count}}{${percentage}}`;
}

function generateReportForRefactoringPropDrillings(propDrillingsList, project) {
    const { componentCompositionCount, contextCount, refactorablePropDrillingsCount } = countPropDrillingRefactoringStats(propDrillingsList);
    const propDrillingsCount = propDrillingsList.length;

    const latexRow =
        `${project.projectName} ` +
        `& ${propDrillingsCount} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, contextCount)} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, componentCompositionCount)} ` +
        `& ${formatTotalStatsColumn(propDrillingsCount, refactorablePropDrillingsCount)} \\\\\n`;

    appendFileSync(TBL5_REFACTORING_CANDIDATES, latexRow, 'utf8');
}
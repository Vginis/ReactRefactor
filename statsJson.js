import { 
    parseResultsJson, 
    countDistinctComponents, 
    calculatePropDrillingDepths, 
    countCompoundPropDrillings, 
    countPropDrillingFamilies,
    countPropDrillingRefactoringStats
} from "./lib/utils/statsJsonCalculation.js";
import { writeFile, appendFile } from "fs/promises";

let projects = [
    {
        projectName: 'Joplin',
        projectResultsPath: './results/candidates-joplin-desktop-e75875c.json',
        totalComponents: 122  
    },
    {
        projectName: 'Carbon',
        projectResultsPath: './results/candidates-carbon-0a07790.json',
        totalComponents: 108  
    },
    {
        projectName: 'Grafana',
        projectResultsPath: './results/candidates-grafana-0d1a5b4.json',
        totalComponents: 2728  
    },
    {
        projectName: 'Apache-Superset',
        projectResultsPath: './results/candidates-superset-6a1c30e.json',
        totalComponents: 525  
    },
    {
        projectName: 'Mastodon',
        projectResultsPath: './results/candidates-mastodon-55a7b1e.json',
        totalComponents: 393  
    },
    {
        projectName: 'Redash',
        projectResultsPath: './results/candidates-redash-67a95e9.json',
        totalComponents: 252  
    },
    {
        projectName: 'Metabase',
        projectResultsPath: './results/candidates-metabase-7fbf305.json',
        totalComponents: 2321  
    },
    {
        projectName: 'Prometheus',
        projectResultsPath: './results/candidates-prometheus-9ec59ba.json',
        totalComponents: 59  
    },
    {
        projectName: 'Rocket chat',
        projectResultsPath: './results/candidates-rocketchat-7137ec8.json',
        totalComponents: 1391  
    },
    {
        projectName: 'MitmProxy',
        projectResultsPath: './results/candidates-mitmproxy-d9d5878.json',
        totalComponents: 116  
    }
];

async function resetLatexFiles() {
    await writeFile("stats/latex/prop_drilling_report.tex", "");
    await writeFile("stats/latex/prop_drilling_depth_report.tex", "");
    await writeFile("stats/latex/compound_prop_drillings_report.tex", "");
    await writeFile("stats/latex/prop_drillings_refactorings_report.tex", "");
}

async function generateReports() {
    for(const project of projects) {
        let propDrillingsList = await parseResultsJson(project.projectResultsPath);
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

    await appendFile("stats/latex/prop_drilling_report.tex", latexRow, 'utf8');
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

    await appendFile("stats/latex/prop_drilling_depth_report.tex", latexRow, 'utf8');
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

    await appendFile("stats/latex/compound_prop_drillings_report.tex", latexRow, 'utf8');
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

    await appendFile("stats/latex/prop_drillings_refactorings_report.tex", latexRow, 'utf8');
}
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import ProjectInfo from '../json/ProjectInfo.js';
import { readFileSync } from 'node:fs';

function countDistinctComponents(propDrillingsList) {
    const uniqueComponents = new Set();

    for(const propDrilling of propDrillingsList) {
        for(const node of propDrilling.propPassings) {
            uniqueComponents.add(node.source);
            uniqueComponents.add(node.target);
        }
    }

    return uniqueComponents.size;
    
}

function calculatePropDrillingDepths(propDrillingsList) {
    const depthsMap = new Map();
    for(const propDrilling of propDrillingsList) {
        if(!depthsMap.has(propDrilling.propPassings.length + 1)) {
            depthsMap.set(propDrilling.propPassings.length + 1, 1)
        } else {
            const currentValue = depthsMap.get(propDrilling.propPassings.length + 1);
            depthsMap.set(propDrilling.propPassings.length+1, currentValue + 1);
        }
    }

    return depthsMap;   
}

function countPathOccurrences(propDrillings){
    const propDrillingPaths = propDrillings.map(propDrilling => {
        let path = [propDrilling.propPassings[0].source];
        propDrilling.propPassings.forEach(node => path.push(node.target));
        return path;
    });
    let pathMap = new Map();
    propDrillingPaths.forEach(path => {
        let key = path.join('>');        
        if (!pathMap.has(key)) {
            pathMap.set(key, 0);
        }
        
        pathMap.set(key, pathMap.get(key) + 1);
    });
    
    return pathMap;
}

function countPropDrillingFamilies(propDrillings){
    const pathOccurencesMap = countPathOccurrences(propDrillings);
    const secondMap = new Map();

    for (const pathValue of pathOccurencesMap.values()) {
        if (pathValue >= 2) {
            secondMap.set(pathValue, (secondMap.get(pathValue) ?? 0) + 1);
        }
    }

    let twos = secondMap.get(2) || 0;
    let threes = secondMap.get(3) || 0;

    let multiples = 0;
    let memberPdsTotal = 0;

    for (const [size, families] of secondMap.entries()) {
        if (size >= 4) {
            multiples += families;
        }

        memberPdsTotal += size * families;
    }

    return {
        twos,
        threes,
        multiples,
        memberPdsTotal
    };
}

function calculateMemberPDsTotal(pathOccurencesMap){
    let total = 0;

    for(const count of pathOccurencesMap.values()){
        if(count >= 2){
            total += count;
        }
    }

    return total;
}

function countCompoundPropDrillings(propDrillings){
    const pathCountMap = countPathOccurrences(propDrillings);
    let compoundPropDrillingsCount = 0;
    let totalCompoundPropDrillings = 0;
    
    for(let pathCount of pathCountMap.values()){
        if(pathCount > 1){
            compoundPropDrillingsCount++;
            totalCompoundPropDrillings += pathCount;
        }
    }

    return { compoundPropDrillingsCount, totalCompoundPropDrillings };
}

function countPropDrillingRefactoringStats(propDrillings){
    let componentCompositionCount = 0;
    let contextCount = 0;
    let propDrillingsPathOccurences = countPathOccurrences(propDrillings);
    let visitedRefactorablePropDrillings = new Set();
    let visitedCompoundPropDrillings = new Set();

    propDrillings.forEach(pd => {
        if(pd.canRefactorWithComposition){
            componentCompositionCount ++;
            visitedRefactorablePropDrillings.add(pd);
        }
        if(pd.canRefactorWithContext){
            contextCount++;
            visitedRefactorablePropDrillings.add(pd);
        }

        const normalizedPath = constructPropDrillingPathByNames(pd);
        const normalizedPathKey= normalizedPath.join('>');
        const compoundPropDrillingsPairsCount = propDrillingsPathOccurences.get(normalizedPathKey);
        if(compoundPropDrillingsPairsCount>1 && (pd.canRefactorWithComposition || pd.canRefactorWithContext)){
            visitedCompoundPropDrillings.add(normalizedPathKey)
        }
    });
    const refactorableCompoundPropDrillingsCount = visitedCompoundPropDrillings.size;
    const refactorablePropDrillingsCount = visitedRefactorablePropDrillings.size;
    return { componentCompositionCount, contextCount, refactorablePropDrillingsCount, refactorableCompoundPropDrillingsCount };
}

function constructPropDrillingPathByNames(propDrilling) {
    return [
        ...propDrilling.propPassings.map(propPassing => propPassing.source),
        propDrilling.propPassings[propDrilling.propPassings.length - 1].target
    ];
}

function parseResultsJson(jsonPath, type = ProjectInfo) {
    const filePath = path.resolve(jsonPath);
    try {
        const fileContents = readFileSync(filePath, "utf-8");
        const propDrillingsList = JSON.parse(fileContents);
        return propDrillingsList.map(obj => type.fromJson(obj));
    } catch(exception) {
        throw new Error(`Couldn't read file in path: ${filePath}`, exception);
    }
}

export { 
    countDistinctComponents, 
    calculatePropDrillingDepths,
    countPathOccurrences,
    countPropDrillingFamilies,
    countCompoundPropDrillings,
    countPropDrillingRefactoringStats,
    parseResultsJson
}
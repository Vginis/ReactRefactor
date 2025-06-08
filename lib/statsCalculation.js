//module for stats calculation
function countDistinctComponents(propDrillings) {
    const uniqueComponents = new Set();
    
    propDrillings.forEach(propDrilling => {
        propDrilling.path.forEach(node => {
            // Extract component name before parentheses if it exists
            const componentName = node.sourceComponent.name;
            const componentDestName = node.destComponent.name;
            uniqueComponents.add(componentName);
            uniqueComponents.add(componentDestName);
        });
       
    });
    
    return uniqueComponents.size;
}

function calculatePropDrillingDepths(propDrillings){
    const depthsMap = new Map();
    propDrillings.forEach(propDrilling => {
        if(!depthsMap.has(propDrilling.path.length+1)){
            depthsMap.set(propDrilling.path.length+1, 1)
        } else{
            const currentValue = depthsMap.get(propDrilling.path.length+1);
            depthsMap.set(propDrilling.path.length+1, currentValue+1);
        }
    });
    return depthsMap;
}

function countPathOccurrences(propDrillings){
    const propDrillingPaths = propDrillings.map(propDrilling => {
        let path = [propDrilling.path[0].sourceComponent.name];
        propDrilling.path.forEach(node => path.push(node.destComponent.name));
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
    let twos = 0;
    let threes = 0;
    let multiples = 0;
    
    for(const pathValue of pathOccurencesMap.values()){
        if(pathValue === 2){
            twos += 2;
        } else if(pathValue === 3){
            threes += 3;
        } else if(pathValue > 3) {
            multiples += pathValue
        }
    }

    return {"twos":twos, "threes":threes, "multiples":multiples};
}

function countCompoundPropDrillings(propDrillings){
    const pathCountMap = countPathOccurrences(propDrillings);
    let count = 0;
    for(let pathCount of pathCountMap.values()){
        if(pathCount > 1){
            count += pathCount;
        }
    }
    return count;
}

function countPropDrillingRefactoringStats(propDrillings){
    let componentCompositionCount = 0;
    let contextCount = 0;
    propDrillings.forEach(pd => {
        if(pd.compositionRefactoring){
            componentCompositionCount ++;
        }
        if(pd.contextRefactoring){
            contextCount++;
        }
    });
    return {componentCompositionCount, contextCount};
}

function countPropDrillingsWithDifferentStartCommonEnding(propDrillings) {
    let propDrillingsWithCommonEnding = 0;
    let propDrilllingsWithCommonStart = 0;
    for(const propDrilling of propDrillings){
        let groupedProps = propDrilling.getGroupedProps(propDrillings);
        const groupedPropDrillingsWithCommonEnding = propDrilling.checkIfPdPathHasCommonEnding(propDrillings,groupedProps);
        if(groupedPropDrillingsWithCommonEnding.length > 0){
            propDrillingsWithCommonEnding++;
        }

        const groupedPropDrillingsWithCommonStart = propDrilling.checkIfPdPathHasCommonStart(propDrillings, groupedProps);
        if(groupedPropDrillingsWithCommonStart.length > 0){
            propDrilllingsWithCommonStart++;
        }
    }
    return { propDrillingsWithCommonEnding, propDrilllingsWithCommonStart };
}

export {countDistinctComponents,countPathOccurrences,calculatePropDrillingDepths,countCompoundPropDrillings,countPropDrillingFamilies,countPropDrillingRefactoringStats,countPropDrillingsWithDifferentStartCommonEnding}
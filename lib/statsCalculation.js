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
        if(!depthsMap.has(propDrilling.path.length)){
            depthsMap.set(propDrilling.path.length, 1)
        } else{
            const currentValue = depthsMap.get(propDrilling.path.length);
            depthsMap.set(propDrilling.path.length, currentValue+1);
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

export {countDistinctComponents,countPathOccurrences,calculatePropDrillingDepths}
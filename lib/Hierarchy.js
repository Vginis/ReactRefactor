import { PropDrilling } from "./PropDrilling.js";
import { removeDuplicates,removeDuplicateObjects,filterDistinctPropDrillingObjects,filterSamePropertyPropDrillings,groupPropDrillingsByPath} from "./util.js";
function checkReturnElements(reactComponent, reactComponents) {
    return reactComponent.returnedElements.every(childName => {
        return !reactComponents.some(comp => comp.name === childName|| (comp.aliases && comp.aliases.aliases.includes(childName)));
    });
}

function loadHierarchy(reactComponent, reactComponents) {
    if (!reactComponent.returnedElements || checkReturnElements(reactComponent, reactComponents)) {
        return { [reactComponent.name]: {}};
    }
    let hierarchy = {};
    reactComponent.returnedElements.forEach(childName => {
        const child = reactComponents.find(comp => comp.name === childName || (comp.aliases && comp.aliases.aliases.includes(childName)));
        if (child) {
            const childHierarchy = loadHierarchy(child,reactComponents);
            if(!hierarchy[reactComponent.name]){
                hierarchy[reactComponent.name] = {};
            }
            if(!hierarchy[reactComponent.name][child.name]){
                hierarchy[reactComponent.name][child.name] = [];
            }
            hierarchy[reactComponent.name][child.name].push(childHierarchy[child.name]);
        }
    });
    return hierarchy
}

function extractAllPaths(hierarchy){
    let paths = []
    function traverse(node,path = []){
        if(Object.keys(node).length === 0){
            paths.push(path);
        }
        Object.keys(node).forEach(componentName => {
            const currentPath = [...path,componentName];
            if(Array.isArray(node[componentName])){
                node[componentName].forEach(child => {
                    traverse(child,currentPath);
                });
            } else {
                traverse(node[componentName],currentPath);
            }
        });
    }
    traverse(hierarchy);
    return paths;
}

function detectPropDrilling(paths, reactComponents) {
    let returnPropsDrillingResults = [];
    paths.forEach(path => {
        const propsMap = {}; 
        const returnPropsMap = {};
        path.forEach(componentName => {
            const component = reactComponents.find(comp => comp.name === componentName);
            if (component) {
                const childProps = component.getChildPropValues(reactComponents);
                Object.keys(childProps).forEach(childName => {
                    childProps[childName].forEach(prop => {
                        const values = Object.values(prop); 
                        values.forEach(value => {
                            if (!returnPropsMap[value]) {
                                returnPropsMap[value] = [];
                            }
                            returnPropsMap[value].push(componentName);
                        });
                    });
                });
                component.properties.forEach(prop => {
                    if (!propsMap[prop]) {
                        propsMap[prop] = [];
                    }
                    propsMap[prop].push(componentName);
                });

                Object.keys(returnPropsMap).forEach(prop => {
                    returnPropsMap[prop] = removeDuplicates(returnPropsMap[prop]);
                    if (returnPropsMap[prop].length > 1) {
                        returnPropsDrillingResults.push({
                            prop,
                            path: [...returnPropsMap[prop]]
                        });
                    }
                });
            }

        });
    });
    returnPropsDrillingResults = removeDuplicateObjects(returnPropsDrillingResults);
    return { returnPropsDrillingResults };
}

function extractPropDrillingObjects(paths, reactComponents){
    let propDrillings = [];
    const { returnPropsDrillingResults } = detectPropDrilling(paths, reactComponents);
    if(returnPropsDrillingResults.length === 0){
        console.log('No Prop Drillings found');
        return propDrillings;
    }
    returnPropsDrillingResults.forEach(returnResult => {
        const component = reactComponents.find(comp => comp.name===returnResult.path[returnResult.path.length-1]);
        if(!component) throw new Error("Component not found");
        const propValues = component.getChildPropValues(reactComponents);
        function findMatchingProp(propValues, targetProp) {
            for (const [key, values] of Object.entries(propValues)) {
                for (const obj of values) {
                    for (const [propKey, propValue] of Object.entries(obj)) {
                        if (propValue === targetProp) {
                            return key;
                        }
                    }
                }
            }
            return null;
        }
        returnResult.path.push(findMatchingProp(propValues, returnResult.prop));
        propDrillings.push(new PropDrilling(returnResult.prop,returnResult.path))
    });
    let distinctPropDrillings = filterDistinctPropDrillingObjects(propDrillings);
    distinctPropDrillings = filterSamePropertyPropDrillings(distinctPropDrillings);
    distinctPropDrillings = groupPropDrillingsByPath(distinctPropDrillings);
    return distinctPropDrillings;
}
export {loadHierarchy,extractAllPaths,extractPropDrillingObjects,detectPropDrilling}
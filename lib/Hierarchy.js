import { PropDrilling } from "./PropDrilling.js";
import { removeDuplicates } from "./util.js";
function checkReturnElements(reactComponent, reactComponents) {
    return reactComponent.returnedElements.every(childName => {
        return !reactComponents.some(comp => comp.name === childName);
    });
}

function loadHierarchy(reactComponent, reactComponents) {
    if (!reactComponent.returnedElements || checkReturnElements(reactComponent, reactComponents)) {
        return { [reactComponent.name]: {}};
    }
    let hierarchy = {};
    
    reactComponent.returnedElements.forEach(childName => {
        const child = reactComponents.find(comp => comp.name === childName);
        if (child) {
            const childHierarchy = loadHierarchy(child,reactComponents);
            if(!hierarchy[reactComponent.name]){
                hierarchy[reactComponent.name] = {};
            }
            if(!hierarchy[reactComponent.name][childName]){
                hierarchy[reactComponent.name][childName] = [];
            }
            hierarchy[reactComponent.name][childName].push(childHierarchy[childName]);
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
    const propDrillingResults = [];
    const returnPropsDrillingResults = [];
    paths.forEach(path => {
        const propsMap = {}; 
        const returnPropsMap = {};
        path.forEach(componentName => {
            const component = reactComponents.find(comp => comp.name === componentName);
            if (component) {
                const childProps = component.getChildProps(reactComponents);
                Object.keys(childProps).forEach(childName => {
                    childProps[childName].forEach(propName => {
                        if (!returnPropsMap[propName]) {
                            returnPropsMap[propName] = [];
                        }
                        returnPropsMap[propName].push(componentName);
                    });
                });
                component.properties.forEach(prop => {
                    if (!propsMap[prop]) {
                        propsMap[prop] = [];
                    }
                    propsMap[prop].push(componentName);
                });
            }
        });

        Object.keys(propsMap).forEach(prop => {
            if (propsMap[prop].length > 1) {
                propDrillingResults.push({
                    prop: `${prop}`,
                    path: [...propsMap[prop]]
                });
            }
        });

        Object.keys(returnPropsMap).forEach(prop => {
            if (returnPropsMap[prop].length > 1) {
                returnPropsDrillingResults.push({
                    prop,
                    path: [...returnPropsMap[prop]]
                });
            }
        });
    });
    returnPropsDrillingResults.forEach(el => {
        const unique = removeDuplicates(el.path);
        el.path = unique;
    });
    return { propDrillingResults, returnPropsDrillingResults };
}

function extractPropDrillingObjects(paths, reactComponents){
    let propDrillings = [];
    const { propDrillingResults, returnPropsDrillingResults } = detectPropDrilling(paths, reactComponents);

    for(let i=0;i<propDrillingResults.length;i++){
        const path = returnPropsDrillingResults[i].path;
        path.push(propDrillingResults[i].path[propDrillingResults[i].path.length-1]);
        const prop = returnPropsDrillingResults[i].prop;
        if(path.length > 2){
            propDrillings.push(new PropDrilling(prop,path));
        }
    }
    return propDrillings;
}

//todo add the check for intermediate Components checkIfContainsPropertyInBody
export {loadHierarchy,extractAllPaths,extractPropDrillingObjects}
import { PropDrilling } from "./PropDrilling.js";
import { PropPassing } from "./PropPassing.js";
import { removeDuplicates,removeDuplicateObjects,filterLongestPropDrillings,removeDuplicatePropPassings} from "./util.js";
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

function detectPropDrilling(paths,reactComponents){
    let propDrillings = [];
    paths.forEach(path => {
        let propPassings = [];
        for(let i=0;i<path.length-1;i++){
            const firstComponent = reactComponents.find(comp => comp.name === path[i]);
            if (!firstComponent) throw new Error("Component not found");
            const propValues = firstComponent.getChildPropValues(reactComponents);
            
            const secondComponent = reactComponents.find(comp => comp.name === path[i+1]);
            if (!secondComponent) throw new Error("Component not found");
    
            for (let [component, props] of Object.entries(propValues)) {
                props = removeDuplicateObjects(props);
                props.forEach(p => {
                    for (const [propName, propValue] of Object.entries(p)) {
                        if(secondComponent.properties.includes(propName+"="+propName)){
                            propPassings.push(new PropPassing(firstComponent,secondComponent,props))
                        }
                    }
                });
            }
        }
        propPassings = removeDuplicatePropPassings(propPassings);
        propDrillings.push(...createPropDrilling(propPassings));
    });
    //todo move these 2 function in util.js

    function serializePropDrilling(propDrilling) {
        return JSON.stringify({
            properties: propDrilling.properties,
            path: propDrilling.path.map(p => ({
                source: p.sourceComponent.name,
                dest: p.destComponent.name,
                props: p.props
            })),
            source: propDrilling.source.name,
            dest: propDrilling.dest.name
        });
    }
    function getDistinctPropDrillings(propDrillings) {
        const uniqueSet = new Set();
        const distinctArray = [];
    
        for (const drilling of propDrillings) {
            const serialized = serializePropDrilling(drilling);
            if (!uniqueSet.has(serialized)) {
                uniqueSet.add(serialized);
                distinctArray.push(drilling);
            }
        }
    
        return distinctArray;
    }
    propDrillings = getDistinctPropDrillings(propDrillings);
    return propDrillings;
}
function createPropDrilling(propPassings) {
    let propDrillingInstances = [];

    for (let i = 0; i < propPassings.length; i++) {
        const current = propPassings[i];

        for (const prop of current.props) {
            const path = [current];
            let properties = [prop];  
            const visitedInCurrentPath = new Set([current]);
            let next = current.destComponent;

            while (true) {
                const nextPassing = propPassings.find(pp =>
                    pp.sourceComponent.name === next.name && !visitedInCurrentPath.has(pp) &&
                    hasCommonProps(properties, pp.sourceComponent.properties,pp.destComponent.name) &&
                    hasCommonPropPassings(properties, pp.props)
                );

                if (!nextPassing) break;
                path.push(nextPassing);
                visitedInCurrentPath.add(nextPassing);

                properties = properties.filter(p =>
                    nextPassing.props.some(nextProp => 
                        Object.keys(p)[0] === Object.values(nextProp)[0]
                    )
                );

                next = nextPassing.destComponent;
            }

            if (path.length > 1) {
                const uniqueProperties = removeDuplicateObjects(properties);
                propDrillingInstances.push(new PropDrilling(uniqueProperties, path, path[0].sourceComponent, path[path.length - 1].destComponent));
            }
        }
    }
    propDrillingInstances = filterLongestPropDrillings(propDrillingInstances)
    return propDrillingInstances;
}


function hasCommonProps(props1, props2,name) {
    const formattedProps1 = props1.map(prop => {
        const [key, value] = Object.entries(prop)[0];
        return `${key}=${key}`;
    });
    return formattedProps1.some(formattedProp =>
        props2.includes(formattedProp)
    );
}

function hasCommonPropPassings(props1, props2) {
    const props2Values = new Set(props2.map(prop => Object.values(prop)[0]));
    return props1.some(prop => {
        const keyInProps1 = Object.keys(prop)[0];
        return props2Values.has(keyInProps1);
    });
}
export {loadHierarchy,extractAllPaths,detectPropDrilling}
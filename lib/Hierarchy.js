import { PropDrilling } from "./PropDrilling.js";
import { PropPassing } from "./PropPassing.js";
import { getDistinctPropDrillings,removeDuplicateObjects,filterLongestPropDrillings,removeDuplicatePropPassings} from "./util.js";

//Function that performs a validation to ensure that all elements returned by a React component are not found in the other React Components list
function checkReturnElements(reactComponent, reactComponents) {
    return reactComponent.returnedElements.every(childName => {
        return !reactComponents.some(comp => comp.name === childName|| (comp.aliases && comp.aliases.aliases.includes(childName)));
    });
}

//Function that constructs the object that depicts the Hierarchy of the input project
function loadHierarchy(reactComponent, reactComponents) {
    //Check if the current React Component returns other components
    if (!reactComponent.returnedElements || checkReturnElements(reactComponent, reactComponents)) {
        return { [reactComponent.name]: {}};
    }
    let hierarchy = {};

    //Recursively construct the hierarchy
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

//Extacts all the paths from the hierarchy object 
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
            //Extract all Prop Passings between components
            const propValues = firstComponent.getChildPropValues(reactComponents);
            
            const secondComponent = reactComponents.find(comp => comp.name === path[i+1]);
            if (!secondComponent) throw new Error("Component not found");
    
            //Construct Prop Passing Objects
            for (let [component, props] of Object.entries(propValues)) {
                props = removeDuplicateObjects(props);
                props.forEach(p => {
                    for (const [propName, propValue] of Object.entries(p)) {
                        if(secondComponent.properties.includes(propName+"="+propName) && component===secondComponent.name){
                            propPassings.push(new PropPassing(firstComponent,secondComponent,props))
                        }
                    }
                });
            }
        }
        
        propPassings = removeDuplicatePropPassings(propPassings);
        propDrillings.push(...createPropDrilling(propPassings));
    });
    
    propDrillings = getDistinctPropDrillings(propDrillings);
    return propDrillings;
}

//Function that extracts PropDriling instances
function createPropDrilling(propPassings) {
    let propDrillingInstances = [];

    for (let i = 0; i < propPassings.length; i++) {
        const current = propPassings[i];

        for (const prop of current.props) {
            const path = [current];
            let properties = [prop];
            let propertyMappings = properties.map(p => ({
                original: Object.keys(p)[0], // Original prop name
                current: Object.keys(p)[0]  // Current prop name
            }));
            const visitedInCurrentPath = new Set([current]); // Track visited nodes
            let next = current.destComponent;

            // Loop to build the prop passing chain
            while (true) {
                const nextPassing = propPassings.find(pp =>
                    pp.sourceComponent.name === next.name &&
                    !visitedInCurrentPath.has(pp) &&
                    hasCommonProps(
                        propertyMappings.map(mapping => ({ [mapping.current]: mapping.current })),
                        pp.sourceComponent.properties
                    ) &&
                    hasCommonPropPassings(
                        propertyMappings.map(mapping => ({ [mapping.current]: mapping.current })),
                        pp.props
                    )
                );
                if (!nextPassing) break;

                path.push(nextPassing);
                visitedInCurrentPath.add(nextPassing);

                const previousPropertyMappings = [...propertyMappings];

                // Update propertyMappings based on the current `nextPassing` props
                propertyMappings = propertyMappings
                    .map(mapping => {
                        const match = nextPassing.props.find(nextProp =>
                            Object.values(nextProp)[0] === mapping.current
                        );
                        if (match) {
                            return {
                                original: mapping.original,
                                current: Object.keys(match)[0]
                            };
                        }
                        return null; // Filter out properties no longer passed
                    })
                    .filter(Boolean);

                // Handle properties excluded from the current path
                if (path.length > 1) {
                    const excludedMappings = previousPropertyMappings.filter(mapping =>
                        !propertyMappings.some(newMapping => newMapping.original === mapping.original)
                    );
                    const previousPath = path.slice(0, -1);
                    if (excludedMappings.length > 0 && previousPath.length > 1) {
                        const excludedProperties = excludedMappings.map(mapping => ({
                            [mapping.original]: mapping.current
                        }));
                        propDrillingInstances.push(
                            new PropDrilling(
                                removeDuplicateObjects(excludedProperties),
                                previousPath,
                                path[0].sourceComponent,
                                path[path.length - 2].destComponent
                            )
                        );
                    }
                }

                next = nextPassing.destComponent;
            }

            // Add the final PropDrilling instance for the current path
            if (path.length > 1 && propertyMappings.length > 0) {
                const finalProperties = propertyMappings.map(mapping => ({
                    [mapping.original]: mapping.current
                }));
                propDrillingInstances.push(
                    new PropDrilling(
                        removeDuplicateObjects(finalProperties),
                        path,
                        path[0].sourceComponent,
                        path[path.length - 1].destComponent
                    )
                );
            }
        }
    }

    propDrillingInstances = filterLongestPropDrillings(propDrillingInstances);
    return propDrillingInstances;
}


//Helper method that checks if there are common props between the current PropPassing node and the next Prop Passing source Component entity
function hasCommonProps(props1, props2) {
    const formattedProps1 = props1.map(prop => {
        const [key, value] = Object.entries(prop)[0];
        return `${key}=${key}`;
    });
    return formattedProps1.some(formattedProp =>
        props2.includes(formattedProp)
    );
}

//Helper method that checks if there are common props between the current PropPassing node and the next one.
function hasCommonPropPassings(props1, props2) {
    const props2Values = new Set(props2.map(prop => Object.values(prop)[0]));
    return props1.some(prop => {
        const keyInProps1 = Object.keys(prop)[0];
        return props2Values.has(keyInProps1);
    });
}
export {loadHierarchy,extractAllPaths,detectPropDrilling}
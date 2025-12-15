import { PropDrilling } from "./PropDrilling.js";
import { PropPassing } from "./PropPassing.js";
import { getDistinctPropDrillings,removeDuplicateObjects,filterLongestPropDrillings,removeDuplicatePropPassings} from "./util.js";

//todo resolve aliases for composite keys
function checkReturnElements(reactComponent, reactComponents) {
    return reactComponent.returnedElementsByKey.every(childKeyName => {
        return !reactComponents.some(comp => 
            comp.compositeKeyName === childKeyName || 
            (comp.aliases?.aliases?.includes(childKeyName.split(":")[1]))
        );
    });
}


/**
 * 
 * @param {*} reactComponent The current node of the breadth first search
 * @param {*} reactComponents All react components
 * @param {*} currentPath The path from root to current node
 * @returns 
 */
function loadHierarchy(reactComponent, reactComponents, currentPath = []) {

    if (!reactComponent){
        console.log("******************** Invoked with null component")
        console.log(currentPath)
        return
    }
    /*
    Check whether reactComponent is already part of the currentPath, starting a circle, abort traversal
     */
    if (currentPath.includes(reactComponent)){
        return { [reactComponent.compositeKeyName]: {} };
    }
    /*
    Check if reactComponent returns any react elements, potential children
    */
    currentPath.push(reactComponent)
    if (reactComponent.childComponents.length == 0){
        return { [reactComponent.compositeKeyName]: {} };
    } 
    // if (!reactComponent.returnedElementsByKey || checkReturnElements(reactComponent, reactComponents)) {    
    //     return { [reactComponent.compositeKeyName]: {} };
    // }
    let hierarchy = {};

    //for each returned element (child) of the reactComponent
    // reactComponent.returnedElementsByKey.forEach(childName => {
    //     const child = reactComponents.find(comp => 
    //         comp.compositeKeyName === childName || 
    //         (comp.aliases?.aliases?.includes(childName.split(":")[1]))
    //     );
    reactComponent.childComponents.forEach(child => {
        if (child) {
            // provide a copy of current path
            const childHierarchy = loadHierarchy(child, reactComponents, [...currentPath]);
            if (!hierarchy[reactComponent.compositeKeyName]) {
                hierarchy[reactComponent.compositeKeyName] = {};
            }
            if (!hierarchy[reactComponent.compositeKeyName][child.compositeKeyName]) {
                hierarchy[reactComponent.compositeKeyName][child.compositeKeyName] = [];
            }
            hierarchy[reactComponent.compositeKeyName][child.compositeKeyName].push(childHierarchy[child.compositeKeyName]);
        }
    });
    return hierarchy;
}

function extractAllPaths(hierarchy) {
    let paths = [];
    function traverse(node, path = []) {
        if (Object.keys(node).length === 0 && path.length >= 3) {
            paths.push(path);
        }
        Object.keys(node).forEach(componentKey => {
            const currentPath = [...path, componentKey];
            if (Array.isArray(node[componentKey])) {
                node[componentKey].forEach(child => {
                    traverse(child, currentPath);
                });
            } else {
                traverse(node[componentKey], currentPath);
            }
        });
    }
    traverse(hierarchy);
    return paths;
}

function detectPropDrilling(paths, reactComponents) {
    let propDrillings = [];
    paths = removeDuplicateObjects(paths);
    paths.forEach(path => {
        const propPassings = extractPropPassingObjects(path, reactComponents);
        propDrillings.push(...createPropDrilling(propPassings));
    });

    propDrillings = getDistinctPropDrillings(propDrillings);
    return propDrillings;
}

function extractPropPassingObjects(path, reactComponents) { 
    let propPassings = [];
    for (let i = 0; i < path.length - 1; i++) {
        const firstComponent = reactComponents.find(comp => comp.compositeKeyName === path[i]);
        if (!firstComponent) throw new Error("Component not found");

        const propValues = firstComponent.getChildPropValues(reactComponents);
        const secondComponent = reactComponents.find(comp => comp.compositeKeyName === path[i + 1]);
        if (!secondComponent) throw new Error("Component not found");

        for (let [componentKey, props] of Object.entries(propValues)) {
            const filteredProps = removeDuplicateObjects(props);
            filteredProps.forEach(p => {
                for (const [propName] of Object.entries(p)) {
                    if (secondComponent.properties.map(pr => pr.propName).includes(propName) && componentKey === secondComponent.compositeKeyName) {
                        propPassings.push(new PropPassing(firstComponent, secondComponent, filteredProps));
                    }
                }
            });
        }
    }

    return removeDuplicatePropPassings(propPassings);
}

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

    return (propDrillingInstances.length === 0) ? propDrillingInstances : filterLongestPropDrillings(propDrillingInstances);
}


//Helper method that checks if there are common props between the current PropPassing node and the next Prop Passing source Component entity
function hasCommonProps(props1, props2) {
    const formattedProps1 = props1.map(prop => {
        return Object.keys(prop)[0];
    });
    return formattedProps1.some(formattedProp =>
        props2.map(pr => pr.propName).includes(formattedProp)
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
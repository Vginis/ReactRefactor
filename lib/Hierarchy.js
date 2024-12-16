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
            const visitedInCurrentPath = new Set([current]);//Set to keep track of which Prop Passings are added to the path, so as to avoid duplicates
            let next = current.destComponent;

            //loop that creates prop passing chain between the components
            while (true) {
                //Locate the next Prop Passing node of the Prop Drilling
                const nextPassing = propPassings.find(pp =>
                    pp.sourceComponent.name === next.name && !visitedInCurrentPath.has(pp) &&
                    hasCommonProps(path[path.length-1].props, pp.sourceComponent.properties) &&
                    hasCommonPropPassings(path[path.length-1].props, pp.props)
                );
                if (!nextPassing) break;
                path.push(nextPassing);
                visitedInCurrentPath.add(nextPassing);
                
                const previousProperties = properties;

                //Filter the props that are no longer passed through the prop drilling path
                properties = properties.filter(p =>
                    nextPassing.props.some(nextProp => 
                        Object.keys(p)[0] === Object.values(nextProp)[0]
                    )
                );

                //PropDrilling tracking for proped variables that their path is a subset to the bigger path
                if(path.length>1){
                   const excludedProperties = previousProperties.filter(p => 
                    !nextPassing.props.some(nextProp => 
                        Object.keys(p)[0] === Object.values(nextProp)[0]
                    )
                   );
                   const previousPath = path.slice(0, -1);
                   if(excludedProperties.length>0 && previousPath.length>1){
                    const uniqueProperties = removeDuplicateObjects(excludedProperties);
                    propDrillingInstances.push(new PropDrilling(uniqueProperties, previousPath, path[0].sourceComponent, path[path.length - 2].destComponent));
                   }
                }
                
                next = nextPassing.destComponent;
            }
            
            if (path.length > 1 && properties.length>0) {
                const uniqueProperties = removeDuplicateObjects(properties);
                propDrillingInstances.push(new PropDrilling(uniqueProperties, path, path[0].sourceComponent, path[path.length - 1].destComponent));
            }
        }
    }
    propDrillingInstances = filterLongestPropDrillings(propDrillingInstances)
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
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
            Object.assign(hierarchy, loadHierarchy(child, reactComponents));
        }
    });
    return { [reactComponent.name]: hierarchy };
}

// function locatePropDrilling(node, reactComponents) {
//     const propDrillingCounter = {};
    
//     function traverse(node, parentProps = []) {
//         const componentName = Object.keys(node)[0];
//         const component = reactComponents.find(comp => comp.name === componentName);
        
//         if (!component) return;
        
//         // Get the props passed by this component
//         const componentProps = component.properties || {};
//         const propNames = Object.keys(componentProps);
//         console.log(component.properties);
//         // Count the props being passed down
//         propNames.forEach(propName => {
//             if (!propDrillingCounter[propName]) {
//                 propDrillingCounter[propName] = 0;
//             }
//             propDrillingCounter[propName] += 1;
//         });

//         // Traverse children
//         const children = node[componentName];
//         for (const childName in children) {
//             traverse({ [childName]: children[childName] }, propNames);
//         }
//     }

//     traverse(node);
//     return propDrillingCounter;
// }
export {loadHierarchy}
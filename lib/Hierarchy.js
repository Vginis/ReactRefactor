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

export {loadHierarchy}
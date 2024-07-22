function findCommonAncestor(componentA, componentB,root){
    function getAncestors(component) {
        const ancestors = [];
        let currentComponent = component;

        while (currentComponent && currentComponent.name !== root.name) {
            ancestors.push(currentComponent);
            currentComponent = currentComponent.parentElements.length > 0 ? currentComponent.parentElements[0] : null;
        }

        if (currentComponent) {
            ancestors.push(root);
        }

        return ancestors;
    }
    const ancestorsA = getAncestors(componentA);
    const ancestorsB = getAncestors(componentB);

    const setB = new Set(ancestorsB.map(component => component.name));
    for (let ancestor of ancestorsA) {
        if (setB.has(ancestor.name)) {
            return ancestor;
        }
    }

    return null;
}

export {findCommonAncestor};
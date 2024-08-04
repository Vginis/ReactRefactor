import jscodeshift from 'jscodeshift';
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

function getValueFromGivenState(state,component){
    const j = jscodeshift;
    let foundDeclaration = null;
    const ast = component.ast;
    ast.find(j.VariableDeclaration).forEach(path => {
        path.node.declarations.forEach(declaration => {
            if (j.ArrayPattern.check(declaration.id) && declaration.id.elements.length === 2){
                const [stateElement] = declaration.id.elements;
                if(j.Identifier.check(stateElement) && stateElement.name === state){
                    if( 
                    j.CallExpression.check(declaration.init) &&
                    j.Identifier.check(declaration.init.callee) &&
                    declaration.init.callee.name === 'useState'
                ) {
                    foundDeclaration = declaration.init.arguments[0].value;
                }
                }
            }
        })
    });

return foundDeclaration;
}

function findCommonUseStates(useStateDeclarations){
    let counts = {};
    useStateDeclarations.forEach(declaration => {
        const key = JSON.stringify({ name: declaration.variableName, value: declaration.initialValue });

        if(counts[key] === undefined){
            counts[key] = 1;
        } else {
            counts[key] ++;
        }
    })
    return counts;
}

function findRepeatedCode(componentA,componentB,minLines = 4){
    const linesA = getLinesFromAst(componentA.ast);
    const linesB = getLinesFromAst(componentB.ast);

    const repeatedSeqs = [];

    for(let i=0; i<linesA.length; i++){
        for(let j=0; j<linesB.length; j++){
            let k = 0;
            while(linesA[i+k] && linesB[j+k] && linesA[i+k] === linesB[j+k]){
                k++;
            }
            if(k >= minLines){
                repeatedSeqs.push({
                    start1: i,
                    start2: j,
                    length: k,
                    lines: linesA.slice(i, i + k)
                });
            }
        }
    }
    const filteredSeqs = [];
    repeatedSeqs.forEach(seq => {
        const isSubset = repeatedSeqs.some(otherSeq =>
            otherSeq !== seq &&
            seq.start1 >= otherSeq.start1 &&
            seq.start2 >= otherSeq.start2 &&
            seq.start1 + seq.length <= otherSeq.start1 + otherSeq.length &&
            seq.start2 + seq.length <= otherSeq.start2 + otherSeq.length
        );
        if (!isSubset) {
            filteredSeqs.push(seq);
        }
    });

    return filteredSeqs;
}

function getLinesFromAst(ast){
    const code = ast.toSource();
    return code.split('\n');
}
function locatePropPassing(root,components){
    const propPassingComponents = [];
    function traverse(component,propsMap = {}){
        const {name,properties,returnedElements} = component;
        const newPropsMap = { ...propsMap};

        properties.forEach(prop => {
            if(!newPropsMap[prop]){
                newPropsMap[prop] = [];
            }
            newPropsMap[prop].push(name);
        });
        Object.keys(newPropsMap).forEach(prop => {
            if(newPropsMap[prop].length >= 2){
                propPassingComponents.push({prop, path: newPropsMap[prop]});
            }
        });

        returnedElements.forEach(childName =>{
            const childComponent = components.find(comp => comp.name === childName);
            if(childComponent){
                traverse(childComponent, newPropsMap);
            }
        });}
    traverse(root);
    return propPassingComponents;
}
function locatePropDrilling(root, components) {
    const propDrillingComponents = [];
    const seen = new Set();

    function traverse(component, propsMap = {}) {
        const { name, returnedElements } = component;
        const newPropsMap = { ...propsMap };

        const childProps = component.getChildProps();
        Object.keys(childProps).forEach(child => {
            childProps[child].forEach(prop => {
                if (!newPropsMap[prop]) {
                    newPropsMap[prop] = [];
                }
                newPropsMap[prop].push(name);
            });
        });

        Object.keys(newPropsMap).forEach(prop => {
            const pathString = newPropsMap[prop].join(' -> ');
            if (newPropsMap[prop].length >= 2 && !seen.has(`${prop}-${pathString}`)) {
                propDrillingComponents.push({ prop, path: newPropsMap[prop] });
                seen.add(`${prop}-${pathString}`);
            }
        });

        returnedElements.forEach(childName => {
            const childComponent = components.find(comp => comp.name === childName);
            if (childComponent) {
                traverse(childComponent, newPropsMap);
            }
        });
    }

    traverse(root);
    return propDrillingComponents;
}

function locatePropDrillingPath(root,components){
    const propDrilling = locatePropDrilling(root,components)
    const propPassing = locatePropPassing(root,components);
    
    if(propDrilling.length === 0 || propPassing.length === 0){
        return 'Havent found any prop drilling occurences';
    }
    let path = [];
    let commonA,commonB;
    for(let i=0; i<propDrilling.length;i++){
        for(let j=0; j<propPassing.length;j++){
            if(propDrilling[i].prop+"="+propDrilling[i].prop === propPassing[i].prop){
               commonA = propDrilling[i];
               commonB = propPassing[j];
            }
        } 
    }
    commonA.path.push(commonB.path[commonB.path.length-1]);
    return commonA.path;
}

//todo Refactor the repeated code here
//make PropDrilling more Object Oriented
export {findCommonAncestor,getValueFromGivenState,findCommonUseStates,findRepeatedCode,locatePropDrillingPath};
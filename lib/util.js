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
function removeDuplicates(arr) {
    let unique = [];
    arr.forEach(element => {
        if (!unique.includes(element)) {
            unique.push(element);
        }
    });
    return unique;
}

function recursiveComponentComposition(hierarchy, j) {
    const createJSXElement = (parentName, childElements = []) => {
        return j.jsxElement(
            j.jsxOpeningElement(j.jsxIdentifier(parentName), []),
            j.jsxClosingElement(j.jsxIdentifier(parentName)),
            childElements,
            false
        );
    };

    const compose = (node) => {
        if (!node || typeof node !== 'object' || Object.keys(node).length === 0) {
            return null;
        }
        const componentName = Object.keys(node)[0]; 
        const children = node[componentName];
        if (Array.isArray(children)) {
            const childElements = children.map(childNode => compose(childNode)).filter(Boolean);
            return createJSXElement(componentName, childElements);
        }
        if (typeof children === 'object') {
            const childElements = [];
            Object.keys(children).forEach(childName => {
                const childNode = { [childName]: children[childName] };
                const childElement = compose(childNode);
                if (childElement) {
                    childElements.push(childElement);
                }
            });

            return createJSXElement(componentName, childElements);
        }
        return createJSXElement(componentName);
    };

    return compose(hierarchy);
}

function returnsJSX(path, j) {
    let returnedJSX = false;
  
    // Handle normal function components and class methods
    j(path).find(j.ReturnStatement).forEach(returnPath => {
      const argument = returnPath.node.argument;
      if (argument && (
          argument.type === 'JSXElement' || 
          argument.type === 'JSXFragment' || 
          (argument.type === 'CallExpression' &&
           argument.callee.object &&
           argument.callee.object.name === 'React' &&
           argument.callee.property.name === 'createElement')
        )
      ) {
        returnedJSX = true;
      }
    });
    // Handle arrow function components with implicit return
    if (!returnedJSX && path.type === 'ArrowFunctionExpression') {
      const body = path.body;
  
      // If the arrow function's body is JSXElement/JSXFragment, it's implicitly returned
      if (body.type === 'JSXElement' || body.type === 'JSXFragment') {
        returnedJSX = true;
      }
  
      // Handle arrow function returning a call to React.createElement
      if (body.type === 'CallExpression' &&
          body.callee.object &&
          body.callee.object.name === 'React' &&
          body.callee.property.name === 'createElement') {
        returnedJSX = true;
      }
    }

    return returnedJSX;
  }

export {findCommonAncestor,getValueFromGivenState,findCommonUseStates,findRepeatedCode,removeDuplicates,recursiveComponentComposition,returnsJSX};
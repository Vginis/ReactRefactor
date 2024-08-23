import path from 'path';
import * as fs from 'fs';
import jscodeshift from 'jscodeshift';

class UseStateDeclaration{
    constructor(variableName, setVariableMethod, initialValue,filePath, reactComponent){
        this.variableName = variableName
        this.setVariableMethod = setVariableMethod
        this.initialValue = initialValue
        this.filePath = filePath
        this.reactComponent = reactComponent
    }
}

function loadUseStateVariables(reactFiles) {
    let useStateVariables = [];
    const j = jscodeshift;
    reactFiles.forEach(file => {
        file.ast.find(j.VariableDeclaration).forEach(path => {
            path.node.declarations.forEach(declaration => {
                if (
                    declaration.init && 
                    declaration.init.type === 'CallExpression' &&
                    declaration.init.callee.type === 'Identifier' &&
                    declaration.init.callee.name === 'useState'
                ) {
                    let parentPath = path.parentPath;
                    let componentName = '';

                    while (parentPath && parentPath.node.type !== 'FunctionDeclaration' && parentPath.node.type !== 'FunctionExpression' && parentPath.node.type !== 'ArrowFunctionExpression') {
                        parentPath = parentPath.parentPath;
                    }

                    if (parentPath && (parentPath.node.type === 'FunctionDeclaration' || parentPath.node.type === 'FunctionExpression')) {
                        if (parentPath.node.id && parentPath.node.id.name) {
                            componentName = parentPath.node.id.name;
                        }
                    } else if (parentPath && parentPath.node.type === 'ArrowFunctionExpression') {
                        let grandParentPath = parentPath.parentPath;
                        if (grandParentPath && grandParentPath.node.type === 'VariableDeclarator' && grandParentPath.node.id.type === 'Identifier') {
                            componentName = grandParentPath.node.id.name;
                        }
                    }
                    let setVariableMethod = null;
                    if(declaration.id.elements[1]){
                        setVariableMethod = declaration.id.elements[1].name;
                    }
                    useStateVariables.push({
                        variableName: declaration.id.elements[0].name,
                        setVariableMethod: setVariableMethod,
                        initialValue: j(declaration.init.arguments[0]).toSource(),
                        filePath: file.filePath,
                        reactComponent: componentName
                    });
                }
            });
        });
    });

    return useStateVariables;
}


export {UseStateDeclaration, loadUseStateVariables}
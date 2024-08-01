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

function loadUseStateVariables(reactFiles){
    let useStateVariables = [];
    const j = jscodeshift;
    reactFiles.forEach(file => {
        // const filePath = path.join("../code/vite-project/src/", file);
        // const fileContent = fs.readFileSync(filePath, 'utf8');
        // const ast = j(fileContent); 

        file.ast.find(j.VariableDeclaration).forEach(path => {
            path.node.declarations.forEach(declaration => {
                if(
                    declaration.init && 
                    declaration.init.type === 'CallExpression' &&
                    declaration.init.callee.type === 'Identifier' &&
                    declaration.init.callee.name === 'useState'
                ){
                    let parentPath = path.parentPath;
                    while (parentPath && parentPath.node.type !== 'FunctionDeclaration' && parentPath.node.type !== 'FunctionExpression') {
                        parentPath = parentPath.parentPath;
                    }

                    let componentName = '';
                    if (parentPath && parentPath.node.id && parentPath.node.id.name) {
                        componentName = parentPath.node.id.name;
                    }
                    useStateVariables.push({
                        variableName: declaration.id.elements[0].name,
                        setVariableMethod: declaration.id.elements[1].name,
                        initialValue: j(declaration.init.arguments[0]).toSource(),
                        filePath: file.filePath,
                        reactComponent: componentName
                    })
                }
            })
        })
    });
    return useStateVariables;
}

export {UseStateDeclaration, loadUseStateVariables}
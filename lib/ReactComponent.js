import * as fs from 'fs';
import jscodeshift from 'jscodeshift';

class ReactComponent {
    constructor(name, properties, returnedElements,parentElements, filepath, ast, useStateDeclarations=[]){
        this.name = name;
        this.properties = properties;
        this.returnedElements = returnedElements;
        this.parentElements = parentElements;
        this.filepath = filepath;
        this.ast = ast;
        this.useStateDeclarations = useStateDeclarations;
    }

    loadFileAndAst(){
        const j = jscodeshift;
        const filePath = this.filepath;
        const ast = this.ast;
        return {j,filePath,ast};
    }
//todo fix the bug in the addNewProperty, second function Component Example 2 can't add new prop if there is already that prop in the Example Component
    addNewProperty(newProp){
        if(!this.properties.includes(newProp)){
            this.properties.push(newProp);
        }else{
            console.log("Property already exists. Maybe pick a new name for the prop.")
            return;}
        const {j,filePath,ast} = this.loadFileAndAst();
    
        let updatedAst = ast;
        updatedAst.find(j.FunctionDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                if (path.node.params.length === 0) {
                    const newPropNode = j.property('init', j.identifier(newProp), j.identifier(newProp));
                    const objectPattern = j.objectPattern([newPropNode]);
                    path.node.params.push(objectPattern);
                } else {
                    path.node.params.forEach(param => {
                        if (param.type === 'ObjectPattern') {
                            const newPropNode = j.property('init', j.identifier(newProp), j.identifier(newProp));
                            param.properties.push(newPropNode);
                        }
                    });
                }
            }
        });
    //todo change this here. 
        const updatedCode = updatedAst.toSource();
        fs.writeFileSync(filePath, updatedCode, 'utf8');
    }

    removeProperty(prop){
        let deleted = false;
        if(this.properties.includes(prop+`=${prop}`)){
            this.properties = this.properties.filter(pr => pr!==(prop+`=${prop}`))
            deleted = true;
        }
        if(!deleted){
            console.log("This Property doesn't exist");
            return;
        }
        const {j,filePath,ast} = this.loadFileAndAst();
        let updatedAst = ast;
        updatedAst.find(j.FunctionDeclaration).forEach(path => {
            path.node.params.forEach(param => {
                if (param.type === 'ObjectPattern') {
                    param.properties = param.properties.filter(property => {
                        return !(property.key && property.key.name === prop);
                    });
                    
                }
            });
        });
        const updatedCode = updatedAst.toSource();
        fs.writeFileSync(filePath, updatedCode, 'utf8');
    }
    
    addNewUseStateDeclaration(variableDec){
        if(!this.useStateDeclarations.includes(variableDec)){
            this.useStateDeclarations.push(variableDec);
        }
        const j = jscodeshift;
        const { variableName, setVariableMethod, initialValue } = variableDec;
        let foundUseState = false;

        this.ast.find(j.ImportDeclaration).forEach(path => {
            if (path.node.source.value === 'react') {
                console.log(path.node.specifiers);
                let existingSpecifier = path.node.specifiers.filter(spec => spec.type!=='ImportDefaultSpecifier')
                existingSpecifier = existingSpecifier.find(specifier => specifier.imported.name === 'useState');
                if (!existingSpecifier) {
                    path.node.specifiers.push(j.importSpecifier(j.identifier('useState')));
                }
                foundUseState = true;
            }
        });

        if (!foundUseState) {
            const importDeclaration = j.importDeclaration(
                [j.importSpecifier(j.identifier('useState'))],
                j.literal('react')
            );
            this.ast.get().node.program.body.unshift(importDeclaration);
        }

        this.ast.find(j.FunctionDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                const useStateCall = j.variableDeclaration('const', [
                    j.variableDeclarator(
                        j.arrayPattern([
                            j.identifier(variableName),
                            j.identifier(setVariableMethod)
                        ]),
                        j.callExpression(
                            j.identifier('useState'),
                            [j.literal(initialValue)]
                        )
                    )
                ]);

                path.node.body.body.unshift(useStateCall);
            }
        });

        const updatedCode = this.ast.toSource();
        fs.writeFileSync(this.filepath, updatedCode, 'utf8');
    }
    removeUseStateDeclaration(variableName){
        let deleted = false;
        this.useStateDeclarations.forEach(el => {
            if(el.variableName === variableName){
                this.useStateDeclarations = this.useStateDeclarations.filter(el => el.variableName !== variableName);
                deleted = true;
            }
        })
        if(!deleted){
            console.log("Use State Declaration doesn't exist");
            return;
        }
        const {j,filePath,ast} = this.loadFileAndAst();
        ast.find(j.FunctionDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                path.node.body.body = path.node.body.body.filter(node => {
                    if (j.VariableDeclaration.check(node)) {
                        const declaration = node.declarations[0];
                        if (j.ArrayPattern.check(declaration.id)) {
                            const [stateVar] = declaration.id.elements;
                            return stateVar.name !== variableName;
                        }
                    }
                    return true;
                });
            }
        });

        const updatedCode = ast.toSource();
        fs.writeFileSync(filePath, updatedCode, 'utf8');

        }
    
    addNewPropToReturnElement(variableName,componentName){
        if(!this.returnedElements.includes(componentName)){
            console.log("Given componentName not included in the return elements.")
            return;
        }

        const {j,filePath,ast} = this.loadFileAndAst();
        
         ast.find(j.ReturnStatement).forEach(path => {
            j(path).find(j.JSXElement).forEach(elementPath => {
                if(elementPath.node.openingElement.name.name === componentName){
                    const attributes = elementPath.node.openingElement.attributes;

                    if(!attributes.some(attr => attr.name && attr.name.name === variableName)){
                        attributes.push(
                            j.jsxAttribute(
                                j.jsxIdentifier(variableName),
                                j.jsxExpressionContainer(j.identifier(variableName))
                            )
                        );
                    }
                }
            });
        });

        const output = ast.toSource();
        fs.writeFileSync(filePath, output);
    }

    removePropFromReturnElement(variableName,componentName){
        if(!this.returnedElements.includes(componentName)){
            console.log("Given componentName not included in the return elements.")
            return;
        }
        const {j,filePath,ast} = this.loadFileAndAst();

        ast.find(j.ReturnStatement).forEach(path => {
            j(path).find(j.JSXElement).forEach(elementPath => {
               if(elementPath.node.openingElement.name.name === componentName){
                 const attributes = elementPath.node.openingElement.attributes;
                 const filtAttributes = attributes.filter(el => (el.name.name !== variableName));
                 console.log(filtAttributes);
                 elementPath.node.openingElement.attributes = filtAttributes;
               }
            })
        })

        const output = ast.toSource();
        fs.writeFileSync(filePath, output);
    }
}
export {ReactComponent};
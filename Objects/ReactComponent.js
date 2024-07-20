import path from 'path';
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

    addNewProperty(newProp){
        if(!this.properties.includes(newProp)){
            this.properties.push(newProp);
        }else{
            console.log("Property already exists. Maybe pick a new name for the prop.")
            return;}
        const j = jscodeshift;
        const filePath = this.filepath;
        const ast = this.ast;
    
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
        const ast = this.ast;
        const j = jscodeshift;
        const filePath = this.filepath;
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
//BUG: when the import is like this: import React,{useState} from 'react'; is not working. 
    addNewUseStateDeclaration(variableDec){
        if(!this.useStateDeclarations.includes(variableDec)){
            this.useStateDeclarations.push(variableDec);
        }
        const j = jscodeshift;
        const { variableName, setVariableMethod, initialValue } = variableDec;
        let foundUseState = false;

        this.ast.find(j.ImportDeclaration).forEach(path => {
            if (path.node.source.value === 'react') {
                const existingSpecifier = path.node.specifiers.find(specifier => specifier.imported.name === 'useState');
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
        const j = jscodeshift;
        const filePath = this.filepath;
        const ast = this.ast;
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
}

function loadReactComponents(files){
    let components = [];
    const j = jscodeshift;
    files.forEach(file => {
        const filePath = path.join("../code/vite-project/src/", file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const ast = j(fileContent);
        ast.find(j.FunctionDeclaration).forEach(path => {
            let props = [];
           
            path.node.params.forEach(param => {
                if (param.type === 'ObjectPattern') {
                    props = extractPropsFromObjectPattern(param);
                }
            });
            const returnedElements = extractReturnElements(path.node);
            components.push(new ReactComponent(path.node.id.name, props, returnedElements,[],filePath,ast));
        });
    });
    return components;
}

function extractPropsFromObjectPattern(objectPatternNode) {
    let props = [];
    objectPatternNode.properties.forEach(property => {
        if (property.type === 'Property') {
            const propName = property.key.name;
            const propValue = jscodeshift(property.value).toSource();
            props.push(`${propName}=${propValue}`);
        } else if (property.type === 'ObjectPattern') {
            const nestedProps = extractPropsFromObjectPattern(property);
            props.push(...nestedProps);
        }
    });

    return props;
}

function extractReturnElements(functionNode){
    let returnedElements = [];
    functionNode.body.body.forEach(node => {
        if(node.type === 'ReturnStatement'){
            if(node.argument.type === 'JSXElement' || node.argument.type === 'JSXFragment'){
                returnedElements = extractElementNames(node.argument);
            }
        }
    })
    return returnedElements;
}

function extractElementNames(node) {
    let elementNames = [];

    if (node.type === 'JSXElement') {
        const openingElement = node.openingElement;
        if (openingElement.name.type === 'JSXIdentifier') {
            elementNames.push(openingElement.name.name);
        } else if (openingElement.name.type === 'JSXMemberExpression') {
            elementNames.push(openingElement.name.property.name);
        }

        node.children.forEach(child => {
            if (child.type === 'JSXElement') {
                elementNames = elementNames.concat(extractElementNames(child));
            }
        });
    } else if (node.type === 'JSXFragment') {
        node.children.forEach(child => {
            if (child.type === 'JSXElement') {
                elementNames = elementNames.concat(extractElementNames(child));
            }
        });
    }

    return elementNames;
}

function addParents(reactComponents){
    reactComponents.forEach(comp => {
        const otherComponents = reactComponents.filter(component => component.name !== comp.name);
        let parents = [];
        otherComponents.forEach(comp2 => {
            if(comp2.returnedElements.includes(comp.name)){
                parents.push(comp2);
            }
        });
        comp.parentElements = parents;
    })
    
}

export {ReactComponent, loadReactComponents, addParents};

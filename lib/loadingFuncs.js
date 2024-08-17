import path from 'path';
import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import { ReactComponent } from './ReactComponent.js';
function loadReactComponents(reactFiles){
    let components = [];
    const j = jscodeshift;
    reactFiles.forEach(file => {
        file.ast.find(j.FunctionDeclaration).forEach(path => {
            let props = [];
           
            path.node.params.forEach(param => {
                if (param.type === 'ObjectPattern') {
                    props = extractPropsFromObjectPattern(param);
                }
            });
            const returnedElements = extractReturnElements(path.node);
            components.push(new ReactComponent(path.node.id.name, props, returnedElements,[],file.filePath,file.ast));
            extractImportDeclarations(components);
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
    });
}

function extractImportDeclarations(reactComponents){
        reactComponents.forEach(reactComponent => {
            const { j, ast } = reactComponent.loadFileAndAst();

            const imports = [];
    
            ast.find(j.ImportDeclaration).forEach(path => {
                const source = path.node.source.value;
                const specifiers = path.node.specifiers.map(specifier => {
                    if (specifier.type === 'ImportSpecifier') {
                        return specifier.imported.name;
                    } else if (specifier.type === 'ImportDefaultSpecifier') {
                        return specifier.local.name;
                    } else if (specifier.type === 'ImportNamespaceSpecifier') {
                        return '*';
                    }
                });
    
                imports.push({ [source]: specifiers });
            });
            reactComponent.importDeclarations = imports;
        })
        
}

export {loadReactComponents,addParents,extractReturnElements,extractImportDeclarations};
import path from 'path';
import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import { ReactComponent } from './ReactComponent.js';
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

export {loadReactComponents,addParents};
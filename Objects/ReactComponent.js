import path from 'path';
import * as fs from 'fs';
import jscodeshift from 'jscodeshift';

class ReactComponent {
    constructor(name, properties, returnedElements,parentElements, filepath, ast){
        this.name = name;
        this.properties = properties;
        this.returnedElements = returnedElements;
        this.parentElements = parentElements;
        this.filepath = filepath;
        this.ast = ast;
    }

    addNewProperty(newProp){
        if(!this.properties.includes(newProp)){
            this.properties.push(newProp);
        }
    }

    removeProperty(prop){
        if(this.properties.includes(prop)){
            this.properties = this.properties.filter(pr => pr!==prop)
        }
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

function addNewPropToComponent(reactComponent, newProp) {
    const j = jscodeshift;
    const filePath = reactComponent.filepath;
    const ast = reactComponent.ast;

    let updatedAst = ast;
    updatedAst.find(j.FunctionDeclaration).forEach(path => {
        if (path.node.id.name === reactComponent.name) {
            console.log('here-1');
            reactComponent.addNewProperty(newProp);
            console.log('here0');
            if (path.node.params.length === 0) {
                const newPropNode = j.property('init', j.identifier(newProp.split('=')[0]), j.identifier(newProp.split('=')[1]));
                const objectPattern = j.objectPattern([newPropNode]);
                path.node.params.push(objectPattern);
                console.log('here1');
            } else {
                path.node.params.forEach(param => {
                    if (param.type === 'ObjectPattern') {
                        const newPropNode = j.property('init', j.identifier(newProp.split('=')[0]), j.identifier(newProp.split('=')[1]));
                        param.properties.push(newPropNode);
                        console.log('here2');
                    }
                });
            }
        }
    });

    const updatedCode = updatedAst.toSource();
    fs.writeFileSync(filePath, updatedCode, 'utf8');
}

function removeExistingPropFromComponent(reactComponent, prop){
    const j = jscodeshift;
    const filePath = reactComponent.filepath;
    const ast = reactComponent.ast;

    let updatedAst = ast;
    updatedAst.find(j.FunctionDeclaration).forEach(path => {
        path.node.params.forEach(param => {
            if (param.type === 'ObjectPattern') {
                console.log(param.properties[0].key);
                console.log(prop);
                param.properties = param.properties.filter(property => {
                    return !(property.key && property.key.name === prop);
                });
                
            }
        });
    });
    //reactComponent.removeProperty(prop);
    const updatedCode = updatedAst.toSource();
    fs.writeFileSync(filePath, updatedCode, 'utf8');
}
export {ReactComponent, loadReactComponents, addParents,addNewPropToComponent,removeExistingPropFromComponent};

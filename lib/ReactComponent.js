import * as fs from 'fs';
import path from 'path';
import jscodeshift from 'jscodeshift';
import { ImportManager } from './ImportManager.js';
import { ImportSpecifier } from './ImportStatement.js';
import { projectPath } from '../index.js';

class ReactComponent {
    constructor(name, properties, returnedElements,parentElements, componentType='Function',reactFile,isInRootFile=false
        ,useStateDeclarations=[],aliases=undefined){
        this.name = name;
        this.properties = properties;
        this.returnedElements = returnedElements;
        this.parentElements = parentElements;
        this.useStateDeclarations = useStateDeclarations;
        this.componentType = componentType;
        this.isChanged = false;
        this.isInRootFile = isInRootFile;
        this.aliases = aliases;
        this.reactFile = reactFile;
    }

    loadFileAndAst(){
        const j = jscodeshift;
        const filePath = this.reactFile.filePath;
        const ast = this.reactFile.ast;
        return {j,filePath,ast};
    }
    addNewProperty(newProp){
        if(!this.properties.includes(newProp)){
            this.properties.push(newProp);
            this.isChanged = true;
        }else{
            console.log("Property already exists. Maybe pick a new name for the prop.")
            return;}
        const {j,ast} = this.loadFileAndAst();
    
        ast.find(j.FunctionDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                if (path.node.params.length === 0) {
                    // If no parameters exist, create an ObjectPattern for the new prop
                    const newPropNode = j.property('init', j.identifier(newProp), j.identifier(newProp));
                    const objectPattern = j.objectPattern([newPropNode]);
                    path.node.params.push(objectPattern);
                } else {
                    const firstParam = path.node.params[0];
                    if (firstParam.type === 'Identifier') {
                        // If it's a single identifier (e.g., props), replace it with an object pattern
                        const newPropNode = j.property('init', j.identifier(newProp), j.identifier(newProp));
                        const objectPattern = j.objectPattern([
                            newPropNode,
                            j.restElement(j.identifier(firstParam.name)) // Keep the original props as ...props
                        ]);
                        path.node.params[0] = objectPattern;
                    } else if (firstParam.type === 'ObjectPattern') {
                        // If it’s already an ObjectPattern, add the newProp
                        const newPropNode = j.property('init', j.identifier(newProp), j.identifier(newProp));
                        firstParam.properties.push(newPropNode);
                    }
                }
            }
        });
        ast.find(j.ClassDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                let renderMethod = path.node.body.body.find(method =>
                    method.type === 'MethodDefinition' &&
                    method.key.name === 'render'
                );
                if (renderMethod) {
                    const newStatement = j.variableDeclaration('const', [
                        j.variableDeclarator(
                            j.objectPattern([j.property('init', j.identifier(newProp), j.identifier(newProp))]),
                            j.memberExpression(j.thisExpression(), j.identifier('props'))
                        )
                    ]);    
                    renderMethod.value.body.body.unshift(newStatement);
                }}
        });
        ast.find(j.VariableDeclaration).forEach(path => {
            path.node.declarations.forEach(declaration => {
                if (declaration.init && declaration.init.type === 'ArrowFunctionExpression' && declaration.id.name===this.name) {
                    const arrowFunctionBody = declaration.init.body;
                    if (arrowFunctionBody.type === 'BlockStatement') {
                        if (declaration.init.params.length === 0) {
                            const newPropNode = j.property('init', j.identifier(newProp), j.identifier(newProp));
                            const objectPattern = j.objectPattern([newPropNode]);
                            declaration.init.params.push(objectPattern);
                        } else {
                            declaration.init.params.forEach(param => {
                                if (param.type === 'ObjectPattern') {
                                    const newPropNode = j.property('init', j.identifier(newProp), j.identifier(newProp));
                                    param.properties.push(newPropNode);
                                }
                            });
                        }
                    }
                }
            });
        });
    }

    removeProperty(prop){
        let deleted = false;
        if(this.properties.includes(prop+`=${prop}`)){
            this.properties = this.properties.filter(pr => pr!==(prop+`=${prop}`))
            deleted = true;
            this.isChanged = true;
        }
        if(!deleted){
            console.log(`The Property ${prop} doesn't exist `);
            return;
        }
        const {j,ast} = this.loadFileAndAst();
        ast.find(j.FunctionDeclaration).forEach(path => {
            path.node.params.forEach(param => {
                if (param.type === 'ObjectPattern') {
                    param.properties = param.properties.filter(property => {
                        return !(property.key && property.key.name === prop);
                    });
                    
                }
            });
        });
        ast.find(j.ClassDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                let renderMethod = path.node.body.body.find(method =>
                    method.type === 'MethodDefinition' &&
                    method.key.name === 'render'
                );
                if (renderMethod) {
                    renderMethod.value.body.body.forEach(node => {
                        if (node.type === 'VariableDeclaration') {
                            node.declarations.forEach(declaration => {
                                if (declaration.init && declaration.init.type === 'MemberExpression' &&
                                    declaration.init.object.type === 'ThisExpression' && declaration.init.property.name === 'props') {
                                        if (declaration.id.type === 'ObjectPattern') {
                                        declaration.id.properties = declaration.id.properties.filter(property => {
                                            return !(property.key && property.key.name === prop);
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            }
        });
        ast.find(j.VariableDeclaration).forEach(path => {
            path.node.declarations.forEach(declaration => {
                if (declaration.init && declaration.init.type === 'ArrowFunctionExpression'
                    && declaration.id.name===this.name) {    
                    declaration.init.params.forEach(param => {
                        if (param.type === 'ObjectPattern') {
                            param.properties = param.properties.filter(property => {
                                return !(property.key && property.key.name === prop);
                            });
                        }
                    });                   
                }
            });
        });
    }
    
    addNewUseStateDeclaration(variableDec) {
        if(this.componentType === 'Class'){
            throw new Error('Cannot use useState Hook in Class Components. Aborting...');
        }
        if (!this.useStateDeclarations.includes(variableDec)) {
            this.useStateDeclarations.push(variableDec);
            this.isChanged = true;
        }
        const { variableName, setVariableMethod, initialValue } = variableDec;
        const importSpecifiers = [];
        importSpecifiers.push(new ImportSpecifier("useState","useState"));
        this.addAnImportStatement('react', importSpecifiers);
        const {j,ast} = this.loadFileAndAst();
        ast.find(j.FunctionDeclaration).forEach(path => {
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
        ast.find(j.VariableDeclaration).forEach(path => {
            path.node.declarations.forEach(declaration => {
                if(declaration.init.type === 'ArrowFunctionExpression' && declaration.id.name === this.name){
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
                    declaration.init.body.body.unshift(useStateCall);
                }
            })
        });
    }
    
    removeUseStateDeclaration(variableName){
        if(this.componentType === 'Class'){
            throw new Error('Cannot have useState Hook in Class Components. Aborting...');
        }
        let deleted = false;
        this.useStateDeclarations.forEach(el => {
            if(el.variableName === variableName){
                this.useStateDeclarations = this.useStateDeclarations.filter(el => el.variableName !== variableName);
                deleted = true;
                this.isChanged = true;
            }
        })
        if(!deleted){
            console.log("Use State Declaration doesn't exist");
            return;
        }
        const {j,ast} = this.loadFileAndAst();
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
        ast.find(j.VariableDeclaration).forEach(path => {
            path.node.declarations.forEach(declaration => {
                if (j.ArrowFunctionExpression.check(declaration.init) && declaration.id.name === this.name) {
                    const body = declaration.init.body;
                    if (j.BlockStatement.check(body)) {
                        body.body = body.body.filter(node => {
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
                }
            });
        });
        }
    
    addNewPropToReturnElement(variableName,componentName,variableValue=variableName){
        if(!this.returnedElements.includes(componentName)){
            console.log(`Given componentName:${componentName} not included in the return elements.`)
            return;
        }

        const {j,ast} = this.loadFileAndAst();
        
        this.isChanged = true;
        ast.find(j.ReturnStatement).forEach(path => {
            j(path).find(j.JSXElement).forEach(elementPath => {
                if(elementPath.node.openingElement.name.name === componentName){
                    const attributes = elementPath.node.openingElement.attributes;

                    if(!attributes.some(attr => attr.name && attr.name.name === variableName)){
                        attributes.push(
                            j.jsxAttribute(
                                j.jsxIdentifier(variableName),
                                j.jsxExpressionContainer(j.identifier(variableValue))
                            )
                        );
                    }
                }
            });
        });
    }

    removePropFromReturnElement(variableName,componentName,reactComponents){
        let returnedElementName = componentName;
        let isAliased = false;
        if(!this.returnedElements.includes(componentName)){
            const nextComponentName = reactComponents.find(comp => comp.aliases && comp.aliases.original===componentName);
            if(nextComponentName){
                for(let i=0; i<nextComponentName.aliases.filepaths.length; i++){
                    const normalizedTargetPath = path.resolve(nextComponentName.aliases.filepaths[i]);
                    const isSourceContainedInFile = this.reactFile.importDeclarations.some(importStatement => {
                        const resolvedSourcePath = path.resolve(
                            path.dirname(importStatement.filePath),
                            importStatement.source
                        );
                        return resolvedSourcePath===normalizedTargetPath;
                    });
                    if(nextComponentName.aliases.filepaths[i]===this.reactFile.filePath){
                        returnedElementName = nextComponentName.aliases.aliases[i];
                        isAliased = true;
                    } else if(isSourceContainedInFile){
                        returnedElementName = nextComponentName.aliases.aliases[i];
                        isAliased = true;
                    }
               }
            } else {
                console.log("Given componentName not included in the return elements.")
                return;
            }
        }
        const {j,ast} = this.loadFileAndAst();
        ast.find(j.ReturnStatement).forEach(path => {
            j(path).find(j.JSXElement).forEach(elementPath => {
               if(elementPath.node.openingElement.name.name === returnedElementName){
                 const attributes = elementPath.node.openingElement.attributes;
                 const filtAttributes = attributes.filter(el => (el.name && el.name.name !== variableName));
                 this.isChanged = true;
                 elementPath.node.openingElement.attributes = filtAttributes;
               }
            });
        });
        ast.find(j.VariableDeclarator).forEach(path => {
            if(path.value.init && path.value.init.type==='ArrowFunctionExpression'){
                const bodyPath = path.value.init.body;
                if(bodyPath && bodyPath.type==='JSXElement'){
                    bodyPath.children.forEach(childNode => {
                        if(childNode.type==='JSXExpressionContainer' &&
                            childNode.expression && childNode.expression.type==='CallExpression'){
                                childNode.expression.arguments.forEach(arg => {
                                    if(arg.type==='ArrowFunctionExpression'){
                                        arg.body.children.forEach(c => {
                                            if(c.type==='JSXExpressionContainer' 
                                                && c.expression 
                                                && c.expression.consequent && c.expression.consequent.openingElement){
                                                    const attributes = c.expression.consequent.openingElement.attributes;
                                                    const filtAttributes = attributes.filter(el => (el.name.name !== variableName));
                                                    this.isChanged = true;
                                                    c.expression.consequent.openingElement.attributes = filtAttributes;
                                                }
                                        })
                                    }
                                })
                            }
                    })
                }
            }
           
        });
        return isAliased;
    }

    getChildPropValues(reactComponents) {
        const props = {};
        const processedNodes = new Set(); // Set to track processed nodes to avoid duplicates
        const { j } = this.loadFileAndAst();
    
        const returnElements = this.returnedElements.filter(el =>
            reactComponents.some(component => component.name === el ||
                (component.aliases && component.aliases.aliases.includes(el)))
        );
    
        returnElements.forEach(childName => {
            const childNodes = this.reactFile.ast.find(j.JSXElement).filter(path => {
                const isJSXElementMatch = path.node.openingElement.name.name === childName;
                const isPropMatch1 = path.node.openingElement.attributes.some(attr =>
                    attr.type === 'JSXAttribute' &&
                    attr.name.name === 'component' &&
                    attr.value &&
                    attr.value.expression &&
                    attr.value.expression.property &&
                    attr.value.expression.property.name === childName
                );
                const isPropMatch2 = path.node.openingElement.attributes.some(attr =>
                    attr.type === 'JSXAttribute' &&
                    attr.name.name === 'component' &&
                    attr.value &&
                    attr.value.expression &&
                    attr.value.expression.name === childName
                );
    
                return (isJSXElementMatch || isPropMatch1 || isPropMatch2) && !processedNodes.has(path.node);
            });
    
            childNodes.forEach(child => {
                processedNodes.add(child.node);
                const childComponent = reactComponents.find(comp =>
                    comp.name === childName || (comp.aliases && comp.aliases.aliases.includes(childName))
                );
    
                if (childComponent) {
                    props[childComponent.name] = props[childComponent.name] || [];
                    child.node.openingElement.attributes.forEach(attr => {
                        if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
                            const propName = attr.name.name;
                            let propValue = null;
                            if (attr.value && attr.value.type === 'JSXExpressionContainer') {
                                const expr = attr.value.expression;
    
                                if (expr.type === 'MemberExpression') {
                                    if (
                                        expr.object.type === 'MemberExpression' &&
                                        expr.object.object.type === 'ThisExpression' &&
                                        expr.object.property.name === 'props'
                                    ) {
                                        propValue = expr.property.name;
                                    } else if (expr.object.type === 'Identifier' && expr.object.name === 'props') {
                                        propValue = expr.property.name;
                                    } else {
                                        propValue = expr.property.name;
                                    }
                                } else {
                                    propValue = expr.name || expr.value;
                                }
                            } else if (attr.value && attr.value.type === 'Literal') {
                                propValue = attr.value.value;
                            }
    
                            if (propValue !== null) {
                                props[childComponent.name].push({ [propName]: propValue });
                            }
                        }
                    });
                }
            });
        });
    
        return props;
    }
    
    
    checkIfPropIsUsedOutsideJSXProps(prop, nextComponentName) {
    const { j, ast } = this.loadFileAndAst();
    let isUsedOutsideJSXProps = false;
    let componentBody;
    if (this.componentType === 'Function') {
        const functionDeclaration = ast.find(j.FunctionDeclaration, {
            id: { name: this.name }
        });
        componentBody = functionDeclaration.length ? functionDeclaration.get().node.body : null;
    } else if (this.componentType === 'ArrowFunction') {
        const arrowFunctionDeclaration = ast.find(j.VariableDeclarator, {
            id: { name: this.name },
            init: { type: 'ArrowFunctionExpression' }
        });
        componentBody = arrowFunctionDeclaration.length ? arrowFunctionDeclaration.get().node.init.body : null;
    } else if (this.componentType === 'Class') {
        const classDeclaration = ast.find(j.ClassDeclaration, {
            id: { name: this.name }
        });
        
        if (classDeclaration.length) {
            const renderMethod = classDeclaration.find(j.MethodDefinition, {
                key: { name: 'render' }
            });
            componentBody = renderMethod.length ? renderMethod.get().node.body : null;
        }
    }
    if (!componentBody) {
        return false;
    }
    
    j(componentBody).find(j.Identifier, { name: prop }).forEach(path => {
        const parentNode = path.parent.node;
        if (parentNode.type === 'Property' && parentNode.value && parentNode.value.name === prop) {
            return;
        }

        if (
            parentNode.type === 'JSXAttribute' &&
            path.parent.parent.node.name &&
            path.parent.parent.node.name.name === nextComponentName &&
            path.node.name === prop
        ) {
            return;
        }
        if (
            parentNode.type === 'JSXExpressionContainer' &&
            path.node.type === 'Identifier' &&
            path.node.name === prop &&
            path.parent.parent.node.type === 'JSXAttribute'
        ) {
            return ;
        }
        if (
            parentNode.type === 'MemberExpression' &&
            parentNode.property === path.node &&
            parentNode.object.name === "props" &&
            parentNode.property.name === prop &&
            path.parent.parent.parent.parent.node.name &&
            path.parent.parent.parent.parent.node.name.name === nextComponentName
        ) {
            return;
        }

        isUsedOutsideJSXProps = true;
        return false;
    });
    return isUsedOutsideJSXProps;
    }
  
    wrapReturnElementsWithProvider(properties,capitalizedProps,returnPropsMap) {
        const { j, ast } = this.loadFileAndAst();

        // Helper method that wraps return JSX with the Provider
        const wrapReturnWithProvider = (path) => {
            const returnArgument = path.node.argument;
            if(!returnArgument) return;
            if(returnArgument.type !== 'JSXElement' &&
                (!returnArgument.argument || returnArgument.argument.type !== 'JSXElement')
            ){
                return;
            }

            let jsxAttributes = [];
            properties.forEach(prop => {
                const propValueNode = returnPropsMap.get(Object.keys(prop)[0]);
                if (propValueNode) {
                    if (propValueNode.type==='Identifier') {
                        // Literal strings are used as-is
                        const attr = j.jsxAttribute(
                            j.jsxIdentifier(Object.keys(prop)[0]),
                            j.jsxExpressionContainer(propValueNode)
                        );
                        jsxAttributes.push(attr);
                    } else {
                        // Generate source code from the AST node\
                        const attr = j.jsxAttribute(
                            j.jsxIdentifier(Object.keys(prop)[0]),
                            j.jsxExpressionContainer(propValueNode)
                        );
                        jsxAttributes.push(attr);
                    }
                }
            })
            // Wrap the return argument with the Provider
            const wrappedElement = j.jsxElement(
                j.jsxOpeningElement(j.jsxIdentifier(`${capitalizedProps}Provider`), jsxAttributes),
                j.jsxClosingElement(j.jsxIdentifier(`${capitalizedProps}Provider`)),
                [returnArgument]
            );

            path.node.argument = wrappedElement;
        }
        
        if(this.componentType==='Function' || this.componentType==='ArrowFunction'){
            //Handle Function Components case
            const functionComponentNode = ast.find(j.FunctionDeclaration, {
                id: { name: this.name },
            }).nodes()[0] || ast.find(j.VariableDeclarator, {
                id: { name: this.name, type: 'Identifier' },
            }).nodes()[0];
        
            if (functionComponentNode) {
                j(functionComponentNode)
                .find(j.ReturnStatement)
                .forEach(wrapReturnWithProvider);
            }
        } else if(this.componentType==='Class') {
            //Handle Class Components case
            const classComponentNode = ast.find(j.ClassDeclaration, {
                id: { name: this.name },
            }).nodes()[0];
            if(classComponentNode){
                j(classComponentNode).find(j.MethodDefinition,{ key: {name: 'render'}})
                    .find(j.ReturnStatement).forEach(wrapReturnWithProvider);
            }
        } else {return;}

        // Step 3: Add import statement for the Provider
        const currentDir = path.dirname(this.reactFile.filePath);
        const projectDir = path.resolve(projectPath);
        let relativePath = path.relative(currentDir, path.join(projectDir, `${capitalizedProps}Context.js`));
        relativePath = relativePath.replace(/\\/g, '/');
        const importSpecifiers = [];
        importSpecifiers.push(new ImportSpecifier(`${capitalizedProps}Provider`, `${capitalizedProps}Provider`));
        this.addAnImportStatement(relativePath, importSpecifiers);
        this.isChanged = true;
    }
    
    addValueContextUsage(properties,propMapping,propIndex,capitalizedProps) {
        const { j, ast } = this.loadFileAndAst();
        //Import useContext for Function Components
        if(this.componentType === 'Function' || this.componentType === 'ArrowFunction'){
            const importSpecifiers = [];
            importSpecifiers.push(new ImportSpecifier(`useContext`,`useContext`));
            this.addAnImportStatement('react', importSpecifiers);
        }
        
        let counter = 0; //Counts the number of useContextLine insertions, to avoid duplicate declaration of useContext;
        properties.forEach(property => {
            //Import the created context
            const importSpecifiers = [];
            const currentDir = path.dirname(this.reactFile.filePath);
            const projectDir = path.resolve(projectPath);
            let relativePath = path.relative(currentDir, path.join(projectDir, `${capitalizedProps}Context.js`));
            relativePath = relativePath.replace(/\\/g, '/');
            importSpecifiers.push(new ImportSpecifier(`${capitalizedProps}Context`,`${capitalizedProps}Context`));
            this.addAnImportStatement(relativePath, importSpecifiers);
                
            //Construct useContext line
            const useContextLine = j.variableDeclaration('const', [
                j.variableDeclarator(
                    j.identifier(`${capitalizedProps}Props`),
                    j.callExpression(j.identifier('useContext'), [j.identifier(`${capitalizedProps}Context`)])
                )
            ]);
            counter++;

            
            //Resolve the correct variable name that should be used based on variable renamings
            let propUsed;
            for(const key in propMapping){
                if(propMapping[key].includes(Object.values(property)[0])){
                    if(propIndex>=propMapping[key].length){
                        propUsed=propMapping[key][propMapping[key].length-1];
                    } else{
                        propUsed=propMapping[key][propIndex];
                    }
                    break;
                }
            }
            //Construct 'use prop with Context' line
            const propLine = j.variableDeclaration('const', [
                j.variableDeclarator(
                    j.identifier(propUsed),
                    j.memberExpression(j.identifier(`${capitalizedProps}Props`), j.identifier(Object.keys(property)[0]))
                )
            ]);
            if (this.componentType === 'Function' || this.componentType === 'ArrowFunction') {
                //Function Component Context approach
                this.insertUseContextPropLine(propLine,capitalizedProps)
                if (counter === properties.length) {
                    this.insertUseContextLine(useContextLine);
                }
            } else if (this.componentType === 'Class') {
                //Class Component Context approach
                this.insertClassContextLine(property,propMapping,propIndex);
                // Add static contextType property
                if(counter === properties.length){
                    ast.find(j.ClassDeclaration).forEach(path => {
                        if (path.node.id.name === this.name){
                            this.insertClassContextTypeProperty(path,capitalizedProps,j);
                        }
                    });
                }
            }
        });
    
        this.isChanged = true;
        this.reactFile.ast = ast;
    }

    //Inserts Class Context approach
    insertClassContextLine(property,propMapping,propIndex) {
        const { j, ast } = this.loadFileAndAst();
    
        ast.find(j.ClassDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                // Locate the render method
                path.node.body.body.forEach(classBodyElement => {
                    if (
                        classBodyElement.type === 'MethodDefinition' &&
                        classBodyElement.key.name === 'render'
                    ) {
                        if (classBodyElement.value.body.type === 'BlockStatement') {
                            // Step 1: Remove `const ... = this.props.<name>`
                            classBodyElement.value.body.body = classBodyElement.value.body.body.filter(statement => {
                                if (statement.type === 'VariableDeclaration') {
                                    return !statement.declarations.some(declaration =>
                                        declaration.init &&
                                        declaration.init.type === 'MemberExpression' &&
                                        declaration.init.object.type === 'MemberExpression' &&
                                        declaration.init.object.object.type === 'ThisExpression' &&
                                        declaration.init.object.property.name === 'props' &&
                                        declaration.init.property.name === Object.keys(property)[0]
                                    );
                                }
                                return true;
                            });
    
                            // Step 2: Replace `this.props.<name>` with `<name>` in normal code and JSX
                            let propertyName;
                            if(propIndex>=propMapping[Object.keys(property)[0]].length){
                                propertyName=propMapping[Object.keys(property)[0]][propMapping[Object.keys(property)[0]].length-1];
                            } else{
                                propertyName=propMapping[Object.keys(property)[0]][propIndex];
                            }
                            j(classBodyElement.value.body).find(j.MemberExpression, {
                                object: {
                                    type: 'MemberExpression',
                                    object: { type: 'ThisExpression' },
                                    property: { name: 'props' }
                                },
                                property: { name: propertyName }
                            }).replaceWith(j.identifier(propertyName));
    
                            // Step 3: Add destructuring of context at the beginning of render()
                            const contextDestructuring = j.variableDeclaration('const', [
                                j.variableDeclarator(
                                    j.objectPattern([
                                        j.property(
                                            'init',
                                            j.identifier(propertyName),
                                            j.identifier(propertyName)
                                        )
                                    ]),
                                    j.memberExpression(j.thisExpression(), j.identifier('context'))
                                )
                            ]);
                            classBodyElement.value.body.body.unshift(contextDestructuring);
    
                            // Step 4: Traverse the `return` statement and replace `this.props.<name>` in JSX
                            j(classBodyElement.value.body).find(j.ReturnStatement).forEach(returnPath => {
                                j(returnPath).find(j.MemberExpression, {
                                    object: {
                                        type: 'MemberExpression',
                                        object: { type: 'ThisExpression' },
                                        property: { name: 'props' }
                                    },
                                    property: { name: propertyName }
                                }).replaceWith(j.identifier(propertyName));
                            });
                        }
                    }
                });
            }
        });
    }

    insertClassContextTypeProperty(path,capitalizedProps,j){
        const contextTypeProperty = j.classProperty(
            j.identifier('contextType'),
            j.identifier(`${capitalizedProps}Context`),
            null,
            true
        );
        path.node.body.body.unshift(contextTypeProperty);
    }
    //Inserts useContext hook
    insertUseContextLine(useContextLine){
        const {j,ast} = this.loadFileAndAst();

        //Helper function to insert the useContextLine into function body
        const insertIntoBody = (functionPath) => {
            const body = functionPath.value.body;
            if(body.type === 'BlockStatement'){
                // If it's already a BlockStatement, insert the useContextLine at the top
                body.body.unshift(useContextLine);
            } else {
                //  If it's an implicit return, transform it into a BlockStatement
                functionPath.value.body = j.blockStatement([useContextLine, j.returnStatement(body)]);
            }
        }
        ast.find(j.ArrowFunctionExpression).filter(path => {
            const variableDeclarator = path.parentPath.value;
            return(variableDeclarator.type==='VariableDeclarator' && variableDeclarator.id.name===this.name);
        }).forEach(insertIntoBody);

        ast.find(j.FunctionDeclaration, {
            id: { name: this.name}
        }).forEach(insertIntoBody)
    }

    //Inserts line : const 'variable' = ContextPros.variable
    insertUseContextPropLine(propLine,capitalizedProps){
       const {j,ast} = this.loadFileAndAst();
       let alreadyInserted = false;

       const insertIntoBody = (functionPath) => {
        const body = functionPath.value.body;
        if(body.type === 'BlockStatement'){
            // If it's already a BlockStatement, insert the useContext PropLine at the top
            // Replace 'props.property' with 'NumProps.property'
            j(body).find(j.MemberExpression).forEach(memberExprPath => {
                const memberExpr = memberExprPath.value;
                if(memberExpr.object.type === 'Identifier' && memberExpr.object.name === 'props'){
                    memberExpr.object.name = `${capitalizedProps}Props`;
                    alreadyInserted = true;
                }
            });
            //Insert the propLine if not already present
            if(!alreadyInserted){
              body.body.unshift(propLine);
            }
        } else {
            // If it's an implicit return, transform it into a BlockStatement
            const newBody = [propLine, j.returnStatement(body)];
            functionPath.value.body = j.blockStatement(newBody)
        }
       }
       ast.find(j.ArrowFunctionExpression).filter(path => {
        const variableDeclarator = path.parentPath.value;
        return(variableDeclarator.type==='VariableDeclarator' && variableDeclarator.id.name===this.name);
       }).forEach(insertIntoBody);

       ast.find(j.FunctionDeclaration, {
            id: { name: this.name}
       }).forEach(insertIntoBody)
    }
    
    //Returns the Composed JSX
    insertComposition(propDrillingPath) {                  
        const { j } = this.loadFileAndAst();
        const path = propDrillingPath.slice(1);
        const composeJSX = (components) => {
            if(components.length===1){
                return j.jsxElement(
                    j.jsxOpeningElement(j.jsxIdentifier(components[0]), []),
                    j.jsxClosingElement(j.jsxIdentifier(components[0])),
                    [],
                    false
                );
            }
            const [CurrenComponent,...remainingComponents] = components;
            const currentJSXElement = j.jsxElement(
                j.jsxOpeningElement(j.jsxIdentifier(CurrenComponent), []),
                j.jsxClosingElement(j.jsxIdentifier(CurrenComponent)),
                [composeJSX(remainingComponents)],
                false
            );
            return currentJSXElement;
        }  
        const composedJSX = composeJSX(path);
        return composedJSX;
    }

    createReturnPropsMap(componentName) {
        const propsMap = new Map();
        const {j,ast} = this.loadFileAndAst();
        ast.find(j.JSXOpeningElement).filter(path => {
            return (
                path.node.name &&
                path.node.name.type === 'JSXIdentifier' &&
                path.node.name.name === componentName
            );
        }).forEach(path => {
            path.node.attributes.forEach(attribute => {
                if (attribute.type === 'JSXAttribute' && attribute.name.type === 'JSXIdentifier') {
                    const propName = attribute.name.name;
                    let resolvedValue = null;
    
                    if (attribute.value) {
                        if (attribute.value.type === 'JSXExpressionContainer') {
                            // For expressions like {this.state.user}
                            resolvedValue = attribute.value.expression;
                        } else if (attribute.value.type === 'Literal') {
                            // For literal values like "string"
                            resolvedValue = attribute.value.value;
                        }
                    }
                    propsMap.set(propName, resolvedValue);
                }
            });
    
            propsMap.set('node', path.node);
        });
    
        return propsMap;
    }

    
    addAnImportStatement(source, imported, importAsDefault=false) {
        const {j} = this.loadFileAndAst();
        const importManager = new ImportManager(j,this.reactFile);
        importManager.addImport(source, imported,this.reactFile.filePath,importAsDefault);
        this.isChanged = importManager.isChanged;
    }

    writeChanges() {
        if (this.isChanged) {
            const updatedCode = this.reactFile.ast.toSource();
            fs.writeFileSync(this.reactFile.filePath, updatedCode, 'utf8');
            this.hasChanges = false; 
        }
    }
}
export {ReactComponent};
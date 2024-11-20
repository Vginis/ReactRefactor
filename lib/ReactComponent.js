import * as fs from 'fs';
import path from 'path';
import jscodeshift from 'jscodeshift';
import { ImportManager } from './ImportManager.js';
import { ImportSpecifier } from './ImportStatement.js';

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
                if (declaration.init && declaration.init.type === 'ArrowFunctionExpression') {
                    const arrowFunctionBody = declaration.init.body;
    
                    if (arrowFunctionBody.type === 'BlockStatement') {
                        declaration.init.params.forEach(param => {
                            if (param.type === 'ObjectPattern') {
                                param.properties = param.properties.filter(property => {
                                    return !(property.key && property.key.name === prop);
                                });
                            }
                        });
                    }
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
            console.log("Given componentName not included in the return elements.")
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
                    if(nextComponentName.aliases.filepaths[i]===this.reactFile.filePath){
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
                 const filtAttributes = attributes.filter(el => (el.name.name !== variableName));
                 this.isChanged = true;
                 elementPath.node.openingElement.attributes = filtAttributes;
               }
            });
        });
        return isAliased;
    }

    getChildPropValues(reactComponents) {
        const props = {};
        const { j } = this.loadFileAndAst();
    
        const returnElements = this.returnedElements.filter(el =>
            reactComponents.some(component => component.name === el ||
                (component.aliases && component.aliases.aliases.includes(el)))
        );
        returnElements.forEach(childName => {          
            const child = this.reactFile.ast.find(j.JSXElement).filter(path => {
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
                    attr.value.expression &&
                    attr.value.expression.name === childName
                );
                return isJSXElementMatch || isPropMatch1 || isPropMatch2;
            }).get(0);
    
            const childComponent = reactComponents.find(comp => comp.name === childName || (comp.aliases && comp.aliases.aliases.includes(childName)));
    
            if (child) {
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
                                } else if(expr.object.type==='Identifier' && expr.object.name==='props'){
                                    propValue = expr.property.name
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
        isUsedOutsideJSXProps = true;
        return false;
    });
    return isUsedOutsideJSXProps;
    }
  
    wrapReturnElementsWithProvider(properties,destPath) {
        const { j, ast } = this.loadFileAndAst();
        const prop1 = properties.map(prop => Object.keys(prop)[0].charAt(0).toUpperCase() + Object.keys(prop)[0].slice(1)).join('');
        
        ast.find(j.ReturnStatement).forEach(path => {
            const returnArgument = path.node.argument;
            const jsxAttributes = properties.map(property =>
                j.jsxAttribute(
                    j.jsxIdentifier(Object.keys(property)[0]),
                    j.jsxExpressionContainer(j.identifier(Object.keys(property)[0]))
                )
            );
            const wrappedElement = j.jsxElement(
                j.jsxOpeningElement(j.jsxIdentifier(`${prop1}Provider`), jsxAttributes),
                j.jsxClosingElement(j.jsxIdentifier(`${prop1}Provider`)),
                [returnArgument]
            );
            path.node.argument = wrappedElement;
        });
        
        const destDirectory = path.dirname(destPath);
        const destDirArray = destDirectory.split(path.sep);
        const sourceDirArray = path.dirname(this.reactFile.filePath).split(path.sep);

        let i = 0;
        while (i < destDirArray.length && i < sourceDirArray.length && destDirArray[i] === sourceDirArray[i]) {
            i++;
        }
        const importSpecifiers = [];
        importSpecifiers.push(new ImportSpecifier(`${prop1}Provider`,`${prop1}Provider`));
        this.addAnImportStatement(`./${destDirArray.slice(i).join(path.sep)}/${prop1}Context.js`, importSpecifiers);
        this.isChanged = true;
    }
    
    addValueContextUsage(properties,propMapping) {
        const { j, ast } = this.loadFileAndAst();
        const prop1 = properties.map(prop => Object.keys(prop)[0].charAt(0).toUpperCase() + Object.keys(prop)[0].slice(1)).join('');
        if(this.componentType === 'Function' || this.componentType === 'ArrowFunction'){
            const importSpecifiers = [];
            importSpecifiers.push(new ImportSpecifier(`useContext`,`useContext`));
            this.addAnImportStatement('react', importSpecifiers);
        }
        
        properties.forEach(property => {
            const importSpecifiers = [];
            importSpecifiers.push(new ImportSpecifier(`${prop1}Context`,`${prop1}Context`));
            this.addAnImportStatement(`./${prop1}Context.js`, importSpecifiers);
    
            let usedProperty = Object.keys(property)[0];
            for (let [key, value] of propMapping.entries()) {
                if (value === Object.keys(property)[0]) {
                    if(key!==value){
                        const constDeclaration = j.variableDeclaration('const', [
                            j.variableDeclarator(
                                j.identifier(key),
                                j.identifier(value)
                            )
                        ]);
            
                        ast.find(j.FunctionDeclaration).forEach(path => {
                            if (path.node.id.name === this.name) {
                                path.get('body', 'body').unshift(constDeclaration);
                            }
                        });
            
                        ast.find(j.VariableDeclaration).forEach(path => {
                            path.node.declarations.forEach(declaration => {
                                if (declaration.init.type === 'ArrowFunctionExpression' && declaration.id.name === this.name) {
                                    declaration.init.body.body.unshift(constDeclaration);
                                }
                            });
                        });
                    }
                    
                }
            }
            
            const useContextLine = j.variableDeclaration('const', [
                j.variableDeclarator(
                    j.identifier(usedProperty),
                    j.callExpression(j.identifier('useContext'), [j.identifier(`${prop1}Context`)])
                )
            ]);
    
            ast.find(j.FunctionDeclaration).forEach(path => {
                if (path.node.id.name === this.name) {
                    path.get('body', 'body').unshift(useContextLine);
                }
            });
    
            ast.find(j.VariableDeclaration).forEach(path => {
                path.node.declarations.forEach(declaration => {
                    if (declaration.init.type === 'ArrowFunctionExpression' && declaration.id.name === this.name) {
                        declaration.init.body.body.unshift(useContextLine);
                    }
                });
            });
    
            const wrapWithContextConsumer = (returnArgument, prop1) => {
                return j.returnStatement(
                    j.jsxElement(
                        j.jsxOpeningElement(j.jsxIdentifier(`${prop1}Context.Consumer`), []),
                        j.jsxClosingElement(j.jsxIdentifier(`${prop1}Context.Consumer`)),
                        [
                            j.jsxExpressionContainer(
                                j.arrowFunctionExpression(
                                    [j.identifier(Object.keys(property)[0])],
                                    j.blockStatement([j.returnStatement(returnArgument)])
                                )
                            )
                        ]
                    )
                );
            };
    
            ast.find(j.ClassDeclaration).forEach(classPath => {
                const className = classPath.node.id.name;
                if (className === this.name) {
                    classPath.node.body.body.forEach(classElement => {
                        if (classElement.type === 'MethodDefinition' && classElement.key.name === 'render') {
                            const functionBody = classElement.value.body.body;
                            functionBody.forEach((bodyElement, index) => {
                                if (bodyElement.type === 'ReturnStatement') {
                                    const jsxContent = bodyElement.argument;
                                    const wrappedReturn = wrapWithContextConsumer(jsxContent, prop1);
                                    functionBody[index] = wrappedReturn;
                                }
                            });
                        }
                    });
                }
            });
        });
    
        this.isChanged = true;
        this.reactFile.ast = ast;
    }
    
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

    addAnImportStatement(source, imported) {
        const {j} = this.loadFileAndAst();
        const importManager = new ImportManager(j,this.reactFile);
        importManager.addImport(source, imported);
        this.isChanged = importManager.isChanged;
    }
    
    extractPropsForComponent(componentName) {
        const propsMap = {};
        const {ast,j} = this.loadFileAndAst();
        ast.find(j.JSXElement).forEach(path => {
            const elementName = path.node.openingElement.name.name;
            
            if (elementName === componentName) {
                path.node.openingElement.attributes.forEach(attr => {
                    if (attr.type === 'JSXAttribute' && attr.name && attr.name.name) {
                        const propName = attr.name.name;
                        
                        if (attr.value && attr.value.type === 'JSXExpressionContainer') {
                            if (attr.value.expression.type === 'Identifier') {
                                propsMap[propName] = attr.value.expression.name;
                            }
                        } else if (attr.value && attr.value.type === 'Literal') {
                            propsMap[propName] = attr.value.value;
                        } else if (attr.value === null) {
                            propsMap[propName] = true;
                        }
                    }
                });
            }
        });

        return propsMap;
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
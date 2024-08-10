import * as fs from 'fs';
import jscodeshift from 'jscodeshift';
import { extractAllPaths, loadHierarchy } from './hierarchy.js';

class ReactComponent {
    constructor(name, properties, returnedElements,parentElements, filepath, ast, useStateDeclarations=[]){
        this.name = name;
        this.properties = properties;
        this.returnedElements = returnedElements;
        this.parentElements = parentElements;
        this.filepath = filepath;
        this.ast = ast;
        this.useStateDeclarations = useStateDeclarations;
        this.isChanged = false;
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
            this.isChanged = true;
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
    }

    removeProperty(prop){
        let deleted = false;
        if(this.properties.includes(prop+`=${prop}`)){
            this.properties = this.properties.filter(pr => pr!==(prop+`=${prop}`))
            deleted = true;
            this.isChanged = true;
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
    }
    
    addNewUseStateDeclaration(variableDec){
        if(!this.useStateDeclarations.includes(variableDec)){
            this.useStateDeclarations.push(variableDec);
            this.isChanged = true;
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
                        this.isChanged = true;
                    }
                }
            });
        });
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
                 this.isChanged = true;
                 elementPath.node.openingElement.attributes = filtAttributes;
               }
            })
        })
    }

    getChildProps() {
        const props = {};
        const {j} = this.loadFileAndAst();
        this.returnedElements.forEach(childName => {
            const child = this.ast.find(j.JSXElement).filter(path => path.node.openingElement.name.name === childName).get(0);
            if(child){
                child.node.openingElement.attributes.forEach(attr => {
                    if(attr.type==='JSXAttribute' && attr.name.type === 'JSXIdentifier'){
                        props[childName] = props[childName] || [];
                        props[childName].push(attr.name.name);
                    }
                });
            }
        });
        return props;
    }
    checkIfContainsPropertyInBody(prop) {
        const { j, ast } = this.loadFileAndAst();
        let isUsed = false;
    
        ast.find(j.Identifier, { name: prop }).forEach(path => {
            const parentNode = path.parent.node;
            if (
                (parentNode.type === 'MemberExpression' && parentNode.property === path.node) || 
                (parentNode.type === 'AssignmentExpression' && parentNode.left === path.node) || 
                (parentNode.type === 'VariableDeclarator' && parentNode.init === path.node) || 
                (parentNode.type === 'CallExpression' && parentNode.arguments.includes(path.node)) || 
                (parentNode.type === 'JSXExpressionContainer' && parentNode.expression === path.node) ||
                (parentNode.type === 'ReturnStatement' && parentNode.argument === path.node) || 
                (parentNode.type === 'BinaryExpression' && (parentNode.left === path.node || parentNode.right === path.node)) ||
                (parentNode.type === 'UpdateExpression' && parentNode.argument === path.node) || 
                (parentNode.type === 'LogicalExpression' && (parentNode.left === path.node || parentNode.right === path.node)) || 
                (parentNode.type === 'ConditionalExpression' && (parentNode.test === path.node || parentNode.consequent === path.node || parentNode.alternate === path.node)) || 
                (parentNode.type === 'ObjectProperty' && parentNode.value === path.node)
            ) {
                if (!(parentNode.type === 'JSXAttribute' && parentNode.value.expression === path.node)) {
                    console.log(`Valid usage found in parent node type: ${parentNode.type}`);
                    isUsed = true;
                    return false;
                }
            }
        });
    
        return isUsed;
    }
    
    wrapReturnElementsWithProvider(property) {
        const {j,ast} = this.loadFileAndAst();

        // Find the return statement and wrap it with <ValueProvider value={value}></ValueProvider>
        ast.find(j.ReturnStatement).forEach(path => {
                const returnArgument = path.node.argument;

                const wrappedElement = j.jsxElement(
                    j.jsxOpeningElement(j.jsxIdentifier(`${property}Provider`), [
                        j.jsxAttribute(
                            j.jsxIdentifier(`${property}`),
                            j.jsxExpressionContainer(j.identifier(property))
                        )
                    ]),
                    j.jsxClosingElement(j.jsxIdentifier(`${property}Provider`)),
                    [returnArgument]
                );

                path.node.argument = wrappedElement;
            });

        // Add import { ValueProvider } from './ValueContext';
        const importDeclaration = j.importDeclaration(
            [j.importSpecifier(j.identifier(`${property}Provider`))],
            j.literal(`./${property}Context.js`)
        );

        
        const body = ast.find(j.Program).get('body').value;
        console.log(body);
        const firstImportIndex = body.findIndex(node => node.type === 'ImportDeclaration');
        if (firstImportIndex === -1) {
            body.unshift(importDeclaration);
        } else {
            body.splice(firstImportIndex, 0, importDeclaration);
        }

        this.isChanged = true;
    }
    addValueContextUsage(property) {
        const { j, ast } = this.loadFileAndAst();
    
        const valueContextImport = j.importDeclaration(
            [j.importSpecifier(j.identifier(`${property}Context`))],
            j.literal(`./${property}Context`)
        );
    
        const reactImport = j.importDeclaration(
            [j.importSpecifier(j.identifier('useContext'))],
            j.literal('react')
        );
    
        const useContextLine = j.variableDeclaration('const', [
            j.variableDeclarator(j.identifier(property), j.callExpression(j.identifier('useContext'), [j.identifier(`${property}Context`)]))
        ]);
    
        const body = ast.find(j.Program).get('body').value;
    
        const useContextImportIndex = body.findIndex(node => {
            return node.type === 'ImportDeclaration' && 
                   Array.isArray(node.specifiers) && 
                   node.specifiers.some(spec => spec.imported && spec.imported.name === 'useContext');
        });
        
        if (useContextImportIndex === -1) {
            body.unshift(reactImport);
        }
    
        const importIndex = body.findIndex(node => {
            return node.type === 'ImportDeclaration' && 
                   Array.isArray(node.specifiers) &&  
                   node.specifiers.some(spec => spec.imported && spec.imported.name === `./${property}Context`);
        });
        
        if (importIndex === -1) {
            body.unshift(valueContextImport);
        }

        ast.find(j.FunctionDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                path.get('body', 'body').unshift(useContextLine);
            }
        });
    
        this.isChanged = true;
        this.ast = ast;  
    }
    
    writeChanges() {
        if (this.isChanged) {
            const updatedCode = this.ast.toSource();
            fs.writeFileSync(this.filepath, updatedCode, 'utf8');
            this.hasChanges = false; 
        }
    }
}
export {ReactComponent};
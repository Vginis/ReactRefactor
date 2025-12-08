import * as fs from 'node:fs';
import j from './Parser.js'
import path from 'node:path';
import { ImportManager } from './ImportManager.js';
import { ImportSpecifier } from './ImportStatement.js';
import { cleanUnneccessaryParenthesis } from './util.js';
import { Property } from './Property.js';
import * as flatted from 'flatted';
import { extractGlobalCliVariables } from './cli.js';

const { projectPath, fileType } = extractGlobalCliVariables();

class ReactComponent {
    constructor(name, properties, returnedElements, parentElements, componentType, reactFile, isInRootFile = false
        , astNode, useStateDeclarations = [], aliases = undefined) {
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
        this.compositeKeyName = this.reactFile.filePath + ":" + this.name;
        this.returnedElementsByKey = []
        // the AST node of the declaration
        this.astNode = astNode
        this._childComponents = []
    }

    get fqn() {
        if (!this._fqn) {
            this._fqn = this.reactFile.relativePath + ":" + this.name
        }
        return this._fqn
    }

    get shortFqn() {
        if (!this._shortFqn) {
            let filePathSegments = this.reactFile.relativePath.split(":")
            let fileName = filePathSegments[filePathSegments.length - 1]
            let pathSegments = filePathSegments.slice(0, filePathSegments.length)
            let shortenedPath = pathSegments.map(s => s.charAt(0)).join(".")
            this._shortFqn = [shortenedPath, fileName, this.name].join(":")
        }
        return this._shortFqn
    }

    get childComponents() {
        return this._childComponents
    }

    /**
     * Returns whether the component has as alias (in any file) the provided element name (not fqn)
     * @param {string} componentName 
     * @returns boolean
     */
    hasAlias(componentName) {
        return this.aliases?.aliases?.includes(componentName);
    }


    loadFileAndAst() {
        //const j = resolveJscodeshiftParser(fileType);
        const filePath = this.reactFile.filePath;
        const ast = this.reactFile.ast;
        const j = this.reactFile.j;
        return { j, filePath, ast };
    }


    /**
     * Resolves all JSX references in returned JSX to actual components objects
     * identified (after resolution of imported/local components)
     */
    resolveReturnedElementsToChildComponents() {

        this.returnedElements.forEach(elementName => {
            let component = this.reactFile.getLocalComponent(elementName)
            if (!component) {
                component = this.reactFile.getImportedComponentDeclaration(elementName)
            }
            if (component) {
                this._childComponents.push(component)
            }
        })

    }

    addNewProperty(newProp, propType = "string") {
        let hasProps = true;
        if (!this.properties.map(p => p.propName).includes(newProp)) {
            this.properties.push(new Property(newProp, propType));
            this.isChanged = true;
        } else {
            console.log("Property already exists. Maybe pick a new name for the prop.")
            return;
        }
        const { j, ast } = this.loadFileAndAst();

        ast.find(j.FunctionDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                if (path.node.params.length === 0) {
                    // If no parameters exist, create an ObjectPattern for the new prop
                    hasProps = false;
                    const newPropNode = j.objectProperty(j.identifier(newProp), j.identifier(newProp), false, true);
                    newPropNode.shorthand = true;
                    const objectPattern = j.objectPattern([newPropNode]);
                    path.node.params.push(objectPattern);
                } else {
                    const firstParam = path.node.params[0];
                    if (firstParam.type === 'Identifier') {
                        // If it's a single identifier (e.g., props), replace it with an object pattern
                        const newPropNode = j.objectProperty(j.identifier(newProp), j.identifier(newProp), false, true);
                        newPropNode.shorthand = true;
                        const objectPattern = j.objectPattern([
                            newPropNode,
                            j.restElement(j.identifier(firstParam.name)) // Keep the original props as ...props
                        ]);
                        path.node.params[0] = objectPattern;
                    } else if (firstParam.type === 'ObjectPattern') {
                        // If it’s already an ObjectPattern, add the newProp
                        const newPropNode = j.objectProperty(j.identifier(newProp), j.identifier(newProp), false, true);
                        newPropNode.shorthand = true;
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
                }
            }
        });
        ast.find(j.VariableDeclaration).forEach(path => {
            path.node.declarations.forEach(declaration => {
                if (declaration.init && declaration.init.type === 'ArrowFunctionExpression' && declaration.id.name === this.name) {
                    const arrowFunctionBody = declaration.init.body;
                    if (arrowFunctionBody.type === 'BlockStatement') {
                        if (declaration.init.params.length === 0) {
                            const newPropNode = j.objectProperty(j.identifier(newProp), j.identifier(newProp), false, true);
                            newPropNode.shorthand = true;
                            const objectPattern = j.objectPattern([newPropNode]);
                            declaration.init.params.push(objectPattern);
                        } else {
                            declaration.init.params.forEach(param => {
                                if (param.type === 'ObjectPattern') {
                                    const newPropNode = j.objectProperty(j.identifier(newProp), j.identifier(newProp), false, true);
                                    newPropNode.shorthand = true;
                                    param.properties.push(newPropNode);
                                }
                            });
                        }
                    }
                }
            });
        });

        let propsAreDestructured = true;
        // Handle TypeScript Cases (.ts, .tsx)
        if (fileType === "ts" || fileType === "tsx") {
            propsAreDestructured = this.addNewPropertyForTS(newProp, propType, hasProps);
        }

        const useThisProps = !propsAreDestructured && this.componentType === 'Class';//Indicator that show if we should add the prop in the code like this {property} or like this {this.props.property} 
        return useThisProps;
    }

    addNewPropertyForTS(newProp, propType, hasProps) {
        const { j, ast } = this.loadFileAndAst();
        let propertiesEntityName;
        let propsAreDestructured = true;
        ast.find(j.FunctionDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                const functionParams = path.node.params;

                if (!hasProps) {
                    // If no existing parameters, add an object pattern with type annotation
                    const objectPattern = functionParams[0];

                    const tsTypeLiteral = j.tsTypeLiteral([
                        ...objectPattern.properties.map(prop =>
                            j.tsPropertySignature(
                                j.identifier(prop.key.name),
                                j.tsTypeAnnotation(j.tsTypeReference(j.identifier(prop.key.name === newProp ? propType : "any"))) // Preserve existing props
                            )
                        )
                    ]);

                    objectPattern.typeAnnotation = j.tsTypeAnnotation(tsTypeLiteral);
                }
                if (functionParams.length > 0 && functionParams[0].type === 'ObjectPattern') {
                    // Destructuring found: function MyComponentA({ children }) { ... }
                    const objectPattern = functionParams[0];

                    // Add new property to the destructuring if not already present
                    const hasProperty = objectPattern.properties.some(
                        prop => prop.key.name === newProp
                    );

                    if (!hasProperty) {
                        const newPropNode = j.objectProperty(j.identifier(newProp), j.identifier(newProp));
                        newPropNode.shorthand = true;
                        objectPattern.properties.push(newPropNode);
                    }
                }

                // Handle type annotations
                const functionType = path.node.params[0].typeAnnotation?.typeAnnotation;
                if (functionType?.type === 'TSTypeLiteral') {
                    const hasPropertyType = functionType.members.some(
                        member => member.key.name === newProp
                    );
                    if (!hasPropertyType) {
                        functionType.members.push(
                            j.tsPropertySignature(
                                j.identifier(newProp),
                                j.tsTypeAnnotation(j.tsTypeReference(j.identifier(propType)))
                            )
                        );
                    }


                } else if (functionType?.type === 'TSTypeReference') {
                    // Handle external interface/type reference
                    propertiesEntityName = functionType.typeName.name;
                }
            }
        });

        ast.find(j.ClassDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                const classNode = path.node;
                const superTypeParams = classNode.superTypeParameters?.params;

                if (!superTypeParams || superTypeParams.length === 0) {
                    classNode.superTypeParameters = j.tsTypeParameterInstantiation([
                        j.tsTypeLiteral([
                            j.tsPropertySignature(
                                j.identifier(newProp),
                                j.tsTypeAnnotation(j.tsTypeReference(j.identifier(propType)))
                            )
                        ])
                    ]);
                }
                if (superTypeParams && superTypeParams.length > 0) {
                    const propsType = superTypeParams[0];

                    if (propsType.type === 'TSTypeLiteral') {
                        // If the class component has inline props: class MyComponent extends React.Component<{ prop: type }>
                        const hasProperty = propsType.members.some(member => member.key.name === newProp);

                        if (!hasProperty) {
                            propsType.members.push(
                                j.tsPropertySignature(
                                    j.identifier(newProp),
                                    j.tsTypeAnnotation(j.tsTypeReference(j.identifier(propType)))
                                )
                            );
                        }
                    } else if (propsType.type === 'TSTypeReference') {
                        // If the class component uses an external interface/type: class MyComponent extends React.Component<Props>
                        propsAreDestructured = false;
                        propertiesEntityName = propsType.typeName.name;
                    }
                }
            }
        });

        ast.find(j.VariableDeclaration).forEach(path => {
            path.node.declarations.forEach(declaration => {
                if (
                    declaration?.init?.type === 'ArrowFunctionExpression' &&
                    declaration.id.name === this.name
                ) {
                    const functionType = declaration.id.typeAnnotation?.typeAnnotation;
                    if (functionType?.type === 'TSTypeReference') {
                        // Check if the function has inline props: const MyComponent: React.FC<{ prop: type }>
                        const typeArgs = functionType.typeParameters?.params[0];
                        if (typeArgs?.type === 'TSTypeLiteral') {
                            const hasProperty = typeArgs.members.some(
                                member => member.key.name === newProp
                            );
                            if (!hasProperty) {
                                typeArgs.members.push(
                                    j.tsPropertySignature(
                                        j.identifier(newProp),
                                        j.tsTypeAnnotation(j.tsTypeReference(j.identifier(propType)))
                                    )
                                );
                            }
                        } else if (typeArgs?.type === 'TSTypeReference') {
                            // Check if the function has props defined in a Type or Interface
                            propertiesEntityName = typeArgs.typeName.name;
                        } else if (!typeArgs) {
                            functionType.typeParameters = j.tsTypeParameterInstantiation([
                                j.tsTypeLiteral([
                                    j.tsPropertySignature(
                                        j.identifier(newProp),
                                        j.tsTypeAnnotation(j.tsTypeReference(j.identifier(propType)))
                                    )
                                ])
                            ]);
                        }
                    }
                }
            });
        });

        // Props defined as separate type/interface
        ast.find(j.TSTypeAliasDeclaration).forEach(path => {
            if (propertiesEntityName && path.node.id.name === propertiesEntityName) {
                path.node.typeAnnotation.members.push(
                    j.tsPropertySignature(j.identifier(newProp), j.tsTypeAnnotation(j.tsTypeReference(j.identifier(propType))))
                );
            }
        });

        ast.find(j.TSInterfaceDeclaration).forEach(path => {
            if (propertiesEntityName && path.node.id.name === propertiesEntityName) {
                path.node.body.body.push(
                    j.tsPropertySignature(j.identifier(newProp), j.tsTypeAnnotation(j.tsTypeReference(j.identifier(propType))))
                );
            }
        });
        return propsAreDestructured;
    }

    removeProperty(prop) {
        let deleted = false;
        if (this.properties.map(pr => pr.propName).includes(prop)) {
            this.properties = this.properties.filter(pr => pr.propName !== (prop))
            deleted = true;
            this.isChanged = true;
        }
        if (!deleted) {
            console.log(`The Property ${prop} doesn't exist `);
            return;
        }
        const { j, ast } = this.loadFileAndAst();
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
                                if (declaration?.init?.type === 'MemberExpression' &&
                                    declaration?.init?.object?.type === 'ThisExpression' && declaration?.init?.property?.name === 'props') {
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
                    && declaration.id.name === this.name) {
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

        //Remove inline desctructuring const {...} = props;
        ast.find(j.VariableDeclarator).forEach(path => {
            const { id, init } = path.node;

            if (init?.type === 'Identifier' && init?.name === "props" && id.type === 'ObjectPattern') {
                id.properties.forEach(property => {
                    if (property.type === 'Property' && property.key.type === 'Identifier') {
                        id.properties = id.properties.filter(pr => {
                            return pr?.key?.name !== prop
                        })
                    }
                });
            }
        });
        if (fileType === "ts" || fileType === "tsx") {
            this.removePropertyForTS(prop);
        }
    }

    removePropertyForTS(prop) {
        const { j, ast } = this.loadFileAndAst();
        let propertiesEntityName;

        // Handle Function Declarations
        ast.find(j.FunctionDeclaration).forEach(path => {
            const functionParams = path.node.params;

            if (functionParams.length > 0 && functionParams[0].type === 'ObjectPattern') {
                // Remove prop from inline destructuring
                functionParams[0].properties = functionParams[0].properties.filter(p => {
                    if (p.type === 'RestElement') return;
                    return p.key.name !== prop
                });
            }

            // Handle inline type annotations
            const functionType = functionParams[0]?.typeAnnotation?.typeAnnotation;
            if (functionType && functionType.type === 'TSTypeLiteral') {
                functionType.members = functionType.members.filter(member => member.key.name !== prop);
            } else if (functionType && functionType.type === 'TSTypeReference') {
                propertiesEntityName = functionType.typeName.name;
            }
        });

        // Handle Arrow Function Components
        ast.find(j.VariableDeclaration).forEach(path => {
            path.node.declarations.forEach(declaration => {
                if (declaration.init && declaration.init.type === 'ArrowFunctionExpression' && declaration.id.name === this.name) {
                    const functionType = declaration.id.typeAnnotation?.typeAnnotation;

                    if (functionType && functionType.type === 'TSTypeReference') {
                        const typeArgs = functionType.typeParameters?.params[0];

                        if (typeArgs && typeArgs.type === 'TSTypeLiteral') {
                            typeArgs.members = typeArgs.members.filter(member => member.key.name !== prop);
                        } else if (typeArgs && typeArgs.type === 'TSTypeReference') {
                            propertiesEntityName = typeArgs.typeName.name;
                        }
                    }

                    const functionTypeParams = declaration?.init?.params;
                    if (functionTypeParams) {
                        functionTypeParams.forEach(tp => {
                            if (tp?.typeAnnotation?.typeAnnotation.type === "TSTypeReference") {
                                propertiesEntityName = tp?.typeAnnotation?.typeAnnotation?.typeName?.name;
                            }
                        })
                    }
                }
            });
        });

        // Handle Class Components (extends React.Component<{ props }>)
        ast.find(j.ClassDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                const superTypeParams = path.node.superTypeParameters?.params;

                if (superTypeParams && superTypeParams.length > 0) {
                    const propsType = superTypeParams[0];

                    if (propsType.type === 'TSTypeLiteral') {
                        propsType.members = propsType.members.filter(member => member.key.name !== prop);
                    } else if (propsType.type === 'TSTypeReference') {
                        propertiesEntityName = propsType.typeName.name;
                    } else if (propsType.type === 'TSIntersectionType') {
                        propsType.types.forEach(pt => {
                            if (pt.type === 'TSTypeReference') {
                                this.removePropsFromInterfaceOrType(ast, j, prop, pt.typeName.name);
                            }
                        });
                        return;
                    }
                }
            }
        });

        this.removePropsFromInterfaceOrType(ast, j, prop, propertiesEntityName);
    }

    // If properties are declared in a separate interface/type, remove prop there
    removePropsFromInterfaceOrType(ast, j, prop, propertiesEntityName) {
        ast.find(j.TSTypeAliasDeclaration).forEach(path => {
            if (propertiesEntityName && path.node.id.name === propertiesEntityName) {
                path.node.typeAnnotation.members = path.node.typeAnnotation.members.filter(member => member.key.name !== prop);
            }
        });

        ast.find(j.TSInterfaceDeclaration).forEach(path => {
            if (propertiesEntityName && path.node.id.name === propertiesEntityName) {
                path.node.body.body = path.node.body.body.filter(member => member.key.name !== prop);
            }
        });
    }

    addNewUseStateDeclaration(variableDec) {
        if (this.componentType === 'Class') {
            throw new Error('Cannot use useState Hook in Class Components. Aborting...');
        }
        if (!this.useStateDeclarations.includes(variableDec)) {
            this.useStateDeclarations.push(variableDec);
            this.isChanged = true;
        }
        const { variableName, setVariableMethod, initialValue } = variableDec;
        const importSpecifiers = [];
        importSpecifiers.push(new ImportSpecifier("useState", "useState"));
        this.addAnImportStatement('react', importSpecifiers);
        const { j, ast } = this.loadFileAndAst();
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
                if (declaration.init.type === 'ArrowFunctionExpression' && declaration.id.name === this.name) {
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

    removeUseStateDeclaration(variableName) {
        if (this.componentType === 'Class') {
            throw new Error('Cannot have useState Hook in Class Components. Aborting...');
        }
        let deleted = false;
        this.useStateDeclarations.forEach(el => {
            if (el.variableName === variableName) {
                this.useStateDeclarations = this.useStateDeclarations.filter(el => el.variableName !== variableName);
                deleted = true;
                this.isChanged = true;
            }
        })
        if (!deleted) {
            console.log("Use State Declaration doesn't exist");
            return;
        }
        const { j, ast } = this.loadFileAndAst();
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

    addNewPropToReturnElement(variableName, componentName, variableValue = variableName) {
        if (!this.returnedElements.includes(componentName)) {
            console.log(`Given componentName:${componentName} not included in the return elements.`)
            return;
        }

        const { j, ast } = this.loadFileAndAst();

        this.isChanged = true;
        ast.find(j.ReturnStatement).forEach(path => {
            j(path).find(j.JSXElement).forEach(elementPath => {
                if (elementPath.node.openingElement.name.name === componentName) {
                    const attributes = elementPath.node.openingElement.attributes;

                    if (!attributes.some(attr => attr.name && attr.name.name === variableName)) {
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

    removePropFromReturnElement(variableName, componentName, reactComponents) {
        let returnedElementName = componentName;
        let isAliased = false;
        if (!this.returnedElements.includes(componentName)) {
            const nextComponentName = reactComponents.find(comp => comp.aliases && comp.aliases.original === componentName);
            if (nextComponentName) {
                for (let i = 0; i < nextComponentName.aliases.filepaths.length; i++) {
                    const normalizedTargetPath = path.resolve(nextComponentName.aliases.filepaths[i]);
                    const isSourceContainedInFile = this.reactFile.importStatements.some(importStatement => {
                        const resolvedSourcePath = path.resolve(
                            path.dirname(importStatement.filePath),
                            importStatement.source
                        );
                        return resolvedSourcePath === normalizedTargetPath;
                    });
                    if (nextComponentName.aliases.filepaths[i] === this.reactFile.filePath || isSourceContainedInFile) {
                        returnedElementName = nextComponentName.aliases.aliases[i];
                        isAliased = true;
                    }
                }
            } else {
                console.log("Given componentName not included in the return elements.")
                return;
            }
        }
        const { j, ast } = this.loadFileAndAst();
        //Search for the ast of the specific component by name
        ast.find(j.VariableDeclarator, { id: { name: this.name } })
            .filter(path => j.FunctionExpression.check(path.node.init) || j.ArrowFunctionExpression.check(path.node.init))
            .forEach(funcPath => {
                j(funcPath).find(j.JSXElement).forEach(elementPath => {
                    if (elementPath.node.openingElement.name.name === returnedElementName) {
                        const attributes = elementPath.node.openingElement.attributes;
                        const filtAttributes = attributes.filter(el => el.name && el.name.name !== variableName);
                        this.isChanged = true;
                        elementPath.node.openingElement.attributes = filtAttributes;
                    }
                });
            });

        ast.find(j.FunctionDeclaration, { id: { name: this.name } })
            .forEach(funcPath => {
                j(funcPath).find(j.JSXElement).forEach(elementPath => {
                    if (elementPath.node.openingElement.name.name === returnedElementName) {
                        const attributes = elementPath.node.openingElement.attributes;
                        const filtAttributes = attributes.filter(el => el.name && el.name.name !== variableName);
                        this.isChanged = true;
                        elementPath.node.openingElement.attributes = filtAttributes;
                    }
                });
            });

        ast.find(j.ClassDeclaration, { id: { name: this.name } })
            .forEach(classPath => {
                j(classPath)
                    .find(j.ClassMethod, { key: { name: "render" } }) // Search for ClassMethod
                    .forEach(p => this.handleRenderMethodForReturnElementPropRemoval(p, returnedElementName, variableName));

                j(classPath)
                    .find(j.MethodDefinition, { key: { name: "render" } }) // Search for MethodDefinition
                    .forEach(p => this.handleRenderMethodForReturnElementPropRemoval(p, returnedElementName, variableName));
            });

        ast.find(j.VariableDeclarator).forEach(path => {
            if (path.value.init && path.value.init.type === 'ArrowFunctionExpression') {
                const bodyPath = path.value.init.body;
                if (bodyPath && bodyPath.type === 'JSXElement') {
                    bodyPath.children.forEach(childNode => {
                        if (childNode.type === 'JSXExpressionContainer' &&
                            childNode.expression && childNode.expression.type === 'CallExpression') {
                            childNode.expression.arguments.forEach(arg => {
                                if (arg.type === 'ArrowFunctionExpression') {
                                    arg.body.children.forEach(c => {
                                        if (c.type === 'JSXExpressionContainer' && c.expression?.consequent?.openingElement) {
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

    handleRenderMethodForReturnElementPropRemoval(renderMethod, returnedElementName, variableName) {
        const { j } = this.loadFileAndAst();
        j(renderMethod)
            .find(j.JSXElement)
            .forEach(elementPath => {
                if (elementPath.node.openingElement.name.name === returnedElementName) {
                    const attributes = elementPath.node.openingElement.attributes;
                    const filtAttributes = attributes.filter(el => el.name && el.name.name !== variableName);
                    this.isChanged = true;
                    elementPath.node.openingElement.attributes = filtAttributes;
                }
            });
    }

    getChildPropValues(reactComponents) {
        const props = {};
        const processedNodes = new Set(); // Set to track processed nodes to avoid duplicates
        const { j } = this.loadFileAndAst();

        this.returnedElementsByKey.forEach(childNameKey => {
            const childName = childNameKey.split(":")[1];
            const childNodes = this.reactFile.ast.find(j.JSXElement).filter(path => {
                const isJSXElementMatch = path.node.openingElement.name.name === childName;
                //Checking If the Component is Passed as a Prop: e.g. component={SomeComponent.someProp}
                const isPropMatch1 = path.node.openingElement.attributes.some(attr =>
                    attr.type === 'JSXAttribute' &&
                    attr.name.name === 'component' &&
                    attr?.value?.expression?.property?.name === childName
                );
                //Checking If the Component is Passed as a Prop: e.g. component={SimpleComponent}
                const isPropMatch2 = path.node.openingElement.attributes.some(attr =>
                    attr.type === 'JSXAttribute' &&
                    attr.name.name === 'component' &&
                    attr?.value?.expression?.name === childName
                );

                return (isJSXElementMatch || isPropMatch1 || isPropMatch2) && !processedNodes.has(path.node);
            });

            childNodes.forEach(child => {
                processedNodes.add(child.node);
                const childComponent = reactComponents.find(comp =>
                    comp.compositeKeyName === childNameKey || (comp?.aliases?.aliases?.includes(childName))
                );

                if (childComponent) {
                    props[childComponent.compositeKeyName] = props[childComponent.compositeKeyName] || [];
                    child.node.openingElement.attributes.forEach(attr => {
                        if (attr.type === 'JSXAttribute' && attr.name.type === 'JSXIdentifier') {
                            const propName = attr.name.name;
                            let propValue = null;
                            if (attr.value && attr.value.type === 'JSXExpressionContainer') {
                                const expr = attr.value.expression;

                                if (expr.type === 'MemberExpression') {
                                    //Review and refactor this
                                    // if (
                                    //     expr.object.type === 'MemberExpression' &&
                                    //     expr.object.object.type === 'ThisExpression' &&
                                    //     expr.object.property.name === 'props'
                                    // ) {
                                    //     propValue = expr.property.name;
                                    // } else if (expr.object.type === 'Identifier' && expr.object.name === 'props') {
                                    //     propValue = expr.property.name;
                                    // } else {
                                    //     propValue = expr.property.name;
                                    // }
                                    propValue = expr?.property?.name;
                                } else {
                                    propValue = expr.name || expr.value;
                                }
                            } else if (attr.value && (attr.value.type === 'Literal' || attr.value.type === 'StringLiteral')) {
                                propValue = attr.value.value;
                            }

                            if (propValue !== null) {
                                props[childComponent.compositeKeyName].push({ [propName]: propValue });
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
                path.parent.parent.node.type === 'JSXAttribute' &&
                path?.parent?.parent?.parent?.node?.name?.name === nextComponentName
            ) {
                return;
            }
            if (
                parentNode.type === 'MemberExpression' &&
                parentNode.property === path.node &&
                parentNode.object.name === "props" &&
                parentNode.property.name === prop &&
                path.parent?.parent?.parent?.parent?.node?.name?.name === nextComponentName
            ) {
                return;
            }

            isUsedOutsideJSXProps = true;
            return false;
        });
        return isUsedOutsideJSXProps;
    }


    wrapReturnElementsWithProvider(properties, capitalizedProps, returnPropsMap, intermediateComponentName) {
        const { j, ast } = this.loadFileAndAst();

        // Helper method that wraps JSX elements inside the component
        const wrapJSXElementWithProvider = (jsxPath) => {
            const openingElement = jsxPath.node.openingElement;
            const tagName = openingElement.name.name;

            if (tagName !== intermediateComponentName) return;

            // Construct Provider JSX wrapper
            let jsxAttributes = [];
            properties.forEach((prop) => {
                const propName = Object.keys(prop)[0];
                const propValueNode = returnPropsMap.get(propName);
                if (propValueNode) {
                    jsxAttributes.push(
                        j.jsxAttribute(
                            j.jsxIdentifier(propName),
                            j.jsxExpressionContainer(propValueNode)
                        )
                    );
                }
            });

            // Wrap the intermediate component inside the Provider
            const clonedNode = flatted.parse(flatted.stringify(jsxPath.node));
            const cleanedNode = cleanUnneccessaryParenthesis(j, clonedNode);
            const jsxElementOfCleanNode = cleanedNode?.program?.body[0]?.expression;

            const wrappedElement = j.jsxElement(
                j.jsxOpeningElement(j.jsxIdentifier(`${capitalizedProps}Provider`), jsxAttributes),
                j.jsxClosingElement(j.jsxIdentifier(`${capitalizedProps}Provider`)),
                [jsxElementOfCleanNode] // Wrap only this element
            );
            // Replace the JSX element with the wrapped version
            j(jsxPath).replaceWith(wrappedElement);
        };

        // Handle Function and Arrow Components
        if (this.componentType === 'Function' || this.componentType === 'ArrowFunction') {
            const functionComponentNode =
                ast.find(j.FunctionDeclaration, { id: { name: this.name } }).nodes()[0] ||
                ast.find(j.VariableDeclarator, { id: { name: this.name, type: 'Identifier' } }).nodes()[0];

            if (functionComponentNode) {
                j(functionComponentNode)
                    .find(j.JSXElement) // Find all JSX elements inside the component body
                    .forEach(wrapJSXElementWithProvider);
            }
        }
        // Handle Class Components
        else if (this.componentType === 'Class') {
            const classComponentNode = ast.find(j.ClassDeclaration, { id: { name: this.name } }).nodes()[0];
            if (classComponentNode) {
                j(classComponentNode)
                    .find(j.JSXElement) // Find all JSX elements inside the class component
                    .forEach(wrapJSXElementWithProvider);
            }
        } else {
            return;
        }

        // Step 3: Add import statement for the Provider
        const currentDir = path.dirname(this.reactFile.filePath);
        const projectDir = path.resolve(projectPath);
        let relativePath = path.relative(currentDir, path.join(projectDir, `${capitalizedProps}Context`));
        relativePath = relativePath.replace(/\\/g, '/');

        if (!relativePath.startsWith('.')) {
            relativePath = './' + relativePath;
        }
        this.addAnImportStatement(relativePath, [
            new ImportSpecifier(`${capitalizedProps}Provider`, `${capitalizedProps}Provider`),
        ]);

        this.isChanged = true;
    }


    addValueContextUsage(properties, propMapping, propIndex, capitalizedProps, propDrillingLength) {
        const { j, ast } = this.loadFileAndAst();
        let allFromReactAreImportedInNamespace = false;
        //Import useContext for Function Components
        if (this.componentType === 'Function' || this.componentType === 'ArrowFunction') {
            const importSpecifiers = [];
            importSpecifiers.push(new ImportSpecifier(`useContext`, `useContext`));
            allFromReactAreImportedInNamespace = this.addAnImportStatement('react', importSpecifiers);
        }

        let counter = 0; //Counts the number of useContextLine insertions, to avoid duplicate declaration of useContext;
        properties.forEach(property => {
            //Import the created context
            const importSpecifiers = [];
            const currentDir = path.dirname(this.reactFile.filePath);
            const projectDir = path.resolve(projectPath);
            let relativePath = path.relative(currentDir, path.join(projectDir, `${capitalizedProps}Context`));
            if (relativePath.includes("\\")) {
                relativePath = relativePath.replace(/\\/g, '/');
            } else {
                relativePath = "./" + relativePath;
            }

            importSpecifiers.push(new ImportSpecifier(`${capitalizedProps}Context`, `${capitalizedProps}Context`));
            this.addAnImportStatement(relativePath, importSpecifiers);

            //Construct useContext line
            const useContextDeclaration = (allFromReactAreImportedInNamespace) ? "React.useContext" : "useContext";
            const useContextLine = [
                j.variableDeclaration("const", [
                    j.variableDeclarator(
                        j.identifier(`${capitalizedProps}Props`),
                        j.callExpression(j.identifier(useContextDeclaration), [
                            j.identifier(`${capitalizedProps}Context`),
                        ])
                    ),
                ]),
                j.ifStatement(
                    j.unaryExpression("!", j.identifier(`${capitalizedProps}Props`)),
                    j.blockStatement([
                        j.throwStatement(
                            j.newExpression(j.identifier("Error"), [
                                j.literal(
                                    `${capitalizedProps}Props must be used within a ${capitalizedProps}Provider`
                                ),
                            ])
                        ),
                    ])
                )];
            counter++;


            //Resolve the correct variable name that should be used based on variable renamings
            let propUsed;
            for (const key in propMapping) {
                if (propMapping[key].includes(Object.values(property)[0])) {
                    if (propIndex >= propMapping[key].length || propIndex === propDrillingLength) {
                        propUsed = propMapping[key][propMapping[key].length - 1];
                    } else {
                        propUsed = propMapping[key][propIndex];
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
                this.insertUseContextPropLine(propLine, capitalizedProps, propUsed)
                if (counter === properties.length) {
                    this.insertUseContextLine(useContextLine);
                }
            } else if (this.componentType === 'Class') {
                //Class Component Context approach
                this.insertClassContextLine(property, propMapping, propIndex);
                // Add static contextType property
                if (counter === properties.length) {
                    ast.find(j.ClassDeclaration).forEach(path => {
                        if (path.node.id.name === this.name) {
                            this.insertClassContextTypeProperty(path, capitalizedProps, j);
                        }
                    });
                }
            }
        });

        this.isChanged = true;
        this.reactFile.ast = ast;
    }

    //Inserts Class Context approach
    insertClassContextLine(property, propMapping, propIndex) {
        const { j, ast } = this.loadFileAndAst();

        ast.find(j.ClassDeclaration).forEach(path => {
            if (path.node.id.name === this.name) {
                // Locate the render method
                path.node.body.body.forEach(classBodyElement => {
                    if (
                        (classBodyElement.type === 'MethodDefinition' || classBodyElement.type === 'ClassMethod') &&
                        classBodyElement.key.name === 'render'
                    ) {
                        if (classBodyElement.value?.body?.type === 'BlockStatement' || classBodyElement.body?.type === 'BlockStatement') {
                            const classBodyElementBody = classBodyElement.value?.body || classBodyElement.body
                            // Step 1: Remove `const ... = this.props.<name>`
                            j(classBodyElementBody).find(j.VariableDeclaration).forEach(varPath => {
                                varPath.node.declarations.forEach(declaration => {
                                    if (
                                        declaration.id.type === 'ObjectPattern' &&
                                        declaration.init?.type === 'MemberExpression' &&
                                        declaration.init.object?.type === 'ThisExpression' &&
                                        declaration.init.property?.name === 'props'
                                    ) {
                                        // Remove the specific property from destructuring
                                        declaration.id.properties = declaration.id.properties.filter(
                                            propNode => propNode.key.name !== Object.keys(property)[0] && propNode.key.name !== Object.values(property)[0]
                                        );
                                    }
                                });
                            });
                            classBodyElementBody.body = classBodyElementBody.body.filter(statement => {
                                if (statement.type === 'VariableDeclaration') {
                                    return !statement.declarations.some(declaration =>
                                        declaration.init?.type === 'MemberExpression' &&
                                        declaration.init?.object?.type === 'MemberExpression' &&
                                        declaration.init?.object?.object?.type === 'ThisExpression' &&
                                        declaration.init?.object?.property?.name === 'props' &&
                                        declaration.init?.property?.name === Object.keys(property)[0]
                                    );
                                }
                                return true;
                            });

                            // Step 2: Replace `this.props.<name>` with `<name>` in normal code and JSX
                            let propertyName;
                            if (propIndex >= propMapping[Object.keys(property)[0]].length) {
                                propertyName = propMapping[Object.keys(property)[0]][propMapping[Object.keys(property)[0]].length - 1];
                            } else {
                                propertyName = propMapping[Object.keys(property)[0]][propIndex];
                            }
                            j(classBodyElementBody).find(j.MemberExpression, {
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
                            classBodyElementBody.body.unshift(contextDestructuring);

                            // Step 4: Traverse the `return` statement and replace `this.props.<name>` in JSX
                            j(classBodyElementBody).find(j.ReturnStatement).forEach(returnPath => {
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

    insertClassContextTypeProperty(path, capitalizedProps, j) {
        const contextTypeProperty = j.classProperty(
            j.identifier('contextType'),
            j.identifier(`${capitalizedProps}Context`),
            null,
            true
        );
        path.node.body.body.unshift(contextTypeProperty);
    }
    //Inserts useContext hook
    insertUseContextLine(useContextLine) {
        const { j, ast } = this.loadFileAndAst();

        //Helper function to insert the useContextLine into function body
        const insertIntoBody = (functionPath) => {
            const body = functionPath.value.body;
            if (body.type === 'BlockStatement') {
                // If it's already a BlockStatement, insert the useContextLine at the top
                body.body.unshift(...useContextLine);
            } else {
                //  If it's an implicit return, transform it into a BlockStatement
                functionPath.value.body = j.blockStatement([useContextLine, j.returnStatement(body)]);
            }
        }
        ast.find(j.ArrowFunctionExpression).filter(path => {
            const variableDeclarator = path.parentPath.value;
            return (variableDeclarator.type === 'VariableDeclarator' && variableDeclarator.id.name === this.name);
        }).forEach(insertIntoBody);

        ast.find(j.FunctionDeclaration, {
            id: { name: this.name }
        }).forEach(insertIntoBody)
    }

    //Inserts line : const 'variable' = ContextPros.variable
    insertUseContextPropLine(propLine, capitalizedProps, propUsed) {
        const { j, ast } = this.loadFileAndAst();
        let alreadyInserted = false;

        const insertIntoBody = (functionPath) => {
            const body = functionPath.value.body;
            if (body.type === 'BlockStatement') {
                // If it's already a BlockStatement, insert the useContext PropLine at the top
                // Replace 'props.property' with 'NumProps.property'
                j(body).find(j.MemberExpression).forEach(memberExprPath => {
                    const memberExpr = memberExprPath.value;
                    if (memberExpr.object.type === 'Identifier' && memberExpr.object.name === 'props' && memberExpr?.property?.name === propUsed) {
                        memberExpr.object.name = `${capitalizedProps}Props`;
                        alreadyInserted = true;
                    }
                });
                //Insert the propLine if not already present
                if (!alreadyInserted) {
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
            return (variableDeclarator.type === 'VariableDeclarator' && variableDeclarator.id.name === this.name);
        }).forEach(insertIntoBody);

        ast.find(j.FunctionDeclaration, {
            id: { name: this.name }
        }).forEach(insertIntoBody)
    }

    //Returns the Composed JSX
    insertComposition(propDrillingPath) {
        const { j } = this.loadFileAndAst();
        const path = propDrillingPath.slice(1);
        const composeJSX = (components) => {
            if (components.length === 1) {
                return j.jsxElement(
                    j.jsxOpeningElement(j.jsxIdentifier(components[0]), []),
                    j.jsxClosingElement(j.jsxIdentifier(components[0])),
                    [],
                    false
                );
            }
            const [CurrenComponent, ...remainingComponents] = components;
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
        const { j, ast } = this.loadFileAndAst();
        ast.find(j.JSXOpeningElement).filter(path => {
            return (
                path?.node?.name?.type === 'JSXIdentifier' &&
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
                        } else if (attribute.value.type === 'StringLiteral') {
                            resolvedValue = '"' + attribute.value.value + '"';
                        }
                    }
                    propsMap.set(propName, resolvedValue);
                }
            });

            propsMap.set('node', path.node);
        });

        return propsMap;
    }


    addAnImportStatement(source, imported, importAsDefault = false) {
        const { j } = this.loadFileAndAst();
        const importManager = new ImportManager(j, this.reactFile);
        const allFromReactAreImportedInNamespace = importManager.addImport(source, imported, this.reactFile.filePath, importAsDefault);
        this.isChanged = importManager.isChanged;
        return allFromReactAreImportedInNamespace;
    }

    writeChanges() {
        if (this.isChanged) {
            const updatedCode = this.reactFile.ast.toSource();
            fs.writeFileSync(this.reactFile.filePath, updatedCode, 'utf8');
            this.hasChanges = false;
        }
    }
}
export { ReactComponent };
import { extractReturnElements } from './loadingFuncs.js';
import { createNewContextFileJS, createNewContextFileTS } from './CreateNewFiles.js';
import { returnsJSX, groupPropDrillingsByPath, removeDuplicateObjects, findCommonEnding } from './util.js';
import { ImportSpecifier } from './ImportStatement.js';
import * as pathLib from 'node:path';
import PropDrillingInfo from './PropDrillingInfo.js';
import { extractGlobalCliVariables } from './cli.js';

const { fileType } = extractGlobalCliVariables();

class PropDrilling {
    constructor(properties, path, source, dest) {
        this.properties = properties;
        this.path = path;
        this.source = source;
        this.dest = dest;
        this.contextRefactoring = true;
        this.compositionRefactoring = true;
    }

    removeAllProps(reactComponents, collectedProps, isComponentCompositionRefactoring) {
        let isAliased = false;
        let finalReturnProps = [];
        const iterationLength = (isComponentCompositionRefactoring) ? this.path.length - 1 : this.path.length;//If refactoring is component composition dont remove the destination props
        for (let i = 0; i < iterationLength; i++) {
            const propMapping = this.generatePropMapping();
            finalReturnProps = [...collectedProps];

            //Adds in the collectedProps List the renamings of the props 
            finalReturnProps.forEach(prop => {
                if (propMapping[Object.keys(prop)[0]]) {
                    const propMapList = propMapping[Object.keys(prop)[0]];
                    for (let i = 0; i < propMapList.length; i++) {
                        const isKeyPresent = finalReturnProps.some(p => Object.keys(prop)[0] === propMapList[i]);
                        if (!isKeyPresent) {
                            finalReturnProps.push({ [propMapList[i]]: propMapList[i] });
                        }
                    }
                }
            });
            finalReturnProps.forEach(prop => {
                const isAlias = this.path[i].sourceComponent.removePropFromReturnElement(Object.keys(prop)[0], this.path[i].destComponent.name, reactComponents);
                if (isAlias) isAliased = true;
                this.path[i].destComponent.removeProperty(Object.keys(prop)[0]);
                this.path[i].destComponent.reactFile.removePropFromPropType(this.path[i].destComponent.name, Object.keys(prop)[0]);
            })
            this.path[i].sourceComponent.isChanged = true;
        }
        return isAliased;
    }

    addUseContext(reactComponents, propDrillings) {
        if (this.checkIfDestComponentHasOtherParentComponents(propDrillings)) {
            throw new Error("Prop Drilling cant be refactored with Context. Another component returns the destination component and it is not part of any Prop Drilling path.");
        }
        let propMapping = this.generatePropMapping();
        const returnPropsMap = this.source.createReturnPropsMap(this.path[0].destComponent.name);
        //Group prop drilling with common path and their properties
        let groupedProps = this.getGroupedProps(propDrillings);

        //Check if there are multiple Prop Drillings ending with the same path
        const groupedPropDrillingsWithCommonEnding = this.checkIfPdPathHasCommonEnding(propDrillings, groupedProps);
        if (groupedPropDrillingsWithCommonEnding.length > 0) {
            this.addCombinationalContext(groupedPropDrillingsWithCommonEnding, reactComponents, propMapping, returnPropsMap, groupedProps);
            return;
        }
        groupedProps = removeDuplicateObjects(groupedProps);
        propMapping = this.generatePropMapping(groupedProps);
        const propTypeMapping = this.getPropTypeMapping(groupedProps);
        //Create Context file
        const capitalizedProps = (fileType === "jsx" || fileType === "js") ? createNewContextFileJS(groupedProps) : createNewContextFileTS(groupedProps, propTypeMapping);
        //Remove Props and Prop passings
        this.removeAllProps(reactComponents, groupedProps, false);
        // //Wrap elements with provider.
        this.source.wrapReturnElementsWithProvider(groupedProps, capitalizedProps, returnPropsMap, this.path[0].destComponent.name);
        // //Add Context Usage in Intermediate Components if needed
        for (let i = 1; i < this.path.length; i++) {
            let usedProps = [];//array of the props that the intermediate component is using
            groupedProps.forEach(prop => {
                const propMap = propMapping[Object.keys(prop)[0]];
                const returnedComponentName = this.path[i].sourceComponent.returnedElements.find(c => c === this.path[i].destComponent.name
                    || this.path[i].destComponent.aliases?.aliases?.includes(c));//Check based on the component's returned name.Not the original(Possibility of Component Aliasing)
                //Check if the prop is used in other parts of the Component except the passing to the prop drilling path
                if (this.checkIfPropIsUsedOutsideJSXPropsWithRenames(propMap, this.path[i].sourceComponent, returnedComponentName)) {
                    usedProps.push({ [propMap[i]]: propMap[i] });
                }
            });
            if (usedProps.length > 0) {
                this.path[i].sourceComponent.addValueContextUsage(usedProps, propMapping, i, capitalizedProps, this.path.length);
            }
        }
        this.dest.addValueContextUsage(groupedProps, propMapping, this.path.length, capitalizedProps, this.path.length);
    }

    checkIfPropIsUsedOutsideJSXPropsWithRenames(propMap, sourceComponent, returnedComponentName) {
        for (const prop of propMap) {
            if (sourceComponent.checkIfPropIsUsedOutsideJSXProps(prop, returnedComponentName)) {
                return true;
            }
        }
        return false;
    }
    //Combinational Context refactoring for Prop Drillings with common endings 
    addCombinationalContext(groupedPropDrillingsWithCommonEnding, reactComponents, propMapping, returnPropsMap, compoundProps) {
        let groupedProps = [];
        const totalPropDrillings = [...groupedPropDrillingsWithCommonEnding];
        totalPropDrillings.push(this);
        const totalPropDrillingPaths = totalPropDrillings.map(propDrilling => {
            const propDrillingPath = propDrilling.path.map(pp => pp.sourceComponent.name);
            propDrillingPath.push(propDrilling.path[propDrilling.path.length - 1].destComponent.name);
            return propDrillingPath;
        })
        const commonPropDrillingComponents = findCommonEnding(totalPropDrillingPaths);

        totalPropDrillings.forEach(gp => {
            const exists = gp.properties.some(prop => {
                return compoundProps.map(p => JSON.stringify(p)).includes(JSON.stringify(prop))
            });
            if (exists) {
                groupedProps.push(...gp.properties);
            }
        })
        groupedProps = removeDuplicateObjects(groupedProps);
        const propTypeMapping = this.getPropTypeMapping(groupedProps);
        //Create Context file
        const capitalizedProps = (fileType === "jsx" || fileType === "js") ? createNewContextFileJS(groupedProps) : createNewContextFileTS(groupedProps, propTypeMapping);
        //Remove Props and Prop passings
        //Wrap elements with provider.
        const contextProviderToSourcesMap = new Map();
        for (const pd of totalPropDrillingPaths) {
            contextProviderToSourcesMap.set(pd[0], false);
        }
        totalPropDrillings.forEach(pd => {
            if (contextProviderToSourcesMap.get(pd.source.name) === false) {
                pd.removeAllProps(reactComponents, groupedProps);
                pd.source.wrapReturnElementsWithProvider(groupedProps, capitalizedProps, returnPropsMap, pd.path[0].destComponent.name);
                contextProviderToSourcesMap.set(pd.source.name, true)
            }
            for (let i = 1; i < pd.path.length + 1 - commonPropDrillingComponents.length; i++) {//Iterate over the non common components of the Prop Drilling path
                let usedProps = [];//array of the props that the intermediate component is using
                groupedProps.forEach(prop => {
                    const propMap = propMapping[Object.keys(prop)[0]];
                    const returnedComponentName = pd.path[i].sourceComponent.returnedElements.find(c => c === pd.path[i].destComponent.name
                        || (pd.path[i].destComponent.aliases && pd.path[i].destComponent.aliases.aliases.includes(c)));//Check based on the component's returned name.Not the original(Possibility of Component Aliasing)
                    //Check if the prop is used in other parts of the Component except the passing to the prop drilling path
                    if (pd.path[i].sourceComponent.checkIfPropIsUsedOutsideJSXProps(propMap[i], returnedComponentName)) {
                        usedProps.push({ [propMap[i]]: propMap[i] });
                    }
                });
                if (usedProps.length > 0) {
                    pd.path[i].sourceComponent.addValueContextUsage(usedProps, propMapping, i, capitalizedProps, this.path.length);
                }
            }
        });
        for (let i = 0; i < commonPropDrillingComponents.length - 1; i++) {//Iterate over the common components of the Prop Drilling path
            let usedProps = [];
            const currentComponent = reactComponents.find(c => c.name === commonPropDrillingComponents[i]);
            const nextComponent = reactComponents.find(c => c.name === commonPropDrillingComponents[i + 1]);
            groupedProps.forEach(prop => {
                const propMap = propMapping[Object.keys(prop)[0]];
                if (currentComponent.checkIfPropIsUsedOutsideJSXProps(propMap[i + 1], nextComponent.name)) {
                    usedProps.push({ [propMap[i + 1]]: propMap[i + 1] });
                }
            });
            if (usedProps.length > 0) {
                currentComponent.addValueContextUsage(usedProps, propMapping, i + 1, capitalizedProps, this.path.length);
            }
        }
        this.dest.addValueContextUsage(groupedProps, propMapping, this.path.length, capitalizedProps, this.path.length);
    }

    addComponentComposition(reactComponents, otherPropDrillings) {
        const intermediateComponents = this.path.slice(1).map(propPassing => propPassing.sourceComponent);
        const propMapping = this.generatePropMapping();
        const childPropsValues = this.source.getChildPropValues(reactComponents);
        const returnPropsMap = this.source.createReturnPropsMap(this.path[0].destComponent.name);

        //Group prop drilling with common path and their properties
        let groupedProps = this.getGroupedProps(otherPropDrillings);
        const propTypeMapping = this.getPropTypeMapping(groupedProps);
        let nonDrilledProps = this.getNonDrilledProps(childPropsValues, propMapping, returnPropsMap);

        const groupedPropDrillingsWithCommonStart = this.checkIfPdPathHasCommonStart(otherPropDrillings, groupedProps);
        if (groupedPropDrillingsWithCommonStart.length > 0) {
            this.addCombinationalComponentComposition(groupedPropDrillingsWithCommonStart, reactComponents, propMapping, returnPropsMap);
            return;
        }

        //Check if extra props are passed from intermediate Components of the Prop Drilling Path
        if (this.checkForOtherIntermediatePropsInPath(reactComponents, groupedProps)) {
            throw new Error("Cannot do Component Composition, because extra props are passed from intermediate Components of the Path. Use Context instead...");
        }
        //Check if prop is used in intermediate components
        const componentPropsMap = this.getIntermediateComponentsPropUsageMap(groupedProps, intermediateComponents, returnPropsMap);

        const isAliased = this.removeAllProps(reactComponents, groupedProps, true);
        //Constructs the PropDrilling path with the names of the components
        let componentspath = this.constructPropDrillingPathByNames();
        let composedJSX = this.constructComposedJSX(isAliased, componentspath, reactComponents);

        //Replaces old JSX with new Composed
        const { j, ast } = this.source.loadFileAndAst();
        const jsxElements = ast.find(j.JSXElement).filter(path => {
            return path.node.openingElement.name.name === this.path[1].sourceComponent.name ||
                (this.path[1].sourceComponent.aliases && this.path[1].sourceComponent.aliases.aliases.includes(path.node.openingElement.name.name))
        });
        jsxElements.replaceWith(() => composedJSX);

        //Insert React's children variable in intermediate components' jsx and props
        this.insertNecessaryPropsInIntermediateComponents(intermediateComponents, componentPropsMap, componentspath, propTypeMapping);

        //Find new Returned Elements of the Refactored component
        this.extractNewReturnedElementsForSourceComponent();

        //Resolve the prop name-value that will be passed in the last component of the prop Drilling path
        this.addPropPassesToTheDestComponentOfComposedJSX(propMapping, returnPropsMap);

        //Add the rest of the props that are passed from the 1st to the 2nd component and are not in the Prop Drilling
        this.addPropPassesFromTheFirstToSecondComponent(nonDrilledProps);

        //Add props in composed JSX that are used in the intermediate components
        this.addPropPassesFromTheFirstToIntermediateComponents(intermediateComponents, componentPropsMap);
        //Handle Import Declarations 
        this.handleImportDeclarationsInComposition(reactComponents);
        this.source.isChanged = true;
    }

    addCombinationalComponentComposition(groupedPropDrillingsWithCommonStart, reactComponents, propMapping, returnPropsMap) {
        //Pending implementation
    }

    getNonDrilledProps(childPropsValues, propMapping, returnPropsMap) {
        //Keeps track of the props that are passed from the 1st to 2nd component and are not part of the Prop Drilling path.
        let nonDrilledProps = []

        childPropsValues[this.path[0].destComponent.compositeKeyName].forEach(childProp => {
            // Extract prop name from the childProp object
            const propName = Object.keys(childProp)[0];
            const renamingsOfProp = propMapping[propName];
            const destProperties = this.dest.properties.map(pr => pr.propName);
            const propExists = destProperties.some(
                prop => renamingsOfProp.includes(prop)
            );

            if (!propExists) {
                const resolvedValue = returnPropsMap.get(propName);
                if (resolvedValue) {
                    nonDrilledProps.push({ [propName]: resolvedValue });
                }
            }
        });
        return nonDrilledProps;
    }

    getIntermediateComponentsPropUsageMap(groupedProps, intermediateComponents, returnPropsMap) {
        //Checks if a prop is used in intermediate components
        const componentPropsMap = new Map();
        for (let i = 0; i < intermediateComponents.length; i++) {
            groupedProps.forEach(prop => {
                const propName = Object.keys(prop)[0];
                const resolvedValue = returnPropsMap.get(propName);
                const nextComponentName = (i < intermediateComponents.length - 1) ? intermediateComponents[i + 1].name : this.path[this.path.length - 1].destComponent.name;
                if (intermediateComponents[i] && intermediateComponents[i].checkIfPropIsUsedOutsideJSXProps(Object.keys(prop)[0], nextComponentName)) {
                    const componentName = intermediateComponents[i].name;
                    if (!componentPropsMap.has(componentName)) {
                        componentPropsMap.set(componentName, []);
                    }
                    componentPropsMap.get(componentName).push({ [propName]: resolvedValue });
                }
            });
        }
        return componentPropsMap;
    }

    constructPropDrillingPathByNames() {
        return [
            ...this.path.map(propPassing => propPassing.sourceComponent.name),
            this.path[this.path.length - 1].destComponent.name
        ];
    }

    constructComposedJSX(isAliased, path, reactComponents) {
        let composedJSX;
        if (!isAliased) {
            composedJSX = this.source.insertComposition(path);
        } else {
            //case for handling Component Aliasing of the second component of the Prop Drilling Hierarchy
            //bug: Handle case for component aliasing in the third,fourth,... component
            let newpath = path;
            const renamedComp = reactComponents.find(comp => comp.name === this.path[0].destComponent.name);
            newpath[1] = renamedComp.aliases.aliases[0];
            composedJSX = this.source.insertComposition(newpath);
        }
        return composedJSX;
    }

    insertNecessaryPropsInIntermediateComponents(intermediateComponents, componentPropsMap, componentspath, propTypeMapping) {
        let childrenString = '{children}'
        intermediateComponents.forEach(el => {
            const propsAreDestructured = el.addNewProperty('children', "React.ReactNode");
            if (propsAreDestructured) childrenString = '{this.props.children}'
            if (componentPropsMap.has(el.name)) {
                const propList = componentPropsMap.get(el.name);
                propList.forEach(pr => {
                    const propertyName = Object.keys(pr)[0];
                    const propType = propTypeMapping.get(propertyName);
                    el.addNewProperty(propertyName, propType);
                })
            }
            const { j, ast } = el.loadFileAndAst();
            ast.find(j.JSXElement).filter(path => componentspath.includes(path.node.openingElement.name.name)).replaceWith(() => childrenString);
        });
    }

    extractNewReturnedElementsForSourceComponent() {
        const { j, ast } = this.source.loadFileAndAst();
        if (this.source.componentType === 'Function') {
            ast.find(j.FunctionDeclaration).filter(path => {
                return (path.value.id && path.value.id.type === 'Identifier' && path.value.id.name === this.source.name);
            }).forEach(path => {
                this.source.returnedElements = extractReturnElements(path.node);
            }
            );
        } else if (this.source.componentType === 'ArrowFunction') {
            ast.find(j.VariableDeclaration).filter(path => {
                const declarations = path.value.declarations;
                return (declarations[0] !== undefined && declarations[0].type === 'VariableDeclarator'
                    && declarations[0].id.type === 'Identifier' && declarations[0].id.name === this.source.name);
            }).forEach(path => {
                path.node.declarations.forEach(declaration => {
                    if (declaration.init && declaration.init.type === 'ArrowFunctionExpression' && returnsJSX(declaration.init, j)) {
                        this.source.returnedElements = extractReturnElements(declaration.init);
                    }
                })
            })
        } else if (this.source.componentType === 'Class') {
            ast.find(j.ClassDeclaration).filter(path => {
                return (
                    path.value.id &&
                    path.value.id.type === 'Identifier' &&
                    path.value.id.name === this.source.name
                );
            }).forEach(path => {
                this.source.returnedElements = extractReturnElements(path.node);
            });
        }
    }

    addPropPassesToTheDestComponentOfComposedJSX(propMapping, returnPropsMap) {
        const { j } = this.source.loadFileAndAst();
        this.dest.properties.forEach(prop => {
            let propValueNode;

            // Check if the prop is in the propMapping
            for (const key in propMapping) {
                if (propMapping[key].includes(prop.propName)) {
                    // Resolve the prop value dynamically from the returnPropsMap
                    propValueNode = returnPropsMap.get(key);
                    const propValue = this.resolvePropValuePassedToComposedJSX(propValueNode, j);
                    if (propValue) {
                        // Add the resolved prop-value pair to the source
                        this.source.addNewPropToReturnElement(prop.propName, this.dest.name, propValue);
                    }
                }
            }
        });
    }

    addPropPassesFromTheFirstToSecondComponent(nonDrilledProps) {
        const { j } = this.source.loadFileAndAst();
        for (let i = 0; i < nonDrilledProps.length; i++) {
            const propName = Object.keys(nonDrilledProps[i])[0];
            const propValueNode = Object.values(nonDrilledProps[i])[0]; // The resolved AST node

            // Transform the AST node into a string or source code
            const propValue = this.resolvePropValuePassedToComposedJSX(propValueNode, j);
            if (this.path[0].destComponent.aliases && this.path[0].destComponent.aliases.filepaths.includes(this.source.reactFile.filePath)) {
                // Component alias case
                this.source.addNewPropToReturnElement(
                    propName,
                    this.path[0].destComponent.aliases.aliases[0],
                    propValue
                );
            } else {
                // Normal case
                this.source.addNewPropToReturnElement(
                    propName,
                    this.path[0].destComponent.name,
                    propValue
                );
            }
        }
    }

    addPropPassesFromTheFirstToIntermediateComponents(intermediateComponents, componentPropsMap) {
        const { j } = this.source.loadFileAndAst();
        for (let i = 0; i < intermediateComponents.length; i++) {
            if (componentPropsMap.has(intermediateComponents[i].name)) {
                const propsList = componentPropsMap.get(intermediateComponents[i].name);
                propsList.forEach(pr => {
                    const propName = Object.keys(pr)[0];
                    const propValueNode = Object.values(pr)[0]; // The resolved AST node

                    // Transform the AST node into a string or source code
                    const propValue = this.resolvePropValuePassedToComposedJSX(propValueNode, j);
                    this.source.addNewPropToReturnElement(
                        propName,
                        intermediateComponents[i].name,
                        propValue
                    );
                });
            }
        }
    }

    resolvePropValuePassedToComposedJSX(propValueNode, j) {
        if (propValueNode) {
            if (typeof propValueNode === 'string') {
                // Literal strings are used as-is
                return propValueNode;
            } else {
                // Generate source code from the AST node
                return j(propValueNode).toSource();
            }
        }
    }

    handleImportDeclarationsInComposition(reactComponents) {
        this.source.returnedElements.forEach(element => {
            const component = reactComponents.find(comp => comp.name === element);
            if (component) {
                const relativePath = pathLib.relative(pathLib.dirname(this.source.reactFile.filePath), component.reactFile.filePath);
                let importPath = `./${relativePath.replace(/\\/g, '/')}`;
                if (importPath.endsWith('.tsx')) {
                    importPath = importPath.slice(0, -4);
                }
                let isAlreadyImported = false;
                this.source.reactFile.importStatements.forEach(importStatement => {
                    if (importStatement.importSpecifiers.some(specifier => specifier.local === element)) {
                        isAlreadyImported = true;
                    }
                })
                if (!isAlreadyImported) {
                    const importDec = [];
                    importDec.push(new ImportSpecifier(element, element));
                    const importAsDefault = component.reactFile.exports.isDefault;
                    this.source.addAnImportStatement(importPath, importDec, importAsDefault);
                }
            }
        });
    }

    checkForOtherIntermediatePropsInPath(reactComponents, acceptedProps) {
        let componentsArray = this.path.map(pp => pp.sourceComponent);
        componentsArray.push(this.path[this.path.length - 1].destComponent);
        let hasOtherProps = false;
        let addedAcceptedProps = [...acceptedProps];//add here the renamings of the prop
        acceptedProps.forEach(prop => {
            if (this.propMapping[Object.keys(prop)[0]]) {
                this.propMapping[Object.keys(prop)[0]].forEach(objProp => {
                    addedAcceptedProps.push({ [objProp]: `${objProp}` });
                })

            }
        })

        for (let i = 0; i < this.path.length - 1; i++) {
            const component = componentsArray.find(comp => comp.name === this.path[i].destComponent.name);
            if (!component) throw new Error("Component not found");

            const passedProps = component.getChildPropValues(reactComponents);
            let propsArray = passedProps[this.path[i + 1].destComponent.compositeKeyName].map(obj => Object.values(obj)[0]);
            propsArray = removeDuplicateObjects(propsArray);
            propsArray.forEach(prop => {
                if (prop !== Object.keys(this.properties[0])[0] && !addedAcceptedProps.some(obj => prop in obj)) {
                    hasOtherProps = true;
                }
            });
        }

        return hasOtherProps;
    }

    generatePropMapping(properties = this.properties) {
        const mapping = {};
        properties.flat().forEach(prop => {
            const [originalName] = Object.entries(prop)[0];
            mapping[originalName] = [originalName];
        });
        this.path.forEach(propPassing => {
            const { props: passingProps } = propPassing;
            passingProps.forEach(prop => {
                const [aliasName, originalName] = Object.entries(prop)[0];
                if (originalName === undefined) return;

                let found = false;
                if (!mapping[originalName]) {
                    mapping[originalName] = [originalName];
                    mapping[aliasName] = [originalName];
                    found = true;
                }
                if (mapping[aliasName]) {
                    mapping[aliasName].push(aliasName);
                    found = true;
                }
                if (!found) {
                    mapping[originalName].push(originalName);
                }
                mapping[originalName].push(aliasName);

            });
        });
        this.propMapping = mapping;
        return mapping;
    }

    getPropTypeMapping(groupedProps) {
        let mapping = new Map();
        const propertyObjects = this.path[0].destComponent.properties;
        groupedProps.forEach(gp => {
            const property = propertyObjects.find(pr => pr.propName === Object.keys(gp)[0])
            const propType = (property?.propType) ? property.propType : "string";
            mapping.set(Object.keys(gp)[0], propType);
        });
        return mapping;
    }

    giveDetailedPropDrillingPath(propDrillings, reactComponents, groupedProps) {
        let pathDetails = [];
        let propDrillingInfo = new PropDrillingInfo(this.source, this.dest);

        const colorText = (text, color) => {
            const colors = {
                green: '\x1b[32m',
                red: '\x1b[31m',
                reset: '\x1b[0m'
            };
            return `${colors[color]}${text}${colors.reset}`;
        };
        const canRefactorWithContext = !this.checkIfDestComponentHasOtherParentComponents(propDrillings);
        const canRefactorWithComposition = !this.checkForOtherIntermediatePropsInPath(reactComponents, groupedProps);
        const canBeRefactored = (canRefactorWithContext || canRefactorWithComposition);

        /* Refactoring preconditions, if true they are satisfied */
        propDrillingInfo.updatePreconditionStatus(canRefactorWithContext, canRefactorWithComposition)
        
        if (!canRefactorWithContext) {
            this.contextRefactoring = false;
        }
        if (!canRefactorWithComposition) {
            this.compositionRefactoring = false;
        }
        const contextTag = colorText('(Context)', canRefactorWithContext ? 'green' : 'red');
        const compositionTag = colorText('(Component Composition)', canRefactorWithComposition ? 'green' : 'red');

        const propMapping = this.generatePropMapping();
        const relevantProps = this.properties.flat().flatMap(prop => {
            const key = Object.keys(prop)[0];
            const value = Object.values(prop)[0];
            return [key, value];
        });
        this.path.forEach((propPassing, index) => {
            const component = propPassing.sourceComponent;

            const visitedProps = new Set();
            let filteredProps = []
            propPassing.props.forEach(p => {
                if (!visitedProps.has(Object.keys(p)[0])) {
                    visitedProps.add(Object.keys(p)[0]);
                    filteredProps.push(p);
                }
            })
            const propsInComponent = filteredProps.filter(prop => {
                const originalName = Object.keys(prop)[0];

                return relevantProps.includes(originalName) ||
                    relevantProps.some(drilledProp => propMapping[drilledProp]?.includes(originalName));
            })
                .map(prop => {
                    const [aliasName, originalName] = Object.entries(prop)[0];
                    const returnedComponentName = component.returnedElements.find(c => c === propPassing.destComponent.name || propPassing?.destComponent?.aliases?.aliases?.includes(c));
                    /* Check based on the component's returned name.Not the original */
                    let nonPurePropPassing = component.checkIfPropIsUsedOutsideJSXProps(originalName, returnedComponentName)
                    let propInfo = {}
                    propInfo.name = aliasName;
                    propInfo.targetAlias = returnedComponentName;
                    propInfo.purePropPassing = !nonPurePropPassing;
                    propInfo.desciption = nonPurePropPassing ? `${aliasName}` : `${aliasName} (drilled only)`;

                    return propInfo;
                });

            if (propsInComponent.length >= 1) {
                propDrillingInfo.addPropPassing(propPassing.sourceComponent,
                    propPassing.destComponent, propsInComponent[0].targetAlias, 
                    propsInComponent[0].name, propsInComponent[0].purePropPassing);
            } else {
                propDrillingInfo.addPropPassing(propPassing.sourceComponent,
                    propPassing.destComponent, '-', '-', false);
            }
            
            const componentDetails = `${component.name}(${propsInComponent.map(p => p.desciption).join(', ')})`;
            pathDetails.push(componentDetails);
        });
        const destComponent = `${this.dest.name}`;

        const fullPath = `[${pathDetails.join(', ')}, ${destComponent}] ${contextTag} ${compositionTag}`;
        return { fullPath, canBeRefactored, propDrillingInfo };
    }

    /**
     * Function that checks if the prop drilling has a common ending 
     * with a different propDrilling.
     * @param {*} propDrillings 
     * @param {*} groupedProps 
     * @returns 
     */
    checkIfPdPathHasCommonEnding(propDrillings, groupedProps) {
        const groupedPropDrillings = [];
        const groupedPropsKeys = groupedProps.map(item => Object.keys(item)[0]);
        propDrillings = propDrillings.filter(pd => pd !== this);
        for (let i = 0; i < propDrillings.length; i++) {
            const currentPropDrilling = propDrillings[i];
            const propDrillingPropKeys = currentPropDrilling.properties.map(pr => Object.keys(pr)[0])[0];

            if (currentPropDrilling.source.name !== this.source.name &&
                currentPropDrilling.dest.name === this.dest.name && groupedPropsKeys.includes(propDrillingPropKeys)
            ) {
                groupedPropDrillings.push(currentPropDrilling);
            }
        }
        return groupedPropDrillings;
    }

    /**
     * Function that checks if the prop drilling has a common start 
     * with a different propDrilling.
     */
    checkIfPdPathHasCommonStart(propDrillings, groupedProps) {
        const groupedPropDrillings = [];
        const groupedPropsKeys = groupedProps.map(item => Object.keys(item)[0]);
        propDrillings = propDrillings.filter(pd => pd !== this);
        for (let i = 0; i < propDrillings.length; i++) {
            const currentPropDrilling = propDrillings[i];
            const propDrillingPropKeys = currentPropDrilling.properties.map(pr => Object.keys(pr)[0])[0];

            if (currentPropDrilling.source.name === this.source.name &&
                currentPropDrilling.dest.name !== this.dest.name &&
                groupedPropsKeys.includes(propDrillingPropKeys)) {
                groupedPropDrillings.push(currentPropDrilling);
            }
        }
        return groupedPropDrillings;
    }

    //Function that checks if the Destination Component is returned by another component that is not part of any PropDrilling path
    checkIfDestComponentHasOtherParentComponents(propDrillings) {
        const otherPropDrillings = propDrillings.filter(pd => pd !== this);
        let parents = this.dest.parentElements;
        parents = parents.filter(p => p.name !== this.path[this.path.length - 1].sourceComponent.name);
        const componentsInOtherPaths = new Set();
        otherPropDrillings.forEach(pd => {
            pd.path.forEach(node => {
                componentsInOtherPaths.add(node.sourceComponent.name);
                componentsInOtherPaths.add(node.destComponent.name);
            });
        });

        // Check if any remaining parent is not in any prop drilling path
        for (const parent of parents) {
            if (!componentsInOtherPaths.has(parent.name)) {
                return true;
            }
        }
        return false;
    }

    //Function that extracts common props from compound prop drillings
    getGroupedProps(otherPropDrillings) {
        let groupedProps = [];
        //Group prop drilling with common path and their properties
        const groupedPropDrillings = groupPropDrillingsByPath(otherPropDrillings);
        groupedPropDrillings.forEach(gp => {
            const exists = gp.properties.some(prop => JSON.stringify(prop) === JSON.stringify(this.properties[0]));
            if (exists) {
                groupedProps.push(...gp.properties);
            }
        });
        return removeDuplicateObjects(groupedProps);
    }
}

function printPropDrillingsWithDetails(propDrillings, reactComponents) {
    let possibleRefactorings = 0;
    let allPropDrillings = []
    propDrillings.forEach(propDrilling => {
        const groupedProps = propDrilling.getGroupedProps(propDrillings);
        let { fullPath, canBeRefactored, propDrillingInfo } = propDrilling.giveDetailedPropDrillingPath(propDrillings, reactComponents, groupedProps);
        allPropDrillings.push(propDrillingInfo)
        console.log(fullPath);

        if (canBeRefactored) possibleRefactorings++;
    });

    return {possibleRefactorings, allPropDrillings};
}
export { PropDrilling, printPropDrillingsWithDetails };
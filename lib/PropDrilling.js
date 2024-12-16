import { extractReturnElements } from './loadingFuncs.js';
import { createNewContextFile } from './CreateNewFiles.js';
import { returnsJSX,groupPropDrillingsByPath, removeDuplicateObjects } from './util.js';
import { ImportSpecifier } from './ImportStatement.js';
import * as path1 from 'path';

class PropDrilling{
    constructor(properties,path,source,dest){
        this.properties = properties,
        this.path = path;
        this.source = source;
        this.dest = dest;
    }

    removeAllProps(reactComponents,collectedProps){
        let isAliased = false;
        let finalReturnProps = [];
        for(let i=0; i<this.path.length;i++){
            const propMapping = this.generatePropMapping();
            finalReturnProps = [...collectedProps];

            //Adds in the collectedProps List the renamings of the props 
            finalReturnProps.forEach(prop => {
                if(propMapping[Object.keys(prop)[0]]){
                    const propMapList = propMapping[Object.keys(prop)[0]];
                    for(let i=0; i<propMapList.length; i++){
                        const isKeyPresent = finalReturnProps.some(p => Object.keys(prop)[0] === propMapList[i]);
                        if (!isKeyPresent) {
                            finalReturnProps.push({ [propMapList[i]]: propMapList[i] });
                        }
                    }
                }
            })

            try{
            finalReturnProps.forEach(prop => {
                const isAlias = this.path[i].sourceComponent.removePropFromReturnElement(Object.keys(prop)[0],this.path[i].destComponent.name,reactComponents);
                if(isAlias) isAliased = true;
                this.path[i].destComponent.removeProperty(Object.keys(prop)[0]);
            })
            this.path[i].sourceComponent.isChanged = true;
            }catch(err){
            throw new Error(`Prop Not removed in the ${this.path[i].sourceComponent.name} Component. Something went wrong.`);
            }
        }
        return isAliased;
    }

    addUseContext(reactComponents,propDrillings){
        const propMapping = this.generatePropMapping();
        //Check if there are multiple Prop Drillings ending with the same path
        if(this.checkIfPdPathHasCommonEnding(propDrillings)){
            throw new Error("Cannot refactor with useContext if there are multiple Prop Drillings ending with the same path. \
                 Aborting refactoring ...");
        }
        //Group prop drilling with common path and their properties
        let groupedProps = [];
        const groupedPropDrillings = groupPropDrillingsByPath(propDrillings);
        groupedPropDrillings.forEach(gp => {
            const exists = gp.properties.some(prop => JSON.stringify(prop) === JSON.stringify(this.properties[0]));
            if(exists){
                groupedProps.push(...gp.properties);
            }
        })
        groupedProps = removeDuplicateObjects(groupedProps);
        //Create Context file
        const capitalizedProps = createNewContextFile(groupedProps);
        //Remove Props and Prop passings
        this.removeAllProps(reactComponents,groupedProps);
        //Wrap elements with provider.
        this.source.wrapReturnElementsWithProvider(groupedProps,capitalizedProps);
        //Add Context Usage in Intermediate Components if needed
        for(let i=1; i<this.path.length; i++){
            let usedProps = [];//array of the props that the intermediate component is using
            groupedProps.forEach(prop => {
                const propMap = propMapping[Object.keys(prop)[0]];
                const returnedComponentName = this.path[i].sourceComponent.returnedElements.find(c => c===this.path[i].destComponent.name 
                    || (this.path[i].destComponent.aliases && this.path[i].destComponent.aliases.aliases.includes(c)));//Check based on the component's returned name.Not the original(Possibility of Component Aliasing)
                //Check if the prop is used in other parts of the Component except the passing to the prop drilling path
                if(this.path[i].sourceComponent.checkIfPropIsUsedOutsideJSXProps(propMap[i],returnedComponentName)){
                    usedProps.push({ [propMap[i]]: propMap[i] });
                }            
         });
         if(usedProps.length>0){
            this.path[i].sourceComponent.addValueContextUsage(usedProps,propMapping,i,capitalizedProps);
        }
        }
        this.dest.addValueContextUsage(groupedProps,propMapping,this.path.length,capitalizedProps);
    }

    addComponentComposition(reactComponents,otherPropDrillings){
        let groupedProps = [];
        let intermediateComponents = [];
        const propMapping = this.generatePropMapping();
        //Group prop drilling with common path and their properties
        const groupedPropDrillings = groupPropDrillingsByPath(otherPropDrillings);
        groupedPropDrillings.forEach(gp => {
            const exists = gp.properties.some(prop => JSON.stringify(prop) === JSON.stringify(this.properties[0]));
            if(exists){
                groupedProps.push(...gp.properties);
            }
        })
        //Check if extra props are passed from intermediate Components of the Prop Drilling Path
        if(this.checkForOtherIntermediatePropsInPath(reactComponents,groupedProps)){
            throw new Error("Cannot do Component Composition, because extra props are passed from intermediate Components of the Path. Use Context instead...");
            }
        //Check if prop is used in intermediate components
        for (let i = 1; i < this.path.length; i++) {
            intermediateComponents.push(this.path[i].sourceComponent)
            groupedProps.forEach(prop => {
                if (this.path[i].sourceComponent && this.path[i].sourceComponent.checkIfPropIsUsedOutsideJSXProps(Object.keys(prop)[0], this.path[i].destComponent.name)) {
                    throw new Error(`Prop ${prop} is used in intermediate components. Aborting refactoring ...`);
                }
            });
        }

        const isAliased = this.removeAllProps(reactComponents,groupedProps);
        let composedJSX;
        //Constructs the PropDrilling path with the names of the components
        let path=[];
        for(let i=0;i<this.path.length;i++){
            path.push(this.path[i].sourceComponent.name);
        }
        path.push(this.path[this.path.length-1].destComponent.name);
        if(!isAliased){
            composedJSX = this.source.insertComposition(path);
        } else {
            //case for handling Component Aliasing of the second component of the Prop Drilling Hierarchy
            //bug: Handle case for component aliasing in the third,fourth,... component
            let newpath = path;
            const renamedComp = reactComponents.find(comp => comp.name===this.path[0].destComponent.name);
            newpath[1] = renamedComp.aliases.aliases[0];
            composedJSX = this.source.insertComposition(newpath);
        }

        //Replaces old JSX with new Composed
        const {j,ast} = this.source.loadFileAndAst();
        const jsxElements = ast.find(j.JSXElement).filter(path => {
            return path.node.openingElement.name.name === this.path[1].sourceComponent.name ||
                (this.path[1].sourceComponent.aliases && this.path[1].sourceComponent.aliases.aliases.includes(path.node.openingElement.name.name)) 
        });
        jsxElements.replaceWith(() => composedJSX);
        const componentspath = path;

        //Insert React's children variable in intermediate components' jsx and props
        intermediateComponents.forEach(el => {
            el.addNewProperty('children');
            const {j,ast} = el.loadFileAndAst();
            ast.find(j.JSXElement).filter(path => componentspath.includes(path.node.openingElement.name.name)).replaceWith(() => '{children}');
        });

        //Add removed props in dest components
        //Problem here with renamings
        groupedProps.forEach(prop => {
            if(propMapping[Object.keys(prop)[0]]){
                const propMapList = propMapping[Object.keys(prop)[0]];
                this.dest.addNewProperty(propMapList[propMapList.length-1].split("=")[0]);
            }
        })

        //Find new Returned Elements of the Refactored component
        if(this.source.componentType === 'Function'){
            ast.find(j.FunctionDeclaration).filter(path => {
                return(path.value.id && path.value.id.type==='Identifier' && path.value.id.name===this.source.name);
            }).forEach(path => {
                this.source.returnedElements = extractReturnElements(path.node);
                }
            );
         } else if(this.source.componentType === 'ArrowFunction'){
            ast.find(j.VariableDeclaration).filter(path => {
                const declarations = path.value.declarations;
                return(declarations[0]!==undefined && declarations[0].type==='VariableDeclarator' 
                    && declarations[0].id.type==='Identifier' && declarations[0].id.name===this.source.name);
            }).forEach(path => {
                path.node.declarations.forEach(declaration => {
                    if(declaration.init && declaration.init.type === 'ArrowFunctionExpression' && returnsJSX(declaration.init, j)){
                        this.source.returnedElements = extractReturnElements(declaration.init);
                    }
                })
            })
        }

        //Resolve the prop name-value that will be passed in the last component of the prop Drilling path
        this.dest.properties.forEach(prop => {
            let propValue;
            for(const key in propMapping){
                if(propMapping[key].includes(prop)){
                    propValue=key;
                    this.source.addNewPropToReturnElement(prop,this.dest.name,propValue);
                }
            }
        });

        //Handle Import Declarations 
        this.source.returnedElements.forEach(element => {
            const component = reactComponents.find(comp => comp.name === element);
            if (component) {
                const relativePath = path1.relative(path1.dirname(reactComponents[0].reactFile.filePath), component.reactFile.filePath);
                const importPath = `./${relativePath.replace(/\\/g, '/')}`;
                let isAlreadyImported = false;
                this.source.reactFile.importDeclarations.forEach(importDeclaration => {
                    if(importDeclaration.importSpecifiers.some(specifier => specifier.local === element)){
                        isAlreadyImported = true;
                    }
                })
                if (!isAlreadyImported) {
                    const importDec = [];
                    importDec.push(new ImportSpecifier(element,element));
                    this.source.addAnImportStatement(importPath, importDec);
                }
            }
        });
        this.source.isChanged = true;
    }

    checkForOtherIntermediatePropsInPath(reactComponents,acceptedProps){
        let hasOtherProps = false;
        for(let i=0;i<this.path.length-1;i++){
            const component = reactComponents.find(comp => comp.name===this.path[i].destComponent.name);
            if(!component) throw new Error("Component not found");
        
            const passedProps = component.getChildPropValues(reactComponents);
            let propsArray = passedProps[this.path[i+1].destComponent.name].map(obj => Object.values(obj)[0]);
            propsArray = removeDuplicateObjects(propsArray);
            propsArray.forEach(prop => {
                if(prop !== Object.keys(this.properties[0])[0] && !acceptedProps.some(obj => prop in obj)){
                    hasOtherProps = true;
                } 
            });
        }
        return hasOtherProps;
    }

    generatePropMapping() {
        const mapping = {};
        this.properties.flat().forEach(prop => {
            const [originalName, originalValue] = Object.entries(prop)[0];
            mapping[originalValue] = [originalName];
        });
        this.path.forEach(propPassing => {
            const { props: passingProps } = propPassing;
            passingProps.forEach(prop => {
                const [aliasName, originalName] = Object.entries(prop)[0];
                if (!mapping[originalName]) {
                    mapping[originalName] = [originalName];  
                }
                mapping[originalName].push(aliasName);
            });
        });
        this.propMapping = mapping;
        return mapping;
    }

    giveDetailedPropDrillingPath() {
        let pathDetails = [];
        const propMapping = this.generatePropMapping();
        const relevantProps = this.properties.flat().map(prop => Object.values(prop)[0]);
        this.path.forEach((propPassing,index) => {
            const component = propPassing.sourceComponent;
            const propsInComponent = propPassing.props
            .filter(prop => {
                const originalName = Object.values(prop)[0];

                return relevantProps.includes(originalName) ||
                relevantProps.some(drilledProp => propMapping[drilledProp]?.includes(originalName));
            })
            .map(prop => {
                const [aliasName, originalName] = Object.entries(prop)[0];
                const returnedComponentName = component.returnedElements.find(c => c===propPassing.destComponent.name || (propPassing.destComponent.aliases && propPassing.destComponent.aliases.aliases.includes(c)));//Check based on the component's returned name.Not the original
                return component.checkIfPropIsUsedOutsideJSXProps(originalName, returnedComponentName) 
                    ? `${aliasName}` 
                    : `${aliasName} (drilled only)`;
            });
            const componentDetails = `${component.name}(${propsInComponent.join(', ')})`;
            pathDetails.push(componentDetails);
        });
        const destComponent = `${this.dest.name}`;
        const fullPath = `[${pathDetails.join(', ')}, ${destComponent}]`;
        return fullPath;
    }

    //Function that checks if the prop drilling has a common ending with a different propDrilling
    //preventing the useContext refactoring
    checkIfPdPathHasCommonEnding(propDrillings){
        propDrillings = propDrillings.filter(pd => pd!==this);
        for(let i=0; i<propDrillings.length;i++){
            if(propDrillings[i].source.name!==this.source.name &&
                propDrillings[i].dest.name===this.dest.name){
                    return true;
                }
        }
        return false;
    }
}

export {PropDrilling};
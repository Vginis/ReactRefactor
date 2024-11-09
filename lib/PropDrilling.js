import { extractReturnElements } from './loadingFuncs.js';
import { createNewContextFile } from './CreateNewFiles.js';
import { returnsJSX,removeDuplicates,groupPropDrillingsByPath } from './util.js';
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
            //todo also here getChildProps must be removed and put getChildPropValues
            const componentReturnProps = this.path[i].sourceComponent.getChildProps(reactComponents);
            finalReturnProps = [...collectedProps];
            //todo review this part of code if needed.
            // if(componentReturnProps[this.path[i].destComponent.name]){
            //     console.log(componentReturnProps[this.path[i].destComponent.name]);
            //     componentReturnProps[this.path[i].destComponent.name].forEach(p => {
            //         if(!finalReturnProps.includes(p)){
            //             finalReturnProps.push(p);
            //         }
            //     });
            // }

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
        let groupedProps = [];
        const groupedPropDrillings = groupPropDrillingsByPath(propDrillings);
        groupedPropDrillings.forEach(gp => {
            const exists = gp.properties.some(prop => JSON.stringify(prop) === JSON.stringify(this.properties[0]));
            if(exists){
                groupedProps.push(...gp.properties);
            }
        })
        createNewContextFile(groupedProps,this.dest.reactFile.filePath);
        this.removeAllProps(reactComponents,groupedProps);
        this.source.wrapReturnElementsWithProvider(groupedProps,this.dest.reactFile.filePath);
        this.dest.addValueContextUsage(groupedProps);
    }

    addComponentComposition(reactComponents,otherPropDrillings){
        let groupedProps = [];
        let intermediateComponents = [];
        const groupedPropDrillings = groupPropDrillingsByPath(otherPropDrillings);
        groupedPropDrillings.forEach(gp => {
            const exists = gp.properties.some(prop => JSON.stringify(prop) === JSON.stringify(this.properties[0]));
            if(exists){
                groupedProps.push(...gp.properties);
            }
        })
        if(this.checkForOtherIntermediatePropsInPath(reactComponents,groupedProps)){
            throw new Error("Cannot do Component Composition, because extra props are passed from intermediate Components of the Path. Use Context instead...");
            }
        for (let i = 1; i < this.path.length; i++) {
            intermediateComponents.push(this.path[i].sourceComponent)
            groupedProps.forEach(prop => {
                if (this.path[i].sourceComponent && this.path[i].sourceComponent.checkIfPropIsUsedOutsideJSXProps(Object.keys(prop)[0], this.path[i].destComponent.name)) {
                    throw new Error(`Prop ${prop} is used in intermediate components. Aborting refactoring ...`);
                }
            });
        }
        const passedProps = this.source.extractPropsForComponent(this.path[1].sourceComponent.name);
        //todo problem here with aliases
        //also this method can be removed and use getChildPropValues.
        
        this.properties.forEach(prop => {
            delete passedProps[prop]
            }   
        );
        const isAliased = this.removeAllProps(reactComponents,groupedProps);
        let composedJSX;
        let path=[];
        if(!isAliased){
            for(let i=0;i<this.path.length;i++){
                path.push(this.path[i].sourceComponent.name);
            }
            path.push(this.path[this.path.length-1].destComponent.name);
            composedJSX = this.source.insertComposition(path);
        } else {
            //todo check here the aliasing how it goes
            let newpath = [];
            const renamedComp = reactComponents.find(comp => comp.name===this.path[1]);
            newpath[1] = renamedComp.aliases.aliases[0];
            composedJSX = this.source.insertComposition(newpath);
        }
        const {j,ast} = this.source.loadFileAndAst();
        const jsxElements = ast.find(j.JSXElement).filter(path => {
            return path.node.openingElement.name.name === this.path[1].sourceComponent.name; 
        });
        jsxElements.replaceWith(() => composedJSX);
        const componentspath = path;
        intermediateComponents.forEach(el => {
            el.addNewProperty('children');
            const {j,ast} = el.loadFileAndAst();

            ast.find(j.JSXElement).filter(path => componentspath.includes(path.node.openingElement.name.name)).replaceWith(() => '{children}');
        });

        groupedProps.forEach(prop => {
            this.dest.addNewProperty(Object.keys(prop)[0]);
        })

        if(this.source.componentType === 'Function'){
            ast.find(j.FunctionDeclaration).forEach(path => {
                this.source.returnedElements = extractReturnElements(path.node);
                }
            );
         } else if(this.source.componentType === 'ArrowFunction'){
            ast.find(j.VariableDeclaration).forEach(path => {
                path.node.declarations.forEach(declaration => {
                    if(declaration.init && declaration.init.type === 'ArrowFunctionExpression' && returnsJSX(declaration.init, j)){
                        this.source.returnedElements = extractReturnElements(declaration.init);
                    }
                })
            })
        }
        groupedProps.forEach(prop => {
            this.source.addNewPropToReturnElement(Object.keys(prop)[0],this.dest.name);
        });

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
            propsArray = removeDuplicates(propsArray);
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

                if (!mapping[originalName].includes(aliasName)) {
                    mapping[originalName].push(aliasName);
                }
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
                return component.checkIfPropIsUsedOutsideJSXProps(originalName, propPassing.destComponent.name) 
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
}

export {PropDrilling};
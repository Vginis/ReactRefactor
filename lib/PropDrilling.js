import { extractReturnElements } from './loadingFuncs.js';
import { createNewContextFile } from './CreateNewFiles.js';
import { returnsJSX,removeDuplicates } from './util.js';
import { ImportSpecifier } from './ImportStatement.js';
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
        for(let i=0; i<this.path.length-1;i++){
            const component = reactComponents.find(comp => comp.name === this.path[i]);
            if(component){
                const componentReturnProps = component.getChildProps(reactComponents);
                finalReturnProps = [...collectedProps];
                if(componentReturnProps[this.path[i+1]]){
                    componentReturnProps[this.path[i+1]].forEach(p => {
                        if(!finalReturnProps.includes(p)){
                            finalReturnProps.push(p);
                        }
                    });
                }
               try{
                finalReturnProps.forEach(prop => {
                    const isAlias = component.removePropFromReturnElement(prop,this.path[i+1],reactComponents);
                    if(isAlias) isAliased = true;
                })
                component.isChanged = true;
               }catch(err){
                throw new Error(`Prop Not removed in the ${component.name} Component. Something went wrong.`);
               }
            }
        }
        for(let j=1; j<this.path.length;j++){
            const component = reactComponents.find(comp => comp.name === this.path[j]);
            if(component){
               try{
                finalReturnProps.forEach(prop => {
                    component.removeProperty(prop);
                });
               }catch(err){
                throw new Error(`Prop Not removed in the ${component.name} Component. Something went wrong.`);
               }
            }
        }
        return isAliased;
    }

    addUseContext(reactComponents){
        const destComponent = reactComponents.find(comp => comp.name===this.dest);
        if(!destComponent){
            throw new Error(`Cannot find component with name ${this.dest}`);
        }

        createNewContextFile(this.properties,destComponent.reactFile.filePath);
        this.removeAllProps(reactComponents,this.properties);
        const source = reactComponents.find(comp => comp.name === this.source);
        const dest = reactComponents.find(comp => comp.name === this.dest);
        if(source && dest){
            source.wrapReturnElementsWithProvider(this.properties,dest.reactFile.filePath);
            dest.addValueContextUsage(this.properties);
        } else {throw new Error('Source or Destination Component doesnt exist')}
    }

    addComponentComposition(reactComponents){
        if(this.checkForOtherIntermediatePropsInPath(reactComponents)){
            throw new Error("Cannot do Component Composition, because extra props are passed from intermediate Components of the Path. Use Context instead...");
            }
        for (let i = 1; i < this.path.length - 1; i++) {
            const component = reactComponents.find(comp => comp.name === this.path[i]);
            this.properties.forEach(prop => {
                if (component && component.checkIfPropIsUsedOutsideJSXProps(prop, this.path[i + 1])) {
                    throw new Error(`Prop ${prop} is used in intermediate components. Aborting refactoring ...`);
                }
            });
        }
        const sourceComponent = reactComponents.find(comp => comp.name === this.source);
        const destComponent = reactComponents.find(comp => comp.name === this.dest);
        if(!sourceComponent || !destComponent){
            throw new Error('Source or Destination Component do not exist');
        }
        const intermediateComponentNames = this.path.filter(name => name !== this.source && name !== this.dest);
        let intermediateComponents = [];
        intermediateComponentNames.forEach(el =>  {
            const component = reactComponents.find(comp => comp.name === el);
            if(component){
                intermediateComponents.push(component);
            }
        });       
        const passedProps = sourceComponent.extractPropsForComponent(this.path[1]);
        this.properties.forEach(prop => {
            delete passedProps[prop]
            }   
        );
        const isAliased = this.removeAllProps(reactComponents,this.properties);
        let composedJSX;
        if(!isAliased){
            composedJSX = sourceComponent.insertComposition(this.path);
        } else {
            let newpath = this.path;
            const renamedComp = reactComponents.find(comp => comp.name===this.path[1]);
            newpath[1] = renamedComp.aliases.aliases[0];
            composedJSX = sourceComponent.insertComposition(newpath);
        }
        const {j,ast} = sourceComponent.loadFileAndAst();
        const jsxElements = ast.find(j.JSXElement).filter(path => {
            return path.node.openingElement.name.name === this.path[1]; 
        });
        jsxElements.replaceWith(() => composedJSX);
        
        intermediateComponents.forEach(el => {
            el.addNewProperty('children');
            const {j,ast} = el.loadFileAndAst();
            ast.find(j.JSXElement).filter(path => this.path.includes(path.node.openingElement.name.name)).replaceWith(() => '{children}');
        });
        
        this.properties.forEach(prop => {
            destComponent.addNewProperty(prop);
        })

        if(sourceComponent.componentType === 'Function'){
            ast.find(j.FunctionDeclaration).forEach(path => {
                sourceComponent.returnedElements = extractReturnElements(path.node);
                }
            );
         } else if(sourceComponent.componentType === 'ArrowFunction'){
            ast.find(j.VariableDeclaration).forEach(path => {
                path.node.declarations.forEach(declaration => {
                    if(declaration.init && declaration.init.type === 'ArrowFunctionExpression' && returnsJSX(declaration.init, j)){
                        sourceComponent.returnedElements = extractReturnElements(declaration.init);
                    }
                })
            })
        }
        this.properties.forEach(prop => {
            sourceComponent.addNewPropToReturnElement(prop,this.dest);
        });
        for (const key in passedProps){
            if(passedProps.hasOwnProperty(key)){
                sourceComponent.addNewPropToReturnElement(key,this.path[1],passedProps[key]);
            }
        }
        sourceComponent.returnedElements.forEach(element => {
            const component = reactComponents.find(comp => comp.name === element);
            if (component) {
                const fileName = "./"+component.reactFile.filePath.split('\\').pop();
                let isAlreadyImported = false;
                sourceComponent.reactFile.importDeclarations.forEach(importDeclaration => {
                    if(importDeclaration.importSpecifiers.includes(element)){
                        isAlreadyImported = true;
                    }
                })
                if (!isAlreadyImported) {
                    const importDec = [];
                    importDec.push(new ImportSpecifier(element,element));
                    sourceComponent.addAnImportStatement(fileName, importDec);
                }
            }
        });
        sourceComponent.isChanged = true;
    }

    checkForOtherIntermediatePropsInPath(reactComponents){
        let hasOtherProps = false;
        for(let i=1;i<this.path.length-1;i++){
            const component = reactComponents.find(comp => comp.name===this.path[i]);
            if(!component) throw new Error("Component not found");
        
            const passedProps = component.getChildPropValues(reactComponents);
            let propsArray = passedProps[this.path[i+1]].map(obj => Object.values(obj)[0]);
            propsArray = removeDuplicates(propsArray);
            propsArray.forEach(prop => {
                if(!this.properties.includes(prop)){
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
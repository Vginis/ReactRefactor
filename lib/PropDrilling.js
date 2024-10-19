import jscodeshift from 'jscodeshift';
import { extractReturnElements } from './loadingFuncs.js';
import { createNewContextFile } from './CreateNewFiles.js';
import { returnsJSX,removeDuplicates } from './util.js';
import { ImportSpecifier } from './ImportStatement.js';
class PropDrilling{
    constructor(property,path,source=path[0],dest=path[path.length-1]){
        this.property = property,
        this.path = path;
        this.source = source;
        this.dest = dest;
    }

    removeAllProps(reactComponents,collectedProps){
        let isAliased = false;
        for(let i=0; i<this.path.length-1;i++){
            const component = reactComponents.find(comp => comp.name === this.path[i]);
            if(component){
               try{
                collectedProps.forEach(prop => {
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
                collectedProps.forEach(prop => {
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

        createNewContextFile(this.property,destComponent.reactFile.filePath);
        this.removeAllProps(reactComponents,this.property);
        const source = reactComponents.find(comp => comp.name === this.source);
        const dest = reactComponents.find(comp => comp.name === this.dest);
        if(source && dest){
            source.wrapReturnElementsWithProvider(this.property,dest.reactFile.filePath);
            dest.addValueContextUsage(this.property);
        } else {throw new Error('Source or Destination Component doesnt exist')}
    }

    addComponentComposition(reactComponents){
        for (let i = 1; i < this.path.length - 1; i++) {
            const component = reactComponents.find(comp => comp.name === this.path[i]);
            this.property.forEach(prop => {
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
        this.property.forEach(prop => {
            delete passedProps[prop]
            }   
        );
        const isAliased = this.removeAllProps(reactComponents,this.property);
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
        
        this.property.forEach(prop => {
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
        this.property.forEach(prop => {
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
}

function giveDetailedPropDrillingPath(propDrillings,reactComponents){
    return propDrillings.map(drilling => {
        const {property: props,path} = drilling;
        const formattedPath = [];

        path.forEach((componentName,index) => {
            let propsUsed = [];
            if(index===0 || index === path.length-1){
                propsUsed = props;
            } else {
                const component = reactComponents.find(comp => componentName === comp.name);
                if(!component) throw new Error("Component not found");
                propsUsed = props.filter(prop => component.checkIfPropIsUsedOutsideJSXProps(prop,path[index+1]));
            }
            const componentWithProps = propsUsed.length > 0
                ? `${componentName}(${propsUsed.join(', ')})` 
                : componentName;

            formattedPath.push(componentWithProps);
        });
        return `[${formattedPath.join(', ')}]`;
    });
}

function checkForOtherIntermediatePropsInPath(propDrillingObj,reactComponents){
    let hasOtherProps = false;
    for(let i=1;i<propDrillingObj.path.length-1;i++){
        const component = reactComponents.find(comp => comp.name===propDrillingObj.path[i]);
        if(!component) throw new Error("Component not found");
    
        const passedProps = component.getChildProps(reactComponents);
        const propsArray = passedProps[propDrillingObj.path[i+1]];
        const filteredPropsArray = removeDuplicates(propsArray);
        filteredPropsArray.forEach(prop => {
            if(!propDrillingObj.property.includes(prop)){
                hasOtherProps = true;
            } 
        });
    }
    return hasOtherProps;
}
export {PropDrilling,giveDetailedPropDrillingPath,checkForOtherIntermediatePropsInPath};
import jscodeshift from 'jscodeshift';
import { extractReturnElements } from './loadingFuncs.js';
import { createNewContextFile } from './CreateNewFiles.js';
import { returnsJSX } from './util.js';
class PropDrilling{
    constructor(property,path,source=path[0],dest=path[path.length-1]){
        this.property = property,
        this.path = path;
        this.source = source;
        this.dest = dest;
    }

    removeAllProps(reactComponents,collectedProps){
        for(let i=0; i<this.path.length-1;i++){
            const component = reactComponents.find(comp => comp.name === this.path[i]);
            if(component){
               try{
                collectedProps.forEach(prop => {
                    component.removePropFromReturnElement(prop,this.path[i+1]);
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
    }

    addUseContext(reactComponents){
        createNewContextFile(this.property);
        this.removeAllProps(reactComponents);
        const source = reactComponents.find(comp => comp.name === this.source);
        const dest = reactComponents.find(comp => comp.name === this.dest);
        if(source && dest){
            source.wrapReturnElementsWithProvider(this.property);
            dest.addValueContextUsage(this.property);
        } else {throw new Error('Source or Destination Component doesnt exist')}
    }

    addComponentComposition(reactComponents,restOfPropDrillingsObjects){
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

        let collectedProps = [this.property];
        restOfPropDrillingsObjects.forEach(propDrillingObj => {
            if(JSON.stringify(propDrillingObj.path)===JSON.stringify(this.path) 
                && !collectedProps.includes(propDrillingObj.property)){
                    collectedProps.push(propDrillingObj.property);
            }
        })
        const passedProps = sourceComponent.extractPropsForComponent(this.path[1]);
        collectedProps.forEach(prop => {
            //todo here add logic for the prop Value.
            delete passedProps[prop]
        }
    );
        
        this.removeAllProps(reactComponents,collectedProps);

        const composedJSX = sourceComponent.insertComposition(this.path);
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
        
        collectedProps.forEach(prop => {
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
        collectedProps.forEach(prop => {
            sourceComponent.addNewPropToReturnElement(prop,this.dest);
        })
        sourceComponent.addNewPropToReturnElement(this.property,this.dest);
        for (const key in passedProps){
            if(passedProps.hasOwnProperty(key)){
                sourceComponent.addNewPropToReturnElement(key,this.path[1],passedProps[key]);
            }
        }
        //todo check again for the imports. They do no work well. 
        sourceComponent.returnedElements.forEach(element => {
            const component = reactComponents.find(comp => comp.name === element);
            if (component) {
                const fileName = "./"+component.filepath.split('\\').pop();
                const isAlreadyImported = sourceComponent.importDeclarations.some(importDeclaration => {
                    return importDeclaration[fileName]?.includes(element);
                });
                if (!isAlreadyImported) {
                    sourceComponent.addAnImportStatement(fileName, element);
                }
            }
        });
        sourceComponent.isChanged = true;
    }
}

export {PropDrilling};
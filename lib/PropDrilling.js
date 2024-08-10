import jscodeshift from 'jscodeshift';
import { createNewContextFile } from './CreateNewFiles.js';
class PropDrilling{
    constructor(property,path,source=path[0],dest=path[path.length-1]){
        this.property = property,
        this.path = path;
        this.source = source;
        this.dest = dest;
    }

    removeAllProps(reactComponents){
        for(let i=0; i<this.path.length-1;i++){
            const component = reactComponents.find(comp => comp.name === this.path[i]);
            if(component){
               try{
                component.removePropFromReturnElement(this.property,this.path[i+1]);
               }catch(err){
                throw new Error(`Prop Not removed in the ${component.name} Component. Something went wrong.`);
               }
            }
        }

        for(let j=1; j<this.path.length;j++){
            const component = reactComponents.find(comp => comp.name === this.path[j]);
            if(component){
               try{
                component.removeProperty(this.property);
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

    addComponentComposition(reactComponents){
        const sourceComponent = reactComponents.find(comp => comp.name === this.source);
        const destComponent = reactComponents.find(comp => comp.name === this.dest);
        if(!sourceComponent || !destComponent){
            throw new Error('Source or Destination Component do not extinct');
        }
        const intermediateComponentNames = this.path.filter(name => name !== this.source && name !== this.dest);
        let intermediateComponents = [];
        intermediateComponentNames.forEach(el =>  {
            const component = reactComponents.find(comp => comp.name === el);
            if(component){
                intermediateComponents.push(component);
            }
        });

        this.removeAllProps(reactComponents);
        intermediateComponents.forEach(el => {
            el.addNewProperty('children');
            el.removeJSXwithChildren();
        })
        destComponent.addNewProperty(this.property)
    }
}

export {PropDrilling};
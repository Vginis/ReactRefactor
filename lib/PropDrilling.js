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

    addUseContext(){
        createNewContextFile(this.property);

    }
}
//todo addContext
function locatePropDrilling(root, components) {
    const propDrillingComponents = [];
    const propPassingComponents = [];
    const seen = new Set();

    function traverse(component, propsMap = {},propPassMap = {}) {
        const { name,properties, returnedElements } = component;
        const newPropsMap = { ...propsMap };
        const newPropsPassMap = { ...propPassMap};

        const childProps = component.getChildProps();
        //propPassing
        properties.forEach(prop => {
            if(!newPropsPassMap[prop]){
                newPropsPassMap[prop] = [];
            }
            newPropsPassMap[prop].push(name);
        });
        Object.keys(newPropsPassMap).forEach(prop => {
            if(newPropsPassMap[prop].length >= 2){
                propPassingComponents.push({prop, path: newPropsPassMap[prop]});
            }
        });
        //propDrilling
        Object.keys(childProps).forEach(child => {
            childProps[child].forEach(prop => {
                if (!newPropsMap[prop]) {
                    newPropsMap[prop] = [];
                }
                newPropsMap[prop].push(name);
            });
        });

        Object.keys(newPropsMap).forEach(prop => {
            const pathString = newPropsMap[prop].join(' -> ');
            if (newPropsMap[prop].length >= 2 && !seen.has(`${prop}-${pathString}`)) {
                propDrillingComponents.push({ prop, path: newPropsMap[prop] });
                seen.add(`${prop}-${pathString}`);
            }
        });

        returnedElements.forEach(childName => {
            const childComponent = components.find(comp => comp.name === childName);
            if (childComponent) {
                traverse(childComponent, newPropsMap,newPropsPassMap);
            }
        });
    }

    traverse(root);
    return { propPassingComponents, propDrillingComponents };
}

function locatePropDrillingPath(root,components){
    const {propPassingComponents, propDrillingComponents} = locatePropDrilling(root,components);
    if(propDrillingComponents.length === 0 || propPassingComponents.length === 0){
        return 'Havent found any prop drilling occurences';
    }
    let commonA,commonB;
    for(let i=0; i<propDrillingComponents.length;i++){
        for(let j=0; j<propPassingComponents.length;j++){
            if(propDrillingComponents[i].prop+"="+propDrillingComponents[i].prop === propPassingComponents[i].prop){
               commonA = propDrillingComponents[i];
               commonB = propPassingComponents[j];
            }
        } 
    }
    commonA.path.push(commonB.path[commonB.path.length-1]);
    for(let i=1; i<commonA.path.length-1;i++){
        const component = components.find(comp => comp.name===commonA.path[i])
        if(component && !component.checkIfContainsPropertyInBody(commonA)){
                continue;
        } else {
            throw new Error('Component doesnt exist or the Prop is used in other Intermediate Components');
        }
    }
    const propDrillingObj = new PropDrilling(commonA.prop,commonA.path); 
    return propDrillingObj;
}
//todo fill the rest of the check for the return statements
export {PropDrilling,locatePropDrillingPath};
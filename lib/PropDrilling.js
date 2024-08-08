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
}
function locatePropDrilling(root, components) {
    const propDrillingComponents = [];
    const propPassingComponents = [];
    const seen = new Set();

    function traverse(component, propsMap = {}, propPassMap = {}, currentPath = []) {
        const { name, properties, returnedElements } = component;

        const newPath = [...currentPath, name];
        const newPropsMap = { ...propsMap };
        const newPropsPassMap = { ...propPassMap };
        //prop Passing
        properties.forEach(prop => {
            if (!newPropsPassMap[prop]) {
                newPropsPassMap[prop] = [];
            }
            newPropsPassMap[prop].push(name);
        });

        Object.keys(newPropsPassMap).forEach(prop => {
            if (newPropsPassMap[prop].length >= 2) {
                const pathString = newPropsPassMap[prop].join(' -> ');
                if (!seen.has(`${prop}-${pathString}`)) {
                    propPassingComponents.push({ prop, path: [...newPropsPassMap[prop]] });
                    seen.add(`${prop}-${pathString}`);
                }
            }
        });

        // prop Drilling
        returnedElements.forEach(childName => {
            const childComponent = components.find(comp => comp.name === childName);
            if (childComponent) {
                const childProps = childComponent.properties || [];
                childProps.forEach(prop => {
                    if (!newPropsMap[prop]) {
                        newPropsMap[prop] = [];
                    }
                    newPropsMap[prop].push(name);
                });

                Object.keys(newPropsMap).forEach(prop => {
                    const pathString = newPropsMap[prop].join(' -> ');
                    if (newPropsMap[prop].length >= 2 && !seen.has(`${prop}-${pathString}`)) {
                        propDrillingComponents.push({ prop, path: [...newPath, childName] });
                        seen.add(`${prop}-${pathString}`);
                    }
                });
                traverse(childComponent, { ...newPropsMap }, { ...newPropsPassMap }, newPath);
            }
        });
    }

    traverse(root);
    return { propPassingComponents, propDrillingComponents };
}

function locatePropDrillingPath(root, components) {
    const { propPassingComponents, propDrillingComponents } = locatePropDrilling(root, components);

    if (propDrillingComponents.length === 0 || propPassingComponents.length === 0) {
        return 'Haven\'t found any prop drilling occurrences';
    }

    const propDrillingArray = [];

    propDrillingComponents.forEach(drilledComponent => {
        const matching = propPassingComponents.find(el => el.prop === drilledComponent.prop);
        if (matching) {
            drilledComponent.path.push(matching.path[matching.path.length - 1]);
            propDrillingArray.push(drilledComponent);
        }
    });

    const uniquePropDrillingArray = Array.from(new Set(propDrillingArray.map(JSON.stringify))).map(JSON.parse);

    const propDrillingObjects = [];

    uniquePropDrillingArray.forEach(elem => {
        for (let i = 1; i < elem.path.length - 1; i++) {
            const component = components.find(comp => comp.name === elem.path[i]);
            if (component && !component.checkIfContainsPropertyInBody(elem)) {
                continue;
            } else {
                throw new Error('Component doesn\'t exist or the Prop is used in other Intermediate Components');
            }
        }
        elem.path = Array.from(new Set(elem.path));
        propDrillingObjects.push(new PropDrilling(elem.prop.split("=")[0], elem.path));
    });

    return propDrillingObjects;
}

export {PropDrilling,locatePropDrillingPath};
import { findCommonAncestor,getValueFromGivenState } from "../util.js"
class StateLifter{
    constructor(components, state){
        this.components = components,
        this.state = state
    }

    liftStateUpFromTwoComponents(root){
        const commonAncestor = findCommonAncestor(this.components[0],this.components[1],root);
        const stateVariableA = getValueFromGivenState(this.state,this.components[0]);
        const stateVariableB = getValueFromGivenState(this.state,this.components[1]);

        if(stateVariableA !== stateVariableB){
            console.log("States of components don't have same values. Aborting refactoring");
            return;
        }
        this.components.forEach(element => {
            element.removeUseStateDeclaration(this.state);
            element.addNewProperty(this.state);
        })

        const variableDec = {
            variableName: this.state,
            setVariableMethod: `set${this.state.charAt(0).toUpperCase() + this.state.slice(1)}`,
            initialValue: stateVariableA,
            filePath: commonAncestor.filepath,
            reactComponent: commonAncestor.name
        }
        commonAncestor.addNewUseStateDeclaration(variableDec);

        this.components.forEach(component => {
            if(commonAncestor.returnedElements.includes(component.name)){
                commonAncestor.addNewPropToReturnElement(this.state,component.name);
            }
        })
    }
}


export {StateLifter};
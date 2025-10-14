export default class PropDrillingInfo {
    constructor(sourceComponent, targetComponent) {
        this.sourceComponent = sourceComponent.fqn;
        this.targetComponent = targetComponent.fqn;
        this.canRefactorWithContext = false;
        this.canRefactorWithComposition = false;
        this.propPassings = []
    }

    addPropPassing(source, target, targetAlias, targetProp, pure){
        let propPassingInfo = {}
        propPassingInfo.source = source.fqn;
        propPassingInfo.target = target.fqn;
        propPassingInfo.targetAlias = targetAlias;
        propPassingInfo.targetProp = targetProp;
        propPassingInfo.isPure = pure;
        this.propPassings.push(propPassingInfo);
    }

    updatePreconditionStatus(multipleParentsInDest, nonForwardedPropsIntermediates){
        this.destinationWithMultipleParentsPrec = multipleParentsInDest;
        this.nonForwardedPropsInIntermediateComponentsPrec = nonForwardedPropsIntermediates;
        this.updateRefactoringCandidateStatus()
    }

    updateRefactoringCandidateStatus(){
        if (this.destinationWithMultipleParentsPrec){
            this.canRefactorWithContext = true;
        }
        if (this.nonForwardedPropsInIntermediateComponentsPrec){
            this.canRefactorWithComposition = true;
        }
    }



    toCSVRow(){
        return ""
    }

}

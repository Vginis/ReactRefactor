import { fileURLToPath } from "url";

export default class PropDrillingInfo {

    constructor(sourceComponent, targetComponent) {
        this.sourceComponent = sourceComponent?.fqn;
        this.targetComponent = targetComponent?.fqn;
        this.canRefactorWithContext = false;
        this.canRefactorWithComposition = false;
        this.propPassings = []
    }

    addPropPassing(source, target, targetAlias, targetProp, pure) {
        let propPassingInfo = new PropPassingInfo(
            source, target, targetAlias, targetProp, pure
        )
        // propPassingInfo.source = source.fqn;
        // propPassingInfo.target = target.fqn;
        // propPassingInfo.targetAlias = targetAlias;
        // propPassingInfo.targetProp = targetProp;
        // propPassingInfo.isPure = pure;
        this.propPassings.push(propPassingInfo);
    }

    updatePreconditionStatus(multipleParentsInDest, nonForwardedPropsIntermediates) {
        this.destinationWithMultipleParentsPrec = multipleParentsInDest;
        this.nonForwardedPropsInIntermediateComponentsPrec = nonForwardedPropsIntermediates;
        this.updateRefactoringCandidateStatus()
    }

    updateRefactoringCandidateStatus() {
        if (this.destinationWithMultipleParentsPrec) {
            this.canRefactorWithContext = true;
        }
        if (this.nonForwardedPropsInIntermediateComponentsPrec) {
            this.canRefactorWithComposition = true;
        }
    }

    get sourceProperty(){
        if (!this.propPassings.length){
            return undefined
        }
        return this.propPassings[0].targetProp
    }

    get path() {
        let segments = [this.sourceComponent]
        segments.push(...this.propPassings.map(p => p.target))
        return segments.join(">>>")
    }

    get augmentedPath() {
        let segments = [this.sourceComponent]
        segments.push(...this.propPassings.map(p => `${p.target}(${p.targetProp})`))
        return segments.join(">>>")
    }

    get depth() {
        return this.propPassings.length - 1;
    }

    get isCandidate(){
        return this.canRefactorWithComposition || this.canRefactorWithContext
    }

    /**
     * 
     * @returns Depth | RefCandidate | Context | Composition | Path | RP4 | RP1
     */
    toCSVRow(project) {

        return [
        project,
        this.depth,
        this.isCandidate + 0,
        this.canRefactorWithContext + 0,
        this.canRefactorWithComposition + 0,
        (this.destinationWithMultipleParentsPrec + 0),
        (this.nonForwardedPropsInIntermediateComponentsPrec + 0),
        this.sourceProperty,
        this.augmentedPath,]
            .join(" | ")
    }

}

PropDrillingInfo.csvRowHeader = function() {
    return 'Project | Depth | RefCandidate | Context | Composition | RP4 | RP1 | Property | Path '
}


PropDrillingInfo.fromJson = function(obj){

    let info = new PropDrillingInfo(obj.sourceComponent, obj.targetComponent)
    info.sourceComponent = obj.sourceComponent
    info.targetComponent = obj.targetComponent
    info.canRefactorWithComposition = obj.canRefactorWithComposition
    info.canRefactorWithContext = obj.canRefactorWithContext
    info.destinationWithMultipleParentsPrec = obj.destinationWithMultipleParentsPrec
    info.nonForwardedPropsInIntermediateComponentsPrec = obj.nonForwardedPropsInIntermediateComponentsPrec

    for(let propPassingObj of obj.propPassings){
        info.propPassings.push(PropPassingInfo.fromJson(propPassingObj))
    }

    return info
}


class PropPassingInfo {

    constructor(source, target, targetAlias, targetProp, isPure){
        this.source = source
        this.target = target
        this.targetAlias = targetAlias
        this.targetProp = targetProp
        this.isPure = isPure
    }

}

PropPassingInfo.fromJson = function(obj){
    return new PropPassingInfo(obj.source, obj.target, obj.targetAlias,
        obj.targetProp, obj.isPure
    )
}
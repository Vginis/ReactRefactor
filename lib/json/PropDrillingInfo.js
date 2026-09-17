import { fileURLToPath } from "url";
import {default as crypto} from "node:crypto" // Use import syntax if using ES modules

function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export default class PropDrillingInfo {

    constructor(sourceComponent, targetComponent) {
        this.sourceComponent = sourceComponent?.fqn;
        this.targetComponent = targetComponent?.fqn;
        this.canRefactorWithContext = false;
        this.canRefactorWithComposition = false;
        this.propPassings = []

        // compound with
        this.samePath = []
        // not compound but same start, target and property
        this.parallel = []
        // not compound but with same source
        this.sameSource = []
        // not compound but with same target
        this.sameTarget = []
    }

    get isPure(){
        
        // check all prop forwardings (not the first item)
        for(let i = 1; i < this.propPassings.length; i++){
            if (!this.propPassings[i].isPure){
                return false
            }
        }
        return true
    }

    addPropPassing(source, target, targetAlias, targetProp, pure) {
        let propPassingInfo = new PropPassingInfo(
            source.fqn, target.fqn, targetAlias, targetProp, pure
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
     * @returns ProjectName | SLOC | Pure | Depth | Candidate | Context | Composition | SourceProp | hash(path) | path
     */
    toCSVRow(project, sloc) {

        return [
        project,
        sloc,
        this.isPure ? 1 : 0,
        this.depth,
        this.isCandidate + 0,
        this.canRefactorWithContext + 0,
        this.canRefactorWithComposition + 0,
        // (this.destinationWithMultipleParentsPrec + 0),
        // (this.nonForwardedPropsInIntermediateComponentsPrec + 0),
        this.sourceProperty,
        hash(this.path),
        this.path
        ]
            .join(" | ")
    }

}

PropDrillingInfo.csvRowHeader = function() {
    return 'project | sloc | pure | depth | candidate | candidateContext | candidateComposition | sourceProp | pathHash | path '
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


export class PropPassingInfo {

    constructor(source, target, targetAlias, targetProp, isPure){
        this.source = source
        this.target = target
        this.targetAlias = targetAlias
        this.targetProp = targetProp
        this.isPure = isPure
    }

    get path() {
        let segments = [this.source, this.target]
        return segments.join(">>>")
    }

}

PropPassingInfo.fromJson = function(obj){
    return new PropPassingInfo(obj.source, obj.target, obj.targetAlias,
        obj.targetProp, obj.isPure
    )
}

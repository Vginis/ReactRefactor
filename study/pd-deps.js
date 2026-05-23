import {
  default as PropDrillingInfo,
  PropPassingInfo,
} from "../lib/json/PropDrillingInfo.js";
import ProjectInfo from "../lib/json/ProjectInfo.js";
import { projects } from './benchmark.js'

import { parseResultsJson } from "../lib/utils/statsJsonCalculation.js";
const RESULTS_DIR = './study/results'

const projectList = projects.map((p) => ProjectInfo.fromJson(p));
const project = projectList[2]

let propDrillingsList = parseResultsJson(
  `${RESULTS_DIR}/${project.resultsFile}`,
  PropDrillingInfo,
);

class CompoundPD {

    constructor(path){
        this.path = path
        this.members = []
    }

    get breadth(){
        return this.members.length
    }

    update(pd){
        this.members.push(pd)
    }

    toString(){

        if (this.breadth <= 1){
            return "-"
        }

        let props = this.members.map(m => m.sourceProperty)
        
        return `(${this.breadth}) - (${props.join(", ")}) ${this.members[0].sourceComponent} --> ${this.members[0].targetComponent}`

    }

}

PropDrillingInfo.pathsMap = new Map()

project.propDrillings = propDrillingsList;

PropDrillingInfo.prototype.updatePathsMap = function(){

    let path = this.path
    let compoundPd =null
    if (PropDrillingInfo.pathsMap.has(path)){
        compoundPd = PropDrillingInfo.pathsMap.get(path)    
    } else {
        compoundPd = new CompoundPD(this.path)
        PropDrillingInfo.pathsMap.set(path, compoundPd)
    }
    compoundPd.update(this)
}

PropDrillingInfo.prototype.checkOverlapping = function (otherPd) {

    if (!this.overlappingPDs){
        this.overlappingPDs = []
    }

    for(let propPassing1 of this.propPassings){
        for(let propPassing2 of otherPd.propPassings){
            if (propPassing1.intersects(propPassing2)){
                this.overlappingPDs.push(otherPd)
                return
            }
        }
    }
};

PropDrillingInfo.prototype.hasOverlappings = function(){
    return this.overlappingPDs && this.overlappingPDs.length > 0;
}

PropPassingInfo.prototype.intersects = function (otherPropPassing) {

    let otherComponents = [otherPropPassing.source, otherPropPassing.target]
    return otherComponents.includes(this.source) || 
        otherComponents.includes(this.target); 
};


for(let i = 0; i < propDrillingsList.length; i++){
    for(let j = 1; j < propDrillingsList.length; j++){
        propDrillingsList[i].checkOverlapping(propDrillingsList[j])
    }
}

let overlappings = 0
propDrillingsList.forEach(pd => {
    pd.updatePathsMap()
    // if (pd.hasOverlappings()){
    //     overlappings++
    // }
});

let compounds = Array.from(PropDrillingInfo.pathsMap.values()).filter(cpd => cpd.breadth > 1)

//console.log(`Total overlappings ${overlappings} / ${propDrillingsList.length}`)
console.log(`Total compounds ${compounds.length}`)
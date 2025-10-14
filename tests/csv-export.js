import * as fs from 'fs';
import PropDrillingInfo from '../lib/PropDrillingInfo.js';


let json = fs.readFileSync('./stats/vitess.json', 'utf-8')
let candidates = JSON.parse(json).map(c => getPropDrillingInfo(c))



console.log(candidates.map(c => c.toCSVRow()))


function getPropDrillingInfo(item){
    let propDrillingInfo = new PropDrillingInfo()
    propDrillingInfo.sourceComponent = item.sourceComponent
    propDrillingInfo.targetComponent = item.targetComponent
    propDrillingInfo.canRefactorWithContext = item.canRefactorWithContext
    propDrillingInfo.canRefactorWithComposition = item.canRefactorWithComposition
    propDrillingInfo.destinationWithMultipleParentsPrec = item.destinationWithMultipleParentsPrec
    propDrillingInfo.nonForwardedPropsInIntermediateComponentsPrec = item.nonForwardedPropsInIntermediateComponentsPrec
    propDrillingInfo.propPassings = item.propPassings
    return propDrillingInfo
}

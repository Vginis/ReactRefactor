import * as fs from 'fs';
import PropDrillingInfo from '../json/PropDrillingInfo.js';


let json = fs.readFileSync('./stats/candidates.json', 'utf-8')
let candidates = JSON.parse(json).map(c => getPropDrillingInfo(c))

let csvLines = candidates.map(c => c.toCSVRow())
csvLines.unshift(candidates[0].csvRowHeader)

fs.writeFileSync('./stats/candidates.csv', csvLines.join("\n"), 'utf-8')

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

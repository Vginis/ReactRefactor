import * as fs from 'fs';
import PropDrillingInfo from '../lib/json/PropDrillingInfo.js';


function generateCSV(projectList, filePath){

    let lines = projectList.map(proj => {
        return proj.propDrillings.map(pd => pd.toCSVRow(proj.projectName, proj.sloc))
    }).flat(1)

    lines.unshift(PropDrillingInfo.csvRowHeader())

    fs.writeFileSync(filePath, lines.join("\n"), 'utf-8')

}

export {generateCSV}



//import { extractGlobalCliVariables } from './cli.js';
import jscodeshift from 'jscodeshift';
import { ReactFile } from './ReactFile.js';

let j = jscodeshift;
let jtsx = jscodeshift.withParser("tsx")

function parserFor(filePath){

    let fileExtension = ReactFile.getFileExtension(filePath)

    if (fileExtension === "tsx" || fileExtension === "ts"){
        return jtsx
    }
    return j;
}

export default parserFor;
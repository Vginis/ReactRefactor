import { extractGlobalCliVariables } from './cli.js';
import jscodeshift from 'jscodeshift';

const { fileType } = extractGlobalCliVariables();

let j = jscodeshift;

if (fileType === "tsx") {
    j = jscodeshift.withParser("tsx");
}

export default j;
import { resolveJscodeshiftParser } from './util.js';
import { extractGlobalCliVariables } from './cli.js';

const {fileType} = extractGlobalCliVariables();
const j = resolveJscodeshiftParser(fileType);

export default j;
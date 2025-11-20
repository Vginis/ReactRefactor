import path from 'path';
import { parseReactFile, ReactFile } from '../../lib/ReactFile.js';
import { extractExports } from '../../lib/Export.js'
import { extractImportDeclarations } from '../../lib/ImportStatement.js';

describe("Export module", () => {

    test("should identify static imports", () => {
        let reactFile = loadReactFile("test/resources/social-net/src/Feed.jsx")
        extractImportDeclarations([reactFile]);
        expect(reactFile.importDeclarations.length).toBe(3)
        expect(reactFile.importDeclarations[0].importSpecifiers.length).toBe(1)
        expect(reactFile.importDeclarations[1].importSpecifiers.length).toBe(1)
        expect(reactFile.importDeclarations[2].importSpecifiers.length).toBe(3)

        let defaultSpecifier = reactFile.importDeclarations[0].importSpecifiers[0]
        // should resolve to the exported component name
        expect(defaultSpecifier.original).toBe("default")

    });


   
});

function loadReactFile(relativePath) {
    let segments = relativePath.split("//")
    const filePath = path.resolve(process.cwd(), ...segments);
    let result = parseReactFile(filePath)
    expect(result).toBeTruthy();
    let { ast, j, fileLocation } = result;
    let reactFile =  new ReactFile(ast, j, fileLocation, false)
    extractExports(reactFile);
    return reactFile;
}


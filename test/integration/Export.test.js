import path from 'path';
import { parseReactFile, ReactFile } from '../../lib/ReactFile.js';
import { extractExports } from '../../lib/Export.js'

describe("Export module", () => {

    test("should identify named exports", () => {

        let reactFile = loadReactFile("test/resources/social-net/src/components.jsx")
        let exportList = extractExports(reactFile)

        expect(exportList.length).toBeTruthy();
        expect.arrayContaining["PostComment", "Avatar"]

    });


    test("should identify default exports", () => {

        let reactFile = loadReactFile("test/resources/social-net/src/Post.jsx")
        let exportList = extractExports(reactFile)

        expect(exportList.length).toBeTruthy();
        expect.arrayContaining["Logo", "Post"]

    });

});

function loadReactFile(relativePath) {
    let segments = relativePath.split("//")
    const filePath = path.resolve(process.cwd(), ...segments);
    let result = parseReactFile(filePath)
    expect(result).toBeTruthy();
    let { ast, j, fileLocation } = result;
    return new ReactFile(ast, j, fileLocation, false)
}


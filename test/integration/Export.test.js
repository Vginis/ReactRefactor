import path from 'path';
import { parseReactFile, ReactFile } from '../../lib/ReactFile.js';
import { extractExports } from '../../lib/Export.js'
import exp from 'constants';

describe("Export module", () => {

    test("should identify named exports", () => {

        let reactFile = loadReactFile("test//resources//social-net//src//components.jsx")
        let exportList = extractExports(reactFile)

        expect(exportList.length).toBeTruthy();
        expect.arrayContaining["PostComment", "Avatar", "AvatarEx", "AvatarClass"]
        let exportedDeclarations = reactFile.exports.exportedDeclarations

        let commentExport = exportedDeclarations.filter(exp => exp.name === "Comment")[0]
        expect(commentExport.astNode.type).toBe("ArrowFunctionExpression")


    });


    test("should identify default identifier exports", () => {

        let reactFile = loadReactFile("test//resources//social-net//src//Post.jsx")
        let exportList = extractExports(reactFile)

        expect(exportList.length).toBeTruthy();
        expect.arrayContaining["Logo", "Post"]

        let exportedDeclarations = reactFile.exports.exportedDeclarations
        let postExport = exportedDeclarations.filter(exp => exp.name === "Post")[0]
        expect(postExport.astNode.type).toBe("ArrowFunctionExpression")

    });

    test("should identify default function exports", () => {

        let reactFile = loadReactFile("test//resources//social-net//src//Feed.jsx")
        let exportList = extractExports(reactFile)
        let exportedDeclarations = reactFile.exports.exportedDeclarations
        expect(exportList.length).toBeTruthy();
        expect(exportedDeclarations.length).toBe(1)
        let feedExport = exportedDeclarations[0]
        expect(feedExport.astNode.type).toBe("FunctionDeclaration")
        // anonymous function default export
        expect(feedExport.name).toBe("Feed")
        expect(feedExport.alias).toBe("Feed")
        expect(feedExport.isDefault).toBe(true)

    });

});

function loadReactFile(relativePath) {
    let segments = relativePath.split("//")
    const absoluteFilePath = path.resolve(process.cwd(), ...segments);
    let result = parseReactFile(absoluteFilePath)
    expect(result).toBeTruthy();
    let { ast, j, filePath } = result;
    return new ReactFile(ast, j, filePath, false)
}


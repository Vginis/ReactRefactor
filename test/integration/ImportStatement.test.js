import path from 'path';
import { parseReactFile, ReactFile } from '../../lib/ReactFile.js';
import { extractExports } from '../../lib/Export.js'
import { extractImportDeclarations } from '../../lib/ImportStatement.js';
import { setProjectPath} from '../utils/test-utils.js'

describe("Export module", () => {

    test("should identify static imports", () => {

        setProjectPath('test//resources//social-net//src')
        let reactFile = loadReactFile("test//resources//social-net//src//Feed.jsx")
        expect(reactFile.relativePath).toBe("Feed.jsx")

        extractImportDeclarations([reactFile]);
        expect(reactFile.importDeclarations.length).toBe(3)
        expect(reactFile.importDeclarations[0].importSpecifiers.length).toBe(1)
        expect(reactFile.importDeclarations[1].importSpecifiers.length).toBe(1)
        expect(reactFile.importDeclarations[2].importSpecifiers.length).toBe(3)

        let defaultSpecifier = reactFile.importDeclarations[0].importSpecifiers[0]
        // should resolve to the exported component name
        expect(defaultSpecifier.original).toBe("default")
    });

    test("should resolve imported inner module paths", () => {
        
        setProjectPath("test//resources//e-library//src")
        let reactFile = loadReactFile("test//resources//e-library//src//components//cart//CartModal.tsx")
        expect(reactFile.relativePath).toBe("components\\cart\\CartModal.tsx")

        extractImportDeclarations([reactFile]);

        expect(reactFile.importDeclarations.length).toBe(10)
        let import1 = reactFile.importDeclarations[1]
        expect(import1.relativeModulePath).toBe("components\\books\\BooksTable")
    });

});


function loadReactFile(relativePath) {
    let segments = relativePath.split("//")
    const absolutefilePath = path.resolve(process.cwd(), ...segments);
    let result = parseReactFile(absolutefilePath)
    expect(result).toBeTruthy();
    let { ast, j, filePath } = result;
    let reactFile = new ReactFile(ast, j, filePath, false)
    extractExports(reactFile);
    return reactFile;
}


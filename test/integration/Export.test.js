import path from 'path';
import * as cliModule from '../../lib/cli.js';
import { loadReactFiles } from '../../lib/ReactFile.js';
import { loadAliases } from '../../lib/Alias.js';
import {
    getAllFiles,
    resolveIfProjectHasMultiplePages,
    extractPathsAndHierarchies
} from '../../lib/util.js';
import {
    loadReactComponents,
    addParents,
    addCompositeKeyReturnedElements
} from '../../lib/loadingFuncs.js';

describe("Component hierarchy", () => {
    afterAll(() => {
        jest.restoreAllMocks();
    });

    test.skip("should load hierarchy without circles", () => {

        const testProjectPath = path.resolve(process.cwd(), "test", "resources", "social-net",  "src");
        const allFiles = getAllFiles(testProjectPath);
        const rootFileName = path.resolve(process.cwd(), "test", "resources", "social-net", "src", "App.jsx");

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//social-net//src//App.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(testProjectPath, rootFileName, allFiles, 6, 6)
    
        expect(paths.length).toBe(2);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)

    });

    
});

function analyzeComponentHierarchy(testProjectPath, rootFileName, allFiles, expectedReactComponents, expectedJsxElements) {

    const hasMultiplePages = resolveIfProjectHasMultiplePages(testProjectPath);
    const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles, rootFileName);

    expect(filteredJsxElements.size).toBe(expectedJsxElements);

    const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);
    expect(reactComponents.length).toBe(expectedReactComponents);

    loadAliases(reactFiles, reactComponents);
    addParents(reactComponents);
    addCompositeKeyReturnedElements(reactComponents, reactFiles);
    const { hierarchyTrees, paths } = extractPathsAndHierarchies(
        reactFiles, rootFileName, reactComponents, hasMultiplePages);

    return {hierarchyTrees, paths}
}
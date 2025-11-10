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

    test("should load hierarchy without circles", () => {

        const testProjectPath = path.resolve(process.cwd(), "test", "resources", "social-net");
        const allFiles = getAllFiles(testProjectPath);
        const rootFileName = path.resolve(process.cwd(), "test", "resources", "social-net", "App.jsx");

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//social-net//App.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(testProjectPath, rootFileName, allFiles, 5, 4)
    
        expect(paths.length).toBe(2);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)

    });

    test("should load hierarchy containing circles", () => {

        const testProjectPath = path.resolve(process.cwd(), "test", "resources", "social-netx");
        const allFiles = getAllFiles(testProjectPath);
        const rootFileName = path.resolve(process.cwd(), "test", "resources", "social-netx", "App.jsx");

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//social-netx//App.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(testProjectPath, rootFileName, allFiles, 5, 5)
    
        expect(paths.length).toBe(3);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)
        expect(paths[2].length).toBe(4)

    });
});

function analyzeComponentHierarchy(testProjectPath, rootFileName, allFiles, expectedReactComponents, expectedJsxElements) {

    const hasMultiplePages = resolveIfProjectHasMultiplePages(testProjectPath);
    const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles, rootFileName);

    // App is not used anywhere, it cannot infer that it's a JSX element
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
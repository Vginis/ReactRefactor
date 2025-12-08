import path from 'path';
import { setProjectPath } from '../utils/test-utils.js';
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

        const testProjectPath = path.resolve(process.cwd(), "test", "resources", "social-net",  "src");
        setProjectPath('test//resources//social-net//src')
        const allFiles = getAllFiles(testProjectPath);
        const rootFileName = path.resolve(process.cwd(), "test", "resources", "social-net", "src", "App.jsx");

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//social-net//src//App.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        
        const { hierarchyTrees, paths } = analyzeComponentHierarchy(testProjectPath, rootFileName, allFiles, 8, 7)
    
        expect(paths.length).toBe(2);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)

    });

    test("should load hierarchy containing circles", () => {

        const testProjectPath = path.resolve(process.cwd(), "test", "resources", "social-netx", "src");
        const allFiles = getAllFiles(testProjectPath);
        const rootFileName = path.resolve(process.cwd(), "test", "resources", "social-netx", "src", "App.jsx");

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//social-netx//src//App.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        globalThis.projectPath = testProjectPath;
        const { hierarchyTrees, paths } = analyzeComponentHierarchy(testProjectPath, rootFileName, allFiles, 5, 6)
    
        expect(paths.length).toBe(3);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)
        expect(paths[2].length).toBe(4)

    });


    test("should load hierarchy containing aliases", () => {

        const testProjectPath = path.resolve(process.cwd(), "test", "resources", "social-net-alias", "src");
        const allFiles = getAllFiles(testProjectPath);
        const rootFileName = path.resolve(process.cwd(), "test", "resources", "social-net-alias", "src", "App.jsx");

        jest.spyOn(cliModule, 'extractGlobalCliVariables').mockReturnValue({
            projectPath: testProjectPath,
            rootFile: ".//test//resources//social-net-alias//src//App.jsx",
            rootComponent: "App",
            fileType: "jsx"
        });

        globalThis.projectPath = testProjectPath;
        // 5 jsx elements, Feed is not used anywhere
        const { hierarchyTrees, paths } = analyzeComponentHierarchy(testProjectPath, rootFileName, allFiles, 6, 6)
    
        expect(paths.length).toBe(3);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)
        expect(paths[2].length).toBe(4)

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
import path from 'path';
import * as cliModule from '../../lib/cli.js';
import { loadReactFiles } from '../../lib/ReactFile.js';
import { loadAliases } from '../../lib/Alias.js';
import { 
    getAllFiles, 
    resolveIfProjectHasMultiplePages, 
    extractPathsAndHierarchies } from '../../lib/util.js';
import { 
    loadReactComponents, 
    addParents, 
    addCompositeKeyReturnedElements } from '../../lib/loadingFuncs.js';

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


        const hasMultiplePages = resolveIfProjectHasMultiplePages(testProjectPath);
        const { reactFiles, filteredJsxElements } = loadReactFiles(allFiles, rootFileName);

        expect(reactFiles.length).toBe(5);
        // App is not used anywhere, it cannot infer that it's a JSX element
        expect(filteredJsxElements.size).toBe(4);

        const reactComponents = loadReactComponents(reactFiles, filteredJsxElements);
        expect(reactComponents.length).toBe(5);

        loadAliases(reactFiles, reactComponents);
        addParents(reactComponents);
        addCompositeKeyReturnedElements(reactComponents, reactFiles);

        const { hierarchyTrees, paths } = extractPathsAndHierarchies(
            reactFiles, rootFileName, reactComponents, hasMultiplePages);
        expect(paths.length).toBe(2);
        expect(paths[0].length).toBe(3)
        expect(paths[1].length).toBe(4)

    });


});
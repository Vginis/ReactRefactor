import { getFileManager } from '../utils/test-utils.js';
import { loadReactComponents } from "../../lib/loadingFuncs.js"
import { loadAliases2 } from '../../lib/Alias.js';

describe("Alias", () => {

    test("should resolve aliases from imports", () => {

        const { fileManager, filteredJsxElements } = getFileManager("test//resources//social-net//src", "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        
        loadAliases2(fileManager.reactFiles)

        const postFile = fileManager.getReactFile("Post.jsx")
        expect(postFile).toBeTruthy()

        const postComponent = postFile.getExportedComponentDeclaration("default")
        expectAliasesForComponent(postComponent, ['MyPost'])

        const componentsFile = fileManager.getReactFile("components.jsx")
        const commentsComponent = componentsFile.getExportedComponentDeclaration("PostComment")
        expectAliasesForComponent(commentsComponent, ['XComment'])

        const avatarComponent = componentsFile.getExportedComponentDeclaration("Avatar")
        expectAliasesForComponent(avatarComponent, ['XAvatar', 'components.Avatar'])
        
    });

    function expectAliasesForComponent(component, expectedAliases){
        const aliases = component.aliases.aliases
        expect(aliases).toEqual(expect.arrayContaining(expectedAliases))
    }

    test.skip("should resolve aliases from wrapper functions", ()=> {
        const { fileManager, filteredJsxElements } = getFileManager("test//resources//social-net//src", "test//resources//social-net-alias//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        
        loadAliases(fileManager.reactFiles)

        expect(reactComponents.length).toBe(8)
    })

    
    
    function expectAllExportedComponentsResolved(fileManager, exceptions) {
        fileManager.reactFiles.forEach(reactFile => {
            reactFile.exports.exportedDeclarations.forEach(declaration => {
                if (exceptions.includes(declaration.name)) {
                    expect(declaration.component).toBeFalsy()
                } else {
                    expect(declaration.component).toBeTruthy()
                }
            })
        })
    }

    function expectContainedComponents(relativeFileName, componentCount, fileManager) {
        const reactFile = fileManager.getReactFile(relativeFileName)
        expect(reactFile).toBeTruthy()
        // 1 component not exported
        expect(reactFile.reactComponents.length).toBe(componentCount)
    }

});




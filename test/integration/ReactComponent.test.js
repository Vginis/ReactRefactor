import { getFileManager } from '../utils/test-utils.js';
import { loadReactComponents } from "../../lib/loadingFuncs.js"
import { loadAliases } from '../../lib/Alias.js';


describe("ReactComponent", () => {

    test("should resolve prop values for all its uses", () => {

        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net-alias//src", 
            "test//resources//social-net-alias//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)

        const feedFile = fileManager.getReactFile("Feed.jsx")
        const feed = feedFile.getLocalComponent("Feed")
        expect(feed).toBeTruthy()
        const propValues = feed.getChildPropValues()

        expectReturnedElements(feedFile, "Feed", ["Avatar", "Avatar2", "MyPost"])
        expectChildComponentsWithName(feedFile, "Feed", ["Post", "Avatar"])
        expectComponentUses(feedFile, "Feed", 4)


    })

    test("should resolve component uses and their property values", () => {

        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net-alias//src", 
            "test//resources//social-net-alias//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)

        expect(reactComponents.length).toBe(6)

        const feedFile = fileManager.getReactFile("Feed.jsx")

        expectReturnedElements(feedFile, "Feed", ["Avatar", "Avatar2", "MyPost"])
        expectChildComponentsWithName(feedFile, "Feed", ["Post", "Avatar"])
        expectComponentUses(feedFile, "Feed", 4)

    })

    test("should resolve child components in functional declarations", () => {

        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-net//src", 
            "test//resources//social-net//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        
        // BUG: should be 8 components, currently class expressions are not supported
        expect(reactComponents.length).toBe(9)

        const postFile = fileManager.getReactFile("Post.jsx")
        expect(postFile).toBeTruthy()

        expectReturnedElements(postFile, "Post", ["XAvatar", "XComment"])
        expectChildComponentsWithName(postFile, "Post", ["Comment", "Avatar"])

        // expectContainedComponents("components.jsx", 4, fileManager)
        // // 1 component not exported
        // expectContainedComponents("Post.jsx", 2, fileManager)

    });

    test("should resolve components declared as wrapper function params", () => {

        const { fileManager, filteredJsxElements } = getFileManager(
            "test//resources//social-netx//src", 
            "test//resources//social-netx//src//App.jsx");

        const reactComponents = loadReactComponents(fileManager.reactFiles, filteredJsxElements)
        
        expect(reactComponents.length).toBe(5)

        const postFile = fileManager.getReactFile("Post.jsx")
        expect(postFile).toBeTruthy()

        expectReturnedElements(postFile, "Post", ["Avatar", "Comment"])
        expectChildComponentsWithName(postFile, "Post", ["Comment", "Avatar"])

    });
    
    function expectContainedComponents(relativeFileName, componentCount, fileManager) {
        const reactFile = fileManager.getReactFile(relativeFileName)
        expect(reactFile).toBeTruthy()
        // 1 component not exported
        expect(reactFile.reactComponents.length).toBe(componentCount)
    }

    function expectReturnedElements(reactFile, componentName, returnedElements){
        const component = reactFile.getLocalComponent(componentName)
        expect(component.returnedElements).toEqual(expect.arrayContaining(returnedElements))
    }

    function expectChildComponentsWithName(reactFile, componentName, expectedComponentNames){
        const component = reactFile.getLocalComponent(componentName)
        const childComponentNames = Array.from(component.childComponents).map(component => component.name)
        expect(childComponentNames.length).toBe(expectedComponentNames.length)
        expect(childComponentNames).toEqual(expect.arrayContaining(expectedComponentNames))
    }

    function expectComponentUses(reactFile, componentName, expectedComponentUses){
        const component = reactFile.getLocalComponent(componentName)
        expect(component.componentUses.length).toEqual(expectedComponentUses)
    }
});




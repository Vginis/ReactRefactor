import { detectPropDrilling } from "../../lib/Hierarchy.js";
import { analyzeComponentHierarchy } from '../utils/test-utils.js';


describe("Component composition refactoring pre-condition check.", () => {
    test("should not allow Component composition refactoring", () => {
        
        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//e-library//src",
            "test//resources//e-library//src//app//layout.jsx", "OrdersTable,CartModal", 31, 65)

        const reactComponents = globalThis.reactComponentManager.getAllReactComponents()
        const groupedProps = [ {order: 'order'} ];
        const propDrillings = detectPropDrilling(paths);
        expect(propDrillings.length).toBe(3);
        expect(propDrillings[0].checkForOtherIntermediatePropsInPath(reactComponents, groupedProps))
            .toBe(true);
    });

    test("should allow Component composition refactoring", () => {
        
        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//atm-banking//src",
            "test//resources//atm-banking//src//main.jsx", "App", 13, 17)
        
        const groupedProps = [ { num: 'num' } ];
        const reactComponents = globalThis.reactComponentManager.getAllReactComponents()
        const propDrillings = detectPropDrilling(paths);
        expect(propDrillings.length).toBe(1);
        expect(propDrillings[0].checkForOtherIntermediatePropsInPath(reactComponents, groupedProps))
            .toBe(false);
    });
})

describe("Context refactoring pre-condition check.", () => {
    test("should allow Context refactoring", () => {

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//atm-banking//src",
            "test//resources//atm-banking//src//main.jsx", "App", 13, 17)

    
        const propDrillings = detectPropDrilling(paths);
        expect(propDrillings.length).toBe(1);
        expect(propDrillings[0].checkIfDestComponentHasOtherParentComponents(propDrillings))
            .toBe(false);
    });

    test("should not allow Context refactoring", () => {

        const { hierarchyTrees, paths } = analyzeComponentHierarchy(
            "test//resources//social-netx//src",
            "test//resources//social-netx//src//App.jsx", "App", 5, 6)

        const propDrillings = detectPropDrilling(paths);
        expect(propDrillings.length).toBe(1);
        expect(propDrillings[0].checkIfDestComponentHasOtherParentComponents(propDrillings))
            .toBe(true);
    });
})
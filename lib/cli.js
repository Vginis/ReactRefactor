function extractGlobalCliVariables() {
    
    const projectPath = globalThis.projectPath;
    const rootFile = globalThis.rootFile;
    const rootComponent = globalThis.rootComponent;
    const fileType = globalThis.fileType;
    const PATH_SEPARATOR = '\\';
    
    const prefixMappings = globalThis.prefixMappings ? 
            (globalThis.prefixMappings instanceof Array ? 
                globalThis.prefixMappings : 
                Array.of(globalThis.prefixMappings)) :
            undefined;

    return { projectPath, rootFile, rootComponent, fileType, prefixMappings, PATH_SEPARATOR };
}

function displayMenu(currentIndex,currentMenuIndex,menuOptions) {
    console.clear();
    console.log(`Menu for Prop Drilling ${currentIndex + 1}`);
    menuOptions.forEach((option, i) => {
        if(i === currentMenuIndex){
            console.log(`> ${option}`);
        } else {
            console.log(` ${option}`);
        }
    });
    console.log("\nUse UP/DOWN arrows to navigate, ENTER to select, or Q to go back.");
}

function displayPropDrilling(index,propDrillings) {
    const reactComponents = globalThis.reactComponentManager.getAllReactComponents();
    console.clear();
    const currentPropDrilling = propDrillings[index];
    console.log(`Prop Drilling ${index+1}/${propDrillings.length}`);
    let { fullPath } = currentPropDrilling.giveDetailedPropDrillingPath(propDrillings, reactComponents, currentPropDrilling.getGroupedProps(propDrillings)) 
    console.log(fullPath);
    console.log('\nUse UP/DOWN arrows to navigate, or press ENTER for more options, or press Q to quit.');
}

export { displayMenu, displayPropDrilling, extractGlobalCliVariables}
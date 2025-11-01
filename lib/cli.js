function extractGlobalCliVariables() {
    const args = process.argv.slice(2);
    const projectPath = args[0];
    const rootFile = args[1];
    const rootComponent = args[2];
    const fileType = args[3] || rootFile?.split(".").pop();

    return { projectPath, rootFile, rootComponent, fileType };
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

function displayPropDrilling(index,propDrillings,reactComponents) {
    console.clear();
    const currentPropDrilling = propDrillings[index];
    console.log(`Prop Drilling ${index+1}/${propDrillings.length}`);
    let { fullPath } = currentPropDrilling.giveDetailedPropDrillingPath(propDrillings, reactComponents, currentPropDrilling.getGroupedProps(propDrillings)) 
    console.log(fullPath);
    console.log('\nUse UP/DOWN arrows to navigate, or press ENTER for more options, or press Q to quit.');
}

export { displayMenu, displayPropDrilling, extractGlobalCliVariables}
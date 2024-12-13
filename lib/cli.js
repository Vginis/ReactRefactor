let inMenu = false;
let currentMenuIndex = 0;
const menuOptions = ["Refactor Prop Drilling with Context","Refactor Prop Drilling with Component Composition",
     "View Detailed Path"];

function displayPropDrilling(index,propDrillings){
    console.clear();
    console.log(`Prop Drilling ${index+1}/${propDrillings.length}`);
    console.log(propDrillings[index].giveDetailedPropDrillingPath());
    console.log('\nUse UP/DOWN arrows to navigate,, or press ENTER for more options, or press Q to quit.');
}

function displayMenu(currentIndex){
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
function handleMenuInput(key,propDrillingInformation){
    const { propDrillings,reactComponents,currentIndex } = propDrillingInformation;
    if (key === '\u0003' || key.toLowerCase() === 'q') { // Ctrl+C or 'Q'
        inMenu = false;
        displayPropDrilling(currentIndex,propDrillings);
    } else if (key === '\u001b[A') { // UP arrow
        if (currentMenuIndex > 0) {
            currentMenuIndex -= 1;
            displayMenu(currentIndex);
        }
    } else if (key === '\u001b[B') { // DOWN arrow
        if (currentMenuIndex < menuOptions.length - 1) {
            currentMenuIndex += 1;
            displayMenu(currentIndex);
        }
    } else if (key === '\r') { // Enter
        const selectedOption = menuOptions[currentMenuIndex];
        inMenu = false;
        console.clear();
        console.log(`You selected: ${selectedOption}`);
        // Placeholder actions for menu options
        if (selectedOption === "Refactor Prop Drilling with Context") {
            console.log("Initiating context refactoring for prop drilling...");
            propDrillings[currentIndex].addUseContext(reactComponents,propDrillings);
        } else if(selectedOption === "Refactor Prop Drilling with Component Composition"){
            console.log("Initiating component composition for prop drilling...")
            propDrillings[currentIndex].addComponentComposition(reactComponents,propDrillings);
        } else if (selectedOption === "View Detailed Path") {
            console.log("Displaying detailed path...");           
            console.log(propDrillings[currentIndex].giveDetailedPropDrillingPath());
        }
        reactComponents.forEach(comp => {
            comp.writeChanges();
        });
        console.log("\nPress any key to go back.");
        process.stdin.once("keypress", () => {
            displayPropDrilling(currentIndex,propDrillings);
        });
    }
}
function handleUserInput(key,propDrillingInformation){
    const { propDrillings,reactComponents,rl,currentIndex } = propDrillingInformation;
    if(inMenu){
        handleMenuInput(key,propDrillingInformation);
        return;
    }
    if(key === '\u0003' || key.toLowerCase()==='q'){ // Ctrl+C or 'Q'
        rl.close();
        process.exit();
    } else if(key === '\u001b[A'){ //UP arrow
        if(currentIndex > 0){
            currentIndex -= 1;
            displayPropDrilling(currentIndex,propDrillings);
        }
    } else if(key === '\u001b[B'){ //DOWN arrow
        if(currentIndex <propDrillings.length-1){
            currentIndex += 1;
            displayPropDrilling(currentIndex,propDrillings);
        }
    } else if(key === '\r'){//Enter
        inMenu = true;
        currentMenuIndex = 0;
        displayMenu(currentIndex);
    }
}


export {displayPropDrilling,handleUserInput}
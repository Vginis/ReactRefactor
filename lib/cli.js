function displayMenu(currentIndex,currentMenuIndex,menuOptions){
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

function displayPropDrilling(index,propDrillings,reactComponents){
    console.clear();
    const currentPropDrilling = propDrillings[index];
    console.log(`Prop Drilling ${index+1}/${propDrillings.length}`);
    console.log(currentPropDrilling.giveDetailedPropDrillingPath(propDrillings, reactComponents, currentPropDrilling.getGroupedProps(propDrillings)));
    console.log('\nUse UP/DOWN arrows to navigate, or press ENTER for more options, or press Q to quit.');
}

export {displayMenu,displayPropDrilling}
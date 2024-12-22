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

function displayPropDrilling(index,propDrillings){
    console.clear();
    console.log(`Prop Drilling ${index+1}/${propDrillings.length}`);
    console.log(propDrillings[index].giveDetailedPropDrillingPath());
    console.log('\nUse UP/DOWN arrows to navigate,, or press ENTER for more options, or press Q to quit.');
}

export {displayMenu,displayPropDrilling}
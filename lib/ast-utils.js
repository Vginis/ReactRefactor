
function astLocationMatches(astNode, otherAstNode) {
    if (!astNode || !otherAstNode) {
        return false
    }
    return astNode.start === otherAstNode.start && astNode.end === otherAstNode.end
}

function extractIdentifierArgumentsFromCallExpression(astNode, onlyCapitalizedNames = true) {

    if (astNode.type !== 'CallExpression') {
        return []
    }

    const identifierNames = []

    astNode.arguments.forEach(arg => {

        if (arg.type === 'Identifier') {
            if ((onlyCapitalizedNames && arg.name[0].toUpperCase() === arg.name[0])
                || !onlyCapitalizedNames) {
                identifierNames.push(arg.name)
                return;
            }
        }
        if (arg.type === 'CallExpression'){
            identifierNames.push(... extractIdentifierArgumentsFromCallExpression(arg, onlyCapitalizedNames));
        }
    });

    return identifierNames;
}

export { astLocationMatches, extractIdentifierArgumentsFromCallExpression }
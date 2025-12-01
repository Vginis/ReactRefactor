
function astLocationMatches(astNode, otherAstNode){
    if (!astNode || !otherAstNode){
        return false
    }
    return astNode.start === otherAstNode.start && astNode.end === otherAstNode.end
}


export {astLocationMatches}
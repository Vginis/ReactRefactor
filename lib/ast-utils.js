
function astLocationMatches(astNode, otherAstNode) {
    if (!astNode || !otherAstNode) {
        return false
    }
    return astNode.start === otherAstNode.start && astNode.end === otherAstNode.end
}

/**
 * Returns true if node type is FunctionExpression, 
 * ArrowFunctionExpression or ClassExpression
 * @param astNode 
 * @returns 
 */
function isFunctionalExpression(astNode){
    return astNode.type === "FunctionExpression"
        || astNode.type === "ArrowFunctionExpression"
        || astNode.type === "ClassExpression";
}

function isFunctionalDeclaration(astNode){
    return isFunctionalExpression(astNode) || 
    astNode.type === "FunctionDeclaration"
    || astNode.type === "ClassDeclaration";
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

/**
 * Returns whether the ast node  matches a component declaration
 * @param {*} componentName 
 * @param {*} astDeclaration 
 * @param {*} j 
 * @returns 
 */
function matchesReactComponent(componentName, astDeclaration, j){
    return returnsJSX(astDeclaration, j) && componentName[0] === componentName[0].toUpperCase()
}

//Helper method that decides if an ast node includes returned jsx
function returnsJSX(path, j) {
  let returnedJSX = false;

  const containsJSX = (node) => {
    if (!node) return false;

    if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
      return true;
    }

    if (node.type === 'CallExpression' &&
      node.callee.object &&
      node.callee.object.name === 'React' &&
      node.callee.property.name === 'createElement') {
      return true;
    }

    if (node.type === 'ConditionalExpression') {
      return containsJSX(node.consequent) || containsJSX(node.alternate);
    }

    if (node.type === 'LogicalExpression') {
      return containsJSX(node.left) || containsJSX(node.right);
    }

    if (node.type === 'Identifier' && node.name === 'children') {
      return true;
    }

    return false;
  };

  j(path).find(j.ReturnStatement).forEach((returnPath) => {
    const argument = returnPath.node.argument;
    if (containsJSX(argument)) {
      returnedJSX = true;
    }
  });

  if (!returnedJSX && path.type === 'ArrowFunctionExpression') {
    const body = path.body;

    if (containsJSX(body)) {
      returnedJSX = true;
    }
  }

  return returnedJSX;
}


export { astLocationMatches, extractIdentifierArgumentsFromCallExpression, isFunctionalExpression, isFunctionalDeclaration, returnsJSX,
    matchesReactComponent
 }

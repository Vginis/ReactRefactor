import jscodeshift from 'jscodeshift';
function removeDuplicates(arr) {
    let unique = [];
    arr.forEach(element => {
        if (!unique.includes(element)) {
            unique.push(element);
        }
    });
    return unique;
}

function filterDistinctPropDrillingObjects(list) {
    return list.filter((item, index, self) => 
      index === self.findIndex(
        other =>
          item.property === other.property &&
          JSON.stringify(item.path) === JSON.stringify(other.path) &&
          item.source === other.source &&
          item.dest === other.dest
      )
    );
  }

  function returnsJSX(path, j) {
    let returnedJSX = false;
  
    const containsJSX = (node) => {
      if (!node) return false;
  
      if (node.type === 'JSXElement' || node.type === 'JSXFragment') {
        return true;
      }
  
      if (
        node.type === 'CallExpression' &&
        node.callee.object &&
        node.callee.object.name === 'React' &&
        node.callee.property.name === 'createElement'
      ) {
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

export {filterDistinctPropDrillingObjects,removeDuplicates,returnsJSX};
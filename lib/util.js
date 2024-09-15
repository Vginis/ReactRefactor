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
  
    // Handle normal function components and class methods
    j(path).find(j.ReturnStatement).forEach(returnPath => {
      const argument = returnPath.node.argument;
      if (argument && (
          argument.type === 'JSXElement' || 
          argument.type === 'JSXFragment' || 
          (argument.type === 'CallExpression' &&
           argument.callee.object &&
           argument.callee.object.name === 'React' &&
           argument.callee.property.name === 'createElement')
        )
      ) {
        returnedJSX = true;
      }
    });
    // Handle arrow function components with implicit return
    if (!returnedJSX && path.type === 'ArrowFunctionExpression') {
      const body = path.body;
  
      // If the arrow function's body is JSXElement/JSXFragment, it's implicitly returned
      if (body.type === 'JSXElement' || body.type === 'JSXFragment') {
        returnedJSX = true;
      }
  
      // Handle arrow function returning a call to React.createElement
      if (body.type === 'CallExpression' &&
          body.callee.object &&
          body.callee.object.name === 'React' &&
          body.callee.property.name === 'createElement') {
        returnedJSX = true;
      }
    }

    return returnedJSX;
  }

export {filterDistinctPropDrillingObjects,removeDuplicates,returnsJSX};
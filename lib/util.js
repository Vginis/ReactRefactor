import jscodeshift from 'jscodeshift';
import { PropDrilling } from './PropDrilling.js';
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

function filterSamePropertyPropDrillings(list){
  function isSubpath(shorter,longer){
    if(shorter.length >= longer) return false;
    return shorter.every((element,index) => element = longer[index]);
  }

  const groupedByProp = list.reduce((acc,curr) => {
    if(!acc[curr.property]) acc[curr.property] = [];
    acc[curr.property].push(curr);
    return acc;
  },{});

  const filteredList = [];
  Object.keys(groupedByProp).forEach(prop => {
    const group = groupedByProp[prop];
    const filteredGroup = group.filter((currentItem,index) => {
      return !group.some((otherItem, otherIndex) => 
        otherIndex !== index && isSubpath(currentItem.path, otherItem.path)
      );
    });
    filteredList.push(...filteredGroup);
    })
    return filteredList;
  }

function groupPropDrillingsByPath(list) {
  const pathMap = {};

  list.forEach(item => {
    const pathKey = item.path.join('>'); 

    if (!pathMap[pathKey]) {
      pathMap[pathKey] = {
        path: item.path,
        source: item.source,
        dest: item.dest,
        properties: [] 
      };
    }

    pathMap[pathKey].properties.push(item.property);
  });

  return Object.values(pathMap).map(group => {
    return new PropDrilling(group.properties, group.path, group.source, group.dest);
  });
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

export {filterDistinctPropDrillingObjects,removeDuplicates,returnsJSX,filterSamePropertyPropDrillings,groupPropDrillingsByPath};
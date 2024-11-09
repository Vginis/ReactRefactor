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

function removeDuplicateObjects(arr) {
  return arr.filter((obj, index, self) =>
    index === self.findIndex((t) => JSON.stringify(t) === JSON.stringify(obj))
  );
}

function removeDuplicatePropPassings(arr) {
  return arr.filter((obj, index, self) =>
    index === self.findIndex((t) =>
      t.sourceComponent.name === obj.sourceComponent.name &&
      t.destComponent.name === obj.destComponent.name &&
      JSON.stringify(t.props) === JSON.stringify(obj.props)
    )
  );
}

function filterDistinctPropDrillingObjects(list) {
    return list.filter((item, index, self) => 
      index === self.findIndex(
        other =>
          item.properties === other.properties &&
          JSON.stringify(item.path) === JSON.stringify(other.path) &&
          item.source === other.source &&
          item.dest === other.dest
      )
    );
  }

  function filterLongestPropDrillings(propDrillingInstances) {
    propDrillingInstances.sort((a, b) => b.path.length - a.path.length);

    const filteredInstances = [];

    for (const currentInstance of propDrillingInstances) {
        const currentProps = JSON.stringify(currentInstance.properties);
        const isSubset = filteredInstances.some(instance => {
            const instanceProps = JSON.stringify(instance.properties);
            if (currentProps !== instanceProps) return false;
            return isPathSubset(currentInstance.path, instance.path);
        });
        
        if (!isSubset) {
            filteredInstances.push(currentInstance);
        }
    }

    return filteredInstances;
}

function isPathSubset(path1, path2) {
    if (path1.length > path2.length) return false;

    const path1Components = path1.map(passing => passing.sourceComponent.name);
    const path2Components = path2.map(passing => passing.sourceComponent.name);
    for (let i = 0; i <= path2Components.length - path1Components.length; i++) {
        if (path2Components.slice(i, i + path1Components.length).every((comp, idx) => comp === path1Components[idx])) {
            return true;
        }
    }
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
function groupPropDrillingsByPath(propDrillings) {
  const grouped = {};

  propDrillings.forEach((propDrilling) => {
    const pathArray = propDrilling.path.map(propPassing => propPassing.sourceComponent.name);
    pathArray.push(propDrilling.dest.name);
    const pathKey = pathArray.join('->');
    if (!grouped[pathKey]) {
      grouped[pathKey] = new PropDrilling([],propDrilling.path,propDrilling.source,propDrilling.dest);
    }
    grouped[pathKey].properties = grouped[pathKey].properties.concat(propDrilling.properties);
  });

  return Object.values(grouped);
}


export {filterDistinctPropDrillingObjects,removeDuplicates,returnsJSX,filterLongestPropDrillings,removeDuplicateObjects,removeDuplicatePropPassings,groupPropDrillingsByPath};


'use strict';

import common = require('../common');
import { Type } from '../type';
import ast = require('../yamlAST');

var YAML_FLOAT_PATTERN = new RegExp(
  '-?(0|[1-9][0-9]*)(\.[0-9]*)?([eE][-+]?[0-9]+)?' +
  '|^0$' +
  '|^[-+]?\.(inf|Inf|INF)$' +
  '|^\.(nan|NaN|NAN)$');

function resolveYamlFloat(nodeOrString: ast.YAMLNode | string) {
  const floatValue = ast.isYAMLNode(nodeOrString) ? (nodeOrString as ast.YAMLNode).value : nodeOrString;
  if (null === floatValue) {
    return false;
  }

  if (!YAML_FLOAT_PATTERN.test(floatValue)) {
    return false;
  }
  return true;
}

function constructYamlFloat(nodeOrString: ast.YAMLNode | string) {
  if (ast.isYAMLNode(nodeOrString)) {
    return nodeOrString;
  }
  var value, sign, base, digits;

  value = nodeOrString.replace(/_/g, '').toLowerCase();
  sign = '-' === value[0] ? -1 : 1;
  digits = [];

  if (0 <= '+-'.indexOf(value[0])) {
    value = value.slice(1);
  }

  if ('.inf' === value) {
    return (1 === sign) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

  } else if ('.nan' === value) {
    return NaN;

  } else if (0 <= value.indexOf(':')) {
    value.split(':').forEach(function (v) {
      digits.unshift((<any>parseFloat)(v, 10));
    });

    value = 0.0;
    base = 1;

    digits.forEach(function (d) {
      value += d * base;
      base *= 60;
    });

    return sign * value;

  }
  return sign * (<any>parseFloat)(value, 10);
}

function representYamlFloat(object, style) {
  if (isNaN(object)) {
    switch (style) {
      case 'lowercase':
        return '.nan';
      case 'uppercase':
        return '.NAN';
      case 'camelcase':
        return '.NaN';
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase':
        return '.inf';
      case 'uppercase':
        return '.INF';
      case 'camelcase':
        return '.Inf';
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase':
        return '-.inf';
      case 'uppercase':
        return '-.INF';
      case 'camelcase':
        return '-.Inf';
    }
  } else if (common.isNegativeZero(object)) {
    return '-0.0';
  }
  return object.toString(10);
}

function isFloat(object) {
  return ('[object Number]' === Object.prototype.toString.call(object)) &&
    (0 !== object % 1 || common.isNegativeZero(object));
}

export = new Type('tag:yaml.org,2002:float', {
  kind: 'scalar',
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: 'lowercase'
});

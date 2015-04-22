'use strict';

var _ = require('lodash');

function toKey(key) {
  return /\[[0-9]\]/.test(key) ? parseInt(/\[([0-9])\]/.exec(key)[1]) : key;
}

function pickKey(exp) {
  exp = exp.split('.');
  return toKey(exp.pop());
}

function getProp(obj, exp) {
  var prop = null;
  function travelProps(obj, exp) {
    if (typeof obj !== 'object' || !obj || exp.length === 0) {
      return prop;
    } else if (!obj[toKey(exp[0])]) {
      return null;
    } else {
      prop = obj;
    }
    return travelProps(obj[toKey(exp[0])], exp.slice(1));
  }
  return travelProps(obj, exp.split('.'));
}

module.exports = function(json, target) {
  var type = typeof target;
  if (type === 'string') {
    if (json[target]) {
      delete json[target];
    }
  } else if (type === 'object') {
    var key = _.keys(target)[0];
    var prop = getProp(json, key);
    if (prop) {
      var val = _.toArray(target[key]);
      key = pickKey(key);
      prop[key] = _.remove(prop[key], function(pv) {
        return _.indexOf(val, pv) === -1;
      });
    }
  } else {
    throw new Error('Not supported type: ' + type)
  }
}

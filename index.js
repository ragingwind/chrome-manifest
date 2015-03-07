'use strict';

var fs = require('fs');
var _ = require('lodash');

function toKey(key) {
  return /\[[0-9]\]/.test(key) ? parseInt(/\[([0-9])\]/.exec(key)[1]) : key;
}

function pickKey(exp) {
  exp = exp.split('.');
  return toKey(exp.pop());
}

function props(obj, exp, v) {
  var prop = null;
  function travelProps(obj, exp) {
    if (typeof obj !== 'object' || !obj || exp.length === 0) {
      return prop;
    } else {
      prop = obj;
    }
    return travelProps(obj[toKey(exp[0])], exp.slice(1));
  }
  return travelProps(obj, exp.split('.'));
}

function version(numbers, index) {
  if (!numbers[index]) {
    throw 'Build number overflow ' + numbers;
  }
  if (numbers[index] + 1 <= 65535) {
    numbers[index]++;
    return numbers.join('.');
  } else {
    version(numbers, ++index);
  }
};

function Manifest(opts) {
  opts = opts || {};
  this.manifest = {};
	if (opts.path) {
		this.load(opts.path);
	}
}

Manifest.prototype.load = function(json) {
  if (typeof json === 'string') {
    this.manifest = JSON.parse(fs.readFileSync(json));
  } else if (typeof json === 'object') {
    this.manifest = json
  }

  return this;
}

Manifest.prototype.save = function(path) {
  fs.writeFileSync(path, this.toString());
  return this;
}

Manifest.prototype.toJSON = function() {
  return this.manifest;
}

Manifest.prototype.toBuffer = function() {
  return new Buffer(this.toString());
}

Manifest.prototype.toString = function() {
  return JSON.stringify(this, 0, '\t');
}

Manifest.prototype.get = function(key) {
  if (key) {
    var prop = props(this.manifest, key);
    return prop[pickKey(key)];
  } else {
    return this.manifest;
  }
}

Manifest.prototype.set = function(key, val) {
  var manifest = this.manifest;
  var prop = props(manifest, key);
  if (prop) {
    prop[pickKey(key)] = val;
  }
}

Manifest.prototype.exclude = function(targets) {
  var manifest = this.manifest;
  targets = _.toArray(targets);
  targets.forEach(function(target) {
    var type = typeof target;

    if (type === 'string') {
      if (target.indexOf('.') !== -1) {
        throw new Error('Keys not existing on root cannot be excluded');
      }
      if (manifest[target]) {
        delete manifest[target];
      }
    } else if (type === 'object') {
      var key = _.keys(target)[0];
      var prop = props(manifest, key);
      var val = _.toArray(target[key]);
      if (prop) {
        key = pickKey(key);
        prop[key] = _.remove(prop[key], function(pv) {
          return _.indexOf(val, pv) === -1;
        });
      }
    } else {
      throw new Error('Not supported type: ' + type)
    }
  });
}

Manifest.prototype.patch = function(patchVersion) {
  if (!patchVersion) {
    var buildnumber = this.manifest.version.split('.');
    this.manifest.version = version(buildnumber, buildnumber.length - 1);
  } else if (typeof patchVersion === 'string' &&
    (/^\d+(\.\d+){0,3}$/).test(patchVersion)) {
    this.manifest.version = patchVersion;
  }
}

module.exports = Manifest;

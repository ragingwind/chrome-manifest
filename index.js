'use strict';

var fs = require('fs');
var _ = require('lodash');

function props(obj, exp) {
  function travelProps(obj, exp) {
    if (typeof obj !== 'object' || !obj || exp.length === 0) {
      return obj;
    }

    var key = /\[[0-9]\]/.test(exp[0]) ? new Number(/\[([0-9])\]/.exec(exp[0])[1]) : exp[0];

    return travelProps(obj[key], exp.slice(1));
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
  this._manifest = {};
	if (opts.path) {
		this.load(opts.path);
	}
}

Manifest.prototype.load = function(json) {
  if (typeof json === 'string') {
    this._manifest = JSON.parse(fs.readFileSync(json));
  } else if (typeof json === 'string') {
    this._manifest = json
  }

  return this;
}

Manifest.prototype.save = function(path) {
  fs.writeFileSync(path, this.toString());
  return this;
}

Manifest.prototype.toJSON = function() {
  return this._manifest;
}

Manifest.prototype.toBuffer = function() {
  return new Buffer(this.toString());
}

Manifest.prototype.toString = function() {
  return JSON.stringify(this, 0, '\t');
}

Manifest.prototype.get = function(key) {
  return key ? props(this._manifest, key) : this._manifest;
}

Manifest.prototype.exclude = function(targets) {
  var manifest = this._manifest;
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
        prop = _.remove(prop, function(pv) {
          return _.indexOf(val, pv) >= 0;
        });
      }
    } else {
      throw new Error('Not supported type: ' + type)
    }
  }.bind(this));
}

Manifest.prototype.patch = function(patchVersion) {
  if (!patchVersion) {
    var buildnumber = this._manifest.version.split('.');
    this._manifest.version = version(buildnumber, buildnumber.length - 1);
  } else if (typeof patchVersion === 'string' &&
    (/^\d+(\.\d+){0,3}$/).test(patchVersion)) {
    this._manifest.version = patchVersion;
  }
}

module.exports = Manifest;

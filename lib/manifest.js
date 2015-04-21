'use strict';

var fs = require('fs');
var _ = require('lodash');
var Metadata = require('./metadata');

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
}

function isMetadataOption(json) {
  return typeof json === 'object' && (!json.name && !json.manifest_version
      && !json.version) && (json.fields || json.permissions);
}

function Manifest(opts) {
	return this.load(opts);
}

Manifest.prototype.load = function(json) {
  json = json || {};

  if (typeof json === 'string') {
    json = JSON.parse(fs.readFileSync(json));
  } else if (isMetadataOption(json)) {
    json = Metadata.getManifest({
      fields: json.fields,
      permissions: json.permissions
    });
  }

  _.extend(this, json);

  return this;
}

Manifest.prototype.toJSON = function() {
  return this;
}

Manifest.prototype.toBuffer = function() {
  return new Buffer(this.toString());
}

Manifest.prototype.toString = function() {
  return JSON.stringify(this, 0, '\t');
}

Manifest.prototype.exclude = function(targets) {
  var manifest = this;
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
      var prop = getProp(manifest, key);
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
    var buildnumber = this.version.split('.');
    this.version = version(buildnumber, buildnumber.length - 1);
  } else if (typeof patchVersion === 'string' && (/^\d+(\.\d+){0,3}$/).test(patchVersion)) {
    this.version = patchVersion;
  }
}

Manifest.prototype.merge = function(src) {
  _.merge(this, src);
}

module.exports = Manifest;
module.exports.queryMetadata = function(opts) {
  return {
    fields: Metadata.queryPermissions(opts),
    permissions: Metadata.queryPermissions(opts)
  };
}

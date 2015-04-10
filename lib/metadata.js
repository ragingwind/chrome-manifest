'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var camelize = require('underscore.string/camelize');

function readjson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath));
}

function query(opts, jsonPath) {
  if (!opts) {
    throw new Error('Query options must be supported');
  }

  var perms = readjson(jsonPath);
  var ret = {};

  Object.keys(perms).forEach(function(key) {
    var perm = perms[key];
    var cond = {
      channel: false,
      extensionTypes: true,
      platforms: true
    };

    cond.cannel = !opts.channel || (perm.channel && perm.channel.indexOf(opts.channel) >= 0);
    cond.extensionTypes = !opts.extensionTypes || opts.extensionTypes === 'all' || perm.extension_types === 'all' ||
            _.intersection(perm.extension_types, opts.extensionTypes).length > 0;
    cond.platforms = !opts.platforms || (perm.platforms && _.intersection(perm.platforms, opts.platforms).length > 0);

    if (cond.cannel && cond.extensionTypes && cond.platforms) {
      ret[key] = perm;
    };
  });

  return ret;
}

function configureField(manifest, field) {
  _.assign(manifest, field, function(src, val, name) {
    if (name === 'permissions') {
      return manifest.permissions = _.union(manifest.permissions || [], val);
    } else if (name === 'icons') {
      return manifest.icons = _.merge(manifest.icons || {}, val);
    } else {
      return val;
    }
  });

  return manifest;
}

function getManifest(fields, permissions) {
  var conf = readjson(path.join(__dirname, 'metadata/configures.json'));
  var manifest = {};

  fields = fields || [];
  permissions = permissions || [];

  fields.forEach(function(name) {
    var field = conf[camelize(name)];

    if (!field) {
      field = {};
      field[name] = {};
    }

    configureField(manifest, field);
  });

  _.each(_.difference(permissions, manifest.permissions), function(name) {
    var field = conf[camelize(name)];

    if (!field) {
      manifest.permissions.push(name);
    } else {
      configureField(manifest, field);
    }
  });

  return manifest;
}

module.exports = {
  queryPermissions: function(opts) {return query(opts, path.join(__dirname, 'metadata/permission_features.json'));},
  queryManifest: function(opts) {return query(opts, path.join(__dirname, 'metadata/manifest_features.json'));},
  getManifest: getManifest
};

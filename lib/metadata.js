'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var camelize = require('underscore.string/camelize');

// Read file as JSON
function readjson(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath));
}

// Return filtered json file by filter options
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
    }
  });

  return ret;
}

// Assign field with related to permissions, icons and other resources
function assignField(manifest, field) {
  _.assign(manifest, field, function(src, val, name) {
    if (name === 'permissions') {
      return manifest.permissions = _.union(manifest.permissions || [], val);
    } else if (name === 'icons') {
      return manifest.icons = _.merge(manifest.icons || {}, val);
    } else if (name === 'content_security_policy') {
      return manifest['content_security_policy'] = manifest['content_security_policy'] ?
             manifest['content_security_policy'] += ' ' + val : val;
    } else {
      return val;
    }
  });

  return manifest;
}

// Return manifest by fields name and permissions
function getManifest(opts) {
  var fields = opts.fields || [];
  var permissions = opts.permissions || [];
  var conf = readjson(path.join(__dirname, 'metadata/configures.json'));
  var manifest = {};

  fields.forEach(function(name) {
    var field = conf[camelize(name)];

    if (!field) {
      field = {};
      field[name] = {};
    }

    assignField(manifest, field);
  });

  // set-up permissions filed
  _.each(_.difference(permissions, manifest.permissions), function(name) {
    var field = conf[camelize(name)];

    // push with name or following field value
    if (!field) {
      manifest.permissions.push(name);
    } else {
      assignField(manifest, field);
    }
  });

  return manifest;
}

module.exports = {
  queryPermissions: function(opts) {
    return query(opts, path.join(__dirname, 'metadata/permission_features.json'));
  },
  queryManifest: function(opts) {
    return query(opts, path.join(__dirname, 'metadata/manifest_features.json'));
  },
  getManifest: getManifest
};

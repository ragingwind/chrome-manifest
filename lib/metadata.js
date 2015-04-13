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
  var templateData = opts.templateData;
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

  _.each(_.difference(permissions, manifest.permissions), function(name) {
    var field = conf[camelize(name)];

    // If there is no related field,
    // push just a permission name to array
    if (!field) {
      manifest.permissions.push(name);
    } else {
      assignField(manifest, field);
    }
  });

  // Convert delemiters to passed values
  if (templateData) {
    try {
      fs.writeFileSync('dummy.json', JSON.stringify(manifest, 2, ' '));
      var computed = _.template(JSON.stringify(manifest));
      manifest = JSON.parse(computed(templateData));
    } catch(e) {
      throw new Error('Missing template data properties, ' + e.toString());
    }
  }

  return manifest;
}

function getTemplateData() {
  return {
    author: 'Author Name',
    backgroundJS: 'scripts/background.js',
    backgroundHTML: 'background.html',
    icon16: 'images/icon16.png',
    icon19: 'images/icon19.png',
    icon38: 'images/icon38.png',
    icon48: 'images/icon48.png',
    icon128: 'images/icon128.png',
    defaultTitle: 'Default Title',
    defaultPopup: 'Default Popup',
    bluetoothUUI: 'Your-Bluetoorh-UUI',
    name: 'Your App Name',
    defaultLocale: 'en',
    description: 'Your App Description',
    titleForfileTextHandler: 'Text File Handler',
    titleForfileImageHandler: 'Image File Handler',
    titleForfileAnyHandler: 'Any File Handler',
    settingHomepage: 'http://www.homepage.com',
    settingStartupPage: 'http://www.startup.com',
    contentScriptJS: 'scripts/contentscript.js',
    cspString: 'script-src \'self\' \'unsafe-eval\' https://example.com; object-src \'self\'',
    extConnAppID: 'Extension AppId',
    extConnMatches: '\'https://*.google.com/*\', \'*://*.chromium.org/*\'',
    homepageURL: 'http://www.homepage.com',
    importId: 'Shared Module Import ID',
    key: 'Extension Uniq Id',
    minimumChromeVersion: 38,
    naclPath: 'naclmodule.nmf',
    naclMimeType: 'application/html',
    oauth2ClientId: 'OAuth2 Client ID',
    oauth2Scope: 'OAuth2 Scope',
    omniboxKeyword: 'Omnibox Keyword',
    optionsPage: 'options.html',
    optionsUIPage: 'options-ui.html',
    pluginPath: 'extension_plugin.dll',
    platforms: 'platforms',
    sandboxPage: 'sandbox.html',
    shortName: 'Your App Short Name',
    signature: 'Your Signature',
    storageSchema: 'schema.json',
    systemIndicator: 'System Indicator',
    updateUrl: 'http://path/to/updateInfo.xml',
    versionName: '1.0 beta',
    webAccessibleResources: '\'images/*.png\', \'style/double-rainbow.css\', \'script/double-rainbow.js\', \'script/main.js\', \'templates/*\'',
    cookiesURL: '\'*://*.google.com\'',
    declarativeWebRequestURL: '\'*://*/*\'',
    webRequestURL: '\'*://*.google.com/\''
  };
}

module.exports = {
  queryPermissions: function(opts) {return query(opts, path.join(__dirname, 'metadata/permission_features.json'));},
  queryManifest: function(opts) {return query(opts, path.join(__dirname, 'metadata/manifest_features.json'));},
  getManifest: getManifest,
  getTemplateData: getTemplateData
};

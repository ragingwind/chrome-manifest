/*global describe, it */

'use strict';

var assert = require('assert');
var fs = require('fs');
var metadata = require('../lib/metadata');

function hasValue(src, dest) {
  var ret = false;
  src = Array.isArray(src) ? src : [src];
  dest = Array.isArray(dest) ? dest : [dest];

  dest.forEach(function (d) {
    if (src.indexOf(d) >= 0) {
      ret = true;
    }
  });

  return ret;
}

it('should return permissions included channel and types', function () {
  var opts = {
    channel: 'stable',
    extensionTypes: ['platform_app']
  };
  var perms = metadata.queryPermissions(opts);

  Object.keys(perms).forEach(function (key) {
    var perm = perms[key];
    assert(perm.channel.indexOf(opts.channel) >= 0 && hasValue(perm.extension_types, opts.extensionTypes));
  });
});

it('should return permissions included dev channel', function () {
  var opts = {
    channel: 'dev'
  };

  var perms = metadata.queryPermissions(opts);

  Object.keys(perms).forEach(function (key) {
    var perm = perms[key];
    assert(perm.channel.indexOf(opts.channel) >= 0);
  });
});

it('should return manifest for extension and stable', function () {
  var opts = {
    channel: 'stable',
    extensionTypes: ['extension']
  };

  var perms = metadata.queryManifest(opts);

  Object.keys(perms).forEach(function (key) {
    var perm = perms[key];
    assert(perm.channel.indexOf(opts.channel) >= 0 &&
          (perm.extension_types === 'all' || hasValue(perm.extension_types, opts.extensionTypes)));
  });
});

it('should return manifest', function () {
  var fields = [
    'about_page',
    'manifest_version',
    'icons',
    'content_scripts',
    'tts_engine'
  ];
  var permissions = [
    'tts_engine',
    'notifications',
    'contextMenus',
    'cookies'
  ];

  var manifest = metadata.getManifest(fields, permissions);

  assert.equal(manifest.permissions.length, 7);
  assert(manifest.about_page);
  assert(manifest.manifest_version);
  assert(manifest.icons && manifest.icons['16'] &&
          manifest.icons['48'] && manifest.icons['128']);
  assert(manifest.content_scripts);
  assert(manifest.tts_engine);
  assert(manifest.web_accessible_resources);
});

it('should return manifest converting', function () {
  var fields = [
    'background-scripts',
    'manifest_version',
    'icons',
    'content_scripts',
    'tts_engine'
  ];

  var templateData = {
    backgroundJS: 'background.js',
    icon16: 'icon/icon-16.png',
    icon48: 'icon/icon-48.png',
    icon128: 'icon/icon-128.png'
  };

  var manifest = metadata.getManifest(fields, null, templateData);

  assert.equal(manifest.icons['16'], 'icon/icon-16.png');
  assert.equal(manifest.icons['48'], 'icon/icon-48.png');
  assert.equal(manifest.icons['128'], 'icon/icon-128.png');
  assert.equal(manifest.background.scripts[0], 'background.js');
});

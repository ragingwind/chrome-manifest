/*global describe, it */

'use strict';

var assert = require('assert');
var fs = require('fs');
var Metadata = require('../lib/metadata');

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

it('should returns permissions included channel and types', function () {
  var opts = {
    channel: 'stable',
    extensionTypes: ['platform_app']
  };
  var perms = Metadata.queryPermissions(opts);

  Object.keys(perms).forEach(function (key) {
    var perm = perms[key];
    assert(perm.channel.indexOf(opts.channel) >= 0 && hasValue(perm.extension_types, opts.extensionTypes));
  });
});

it('should returns permissions included dev channel', function () {
  var opts = {
    channel: 'dev'
  };

  var perms = Metadata.queryPermissions(opts);

  Object.keys(perms).forEach(function (key) {
    var perm = perms[key];
    assert(perm.channel.indexOf(opts.channel) >= 0);
  });
});

it('should returns manifest for extension and stable', function () {
  var opts = {
    channel: 'stable',
    extensionTypes: ['extension']
  };

  var perms = Metadata.queryManifest(opts);

  Object.keys(perms).forEach(function (key) {
    var perm = perms[key];
    assert(perm.channel.indexOf(opts.channel) >= 0 &&
          (perm.extension_types === 'all' || hasValue(perm.extension_types, opts.extensionTypes)));
  });
});

it('should returns manifest', function () {
  var manifest = Metadata.getManifest({
    fields: [
      'about_page',
      'manifest_version',
      'icons',
      'content_scripts',
      'tts_engine',
      'sandbox',
      'content_security_policy'
    ],
    permissions: [
      'tts_engine',
      'notifications',
      'contextMenus',
      'cookies'
    ]
  });

  assert.equal(manifest.permissions.length, 7);
  assert(manifest.about_page);
  assert(manifest.manifest_version);
  assert(manifest.icons && manifest.icons['16'] &&
          manifest.icons['48'] && manifest.icons['128']);
  assert(manifest.content_scripts);
  assert(manifest.tts_engine);
  assert(manifest.web_accessible_resources);
});

it('should returns manifest with content_security_policy merging policies', function () {
  var manifest = Metadata.getManifest({
    fields: [
      'sandbox',
      'content_security_policy'
    ]
  });

  assert(manifest.content_security_policy.indexOf('sandbox allow-scripts;') >= 0);
  assert(manifest.content_security_policy.indexOf('\'unsafe-eval\' https://example.com; object-src \'self\'') >= 0);
});

it('should returns manifest having converting template data', function () {
  var manifest = Metadata.getManifest({
    fields: [
      'background-scripts',
      'manifest_version',
      'icons',
      'content_scripts',
      'tts_engine'
    ]
  });

  assert.equal(manifest.icons['16'], 'images/icon-16.png');
  assert.equal(manifest.icons['48'], 'images/icon-48.png');
  assert.equal(manifest.icons['128'], 'images/icon-128.png');
  assert.equal(manifest.background.scripts[0], 'scripts/background.js');
});


it('should returns manifest having converting template data by tweaked', function () {
  var manifest = Metadata.getManifest({
    fields: [
      'background-scripts',
      'manifest_version',
      'icons',
      'content_scripts',
      'tts_engine'
    ],
  });

  assert.equal(manifest.icons['16'], 'images/icon-16.png');
  assert.equal(manifest.icons['48'], 'images/icon-48.png');
  assert.equal(manifest.icons['128'], 'images/icon-128.png');
  assert.equal(manifest.background.scripts[0], 'scripts/background.js');
});


it('should returns permissions dedicated chrome only', function () {
  var permissions = [
    'audioModem',
    'dns',
    'documentScan',
    'networking.config',
    'platformKeys',
    'power',
    'printerProvider',
    'storage',
    'vpnProvider'
  ];

  var manifest = Metadata.getManifest({
    permissions: permissions
  });

  assert.equal(manifest.permissions.length, 9);
  manifest.permissions.forEach(function (p) {
    assert(permissions.indexOf(p) !== -1);
  });
});

it('should returns valid chrome permissions', function () {
  var permissions = [
    'hostPermissions',
    'background',
    'bookmarks',
    'clipboardRead',
    'clipboardWrite',
    'contentSettings',
    'contextMenus',
    'cookies',
    'debugger',
    'history',
    'idle',
    'management',
    'notifications',
    'pageCapture',
    'tabs',
    'topSites',
    'webNavigation',
    'webRequest',
    'webRequestBlocking',
  ];

  var manifest = Metadata.getManifest({
    permissions: permissions
  });

  permissions.shift();
  permissions.unshift(
    'http://*/*',
    'https://*/*',
    '*://*.google.com'
  );

  assert.equal(manifest.permissions.length, 20);
  manifest.permissions.forEach(function (p) {
    assert(permissions.indexOf(p) !== -1);
  });
});

/*global describe, it */

'use strict';

var assert = require('assert');
var fs = require('fs');
var Manifest = require('../lib/manifest');

it('should return manifest data', function () {
  var manifest = new Manifest('test/fixtures/manifest.json');
  var savedManifest = null;

  assert(manifest.toJSON().name === 'Chrome Manifest', 'Names must be same');
  assert(/Chrome Manifest/gi.test(manifest.toString()), 'Names must be same');
  assert(manifest.toBuffer().toString() === manifest.toString(), 'String must be same');
  assert(manifest.toString(), fs.readFileSync('test/fixtures/manifest.json'));

  manifest.save('test/manifest.copy.json');
  savedManifest = new Manifest('test/manifest.copy.json');

  assert(manifest.toString() == savedManifest.toString(), 'Must be same value');
});

it('should return manifest data same as it passed', function () {
  var manifest = new Manifest({
    'icons': {
      '16': 'images/icon-16.png',
      '128': 'images/icon-128.png'
    },
    'app': {
      'background': {
        'scripts': [
          'scripts/main.js',
          'scripts/chromereload.js'
        ]
      }
    }
  });

  assert.equal(manifest.toJSON().icons['16'], 'images/icon-16.png');
  assert.equal(manifest.toJSON().icons['128'], 'images/icon-128.png');
  assert.equal(manifest.toJSON().app.background.scripts[0], 'scripts/main.js');
  assert.equal(manifest.toJSON().app.background.scripts[1], 'scripts/chromereload.js');
});

it('should return updated value', function () {
  var manifest = new Manifest('test/fixtures/manifest.json');
  var savedManifest = null;

  // Add new uri second content script
  manifest.prop('content_scripts.[1]').matches.push('http://*.google.com');
  assert.equal(manifest.prop('content_scripts.[1].matches.[2]'), 'http://*.google.com');

  // // Remove some of background scripts, manifest_version and key
  manifest.exclude([
    {
      'content_scripts.[0].matches': [
        "http://*/*"
      ]
    },
    {
      'background.scripts': [
        'scripts/willbe-remove-only-for-debug.js',
        'scripts/user-script.js'
      ]
    },
    'manifest_version',
    'key'
  ]);

  assert.equal(manifest.prop('content_scripts.[0].matches').length, 1);
  assert.equal(manifest.val('content_scripts.[0].matches.[0]'), 'https://*/*');
  assert.equal(manifest.prop('background.scripts').length, 2);
  assert.equal(manifest.manifest.background.scripts[1], 'scripts/background.js');
  assert.equal(manifest.prop('manifest_version'), undefined);
  assert.equal(manifest.manifest['key'], undefined);

  // // Patch the version
  for (var i = 0; i < 10; ++i) {
    manifest.patch();
  }
  assert.equal(manifest.prop('version'), '0.0.11');

  manifest.patch('1.1.1');
  assert.equal(manifest.prop('version'), '1.1.1');
});

it('should return overwritten value', function () {
  var manifest = new Manifest('test/fixtures/manifest.json');
  var savedManifest = null;

  // Add new uri second content script
  manifest.set('name', 'New Chrome Apps');
  assert.equal(manifest.prop('name'), 'New Chrome Apps');

  // Add new uri second content script
  manifest.set('background.scripts', ['background.js']);
  assert.equal(manifest.prop('background.scripts')[0], 'background.js');
  assert.equal(manifest.prop('background.scripts').length, 1);

  // It's not gonna work
  var version = manifest.prop('version');
  version = '1.2.2';
  assert.equal(manifest.prop('version'), '0.0.1');
});

it('should return overwritten value', function () {
  // Query permissions by stable and platform_app(Chrome Apps)
  var permissions = Manifest.queryPermissions({
    channel: 'stable',
    extensionTypes: ['platform_app']
  });

  // Query manifest fields by stable and extension
  var fields = Manifest.queryManifest({
    channel: 'stable',
    extensionTypes: ['extension']
  });

  var manifest = Manifest.getManifest({
    fields: Object.keys(fields),
    permissions: Object.keys(permissions)
  });

  manifest.merge({
    name: 'My Apps',
    app: {
      background: {
        scripts: [
          "scripts/background.js",
          "scripts/addmore.js"
        ]
      }
    }
  });

  assert.equal(manifest.manifest['name'], 'My Apps');
  assert.equal(manifest.prop('app.background.scripts').length, 2);
  assert.equal(manifest.prop('app.background.scripts.[1]'), 'scripts/addmore.js');
});

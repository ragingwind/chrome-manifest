/*global describe, it */

'use strict';

var assert = require('assert');
var fs = require('fs');
var Manifest = require('../lib/manifest');

it('should returns valid manifest data', function () {
  var manifest = new Manifest('test/fixtures/manifest.json');

  assert(manifest.name === 'Chrome Manifest', 'Names must be same');
  assert(/Chrome Manifest/gi.test(manifest.toString()), 'Names must be same');
  assert(manifest.toBuffer().toString() === manifest.toString(), 'String must be same');
  assert(manifest.toString(), fs.readFileSync('test/fixtures/manifest.json'));
});

it('should returns manifest data same as it passed', function () {
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

  assert.equal(manifest.icons['16'], 'images/icon-16.png');
  assert.equal(manifest.icons['128'], 'images/icon-128.png');
  assert.equal(manifest.app.background.scripts[0], 'scripts/main.js');
  assert.equal(manifest.app.background.scripts[1], 'scripts/chromereload.js');
});

it('should returns excluded value', function () {
  var manifest = new Manifest('test/fixtures/manifest.json');

  // Add new uri second content script
  manifest.content_scripts[1].matches.push('http://*.google.com');
  assert.equal(manifest.content_scripts[1].matches[2], 'http://*.google.com');

  // Remove some of background scripts, manifest_version and key
  manifest.exclude([
    {
      'content_scripts.[0].matches': ['http://*/*']
    },
    {
      'content_scripts.[1].css': ['styles/contentstyle-10.css']
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

  assert.equal(manifest.content_scripts[0].matches.length, 1);
  assert.equal(manifest.content_scripts[0].matches[0], 'https://*/*');
  assert.equal(manifest.content_scripts[1].css.length, 1);
  assert.equal(manifest.content_scripts[1].css[0], 'styles/contentstyle-11.css');
  assert.equal(manifest.content_scripts[0].matches[0], 'https://*/*');
  assert.equal(manifest.background.scripts.length, 2);
  assert.equal(manifest.background.scripts[1], 'scripts/background.js');
  assert.equal(manifest.manifest_version, undefined);
  assert.equal(manifest['key'], undefined);

  // // Patch the version
  for (var i = 0; i < 10; ++i) {
    manifest.patch();
  }
  assert.equal(manifest.version, '0.0.11');

  manifest.patch('1.1.1');
  assert.equal(manifest.version, '1.1.1');
});


it('should be overwritten value', function () {
  var manifest = new Manifest('test/fixtures/manifest.json');

  // Add new uri second content script
  manifest.background.scripts = ['background.js'];
  assert.equal(manifest.background.scripts[0], 'background.js');
  assert.equal(manifest.background.scripts.length, 1);
});

it('should returns merged value', function () {
  var metadata = new Manifest.queryMetadata({
    channel: 'stable',
    extensionTypes: ['platform_app']
  });

  var manifest = new Manifest({
    fields: Object.keys(metadata.fields),
    permissions: Object.keys(metadata.permissions)
  });

  manifest.merge({
    name: 'My Apps',
    author: 'New Author',
    app: {
      background: {
        scripts: [
          "scripts/background.js",
          "scripts/addmore.js"
        ]
      }
    },
    permissions: [
      'tabs',
      'http://*/**',
      'https://*/**',
      'test permissions'
    ]
  });

  assert.equal(manifest.name, 'My Apps');
  assert.equal(manifest.author, 'New Author');
  assert.equal(manifest.app.background.scripts.length, 2);
  assert.equal(manifest.app.background.scripts[1], 'scripts/addmore.js');
  assert(manifest.permissions.indexOf('test permissions') >= 0);
});

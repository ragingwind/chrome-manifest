/*global describe, it */
'use strict';
var assert = require('assert');
var fs = require('fs');
var Manifest = require('../');

describe('chrome-manifest node module', function () {
  it('should return manifest data', function () {
    var manifest = new Manifest({
      path: 'test/fixtures/manifest.json'
    });
    var savedManifest = null;

    assert(manifest.toJSON().name === 'Chrome Manifest', 'Names must be same');
    assert(/Chrome Manifest/gi.test(manifest.toString()), 'Names must be same');
    assert(manifest.toBuffer().toString() === manifest.toString(), 'String must be same');
    assert(manifest.toString(), fs.readFileSync('test/fixtures/manifest.json'));

    manifest.save('test/manifest.copy.json');
    savedManifest = new Manifest({
      path: 'test/manifest.copy.json'
    });

    assert(manifest.toString() == savedManifest.toString(), 'Must be same value');
  });

  it('should return updated value', function () {
    var manifest = new Manifest({
      path: 'test/fixtures/manifest.json'
    });
    var savedManifest = null;

    // Add new uri second content script
    manifest.get('content_scripts.[1]').matches.push('http://*.google.com');
    assert.equal(manifest.get('content_scripts.[1].matches.[2]'), 'http://*.google.com');

    // Remove some of background scripts, manifest_version and key
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

    assert.equal(manifest.get('content_scripts.[0].matches').length, 1);
    assert.equal(manifest.get('content_scripts.[0].matches.[0]'), 'https://*/*');
    assert.equal(manifest.get('background.scripts').length, 2);
    assert.equal(manifest.get('background.scripts.[1]'), 'scripts/background.js');
    assert.equal(manifest.get('manifest_version'), undefined);
    assert.equal(manifest.get('key'), undefined);

    // Patch the version
    for (var i = 0; i < 10; ++i) {
      manifest.patch();
    }
    assert.equal(manifest.get('version'), '0.0.11');

    manifest.patch('1.1.1');
    assert.equal(manifest.get('version'), '1.1.1');
  });
});

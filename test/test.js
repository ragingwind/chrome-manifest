'use strict';

import test from 'ava';
import Manifest from '../lib/manifest';
import fs from 'fs';

test('should returns valid manifest data', t => {
	var manifest = new Manifest('fixtures/manifest.json');

	t.ok(manifest.name === 'Chrome Manifest', 'Names must be same');
	t.ok(/Chrome Manifest/gi.test(manifest.toString()), 'Names must be same');
	t.ok(manifest.toBuffer().toString() === manifest.toString(), 'String must be same');
	t.ok(manifest.toString(), fs.readFileSync('fixtures/manifest.json'));
});

test('should returns manifest data same as it passed', t => {
	var manifest = new Manifest({
		icons: {
			16: 'images/icon-16.png',
			128: 'images/icon-128.png'
		},
		app: {
			background: {
				scripts: [
					'scripts/main.js',
					'scripts/chromereload.js'
				]
			}
		}
	});

	t.is(manifest.icons['16'], 'images/icon-16.png');
	t.is(manifest.icons['128'], 'images/icon-128.png');
	t.is(manifest.app.background.scripts[0], 'scripts/main.js');
	t.is(manifest.app.background.scripts[1], 'scripts/chromereload.js');
});

test('should returns excluded value', t => {
	var manifest = new Manifest('fixtures/manifest.json');

	// Add new uri second content script
	manifest.content_scripts[1].matches.push('http://*.google.com');
	t.is(manifest.content_scripts[1].matches[2], 'http://*.google.com');

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

	t.is(manifest.content_scripts[0].matches.length, 1);
	t.is(manifest.content_scripts[0].matches[0], 'https://*/*');
	t.is(manifest.content_scripts[1].css.length, 1);
	t.is(manifest.content_scripts[1].css[0], 'styles/contentstyle-11.css');
	t.is(manifest.content_scripts[0].matches[0], 'https://*/*');
	t.is(manifest.background.scripts.length, 2);
	t.is(manifest.background.scripts[1], 'scripts/background.js');
	t.is(manifest.manifest_version, undefined);
	t.is(manifest.key, undefined);

	// // Patch the version
	for (var i = 0; i < 10; ++i) {
		manifest.patch();
	}
	t.is(manifest.version, '0.0.11');

	manifest.patch('1.1.1');
	t.is(manifest.version, '1.1.1');
});

test('should be overwritten value', t => {
	var manifest = new Manifest('fixtures/manifest.json');

	// Add new uri second content script
	manifest.background.scripts = ['background.js'];
	t.is(manifest.background.scripts[0], 'background.js');
	t.is(manifest.background.scripts.length, 1);
});

test('should returns merged value', t => {
	var metadata = Manifest.queryMetadata({
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
					'scripts/background.js',
					'scripts/addmore.js'
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

	t.is(manifest.name, 'My Apps');
	t.is(manifest.author, 'New Author');
	t.is(manifest.app.background.scripts.length, 2);
	t.is(manifest.app.background.scripts[1], 'scripts/addmore.js');
	t.ok(manifest.permissions.indexOf('test permissions') >= 0);
});

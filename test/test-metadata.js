import test from 'ava';
import Metadata from '../lib/metadata';

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

test('should returns permissions included channel and types', t => {
	var opts = {
		channel: 'stable',
		extensionTypes: ['platform_app']
	};
	var perms = Metadata.queryPermissions(opts);

	Object.keys(perms).forEach(function (key) {
		var perm = perms[key];
		t.true(perm.channel.indexOf(opts.channel) >= 0 && hasValue(perm.extension_types, opts.extensionTypes));
	});
});

test('should returns permissions included dev channel', t => {
	var opts = {
		channel: 'dev'
	};

	var perms = Metadata.queryPermissions(opts);

	Object.keys(perms).forEach(function (key) {
		var perm = perms[key];
		t.true(perm.channel.indexOf(opts.channel) >= 0);
	});
});

test('should returns manifest for extension and stable', t => {
	var opts = {
		channel: 'stable',
		extensionTypes: ['extension']
	};

	var perms = Metadata.queryManifest(opts);

	Object.keys(perms).forEach(function (key) {
		var perm = perms[key];
		t.true(perm.channel.indexOf(opts.channel) >= 0 &&
					(perm.extension_types === 'all' || hasValue(perm.extension_types, opts.extensionTypes)));
	});
});

test('should returns manifest', t => {
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

	t.is(manifest.permissions.length, 7);
	t.truthy(manifest.about_page);
	t.truthy(manifest.manifest_version);
	t.truthy(manifest.icons && manifest.icons['16'] &&
					manifest.icons['48'] && manifest.icons['128']);
	t.truthy(manifest.content_scripts);
	t.truthy(manifest.tts_engine);
	t.truthy(manifest.web_accessible_resources);
});

test('should returns manifest with content_security_policy merging policies', t => {
	var manifest = Metadata.getManifest({
		fields: [
			'sandbox',
			'content_security_policy'
		]
	});

	t.true(manifest.content_security_policy.indexOf('sandbox allow-scripts;') >= 0);
	t.true(manifest.content_security_policy.indexOf('\'unsafe-eval\' https://example.com; object-src \'self\'') >= 0);
});

test('should returns manifest having converting template data', t => {
	var manifest = Metadata.getManifest({
		fields: [
			'background-scripts',
			'manifest_version',
			'icons',
			'content_scripts',
			'tts_engine'
		]
	});

	t.is(manifest.icons['16'], 'images/icon-16.png');
	t.is(manifest.icons['48'], 'images/icon-48.png');
	t.is(manifest.icons['128'], 'images/icon-128.png');
	t.is(manifest.background.scripts[0], 'scripts/background.js');
});

test('should returns manifest having converting template data by tweaked', t => {
	var manifest = Metadata.getManifest({
		fields: [
			'background-scripts',
			'manifest_version',
			'icons',
			'content_scripts',
			'tts_engine'
		]
	});

	t.is(manifest.icons['16'], 'images/icon-16.png');
	t.is(manifest.icons['48'], 'images/icon-48.png');
	t.is(manifest.icons['128'], 'images/icon-128.png');
	t.is(manifest.background.scripts[0], 'scripts/background.js');
});

test('should returns permissions dedicated chrome only', t => {
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

	t.is(manifest.permissions.length, 9);
	manifest.permissions.forEach(function (p) {
		t.true(permissions.indexOf(p) !== -1);
	});
});

test('should returns valid chrome permissions', t => {
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
		'webRequestBlocking'
	];

	var manifest = Metadata.getManifest({
		permissions: permissions
	});

	permissions.shift();
	permissions.unshift(
		'http://*/*',
		'https://*/*',
		'*://*.google.com/'
	);

	t.is(manifest.permissions.length, 20);
	manifest.permissions.forEach(function (p) {
		t.true(permissions.indexOf(p) !== -1);
	});
});

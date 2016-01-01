/* eslint quote-props: [2, "consistent"] */
'use strict';

// Permissions for chrome only
var chromeDedicatedPermissions = {
	'audioModem': {
		'channel': 'dev',
		'extension_types': [
			'extension'
		]
	},
	'dns': {
		'channel': 'dev',
		'extension_types': [
			'extension'
		]
	},
	'documentScan': {
		'channel': 'stable',
		'extension_types': [
			'chromeos'
		]
	},
	'networking.config': {
		'channel': 'stable',
		'extension_types': [
			'chromeos'
		]
	},
	'platformKeys': {
		'channel': 'stable',
		'extension_types': [
			'chromeos'
		]
	},
	'power': {
		'channel': 'stable',
		'extension_types': [
			'platform_app', 'chromeos', 'extension'
		]
	},
	'printerProvider': {
		'channel': 'stable',
		'extension_types': [
			'chromeos', 'extension'
		]
	},
	'storage': {
		'channel': 'stable',
		'extension_types': [
			'platform_app', 'chromeos', 'extension'
		]
	},
	'vpnProvider': {
		'channel': 'stable',
		'extension_types': [
			'platform_app', 'chromeos', 'extension'
		]
	}
};

// Ignored permmisions used as subset
var ignoredPermissions = [
	'accessibilityPrivate',
	'mediaGalleries.allAutoDetected',
	'mediaGalleries.scan',
	'mediaGalleries.read',
	'mediaGalleries.copyTo',
	'mediaGalleries.delete',
	'fileSystem.directory',
	'fileSystem.retainEntries',
	'fileSystem.write'
];

// Manifest for chrome only
var chromeDedicatedManifest = {
	'backabout_page': {
		'channel': 'stable',
		'extension_types': ['extensions']
	},
	'backabout_scripts': {
		'channel': 'stable',
		'extension_types': ['extensions']
	},
	'kiosk_enabled': {
		'channel': 'stable',
		'extension_types': ['platform_app']
	},
	'kiosk_only': {
		'channel': 'stable',
		'extension_types': ['platform_app']
	}
};

// Add missing, custrom manifest property
function filterManifest(manifest) {
	Object.keys(chromeDedicatedManifest).forEach(function (p) {
		manifest[p] = chromeDedicatedManifest[p];
	});

	return manifest;
}

// Ignore, add, update permissions
function filterPermission(permission) {
	ignoredPermissions.forEach(function (r) {
		if (permission[r]) {
			delete permission[r];
		}
	});

	Object.keys(chromeDedicatedPermissions).forEach(function (p) {
		permission[p] = chromeDedicatedPermissions[p];
	});

	return permission;
}

module.exports = {
	manifest: filterManifest,
	permission: filterPermission
};

'use strict';

const { execSync, spawnSync } = require('child_process');
const { platform, arch } = process;

function isMusl() {
	try {
		const stderr = execSync('ldd --version', {
			stdio: ['pipe', 'pipe', 'pipe'],
		});
		return stderr.toString().includes('musl');
	} catch (err) {
		return err.stderr?.toString().includes('musl') ?? false;
	}
}

function getPlatformPackage() {
	if (platform === 'linux' && isMusl()) {
		if (arch === 'x64') return '@biomejs/cli-linux-x64-musl';
		if (arch === 'arm64') return '@biomejs/cli-linux-arm64-musl';
		return null;
	}

	const packages = {
		darwin: {
			x64: '@biomejs/cli-darwin-x64',
			arm64: '@biomejs/cli-darwin-arm64',
		},
		linux: {
			x64: '@biomejs/cli-linux-x64',
			arm64: '@biomejs/cli-linux-arm64',
		},
		win32: {
			x64: '@biomejs/cli-win32-x64',
			arm64: '@biomejs/cli-win32-arm64',
		},
	};

	return packages[platform]?.[arch] ?? null;
}

const pkg = getPlatformPackage();
if (!pkg) {
	process.exit(0);
}

const binary = pkg.includes('win32') ? `${pkg}/biome.exe` : `${pkg}/biome`;

try {
	require.resolve(binary);
	process.exit(0);
} catch {
	const { devDependencies } = require('../package.json');
	const version = devDependencies['@biomejs/biome'];
	if (!version) {
		process.exit(0);
	}

	console.log(`Installing missing Biome CLI binary: ${pkg}@${version}`);
	const result = spawnSync(
		'npm',
		['install', '--no-save', '--save-exact', `${pkg}@${version}`],
		{ stdio: 'inherit' },
	);

	process.exit(result.status ?? 1);
}

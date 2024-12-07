/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

(async function () {

	type INativeWindowConfiguration = import('vs/platform/window/common/window.ts').INativeWindowConfiguration;
	type IMainWindowSandboxGlobals = import('vs/base/parts/sandbox/electron-sandbox/globals.js').IMainWindowSandboxGlobals;

	const preloadGlobals: IMainWindowSandboxGlobals = (window as any).vscode; 			// defined by preload.ts

	const configuration = await preloadGlobals.context.resolveConfiguration() as INativeWindowConfiguration;

	const safeProcess = preloadGlobals.process;

	function fileUriFromPath(path: string, config: { isWindows?: boolean; scheme?: string; fallbackAuthority?: string }): string {

		// Since we are building a URI, we normalize any backslash
		// to slashes and we ensure that the path begins with a '/'.
		let pathName = path.replace(/\\/g, '/');
		if (pathName.length > 0 && pathName.charAt(0) !== '/') {
			pathName = `/${pathName}`;
		}

		let uri: string;

		// Windows: in order to support UNC paths (which start with '//')
		// that have their own authority, we do not use the provided authority
		// but rather preserve it.
		if (config.isWindows && pathName.startsWith('//')) {
			uri = encodeURI(`${config.scheme || 'file'}:${pathName}`);
		}

		// Otherwise we optionally add the provided authority if specified
		else {
			uri = encodeURI(`${config.scheme || 'file'}://${config.fallbackAuthority || ''}${pathName}`);
		}

		return uri.replace(/#/g, '%23');
	}

	function setupImportMaps(configuration: INativeWindowConfiguration) {
		const style = document.createElement('style');
		style.type = 'text/css';
		style.media = 'screen';
		style.id = 'vscode-css-loading';
		window.document.head.appendChild(style);

		// Compute base URL and set as global
		const baseUrl = new URL(`${fileUriFromPath(configuration.appRoot, { isWindows: safeProcess.platform === 'win32', scheme: 'vscode-file', fallbackAuthority: 'vscode-app' })}/out/`);


		const importMap: { imports: Record<string, string> } = { imports: {} };
		const addModule = (packageName: string) => {
			const packageNamePath = packageName.split('/');
			const module = `esm-package-dependencies/${packageNamePath[packageNamePath.length - 1]}.js`;
			const url = new URL(module, baseUrl).href;
			importMap.imports[packageName] = url;
		};

		addModule('he');
		addModule('react');
		addModule('react-dom');
		addModule('react-dom/client');
		addModule('react-window');

		const ttp = window.trustedTypes?.createPolicy('vscode-bootstrapImportMap', { createScript(value) { return value; }, });
		const importMapSrc = JSON.stringify(importMap, undefined, 2);
		const importMapScript = document.createElement('script');
		importMapScript.type = 'importmap';
		importMapScript.setAttribute('nonce', '0c6a828f1297');
		// @ts-ignore
		importMapScript.textContent = ttp?.createScript(importMapSrc) ?? importMapSrc;
		window.document.head.appendChild(importMapScript);
	}

	await setupImportMaps(configuration);
}());

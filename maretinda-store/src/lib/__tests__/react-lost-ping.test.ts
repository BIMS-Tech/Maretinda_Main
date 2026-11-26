import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const loader = require('../../../scripts/react-lost-ping-loader.cjs') as (source: string) => string;
const bundled = readFileSync(
	path.resolve(__dirname, '../../../node_modules/next/dist/compiled/react-dom/cjs/react-dom-client.production.js'),
	'utf8',
);
const RECORDS = /0 === \(executionContext & 2\)\s*\?\s*prepareFreshStack\(root, 0\)\s*:\s*\(workInProgressRootPingedLanes \|= pingedLanes\)/g;

describe('the React backport', () => {
	it('makes the React that Next bundles keep a ping that arrives mid-render', () => {
		expect(loader(bundled).match(RECORDS)).toHaveLength(1);
	});

	it('leaves a React that already does so alone', () => {
		const fixed = loader(bundled);
		expect(loader(fixed)).toBe(fixed);
	});

	it('stops the build rather than skip the backport quietly', () => {
		expect(() => loader('something else')).toThrow(/no longer looks/);
	});
});

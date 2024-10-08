// jest.config.js
import {defaults} from 'jest-config';

export default {
	preset: 'ts-jest/presets/default-esm', // Use the ESM preset for ts-jest
	testEnvironment: 'node',
	moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'js'],

	// Updated transform configuration
	transform: {
		'^.+\\.ts$': ['ts-jest', {useESM: true}], // Enable ESM support for TypeScript files
		'^.+\\.js$': 'babel-jest', // Use babel-jest for JavaScript files
	},

};
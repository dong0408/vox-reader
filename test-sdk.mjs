import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { tmt: { v20180321 } } = require('tencentcloud-sdk-nodejs');

console.log('Models keys:', Object.keys(v20180321.Models).slice(0, 20));
console.log('TextTranslateRequest:', v20180321.Models.TextTranslateRequest);

// Look for the correct name
const modelKeys = Object.keys(v20180321.Models);
const matches = modelKeys.filter(k => k.includes('TextTranslate'));
console.log('Matches for TextTranslate:', matches);

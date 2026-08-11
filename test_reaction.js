const assert = require('assert');
let bottomBoundary = 500;
let calculatedTop = 58;
let maxAllowedHeight = bottomBoundary - calculatedTop;
console.log({ calculatedTop, maxAllowedHeight, expectedBottom: calculatedTop + maxAllowedHeight });

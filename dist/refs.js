"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
//specify xlib config options, without requiring environmental config
global._xlibConfigDefaults = __assign({}, {
    logLevel: "ERROR",
    envLevel: "PROD",
    isTest: "FALSE",
    isDev: "FALSE",
    sourceMapSupport: true,
}, global._xlibConfigDefaults);
exports.xlib = require("xlib");
//# sourceMappingURL=refs.js.map
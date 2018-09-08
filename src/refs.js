"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//specify xlib config options, without requiring environmental config
global._xlibConfigDefaults = Object.assign({}, {
    logLevel: "WARN",
    envLevel: "PROD",
    isTest: "FALSE",
    isDev: "FALSE",
    sourceMapSupport: true,
    startupMessageSuppress: true,
}, global._xlibConfigDefaults);
exports.xlib = require("xlib");
//# sourceMappingURL=refs.js.map
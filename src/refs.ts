
//specify xlib config options, without requiring environmental config
(global as any)._xlibConfigDefaults = {
    ...{
        logLevel: "ERROR",
        envLevel: "PROD",
        isTest: "FALSE",
        isDev: "FALSE",
        sourceMapSupport: true,
    } as typeof _xlibConfigDefaults,
    ...(global as any)._xlibConfigDefaults,
};

export import xlib = require("xlib");

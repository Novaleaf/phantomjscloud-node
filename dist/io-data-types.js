"use strict";
function pageRequestDefaultsGet() {
    var pageRequestDefaults = {
        url: null,
        content: null,
        urlSettings: {
            operation: "GET",
            encoding: "utf8",
            headers: {},
            data: null
        },
        renderType: "jpg",
        outputAsJson: false,
        requestSettings: {
            ignoreImages: false,
            disableJavascript: false,
            userAgent: "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Safari/534.34 PhantomJS/2.0.0 (PhantomJsCloud.com/2.0.1)",
            authentication: { userName: "guest", password: "guest" },
            xssAuditingEnabled: false,
            webSecurityEnabled: false,
            resourceWait: 15000,
            resourceTimeout: 35000,
            maxWait: 35000,
            waitInterval: 1000,
            stopOnError: false,
            resourceModifier: [],
            customHeaders: {},
            clearCache: false,
            clearCookies: false,
            cookies: [],
            deleteCookies: []
        },
        suppressJson: ["events.value.resourceRequest.headers", "events.value.resourceResponse.headers", "frameData.content", "frameData.childFrames"],
        renderSettings: {
            quality: 70,
            pdfOptions: {
                border: null,
                footer: {
                    firstPage: null, height: "1cm", lastPage: null, onePage: null, repeating: "<span style='float:right'>%pageNum%/%numPages%</span>"
                },
                format: "letter",
                header: null,
                height: null,
                orientation: "portrait",
                width: null,
                dpi: 150,
            },
            clipRectangle: null,
            renderIFrame: null,
            viewport: { height: 1280, width: 1280 },
            zoomFactor: 1.0,
            passThroughHeaders: false,
        },
        scripts: {
            domReady: [],
            loadFinished: [],
        },
    };
    return pageRequestDefaults;
}
exports.pageRequestDefaultsGet = pageRequestDefaultsGet;
//# sourceMappingURL=io-data-types.js.map
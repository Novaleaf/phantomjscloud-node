"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var refs = require("./refs");
var xlib = refs.xlib;
var Promise = xlib.promise.bluebird;
var _ = xlib.lodash;
var __ = xlib.lolo;
var log = new xlib.logging.Logger(__filename);
//import Promise = refs.Promise;
//import PromiseRetry = refs.PromiseRetry;
exports.ioDatatypes = require("./io-data-types");
/**
 *  helper utils used by the phantomjscloud api.
 */
var utils = require("./utils");
//export function setDebug(isDebug: boolean) {
//    utils.isDebug = isDebug;
//}
/**
 * errors thrown by this module derive from this
 */
var PhantomJsCloudException = (function (_super) {
    __extends(PhantomJsCloudException, _super);
    function PhantomJsCloudException() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PhantomJsCloudException;
}(Error));
exports.PhantomJsCloudException = PhantomJsCloudException;
/**
 * errors thrown by the BrowserApi derive from this
 */
var PhantomJsCloudBrowserApiException = (function (_super) {
    __extends(PhantomJsCloudBrowserApiException, _super);
    function PhantomJsCloudBrowserApiException(message, statusCode, payload, headers) {
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.payload = payload;
        _this.headers = headers;
        return _this;
    }
    return PhantomJsCloudBrowserApiException;
}(PhantomJsCloudException));
exports.PhantomJsCloudBrowserApiException = PhantomJsCloudBrowserApiException;
/**
 *  the defaults used if options are not passed to a new BrowserApi object.
 */
exports.defaultBrowserApiOptions = {
    //endpointOrigin: "http://local.PhantomJsCloud.com:23082",
    endpointOrigin: "https://api.PhantomJsCloud.com",
    apiKey: "a-demo-key-with-low-quota-per-ip-address",
    suppressDemoKeyWarning: false,
};
/**
 * The PhantomJsCloud Browser Api
 */
var BrowserApi = (function () {
    function BrowserApi(keyOrOptions) {
        if (keyOrOptions === void 0) { keyOrOptions = {}; }
        this._endpointPath = "/api/browser/v2/";
        this._browserV2RequestezEndpoint = new xlib.net.EzEndpoint({}, { timeout: 66000, max_tries: 3, interval: 1000 }, { timeout: 65000 });
        if (typeof keyOrOptions === "string") {
            this.options = { apiKey: keyOrOptions };
        }
        else {
            this.options = keyOrOptions;
        }
        _.defaults(this.options, exports.defaultBrowserApiOptions);
        if (this.options.apiKey === exports.defaultBrowserApiOptions.apiKey && this.options.suppressDemoKeyWarning !== true) {
            console.warn("\n------\nWARNING: You are using a demo key for PhantomJs Cloud, and are limited to 100 Pages/Day.  Sign Up to get 500 Pages/Day free.\n------\n");
        }
        //this._browserV2RequestezEndpoint = new xlib.net.EzEndpoint<ioDatatypes.IUserRequest, ioDatatypes.IUserResponse>({origin:this.options.endpointOrigin, path});
        this._autoscaler = new utils.AutoscaleConsumer(this._task_worker.bind(this), this.options.autoscale);
    }
    /**
     * the autoscaler worker function
     * @param task
     */
    BrowserApi.prototype._task_worker = function (task) {
        var _this = this;
        return Promise.try(function () {
            log.debug("_task_worker START");
            _.defaults(task.customOptions, _this.options);
            /**
             *  path including apiKey
             */
            var finalPath = _this._endpointPath + task.customOptions.apiKey + "/";
            //this._browserV2RequestezEndpoint.post(task.userRequest, "hi", "bye", 123);
            return _this._browserV2RequestezEndpoint.post(task.userRequest, task.customOptions.requestOptions, task.customOptions.retryOptions, { origin: task.customOptions.endpointOrigin, path: finalPath })
                .then(function (httpResponse) {
                //log.warn("_task_worker httpResponse", httpResponse.data);
                return Promise.resolve(httpResponse.data);
            }, function (err) {
                //log.warn("_task_worker errResponse", err);
                //let errResponse: Axios.AxiosXHR<ioDatatypes.IUserResponse> = err.innerData
                return Promise.reject(err);
                //let statusCode = errResponse.status;
                //let ex = new PhantomJsCloudBrowserApiException("error processing request, see .payload for details.  statusCode=" + statusCode, statusCode, errResponse.data, errResponse.headers as any);
                //return Promise.reject(ex);
            }).finally(function () {
                log.debug("_task_worker FINISH");
            });
        });
    };
    BrowserApi.prototype.requestSingle = function (request, customOptions, callback) {
        var _this = this;
        return Promise.try(function () {
            log.debug("requestSingle");
            if (callback == null && customOptions != null) {
                //handle function overload
                if (typeof customOptions == "function") {
                    callback = customOptions;
                    customOptions = undefined;
                }
            }
            if (customOptions == null) {
                customOptions = {};
            }
            //convert the request into a userRequest object, if it was a pageRequest
            var _request = request;
            var userRequest;
            if (_request.pages != null && _.isArray(_request.pages)) {
                userRequest = _request;
            }
            else {
                userRequest = { pages: [_request] };
            }
            //set outputAsJson
            _.forEach(userRequest.pages, function (page) {
                page.outputAsJson = true;
            });
            var task = {
                userRequest: userRequest,
                customOptions: customOptions
            };
            return _this._autoscaler.process(task)
                .then(function (result) {
                if (callback != null) {
                    callback(undefined, result);
                }
                return Promise.resolve(result);
            }, function (err) {
                if (callback != null) {
                    callback(err, undefined);
                }
                return Promise.reject(err);
            });
        });
    };
    BrowserApi.prototype.requestBatch = function (requests, customOptions, callback) {
        var _this = this;
        if (callback == null && customOptions != null) {
            //handle function overload
            if (typeof customOptions == "function") {
                callback = customOptions;
                customOptions = undefined;
            }
        }
        var responsePromises = [];
        if (callback != null) {
            var _cb_1 = callback;
            _.forEach(requests, function (request) {
                responsePromises.push(_this.requestSingle(request, customOptions, function (err, result) { _cb_1(err, { request: request, result: result }); }));
            });
        }
        else {
            _.forEach(requests, function (request) {
                responsePromises.push(_this.requestSingle(request, customOptions));
            });
        }
        //if (callback != null) {
        //	Promise.all(responsePromises)
        //		.then((results) => {
        //			if (callback != null) {
        //				callback(null, results);
        //			}
        //			return Promise.resolve(results);
        //		}, (err) => {
        //			if (callback != null) {
        //				callback(err, null);
        //			}
        //			return Promise.reject(err);
        //		});
        //}
        return responsePromises;
    };
    return BrowserApi;
}());
exports.BrowserApi = BrowserApi;
var _test;
(function (_test) {
    describe(__filename, function () {
        var browserApi = new BrowserApi();
        //let browserApi = new BrowserApi({ endpointOrigin: "http://api.phantomjscloud.com" });
        describe("success cases", function () {
            describe("basic browserApi functionality", function () {
                it("plainText example.com", function () {
                    var pageRequest = {
                        url: "https://www.example.com",
                        renderType: "plainText",
                    };
                    return browserApi.requestSingle(pageRequest)
                        .then(function (pjscResponse) {
                        if (pjscResponse.content.data.indexOf("example") >= 0) {
                            return Promise.resolve();
                        }
                        return Promise.reject(log.error("example.com content should contain the word 'example'", { pjscResponse: pjscResponse }));
                    });
                });
            });
            describe("perf tests", function () {
                var fs = require("fs");
                var svg_sample_979_17470485_content = fs.readFileSync(__dirname + "/../tests/svg-sample-979_17470485.html", { encoding: "utf8" });
                // const warmupRequest: ioDatatypes.IPageRequest = {
                // 	url: "",
                // 	content: "<html>hi</html>",
                // 	"renderType": "png", "renderSettings": { "quality": 75, "viewport": { "width": 624, "height": 420 }, "clipRectangle": { "top": 0, "left": 0, "width": 624, "height": 420 }, "zoomFactor": 1 }, "requestSettings": { "waitInterval": 0 }, "outputAsJson": true
                // };
                var testRequest = {
                    "url": "",
                    "content": svg_sample_979_17470485_content,
                    "renderType": "png", "renderSettings": { "quality": 75, "viewport": { "width": 624, "height": 420 }, "clipRectangle": { "top": 0, "left": 0, "width": 624, "height": 420 }, "zoomFactor": 1 }, "requestSettings": { "waitInterval": 0 }, "outputAsJson": true
                };
                function testPass(testName, passName, browserApi) {
                    // //warm up request
                    // const warmupStart = __.utcNowTimestamp();
                    // //return browserApi.requestSingle(testRequest_complexSvgSmallPng)
                    // return browserApi.requestSingle(warmupRequest)
                    // 	.then(() => {
                    // 		const warmupEnd = __.utcNowTimestamp();
                    // 		const warmupElapsedMs = warmupEnd - warmupStart;
                    // 		//log.warn("warmup request elapsedms=", endBasic - startBasic);
                    var testStart = __.utcNowTimestamp();
                    return browserApi.requestSingle(testRequest)
                        .then(function (pjscResponse) {
                        var testEnd = __.utcNowTimestamp();
                        var testElapsedMs = testEnd - testStart;
                        log.warn(testName, { passName: passName,
                            //warmupElapsedMs, 
                            testElapsedMs: testElapsedMs,
                            statusCode: pjscResponse.statusCode });
                        return Promise.resolve();
                        // if (pjscResponse.content.data.indexOf("example") >= 0) {
                        // 	return Promise.resolve();
                        // }
                        // return Promise.reject(log.error("example.com content should contain the word 'example'", { pjscResponse }));
                    });
                    // })
                }
                var test = it("svg gen sample 979_17470485_SEQUENTIAL", function () {
                    var testName = "SEQUENTIAL";
                    var browserApi = new BrowserApi();
                    return testPass(testName, "0", browserApi)
                        .then(function () {
                        return testPass(testName, "1", browserApi);
                    })
                        .then(function () {
                        return testPass(testName, "2", browserApi);
                    })
                        .then(function () {
                        return testPass(testName, "3", browserApi);
                    })
                        .then(function () {
                        return testPass(testName, "4", browserApi);
                    })
                        .then(function () {
                        return testPass(testName, "5", browserApi);
                    })
                        .then(function () {
                        return testPass(testName, "6", browserApi);
                    })
                        .then(function () {
                        return testPass(testName, "7", browserApi);
                    })
                        .then(function () {
                        return testPass(testName, "8", browserApi);
                    })
                        .then(function () {
                        return testPass(testName, "9", browserApi);
                    });
                });
                test.timeout(20000);
                test = it("svg gen sample 979_17470485_PARALLEL", function () {
                    var testName = "PARALLEL";
                    var browserApi = new BrowserApi();
                    var allPasses = [];
                    for (var i = 0; i < 8; i++) {
                        allPasses.push(testPass(testName, i.toString(), browserApi));
                    }
                    return Promise.all(allPasses);
                });
                test.timeout(20000);
                // test = it("svg gen sample 979_17470485_PARALLEL_OLD", () => {
                // 	let testName = "PARALLEL_OLD";
                // 	const browserApi = new BrowserApi({ autoscale: { workerMin: 2 } });
                // 	const allPasses = [];
                // 	for (let i = 0; i < 8; i++) {
                // 		allPasses.push(testPass(testName, i.toString(), browserApi));
                // 	}
                // 	return Promise.all(allPasses);
                // });
                // test.timeout(20000);
            });
        });
        describe("fail cases", function () {
            describe("network failures", function () {
                var test = it("invalid domain", function () {
                    var pageRequest = {
                        url: "https://www.exadsfakjalkjghlalkjrtiuibe.com",
                        renderType: "plainText",
                    };
                    return browserApi.requestSingle(pageRequest)
                        .then(function (pjscResponse) {
                        throw log.error("should have failed...", { pjscResponse: pjscResponse });
                    }, function (err) {
                        if (err.response != null) {
                            var axiosErr = err;
                            log.assert(axiosErr.response != null && axiosErr.response.status === 424, "expected error status 424", { axiosErr: axiosErr });
                        }
                    });
                });
                test.timeout(10000);
            });
        });
    });
})(_test || (_test = {}));
//# sourceMappingURL=_index.js.map
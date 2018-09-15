"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
global.__xlibInitArgs = Object.assign({ 
    //envLevel: "DEV",
    //logLevel: "ERROR",
    //disableEnvAutoRead: false, //won't read env vars from environment, which can override your passed in vars    
    silentInit: true }, global.__xlibInitArgs);
const xlib = require("xlib");
var _ = xlib.lodash;
var bb = xlib.promise.bluebird;
const log = xlib.diagnostics.log; // let log =  new xlib.diagnostics.Logger( __filename );
log._overrideLogLevel("WARN");
//let log = new xlib.diagnostics.
//import Promise = refs.Promise;
//import PromiseRetry = refs.PromiseRetry;
exports.ioDatatypes = require("./io-data-types");
/**
 *  helper utils used by the phantomjscloud api.
 */
const utils = require("./utils");
//export function setDebug(isDebug: boolean) {
//    utils.isDebug = isDebug;
//}
/**
 * errors thrown by this module derive from this
 */
class PhantomJsCloudException extends Error {
}
exports.PhantomJsCloudException = PhantomJsCloudException;
/**
 * errors thrown by the BrowserApi derive from this
 */
class PhantomJsCloudBrowserApiException extends PhantomJsCloudException {
    constructor(message, statusCode, payload, headers) {
        super(message);
        this.statusCode = statusCode;
        this.payload = payload;
        this.headers = headers;
    }
}
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
class BrowserApi {
    constructor(keyOrOptions = {}) {
        this._endpointPath = "/api/browser/v2/";
        this._browserV2RequestezEndpoint = new xlib.net.EzEndpoint({}, { timeout: 66000, max_tries: 3, interval: 1000 }, { timeout: 65000 }, 
        //if the API request fails, this function figures out if we should retry the request or report the failure to the user.
        (err) => __awaiter(this, void 0, void 0, function* () {
            if (err.response == null) {
                //no response so retry normally
                return;
            }
            //custom workflow for known phantomjscloud error levels
            switch (err.response.status) {
                ///////////// FAIL
                case 400: //bad request
                case 401: //unauthorized
                case 402: //payment required
                case 403: //forbidden
                case 424: { //failed dependency
                    //user needs to modify their request
                    throw err;
                }
                ///////////////  RETRY
                case 503: //server to busy
                case 429: { //too many simulatneous requests
                    //stall our thread increase time
                    this._autoscaler.stall();
                    //ok to retry normally
                    return;
                }
                case 500: //internal server error
                case 502: { //bad gateway
                    //ok to retry normally
                    return;
                }
            }
            //standard workflow
            if (err.response.status >= 500) {
                //ok to retry normally
                return;
            }
            else {
                throw err;
            }
        }));
        if (typeof keyOrOptions === "string") {
            this.options = { apiKey: keyOrOptions };
        }
        else {
            this.options = keyOrOptions;
        }
        _.defaults(this.options, exports.defaultBrowserApiOptions);
        if (this.options.apiKey === exports.defaultBrowserApiOptions.apiKey && this.options.suppressDemoKeyWarning !== true) {
            log.warn("\n------\nWARNING: You are using a demo key for PhantomJs Cloud, and are limited to 100 Pages/Day.  Sign Up to get 500 Pages/Day free.\n------\n");
        }
        //this._browserV2RequestezEndpoint = new xlib.net.EzEndpoint<ioDatatypes.IUserRequest, ioDatatypes.IUserResponse>({origin:this.options.endpointOrigin, path});
        this._autoscaler = new utils.AutoscaleConsumer(this._task_worker.bind(this), this.options.autoscale);
    }
    /**
     * the autoscaler worker function
     * @param task
     */
    _task_worker(task) {
        return bb.try(() => {
            log.debug("_task_worker START");
            _.defaults(task.customOptions, this.options);
            /**
             *  path including apiKey
             */
            let finalPath = this._endpointPath + task.customOptions.apiKey + "/";
            //this._browserV2RequestezEndpoint.post(task.userRequest, "hi", "bye", 123);
            return this._browserV2RequestezEndpoint.post(task.userRequest, task.customOptions.requestOptions, task.customOptions.retryOptions, { origin: task.customOptions.endpointOrigin, path: finalPath })
                //return this._browserV2RequestezEndpoint.post(task.userRequest, undefined, task.customOptions.endpointOrigin, finalPath)
                .then((httpResponse) => {
                //log.warn("_task_worker httpResponse", httpResponse.data);
                return Promise.resolve(httpResponse.data);
            }, (err) => {
                //log.warn("_task_worker errResponse", err);
                //let errResponse: Axios.AxiosXHR<ioDatatypes.IUserResponse> = err.innerData
                return Promise.reject(err);
                //let statusCode = errResponse.status;
                //let ex = new PhantomJsCloudBrowserApiException("error processing request, see .payload for details.  statusCode=" + statusCode, statusCode, errResponse.data, errResponse.headers as any);
                //return Promise.reject(ex);
            }).finally(() => {
                log.debug("_task_worker FINISH");
            });
        });
    }
    requestSingle(request, callbackOrOptions, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            let customOptions = callbackOrOptions;
            //	return Promise.try(() => {
            log.debug("requestSingle");
            if (callback == null && callbackOrOptions != null) {
                //handle function overload
                if (typeof callbackOrOptions == "function") {
                    callback = callbackOrOptions;
                    customOptions = {};
                }
            }
            if (callbackOrOptions == null) {
                customOptions = {};
            }
            //convert the request into a userRequest object, if it was a pageRequest
            let _request = request;
            let userRequest;
            if (_request.pages != null && _.isArray(_request.pages)) {
                userRequest = _request;
            }
            else {
                userRequest = { pages: [_request] };
            }
            //set outputAsJson
            _.forEach(userRequest.pages, (page) => {
                page.outputAsJson = true;
            });
            let task = {
                userRequest,
                customOptions
            };
            try {
                let result = yield this._autoscaler.process(task);
                if (callback != null) {
                    callback(undefined, result);
                }
                return result;
            }
            catch (err) {
                if (callback != null) {
                    callback(err, undefined);
                }
                else {
                    throw err;
                }
            }
        });
    }
    requestBatch(requests, customOptionsOrCallback, callback) {
        let customOptions = customOptionsOrCallback;
        if (callback == null && customOptions != null) {
            //handle function overload
            if (typeof customOptions === "function") {
                callback = customOptions;
                customOptions = undefined;
            }
        }
        let responsePromises = [];
        if (callback != null) {
            let _cb = callback;
            _.forEach(requests, (request) => {
                responsePromises.push(this.requestSingle(request, customOptions, (err, result) => { _cb(err, { request, result: result }); }));
            });
        }
        else {
            _.forEach(requests, (request) => {
                responsePromises.push(this.requestSingle(request, customOptions));
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
    }
}
exports.BrowserApi = BrowserApi;
var _test;
(function (_test) {
    describe(__filename, () => {
        log.info("testing if all ok");
        let browserApi = new BrowserApi();
        //let browserApi = new BrowserApi({ endpointOrigin: "http://api.phantomjscloud.com" });
        describe("success cases", () => {
            describe("basic browserApi functionality", () => {
                it("plainText example.com", () => {
                    let pageRequest = {
                        url: "https://www.example.com",
                        renderType: "plainText",
                    };
                    return browserApi.requestSingle(pageRequest)
                        .then((pjscResponse) => {
                        if (pjscResponse.content.data.indexOf("example") >= 0) {
                            return Promise.resolve();
                        }
                        return Promise.reject(log.error("example.com content should contain the word 'example'", { pjscResponse }));
                    });
                });
            });
            //describe("perf tests", () => {
            //	const fs = require("fs");
            //	const svg_sample_979_17470485_content: string = fs.readFileSync(__dirname + "/../tests/svg-sample-979_17470485.html", { encoding: "utf8" });
            //	// const warmupRequest: ioDatatypes.IPageRequest = {
            //	// 	url: "",
            //	// 	content: "<html>hi</html>",
            //	// 	"renderType": "png", "renderSettings": { "quality": 75, "viewport": { "width": 624, "height": 420 }, "clipRectangle": { "top": 0, "left": 0, "width": 624, "height": 420 }, "zoomFactor": 1 }, "requestSettings": { "waitInterval": 0 }, "outputAsJson": true
            //	// };
            //	let testRequest: ioDatatypes.IPageRequest = {
            //		"url": "",
            //		"content": svg_sample_979_17470485_content,
            //		"renderType": "png", "renderSettings": { "quality": 75, "viewport": { "width": 624, "height": 420 }, "clipRectangle": { "top": 0, "left": 0, "width": 624, "height": 420 }, "zoomFactor": 1 }, "requestSettings": { "waitInterval": 0 }, "outputAsJson": true
            //	}
            //	function testPass(testName: string, passName: string, browserApi: BrowserApi): PromiseLike<any> {
            //		// //warm up request
            //		// const warmupStart = __.utcNowTimestamp();
            //		// //return browserApi.requestSingle(testRequest_complexSvgSmallPng)
            //		// return browserApi.requestSingle(warmupRequest)
            //		// 	.then(() => {
            //		// 		const warmupEnd = __.utcNowTimestamp();
            //		// 		const warmupElapsedMs = warmupEnd - warmupStart;
            //		// 		//log.warn("warmup request elapsedms=", endBasic - startBasic);
            //		const testStart = __.utcNowTimestamp();
            //		return browserApi.requestSingle(testRequest)
            //			//return browserApi.requestSingle(basicPageRequest)
            //			.then((pjscResponse) => {
            //				const testEnd = __.utcNowTimestamp();
            //				const testElapsedMs = testEnd - testStart;
            //				log.warn(testName, {
            //					passName,
            //					//warmupElapsedMs, 
            //					testElapsedMs,
            //					statusCode: pjscResponse.statusCode
            //				});
            //				return Promise.resolve();
            //				// if (pjscResponse.content.data.indexOf("example") >= 0) {
            //				// 	return Promise.resolve();
            //				// }
            //				// return Promise.reject(log.error("example.com content should contain the word 'example'", { pjscResponse }));
            //			});
            //		// })
            //	}
            //	let test = it("svg gen sample 979_17470485_SEQUENTIAL", () => {
            //		let testName = "SEQUENTIAL";
            //		const browserApi = new BrowserApi();
            //		return testPass(testName, "0", browserApi)
            //			.then(() => {
            //				return testPass(testName, "1", browserApi);
            //			})
            //			.then(() => {
            //				return testPass(testName, "2", browserApi);
            //			})
            //			.then(() => {
            //				return testPass(testName, "3", browserApi);
            //			})
            //			.then(() => {
            //				return testPass(testName, "4", browserApi);
            //			})
            //			.then(() => {
            //				return testPass(testName, "5", browserApi);
            //			})
            //			.then(() => {
            //				return testPass(testName, "6", browserApi);
            //			})
            //			.then(() => {
            //				return testPass(testName, "7", browserApi);
            //			})
            //			.then(() => {
            //				return testPass(testName, "8", browserApi);
            //			})
            //			.then(() => {
            //				return testPass(testName, "9", browserApi);
            //			})
            //	});
            //	test.timeout(20000);
            //	test = it("svg gen sample 979_17470485_PARALLEL", () => {
            //		let testName = "PARALLEL";
            //		const browserApi = new BrowserApi();
            //		const allPasses = [];
            //		for (let i = 0; i < 8; i++) {
            //			allPasses.push(testPass(testName, i.toString(), browserApi));
            //		}
            //		return Promise.all(allPasses);
            //	});
            //	test.timeout(20000);
        });
        //	// test = it("svg gen sample 979_17470485_PARALLEL_OLD", () => {
        //	// 	let testName = "PARALLEL_OLD";
        //	// 	const browserApi = new BrowserApi({ autoscale: { workerMin: 2 } });
        //	// 	const allPasses = [];
        //	// 	for (let i = 0; i < 8; i++) {
        //	// 		allPasses.push(testPass(testName, i.toString(), browserApi));
        //	// 	}
        //	// 	return Promise.all(allPasses);
        //	// });
        //	// test.timeout(20000);
        //});
        describe("fail cases", () => {
            describe("network failures", () => {
                let test = it("invalid domain", () => {
                    let pageRequest = {
                        url: "https://www.exadsfakjalkjghlalkjrtiuibe.com",
                        renderType: "plainText",
                    };
                    return browserApi.requestSingle(pageRequest)
                        .then((pjscResponse) => {
                        throw log.error("should have failed...", { pjscResponse });
                    }, (err) => {
                        if (err.response != null) {
                            const axiosErr = err;
                            log.assert(axiosErr.response != null && axiosErr.response.status === 424, "expected error status 424", { axiosErr });
                        }
                    });
                });
                test.timeout(10000);
            });
        });
    });
})(_test || (_test = {}));
//# sourceMappingURL=_index.js.map
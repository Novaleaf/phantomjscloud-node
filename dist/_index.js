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
const log = xlib.diagnostics.log;
//log.overrideLogLevel( "WARN" );
/** the definitions for types used by phantomjscloud.   see https://phantomjscloud.com/docs/http-api/ for more details */
exports.ioDatatypes = require("./io-data-types");
/**
* errors thrown by this module derive from this
*/
class PhantomJsCloudException extends xlib.diagnostics.Exception {
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
// /**
//  *  the defaults used if options are not passed to a new BrowserApi object.
//  */
// export let defaultBrowserApiOptions: IBrowserApiOptions = {
//     //endpointOrigin: "http://local.PhantomJsCloud.com:23082",
//     endpointOrigin: "https://api.PhantomJsCloud.com",
//     apiKey: "a-demo-key-with-low-quota-per-ip-address",
//     suppressDemoKeyWarning: false,
// }
// /** internal use: the user's request and it's options */
// interface IBrowserApiTask {
//     userRequest: ioDatatypes.IUserRequest;
//     customOptions: IBrowserApiOptions;
// }
/**
* The PhantomJsCloud Browser Api
*/
class BrowserApi {
    constructor(keyOrOptions = {}) {
        this._endpointPath = "/api/browser/v2/";
        this._defaultBrowserOptions = {
            endpointOrigin: "https://api.PhantomJsCloud.com",
            apiKey: "a-demo-key-with-low-quota-per-ip-address",
            suppressDemoKeyWarning: false,
            endpointOptions: {
                retryOptions: { timeout: 66000, max_tries: 1, interval: 1000, throw_original: true },
                requestOptions: { timeout: 65000 },
                autoscalerOptions: { busyGrowDelayMs: 10000, busyExtraPenalty: 0, growDelayMs: 4000, idleOrBusyDecreaseMs: 3000, minParallel: 4, },
                endpoint: {},
                preRetryErrorIntercept: 
                //if the API request fails, this function figures out if we should retry the request or report the failure to the user.
                (err) => __awaiter(this, void 0, void 0, function* () {
                    if (err.response == null) {
                        //no response so retry normally
                        return "RETRY";
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
                            return "ABORT";
                        }
                        ///////////////  RETRY
                        case 503: //server to busy
                        case 429: { //too many simulatneous requests
                            //stall our thread increase time
                            //ok to retry normally
                            return "RETRY";
                        }
                        case 500: // internal server error
                        case 502: { //bad gateway
                            //ok to retry normally
                            return "RETRY";
                        }
                    }
                    //standard workflow
                    if (err.response.status >= 500) {
                        //ok to retry normally
                        return "RETRY";
                    }
                    else {
                        return "ABORT";
                    }
                }),
            }
        };
        if (typeof keyOrOptions === "string") {
            this.options = { apiKey: keyOrOptions };
        }
        else {
            this.options = keyOrOptions;
        }
        _.defaultsDeep(this.options, this._defaultBrowserOptions);
        //set the actual endpoint to be used internally, if not set via custom options
        _.defaultsDeep(this.options, {
            endpointOptions: {
                endpoint: { origin: this.options.endpointOrigin, path: `${this._endpointPath}${this.options.apiKey}/` }
            }
        });
        if (this.options.apiKey === this._defaultBrowserOptions.apiKey && this.options.suppressDemoKeyWarning !== true) {
            log.warn("\n------\nWARNING: You are using a demo key for PhantomJs Cloud, and are limited to 100 Pages/Day.  Sign Up to get 500 Pages/Day free.\n------\n");
        }
        this._endpoint = new xlib.net.RemoteHttpEndpoint(this.options.endpointOptions);
    }
    /**
    * make a single browser request (PhantomJs call)
    * @param request
    * @param callback
    */
    requestSingle(request, callback) {
        return __awaiter(this, void 0, void 0, function* () {
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
            userRequest.outputAsJson = true;
            // return this._endpoint.post(userRequest).then((axiosResponse) => {
            //     if (callback != null) {
            //         callback(undefined, axiosResponse.data);
            //     }
            //     return axiosResponse.data;
            // }, (err: xlib.net.axios.AxiosError) => {
            //     if (callback != null) {
            //         callback(err, undefined);
            //     }
            //     return bb.reject(err);
            // });
            ///////////////////////////////////////  await inspect mode
            // //try {        
            const { toInspect } = yield xlib.promise.awaitInspect(this._endpoint.post(userRequest));
            if (toInspect.isFulfilled()) {
                const axiosResponse = toInspect.value();
                if (callback != null) {
                    callback(undefined, axiosResponse.data);
                }
                return axiosResponse.data;
            }
            else {
                const err = toInspect.reason();
                if (callback != null) {
                    callback(err, undefined);
                }
                return bb.reject(err);
            }
            //     let axiosResponse = await this._endpoint.post(userRequest);
            //     if (callback != null) {
            //         callback(undefined, axiosResponse.data);
            //     }
            //     return axiosResponse.data;
            // } catch (_err) {
            //     if (callback != null) {
            //         callback(_err, undefined);
            //     }
            //     throw _err;
            // }
        });
    }
    /**
    * make more than 1 browser request (PhantomJs call).  These are executed in parallel and is already optimized for PhantomJs Cloud auto-scaling, (The more your requests, the faster they will process.)
    * @param requests
    * @param callback
    */
    requestBatch(requests, 
    /** note: the callback will be executed once for every request in the array submitted. */
    callback) {
        let responsePromises = [];
        if (callback != null) {
            let _cb = callback;
            _.forEach(requests, (request) => {
                responsePromises.push(this.requestSingle(request, (err, result) => { _cb(err, { request, result: result }); }));
            });
        }
        else {
            _.forEach(requests, (request) => {
                responsePromises.push(this.requestSingle(request));
            });
        }
        return responsePromises;
    }
}
exports.BrowserApi = BrowserApi;
//# sourceMappingURL=_index.js.map
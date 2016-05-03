"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var refs = require("./refs");
var Promise = refs.Promise;
var PromiseRetry = refs.PromiseRetry;
exports.ioDatatypes = require("./io-data-types");
//import _ = refs.lodash;
var _ = refs.lodash;
/**
 *  helper utils used by the phantomjscloud api.   will be moved to a utils module later
 */
var utils;
(function (utils) {
    /**
     * options for the AutoscaleConsumer
     */
    var AutoscaleConsumerOptions = (function () {
        function AutoscaleConsumerOptions() {
            /** the minimum number of workers.  below this, we will instantly provision new workers for added work.  default=2 */
            this.workerMin = 2;
            /** maximum number of parallel workers.  default=30 */
            this.workerMax = 30;
            /** if there is pending work, how long (in ms) to wait before increasing our number of workers.  This should not be too fast otherwise you can overload the autoscaler.  default=3000 (3 seconds), which would result in 20 workers after 1 minute of operation on a very large work queue. */
            this.workersLinearGrowthMs = 3000;
            /** how long (in ms) for an idle worker (no work remaining) to wait before attempting to grab new work.  default=1000 (1 second) */
            this.workerReaquireMs = 1000;
            /** the max time a worker will be idle before disposing itself.  default=20000 (20 seconds) */
            this.workerMaxIdleMs = 20000;
        }
        return AutoscaleConsumerOptions;
    }());
    utils.AutoscaleConsumerOptions = AutoscaleConsumerOptions;
    /**
     * allows consumption of an autoscaling process.  asynchronously executes work, scheduling the work to be executed in a graceful "ramping work up" fashion so to take advantage of the autoscaler increase-in-capacity features.
     * technical details: enqueues all process requests into a central pool and executes workers on them.  if there is additional queued work, increases workers over time.
     */
    var AutoscaleConsumer = (function () {
        function AutoscaleConsumer(
            /** The "WorkerThread", this function processes work. it's execution is automatically managed by this object. */
            _workProcessor, options) {
            if (options === void 0) { options = {}; }
            this._workProcessor = _workProcessor;
            this.options = options;
            this._pendingTasks = [];
            this._workerCount = 0;
            this._workerLastAddTime = new Date(0);
            var defaultOptions = new AutoscaleConsumerOptions();
            _.defaults(options, defaultOptions);
        }
        AutoscaleConsumer.prototype.process = function (input) {
            var _this = this;
            var toReturn = new Promise(function (resolve, reject) {
                _this._pendingTasks.push({ input: input, resolve: resolve, reject: reject });
            });
            this._tryStartProcessing();
            return toReturn;
        };
        AutoscaleConsumer.prototype._tryStartProcessing = function () {
            var _this = this;
            debugLog("AutoscaleConsumer._tryStartProcessing called");
            if (this._workerCount >= this.options.workerMax || this._pendingTasks.length === 0) {
                return;
            }
            var nextAddTime = this._workerLastAddTime.getDate() + this.options.workersLinearGrowthMs;
            var now = Date.now();
            var timeToAddWorker = false;
            if (this._workerCount < this.options.workerMin) {
                timeToAddWorker = true;
            }
            if (now >= nextAddTime) {
                //if we don't have much work remaining, don't add more workers
                //if ((this._workerCount * this.options.workerMinimumQueueMultiplier) < this._pendingRequests.length)
                timeToAddWorker = true;
            }
            if (timeToAddWorker === true) {
                this._workerCount++;
                this._workerLastAddTime = new Date();
                setTimeout(function () { _this._workerLoop(); });
            }
        };
        AutoscaleConsumer.prototype._workerLoop = function (idleMs) {
            var _this = this;
            if (idleMs === void 0) { idleMs = 0; }
            if (this._pendingTasks.length === 0) {
                //no work to do, dispose or wait
                //also instantly dispose of the worker if there's the minimum.
                if (idleMs > this.options.workerMaxIdleMs || this._workerCount <= this.options.workerMin) {
                    //already idle too long, dispose
                    this._workerLoop_disposeHelper();
                }
                else {
                    //retry this workerLoop after a short idle time
                    setTimeout(function () { _this._workerLoop(idleMs + _this.options.workerReaquireMs); }, this.options.workerReaquireMs);
                }
                return;
            }
            var work = this._pendingTasks.shift();
            Promise.try(function () {
                return _this._workProcessor(work.input);
            }).then(function (output) {
                work.resolve(output);
            }, function (error) {
                work.reject(error);
            });
            //fire another loop next tick
            setTimeout(function () { _this._workerLoop(); });
            //since we had work to do, there might be more work to do/scale up workers for. fire a "try start processing"
            this._tryStartProcessing();
            return;
        };
        AutoscaleConsumer.prototype._workerLoop_disposeHelper = function () {
            this._workerCount--;
        };
        return AutoscaleConsumer;
    }());
    utils.AutoscaleConsumer = AutoscaleConsumer;
    /**
 *  a helper for constructing reusable endpoint functions
 */
    var EzEndpointFunction = (function () {
        function EzEndpointFunction(origin, path, 
            /** default is to retry for up to 10 seconds, (no retries after 10 seconds) */
            retryOptions, 
            /** default is to timeout (err 545) after 60 seconds*/
            requestOptions, 
            /** allows aborting retries (if any).  return null to continue retry normally,  return any non-null to abort retries and return the result you are returning.
            NOTE:   error's of statusCode 545 are request timeouts
            DEFAULT:  by default we will retry error 500 and above. */
            preRetryIntercept) {
            if (retryOptions === void 0) { retryOptions = { timeout: 60000, interval: 100, backoff: 2, max_interval: 5000 }; }
            if (requestOptions === void 0) { requestOptions = { timeout: 60000 }; }
            if (preRetryIntercept === void 0) { preRetryIntercept = function (err) {
                if (err.status <= 499) {
                    //console.assert(false, "err");					
                    return Promise.reject(err);
                }
                else {
                    return null;
                }
            }; }
            this.origin = origin;
            this.path = path;
            this.retryOptions = retryOptions;
            this.requestOptions = requestOptions;
            this.preRetryIntercept = preRetryIntercept;
        }
        EzEndpointFunction.prototype.toJson = function () {
            return { origin: this.origin, path: this.path, retryOptions: this.retryOptions, requestOptions: this.requestOptions };
        };
        EzEndpointFunction.prototype.post = function (submitPayload, /**setting a key overrides the key put in ctor.requestOptions. */ customRequestOptions, customOrigin, customPath) {
            var _this = this;
            if (customOrigin === void 0) { customOrigin = this.origin; }
            if (customPath === void 0) { customPath = this.path; }
            debugLog("EzEndpointFunction .post() called");
            var lastErrorResult = null;
            return PromiseRetry(function () {
                try {
                    debugLog("EzEndpointFunction .post() in PromiseRetry block");
                    var endpoint = customOrigin + customPath;
                    //log.debug("EzEndpointFunction axios.post", { endpoint });
                    var finalRequestOptions = void 0;
                    if (customRequestOptions == null || Object.keys(customRequestOptions).length === 0) {
                        finalRequestOptions = _this.requestOptions;
                    }
                    else {
                        finalRequestOptions = _.defaults({}, customRequestOptions, _this.requestOptions);
                    }
                    return refs.Axios.post(endpoint, submitPayload, finalRequestOptions)
                        .then(function (result) {
                        debugLog("EzEndpointFunction .post() got valid response");
                        return Promise.resolve(result);
                    }, function (err) {
                        debugLog("EzEndpointFunction .post() got err");
                        //log.info(err);
                        if (err.status === 0 && err.statusText === "" && err.data === "") {
                            //log.debug("EzEndpointFunction axios.post timeout.", { endpoint });
                            err.status = 524;
                            err.statusText = "A Timeout Occurred";
                            err.data = "Axios->EzEndpointFunction timeout.";
                        }
                        if (_this.preRetryIntercept != null) {
                            var interceptResult = _this.preRetryIntercept(err);
                            if (interceptResult != null) {
                                var stopError = new PromiseRetry.StopError("preRetryIntercept abort");
                                stopError["interceptResult"] = interceptResult;
                                return Promise.reject(stopError);
                            }
                        }
                        lastErrorResult = err;
                        return Promise.reject(err);
                    });
                }
                catch (errThrown) {
                    debugLog("EzEndpointFunction .post() in root promiseRetry block,  got errThrown", errThrown.toString());
                    throw errThrown;
                }
            }, this.retryOptions)
                .catch(function (err) {
                debugLog("EzEndpointFunction .post()  retry catch");
                if (err.interceptResult != null) {
                    return err.interceptResult;
                }
                //let payloadStr = submitPayload == null ? "" : serialization.JSONX.inspectStringify(submitPayload);
                //let payloadStrSummarized = stringHelper.summarize(payloadStr, 2000);
                //log.error("failed ez call .post()", this.toJson(), err, lastErrorResult, payloadStr.length, payloadStrSummarized);
                return Promise.reject(err);
            });
        };
        EzEndpointFunction.prototype.get = function (/**setting a key overrides the key put in ctor.requestOptions. */ customRequestOptions, customOrigin, customPath) {
            var _this = this;
            if (customOrigin === void 0) { customOrigin = this.origin; }
            if (customPath === void 0) { customPath = this.path; }
            debugLog("EzEndpointFunction .get() called");
            return PromiseRetry(function () {
                var endpoint = customOrigin + customPath;
                //log.debug("EzEndpointFunction axios.get", { endpoint });
                //return axios.post<TRecievePayload>(endpoint, submitPayload, this.requestOptions) as any;
                var finalRequestOptions;
                if (customRequestOptions == null || Object.keys(customRequestOptions).length === 0) {
                    finalRequestOptions = _this.requestOptions;
                }
                else {
                    finalRequestOptions = _.defaults({}, customRequestOptions, _this.requestOptions);
                }
                return axios.get(endpoint, finalRequestOptions)
                    .then(function (result) {
                    return Promise.resolve(result);
                }, function (err) {
                    //log.info(err);
                    if (err.status === 0 && err.statusText === "" && err.data === "") {
                        //log.debug("EzEndpointFunction axios.get timeout.", { endpoint });
                        err.status = 524;
                        err.statusText = "A Timeout Occurred";
                        err.data = "Axios->EzEndpointFunction timeout.";
                    }
                    if (_this.preRetryIntercept != null) {
                        var interceptResult = _this.preRetryIntercept(err);
                        if (interceptResult != null) {
                            var stopError = new PromiseRetry.StopError("preRetryIntercept abort");
                            stopError["interceptResult"] = interceptResult;
                            return Promise.reject(stopError);
                        }
                    }
                    return Promise.reject(err);
                });
            }, this.retryOptions).catch(function (err) {
                if (err.interceptResult != null) {
                    return err.interceptResult;
                }
                //og.error("failed ez call .get()", this.toJson(), err);
                return Promise.reject(err);
            });
        };
        return EzEndpointFunction;
    }());
    utils.EzEndpointFunction = EzEndpointFunction;
})(utils || (utils = {}));
/**
 * errors thrown by this module derive from this
 */
var PhantomJsCloudException = (function (_super) {
    __extends(PhantomJsCloudException, _super);
    function PhantomJsCloudException() {
        _super.apply(this, arguments);
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
        _super.call(this, message);
        this.statusCode = statusCode;
        this.payload = payload;
        this.headers = headers;
    }
    return PhantomJsCloudBrowserApiException;
}(PhantomJsCloudException));
exports.PhantomJsCloudBrowserApiException = PhantomJsCloudBrowserApiException;
function debugLog() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i - 0] = arguments[_i];
    }
    if (exports.isDebug !== true) {
        return;
    }
    console.log("\n");
    console.log("\n=====================================");
    console.log.apply(console, args);
    console.log("\n");
}
/**set to true to enable debug outputs */
exports.isDebug = false;
/**
 *  the defaults used if options are not passed to a new BrowserApi object.
 */
exports.defaultBrowserApiOptions = {
    endpointOrigin: "https://PhantomJsCloud.com",
    apiKey: "a-demo-key-with-low-quota-per-ip-address",
};
///** the results of PhantomJsCloud processing */
//export interface IBrowserApiResult {
//	/** your original request */
//	userRequest: ioDatatypes.IUserRequest;
//	userResponse: ioDatatypes.IUserResponse;
//	statusCode: number;
//	responseHeaders: { [key: string]: string };
//	responseMeta: {
//		creditCost: number;
//		dailySubscriptionCreditsRemaining: number;
//		prepaidCreditsRemaining: number;
//		totalCreditsRemaining: number;
//		contentName: string;
//		contentStatusCode: number;
//		contentUrl: string;
//	}
//}
//let textUserResponse: ioDatatypes.IUserResponse;
//textUserResponse.
/**
 * The PhantomJsCloud Browser Api
 */
var BrowserApi = (function () {
    function BrowserApi(keyOrOptions) {
        if (keyOrOptions === void 0) { keyOrOptions = {}; }
        this._endpointPath = "/api/browser/v2/";
        this._browserV2RequestezEndpoint = new utils.EzEndpointFunction();
        if (typeof keyOrOptions === "string") {
            this.options = { apiKey: keyOrOptions };
        }
        else {
            this.options = keyOrOptions;
        }
        _.defaults(this.options, exports.defaultBrowserApiOptions);
        if (this.options.apiKey === exports.defaultBrowserApiOptions.apiKey) {
            console.warn("WARNING: You are using a demo key for PhantomJs Cloud, and are limited to 100 Pages/Day.  Sign Up to get 500 Pages/Day free.");
        }
        this._autoscaler = new utils.AutoscaleConsumer(this._task_worker.bind(this));
    }
    /**
     * the autoscaler worker function
     * @param task
     */
    BrowserApi.prototype._task_worker = function (task) {
        debugLog("_task_worker START");
        _.defaults(task.customOptions, this.options);
        /**
         *  path including apiKey
         */
        var finalPath = this._endpointPath + task.customOptions.apiKey + "/";
        return this._browserV2RequestezEndpoint.post(task.userRequest, undefined, task.customOptions.endpointOrigin, finalPath)
            .then(function (httpResponse) {
            debugLog("_task_worker httpResponse", httpResponse.data);
            //let headers: { [key: string]: string } = httpResponse.headers as any;
            //let toReturn: IBrowserApiResult = {
            //	userRequest: task.userRequest,
            //	userResponse: httpResponse.data,
            //	responseHeaders: headers,
            //	statusCode: httpResponse.status,
            //	responseMeta: {
            //		contentName: headers["pjsc-content-name"],
            //		contentStatusCode: parseInt(headers["pjsc-content-status-code"]),
            //		contentUrl: headers["pjsc-content-url"],
            //		creditCost: parseFloat(headers["pjsc-credit-cost"]),
            //		dailySubscriptionCreditsRemaining: parseFloat(headers["pjsc-daily-subscription-credits-remaining"]),
            //		prepaidCreditsRemaining: parseFloat(headers["pjsc-prepaid-credits-remaining"]),
            //		totalCreditsRemaining: parseFloat(headers["pjsc-total-credits-remaining"]),
            //	}
            //};
            return Promise.resolve(httpResponse.data);
        }, function (errResponse) {
            debugLog("_task_worker errResponse", errResponse);
            var statusCode = errResponse.status;
            var ex = new PhantomJsCloudBrowserApiException("error processing request, see .payload for details.  statusCode=" + statusCode.toString(), statusCode, errResponse.data, errResponse.headers);
            return Promise.reject(ex);
        }).finally(function () {
            debugLog("_task_worker FINISH");
        });
    };
    BrowserApi.prototype.requestSingle = function (request, customOptions) {
        if (customOptions === void 0) { customOptions = {}; }
        debugLog("requestSingle");
        var _request = request;
        var userRequest;
        if (_request.pages != null && _.isArray(_request.pages)) {
            userRequest = _request;
        }
        else {
            userRequest = { pages: [_request] };
        }
        //set outputAsJson
        _.forEach(userRequest.pages, function (page) { page.outputAsJson = true; });
        var task = {
            userRequest: userRequest,
            customOptions: customOptions
        };
        return this._autoscaler.process(task);
    };
    BrowserApi.prototype.requestBatch = function (requests) {
        var _this = this;
        var responsePromises = [];
        _.forEach(requests, function (request) {
            responsePromises.push(_this.requestSingle(request));
        });
        return responsePromises;
    };
    return BrowserApi;
}());
exports.BrowserApi = BrowserApi;
//# sourceMappingURL=_main.js.map
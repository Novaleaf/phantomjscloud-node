"use strict";
var refs = require("./refs");
var Promise = refs.Promise;
var PromiseRetry = refs.PromiseRetry;
var _ = refs.lodash;
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
exports.debugLog = debugLog;
/**set to true to enable debug outputs */
exports.isDebug = false;
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
exports.AutoscaleConsumerOptions = AutoscaleConsumerOptions;
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
            //also instantly dispose of the worker if there's the minimum number of workers or less (because we will instantly spawn them up if needed).
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
exports.AutoscaleConsumer = AutoscaleConsumer;
/**
*  a helper for constructing reusable endpoint functions
*/
var EzEndpointFunction = (function () {
    function EzEndpointFunction(origin, path, 
        /** default is to retry for up to 10 seconds, (no retries after 10 seconds) */
        retryOptions, 
        /** default is to timeout (err 545) after 60 seconds*/
        requestOptions, 
        /** allows aborting retries (if any).  return a resolved promise to continue retry normally,  return any rejected promise to abort retries and return the result you are returning.
        NOTE:   error's of statusCode 545 are request timeouts
        DEFAULT:  by default we will retry error 500 and above. */
        preRetryIntercept) {
        if (retryOptions === void 0) { retryOptions = { timeout: 10000, interval: 100, backoff: 2, max_interval: 5000 }; }
        if (requestOptions === void 0) { requestOptions = { timeout: 60000 }; }
        if (preRetryIntercept === void 0) { preRetryIntercept = function (err) {
            if (err.status <= 499) {
                //console.assert(false, "err");		
                var error = new Error("EzEndpointFunction error.  status=" + err.status + " statusText=" + err.statusText + ".  see .innerData for details");
                error["innerData"] = err;
                return Promise.reject(error);
            }
            else {
                //5xx error, so retry
                return Promise.resolve();
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
                    if (err.status == null) {
                        debugLog("EzEndpointFunction .post() error: unable to contact the server at " + customOrigin);
                    }
                    else {
                        debugLog("EzEndpointFunction .post() got err", err.status, err.statusText);
                    }
                    //log.info(err);
                    if (err.status === 0 && err.statusText === "" && err.data === "") {
                        //log.debug("EzEndpointFunction axios.post timeout.", { endpoint });
                        err.status = 524;
                        err.statusText = "A Timeout Occurred";
                        err.data = "Axios->EzEndpointFunction timeout.";
                    }
                    if (_this.preRetryIntercept != null) {
                        return _this.preRetryIntercept(err)
                            .then(function () {
                            //success result signals that we should retry
                            lastErrorResult = err;
                            return Promise.reject(err);
                        }, function (interceptResult) {
                            //pre-retry reject, so we need to stop retrying.  we do this by wrapping our actual rejection with a "StopError"
                            var stopError = new PromiseRetry.StopError("preRetryIntercept abort");
                            stopError["interceptResult"] = interceptResult;
                            return Promise.reject(stopError);
                        });
                    }
                    else {
                        //no pre-retry intercept, so retry everything
                        lastErrorResult = err;
                        return Promise.reject(err);
                    }
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
                //we aborted retry, so return the actual error that stoped retrying, not our "stopError" wrapper
                return Promise.reject(err.interceptResult);
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
exports.EzEndpointFunction = EzEndpointFunction;
//# sourceMappingURL=utils.js.map
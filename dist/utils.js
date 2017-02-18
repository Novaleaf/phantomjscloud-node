"use strict";
var refs = require("./refs");
var xlib = refs.xlib;
var Promise = xlib.promise.bluebird;
var _ = xlib.lodash;
//export function debugLog(...args: any[]): void {
//	if (isDebug !== true) {
//		return;
//	}
//	//console.log("\n");
//	console.log("\n=====================================");
//	console.log.apply(console, args);
//	//console.log("\n");
//}
///**set to true to enable debug outputs */
//export let isDebug = false;
var log = new xlib.logging.Logger(__filename, xlib.environment.LogLevel.WARN);
/**
 * options for the AutoscaleConsumer
 */
var AutoscaleConsumerOptions = (function () {
    function AutoscaleConsumerOptions() {
        /** the minimum number of workers.  below this, we will instantly provision new workers for added work.  default=2 */
        this.workerMin = 2;
        /** maximum number of parallel workers.  default=60 */
        this.workerMax = 60;
        /** if there is pending work, how long (in ms) to wait before increasing our number of workers.  This should not be too fast otherwise you can overload the autoscaler.  default=3000 (3 seconds), which would result in 20 workers after 1 minute of operation on a very large work queue. */
        this.workersLinearGrowthMs = 3000;
        /** how long (in ms) for an idle worker (no work remaining) to wait before attempting to grab new work.  default=100 (100 ms) */
        this.workerReaquireMs = 100;
        /** the max time a worker will be idle before disposing itself.  default=10000 (10 seconds) */
        this.workerMaxIdleMs = 10000;
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
        this._trySpawnWorker();
        return toReturn;
    };
    AutoscaleConsumer.prototype._trySpawnWorker = function () {
        var _this = this;
        //debugLog("AutoscaleConsumer._tryStartProcessing called");
        if (this._workerCount >= this.options.workerMax || this._pendingTasks.length === 0) {
            return;
        }
        var nextAddTime = this._workerLastAddTime.getTime() + this.options.workersLinearGrowthMs;
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
        if (this.__autoTrySpawnHandle == null) {
            //set a periodic auto-try-spawn worker to kick off
            this.__autoTrySpawnHandle = setInterval(function () {
                _this._trySpawnWorker();
                if (_this._pendingTasks.length == 0) {
                    //stop this period attempt because no work to do.
                    clearInterval(_this.__autoTrySpawnHandle);
                    _this.__autoTrySpawnHandle = null;
                }
            }, 100);
        }
    };
    /**
     *  recursively loops itself
     * @param idleMs
     */
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
        if (work == null) {
            throw log.error("pending task is non existant", { work: work, pendingCount: this._pendingTasks.length });
        }
        Promise.try(function () {
            log.debug("AUTOSCALECONSUMER._workerLoop() starting request processing (workProcessor) concurrent=" + _this._workerCount);
            return _this._workProcessor(work.input);
        }).then(function (output) {
            log.debug("AUTOSCALECONSUMER._workerLoop() finished workProcessor() SUCCESS. concurrent=" + _this._workerCount);
            work.resolve(output);
        }, function (error) {
            log.debug("AUTOSCALECONSUMER._workerLoop() finished workProcessor() ERROR. concurrent=" + _this._workerCount);
            work.reject(error);
        }).finally(function () {
            //fire another loop next tick
            setTimeout(function () { _this._workerLoop(); });
            //since we had work to do, there might be more work to do/scale up workers for. fire a "try start processing"
            _this._trySpawnWorker();
        });
    };
    AutoscaleConsumer.prototype._workerLoop_disposeHelper = function () {
        log.debug("AUTOSCALECONSUMER._workerLoop() already idle too long, dispose.   concurrent=" + this._workerCount);
        this._workerCount--;
    };
    return AutoscaleConsumer;
}());
exports.AutoscaleConsumer = AutoscaleConsumer;
///**
//*  a helper for constructing reusable endpoint functions
//*/
//export class EzEndpointFunction<TSubmitPayload, TRecievePayload>{
//	constructor(
//		public origin?: string,
//		public path?: string,
//		/** default is to retry for up to 10 seconds, (no retries after 10 seconds) */
//		public retryOptions: refs._BluebirdRetryInternals.IOptions = { timeout: 10000, interval: 100, backoff: 2, max_interval: 5000 },
//		/** default is to timeout (err 545) after 60 seconds*/
//		public requestOptions: Axios.AxiosXHRConfigBase<TRecievePayload> = { timeout: 60000 },
//		/** allows aborting retries (if any).  return a resolved promise to continue retry normally,  return any rejected promise to abort retries and return the result you are returning.
//		NOTE:   error's of statusCode 545 are request timeouts
//		DEFAULT:  by default we will retry error 500 and above. */
//		public preRetryIntercept: (err: Axios.AxiosXHR<TRecievePayload>) => Promise<void> = (err) => {
//			if (err.status <= 499) {
//				//console.assert(false, "err");		
//				let error = new Error(`EzEndpointFunction error.  status=${err.status} statusText=${err.statusText}.  see .innerData for details`);
//				(error as any)["innerData"] = err;
//				return Promise.reject(error);
//			} else {
//				//5xx error, so retry
//				return Promise.resolve();
//			}
//		}
//	) {
//	}
//	public toJson() {
//		return { origin: this.origin, path: this.path, retryOptions: this.retryOptions, requestOptions: this.requestOptions };
//	}
//	public post(submitPayload?: TSubmitPayload, /**setting a key overrides the key put in ctor.requestOptions. */customRequestOptions?: Axios.AxiosXHRConfigBase<TRecievePayload>, customOrigin: string = this.origin, customPath: string = this.path): Promise<Axios.AxiosXHR<TRecievePayload>> {
//		//debugLog("EzEndpointFunction .post() called");
//		let lastErrorResult: any = null;
//		return PromiseRetry<Axios.AxiosXHR<TRecievePayload>>(() => {
//			try {
//				//debugLog("EzEndpointFunction .post() in PromiseRetry block");
//				let endpoint = customOrigin + customPath;
//				//log.debug("EzEndpointFunction axios.post", { endpoint });
//				let finalRequestOptions: Axios.AxiosXHRConfigBase<TRecievePayload>;
//				if (customRequestOptions == null || Object.keys(customRequestOptions).length === 0) {
//					finalRequestOptions = this.requestOptions;
//				} else {
//					finalRequestOptions = _.defaults({}, customRequestOptions, this.requestOptions);
//				}
//				return (refs.Axios.post<TRecievePayload>(endpoint, submitPayload, finalRequestOptions
//				) as any as Promise<Axios.AxiosXHR<TRecievePayload>>)
//					.then((result) => {
//						debugLog("EzEndpointFunction .post() got valid response");
//						return Promise.resolve(result);
//					}, (err: Axios.AxiosXHR<TRecievePayload>) => {
//						if (err.status == null) {
//							debugLog("EzEndpointFunction .post() error: unable to contact the server at " + customOrigin);
//						} else {
//							debugLog("EzEndpointFunction .post() got err", err.status, err.statusText);
//						}
//						//log.info(err);
//						if (err.status === 0 && err.statusText === "" && err.data === "" as any) {
//							//log.debug("EzEndpointFunction axios.post timeout.", { endpoint });
//							err.status = 524;
//							err.statusText = "A Timeout Occurred";
//							err.data = "Axios->EzEndpointFunction timeout." as any;
//						}
//						if (this.preRetryIntercept != null) { //see if we should retry this or not
//							return this.preRetryIntercept(err)
//								.then(() => {
//									//success result signals that we should retry
//									lastErrorResult = err;
//									return Promise.reject(err);
//								}, (interceptResult) => {
//									//pre-retry reject, so we need to stop retrying.  we do this by wrapping our actual rejection with a "StopError"
//									let stopError = new PromiseRetry.StopError("preRetryIntercept abort");
//									(stopError as any)["interceptResult"] = interceptResult;
//									return Promise.reject(stopError);
//								})
//							//let interceptResult = this.preRetryIntercept(err);
//							//if (interceptResult != null) {
//							//	let stopError = new PromiseRetry.StopError("preRetryIntercept abort");
//							//	(stopError as any)["interceptResult"] = interceptResult;
//							//	return Promise.reject(stopError);
//							//}
//						} else {
//							//no pre-retry intercept, so retry everything
//							lastErrorResult = err;
//							return Promise.reject(err);
//						}
//					});
//			} catch (errThrown) {
//				debugLog("EzEndpointFunction .post() in root promiseRetry block,  got errThrown", errThrown.toString());
//				throw errThrown;
//			}
//		}, this.retryOptions)
//			.catch((err: any) => {
//				debugLog("EzEndpointFunction .post()  retry catch");
//				if (err.interceptResult != null) {
//					//we aborted retry, so return the actual error that stoped retrying, not our "stopError" wrapper
//					return Promise.reject(err.interceptResult);
//				}
//				//let payloadStr = submitPayload == null ? "" : serialization.JSONX.inspectStringify(submitPayload);
//				//let payloadStrSummarized = stringHelper.summarize(payloadStr, 2000);
//				//log.error("failed ez call .post()", this.toJson(), err, lastErrorResult, payloadStr.length, payloadStrSummarized);
//				return Promise.reject(err);
//			});
//	}
//	public get(/**setting a key overrides the key put in ctor.requestOptions. */customRequestOptions?: Axios.AxiosXHRConfigBase<TRecievePayload>, customOrigin: string = this.origin, customPath: string = this.path): Promise<Axios.AxiosXHR<TRecievePayload>> {
//		debugLog("EzEndpointFunction .get() called");
//		return PromiseRetry<Axios.AxiosXHR<TRecievePayload>>(() => {
//			let endpoint = customOrigin + customPath;
//			//log.debug("EzEndpointFunction axios.get", { endpoint });
//			//return axios.post<TRecievePayload>(endpoint, submitPayload, this.requestOptions) as any;
//			let finalRequestOptions: Axios.AxiosXHRConfigBase<TRecievePayload>;
//			if (customRequestOptions == null || Object.keys(customRequestOptions).length === 0) {
//				finalRequestOptions = this.requestOptions;
//			} else {
//				finalRequestOptions = _.defaults({}, customRequestOptions, this.requestOptions);
//			}
//			return (axios.get<TRecievePayload>(endpoint, finalRequestOptions) as any as Promise<Axios.AxiosXHR<TRecievePayload>>)
//				.then((result) => {
//					return Promise.resolve(result);
//				}, (err: Axios.AxiosXHR<TRecievePayload>) => {
//					//log.info(err);
//					if (err.status === 0 && err.statusText === "" && err.data === "" as any) {
//						//log.debug("EzEndpointFunction axios.get timeout.", { endpoint });
//						err.status = 524;
//						err.statusText = "A Timeout Occurred";
//						err.data = "Axios->EzEndpointFunction timeout." as any;
//					}
//					if (this.preRetryIntercept != null) {
//						let interceptResult = this.preRetryIntercept(err);
//						if (interceptResult != null) {
//							let stopError = new PromiseRetry.StopError("preRetryIntercept abort");
//							(stopError as any)["interceptResult"] = interceptResult;
//							return Promise.reject(stopError);
//						}
//					}
//					return Promise.reject(err);
//				});
//		}, this.retryOptions).catch((err: any) => {
//			if (err.interceptResult != null) {
//				return err.interceptResult;
//			}
//			//og.error("failed ez call .get()", this.toJson(), err);
//			return Promise.reject(err);
//		});
//	}
//} 
//# sourceMappingURL=utils.js.map
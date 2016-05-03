

import refs = require("./refs");
import Promise = refs.Promise;
import PromiseRetry = refs.PromiseRetry;


export import ioDatatypes = require("./io-data-types");


//import _ = refs.lodash;
let _ = refs.lodash;

/**
 *  helper utils used by the phantomjscloud api.   will be moved to a utils module later
 */
module utils {


	/**
	 * options for the AutoscaleConsumer
	 */
	export class AutoscaleConsumerOptions {
		/** the minimum number of workers.  below this, we will instantly provision new workers for added work.  default=2 */
		public workerMin: number = 2;
		/** maximum number of parallel workers.  default=30 */
		public workerMax: number = 30;
		/** if there is pending work, how long (in ms) to wait before increasing our number of workers.  This should not be too fast otherwise you can overload the autoscaler.  default=3000 (3 seconds), which would result in 20 workers after 1 minute of operation on a very large work queue. */
		public workersLinearGrowthMs = 3000;
		/** how long (in ms) for an idle worker (no work remaining) to wait before attempting to grab new work.  default=1000 (1 second) */
		public workerReaquireMs = 1000;
		/** the max time a worker will be idle before disposing itself.  default=20000 (20 seconds) */
		public workerMaxIdleMs = 20000;
	}

	/**
	 * allows consumption of an autoscaling process.  asynchronously executes work, scheduling the work to be executed in a graceful "ramping work up" fashion so to take advantage of the autoscaler increase-in-capacity features.
	 * technical details: enqueues all process requests into a central pool and executes workers on them.  if there is additional queued work, increases workers over time.
	 */
	export class AutoscaleConsumer<TInput, TOutput>{

		constructor(
			/** The "WorkerThread", this function processes work. it's execution is automatically managed by this object. */
			private _workProcessor: (input: TInput) => PromiseLike<TOutput>,
			public options: AutoscaleConsumerOptions = {} as any
		) {
			let defaultOptions = new AutoscaleConsumerOptions();
			_.defaults(options, defaultOptions);
		}

		private _pendingTasks: {
			input: TInput;
			resolve: (result: TOutput) => void;
			reject: (error: Error) => void;
		}[] = [];


		public process(input: TInput): Promise<TOutput> {

			let toReturn = new Promise<TOutput>((resolve, reject) => {
				this._pendingTasks.push({ input, resolve, reject });
			});
			this._tryStartProcessing();
			return toReturn;
		}


		private _workerCount: number = 0;
		private _workerLastAddTime: Date = new Date(0);


		private _tryStartProcessing() {
			debugLog("AutoscaleConsumer._tryStartProcessing called");
			if (this._workerCount >= this.options.workerMax || this._pendingTasks.length === 0) {
				return;
			}

			let nextAddTime = this._workerLastAddTime.getDate() + this.options.workersLinearGrowthMs;
			let now = Date.now();

			let timeToAddWorker = false;

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
				setTimeout(() => { this._workerLoop() });
			}
		}

		private _workerLoop(idleMs: number = 0) {


			if (this._pendingTasks.length === 0) {
				//no work to do, dispose or wait
				//also instantly dispose of the worker if there's the minimum.
				if (idleMs > this.options.workerMaxIdleMs || this._workerCount<=this.options.workerMin) { 
					//already idle too long, dispose
					this._workerLoop_disposeHelper();
				} else {
					//retry this workerLoop after a short idle time
					setTimeout(() => { this._workerLoop(idleMs + this.options.workerReaquireMs) }, this.options.workerReaquireMs);
				}
				return;
			}
			let work = this._pendingTasks.shift();

			Promise.try(() => {
				return this._workProcessor(work.input);
			}).then((output) => {
				work.resolve(output);
			}, (error) => {
				work.reject(error);
			});




			//fire another loop next tick
			setTimeout(() => { this._workerLoop(); });

			//since we had work to do, there might be more work to do/scale up workers for. fire a "try start processing"
			this._tryStartProcessing();

			return;
		}

		private _workerLoop_disposeHelper() {
			this._workerCount--;
		}



	}


	/**
 *  a helper for constructing reusable endpoint functions
 */
	export class EzEndpointFunction<TSubmitPayload, TRecievePayload>{

		constructor(
			public origin?: string,
			public path?: string,
			/** default is to retry for up to 10 seconds, (no retries after 10 seconds) */
			public retryOptions: refs._BluebirdRetryInternals.IOptions = { timeout: 60000, interval: 100, backoff: 2, max_interval: 5000 },
			/** default is to timeout (err 545) after 60 seconds*/
			public requestOptions: Axios.AxiosXHRConfigBase<TRecievePayload> = { timeout: 60000 },
			/** allows aborting retries (if any).  return null to continue retry normally,  return any non-null to abort retries and return the result you are returning.
			NOTE:   error's of statusCode 545 are request timeouts
			DEFAULT:  by default we will retry error 500 and above. */
			public preRetryIntercept: (err: Axios.AxiosXHR<TRecievePayload>) => Promise<TRecievePayload> = (err) => {
				if (err.status <= 499) {
					//console.assert(false, "err");					
					return Promise.reject(err);
				} else {
					return null;
				}
			}
		) {

		}

		public toJson() {
			return { origin: this.origin, path: this.path, retryOptions: this.retryOptions, requestOptions: this.requestOptions };
		}

		public post(submitPayload?: TSubmitPayload, /**setting a key overrides the key put in ctor.requestOptions. */customRequestOptions?: Axios.AxiosXHRConfigBase<TRecievePayload>, customOrigin: string = this.origin, customPath: string = this.path): Promise<Axios.AxiosXHR<TRecievePayload>> {
			debugLog("EzEndpointFunction .post() called");
			let lastErrorResult: any = null;
			return PromiseRetry<Axios.AxiosXHR<TRecievePayload>>(() => {

				try {

					debugLog("EzEndpointFunction .post() in PromiseRetry block");
					let endpoint = customOrigin + customPath;
					//log.debug("EzEndpointFunction axios.post", { endpoint });


					let finalRequestOptions: Axios.AxiosXHRConfigBase<TRecievePayload>;
					if (customRequestOptions == null || Object.keys(customRequestOptions).length === 0) {
						finalRequestOptions = this.requestOptions;
					} else {
						finalRequestOptions = _.defaults({}, customRequestOptions, this.requestOptions);
					}

					return (refs.Axios.post<TRecievePayload>(endpoint, submitPayload, finalRequestOptions
					) as any as Promise<Axios.AxiosXHR<TRecievePayload>>)
						.then((result) => {
							debugLog("EzEndpointFunction .post() got valid response");
							return Promise.resolve(result);
						}, (err: Axios.AxiosXHR<TRecievePayload>) => {
							debugLog("EzEndpointFunction .post() got err");
							//log.info(err);
							if (err.status === 0 && err.statusText === "" && err.data === "" as any) {
								//log.debug("EzEndpointFunction axios.post timeout.", { endpoint });
								err.status = 524;
								err.statusText = "A Timeout Occurred";
								err.data = "Axios->EzEndpointFunction timeout." as any;
							}
							if (this.preRetryIntercept != null) {
								let interceptResult = this.preRetryIntercept(err);
								if (interceptResult != null) {
									let stopError = new PromiseRetry.StopError("preRetryIntercept abort");
									(stopError as any)["interceptResult"] = interceptResult;
									return Promise.reject(stopError);
								}
							}
							lastErrorResult = err;
							return Promise.reject(err);
						});

				} catch (errThrown) {
					debugLog("EzEndpointFunction .post() in root promiseRetry block,  got errThrown",errThrown.toString());
					throw errThrown;
				}

			}, this.retryOptions)
				.catch((err: any) => {
					debugLog("EzEndpointFunction .post()  retry catch");
					if (err.interceptResult != null) {
						return err.interceptResult;
					}

					//let payloadStr = submitPayload == null ? "" : serialization.JSONX.inspectStringify(submitPayload);
					//let payloadStrSummarized = stringHelper.summarize(payloadStr, 2000);
					//log.error("failed ez call .post()", this.toJson(), err, lastErrorResult, payloadStr.length, payloadStrSummarized);
					return Promise.reject(err);
				});
		}
		public get(/**setting a key overrides the key put in ctor.requestOptions. */customRequestOptions?: Axios.AxiosXHRConfigBase<TRecievePayload>, customOrigin: string = this.origin, customPath: string = this.path): Promise<Axios.AxiosXHR<TRecievePayload>> {
			debugLog("EzEndpointFunction .get() called");
			return PromiseRetry<Axios.AxiosXHR<TRecievePayload>>(() => {
				let endpoint = customOrigin + customPath;
				//log.debug("EzEndpointFunction axios.get", { endpoint });
				//return axios.post<TRecievePayload>(endpoint, submitPayload, this.requestOptions) as any;

				let finalRequestOptions: Axios.AxiosXHRConfigBase<TRecievePayload>;
				if (customRequestOptions == null || Object.keys(customRequestOptions).length === 0) {
					finalRequestOptions = this.requestOptions;
				} else {
					finalRequestOptions = _.defaults({}, customRequestOptions, this.requestOptions);
				}

				return (axios.get<TRecievePayload>(endpoint, finalRequestOptions) as any as Promise<Axios.AxiosXHR<TRecievePayload>>)
					.then((result) => {
						return Promise.resolve(result);
					}, (err: Axios.AxiosXHR<TRecievePayload>) => {
						//log.info(err);
						if (err.status === 0 && err.statusText === "" && err.data === "" as any) {
							//log.debug("EzEndpointFunction axios.get timeout.", { endpoint });
							err.status = 524;
							err.statusText = "A Timeout Occurred";
							err.data = "Axios->EzEndpointFunction timeout." as any;
						}
						if (this.preRetryIntercept != null) {
							let interceptResult = this.preRetryIntercept(err);
							if (interceptResult != null) {
								let stopError = new PromiseRetry.StopError("preRetryIntercept abort");
								(stopError as any)["interceptResult"] = interceptResult;
								return Promise.reject(stopError);
							}
						}
						return Promise.reject(err);
					});
			}, this.retryOptions).catch((err: any) => {
				if (err.interceptResult != null) {
					return err.interceptResult;
				}
				//og.error("failed ez call .get()", this.toJson(), err);
				return Promise.reject(err);
			});
		}

	}
}

/**
 * errors thrown by this module derive from this
 */
export class PhantomJsCloudException extends Error {
}

/**
 * errors thrown by the BrowserApi derive from this
 */
export class PhantomJsCloudBrowserApiException extends PhantomJsCloudException {
	constructor(message: string, public statusCode: number, public payload: any, public headers: { [key: string]: string }) {
		super(message);
	}
}


function debugLog(...args: any[]): void {
	if (isDebug !== true) {
		return;
	}
	console.log("\n");
	console.log("\n=====================================");
	console.log.apply(console, args);
	console.log("\n");
}


/**set to true to enable debug outputs */
export let isDebug = false;
export interface IBrowserApiOptions {
	/** the endpoint you want to point at, for example using with a private cloud.  if not set, will default to the PhantomJsCloud public api. */
	endpointOrigin?: string;
	/**pass your PhantomJsCloud.com ApiKey here.   If you don't, you'll use the "demo" key, which is good for about 100 pages/day.   Signup at https://Dashboard.PhantomJsCloud.com to get 500 Pages/Day free*/
	apiKey?: string;
}
/**
 *  the defaults used if options are not passed to a new BrowserApi object.
 */
export let defaultBrowserApiOptions: IBrowserApiOptions = {
    endpointOrigin: "https://PhantomJsCloud.com",
    apiKey: "a-demo-key-with-low-quota-per-ip-address",
}



/** internal use: the user's request and it's options */
interface IBrowserApiTask {
	userRequest: ioDatatypes.IUserRequest;
	customOptions: IBrowserApiOptions;
}

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
export class BrowserApi {

	private _endpointPath = "/api/browser/v2/";
	private _browserV2RequestezEndpoint = new utils.EzEndpointFunction<ioDatatypes.IUserRequest, ioDatatypes.IUserResponse>();

    public options: IBrowserApiOptions;

	constructor(/**pass your PhantomJsCloud.com ApiKey here.   If you don't, you'll use the "demo" key, which is good for about 100 pages/day.   Signup at https://Dashboard.PhantomJsCloud.com to get 500 Pages/Day free*/ apiKey?: string);
    constructor(options?: IBrowserApiOptions);
    constructor(keyOrOptions: string | IBrowserApiOptions = {} as any) {
		if (typeof keyOrOptions === "string") {
			this.options = { apiKey: keyOrOptions };
		} else {
			this.options = keyOrOptions;
		}
		_.defaults(this.options, defaultBrowserApiOptions);


		this._autoscaler = new utils.AutoscaleConsumer<IBrowserApiTask, ioDatatypes.IUserResponse>(this._task_worker.bind(this));
	}

	private _autoscaler: utils.AutoscaleConsumer<IBrowserApiTask, ioDatatypes.IUserResponse>;

	/**
	 * the autoscaler worker function
	 * @param task
	 */
	private _task_worker(task: IBrowserApiTask): PromiseLike<ioDatatypes.IUserResponse> {

		debugLog("_task_worker START");
		_.defaults(task.customOptions, this.options);

		/**
		 *  path including apiKey
		 */
		let finalPath = this._endpointPath + task.customOptions.apiKey + "/";

		return this._browserV2RequestezEndpoint.post(task.userRequest, undefined, task.customOptions.endpointOrigin, finalPath)
			.then((httpResponse) => {
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

			}, (errResponse: Axios.AxiosXHR<ioDatatypes.IUserResponse>) => {
				debugLog("_task_worker errResponse", errResponse);
				let statusCode = errResponse.status;
				let ex = new PhantomJsCloudBrowserApiException("error processing request, see .payload for details.  statusCode=" + statusCode.toString(), statusCode, errResponse.data, errResponse.headers as any);
				return Promise.reject(ex);
			}).finally(() => {
				debugLog("_task_worker FINISH");
			});

	}


    public requestSingle(request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, customOptions: IBrowserApiOptions = {}): PromiseLike<ioDatatypes.IUserResponse> {

		debugLog("requestSingle");
		let _request = request as any;
		let userRequest: ioDatatypes.IUserRequest;
		if (_request.pages != null && _.isArray(_request.pages)) {
			userRequest = _request;
		} else {
			userRequest = { pages: [_request] };
		}
		//set outputAsJson
		_.forEach(userRequest.pages, (page) => { page.outputAsJson = true; });

		let task: IBrowserApiTask = {
			userRequest,
			customOptions
		};

		return this._autoscaler.process(task);
	}



	public requestBatch(requests: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest)[]): PromiseLike<ioDatatypes.IUserResponse>[] {

		let responsePromises: PromiseLike<ioDatatypes.IUserResponse>[] = [];

		_.forEach(requests, (request) => {
			responsePromises.push(this.requestSingle(request));
		});

		return responsePromises;
	}
}




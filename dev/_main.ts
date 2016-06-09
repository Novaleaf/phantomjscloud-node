

import refs = require("./refs");
import Promise = refs.Promise;
import PromiseRetry = refs.PromiseRetry;


export import ioDatatypes = require("./io-data-types");


import _ = refs.lodash;

/**
 *  helper utils used by the phantomjscloud api.  
 */
import utils = require("./utils");

export function setDebug(isDebug: boolean) {
	utils.isDebug = isDebug;
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


export interface IBrowserApiOptions {
	/** the endpoint you want to point at, for example using with a private cloud.  if not set, will default to the PhantomJsCloud public api. */
	endpointOrigin?: string;
	/**pass your PhantomJsCloud.com ApiKey here.   If you don't, you'll use the "demo" key, which is good for about 100 pages/day.   Signup at https://Dashboard.PhantomJsCloud.com to get 500 Pages/Day free*/
	apiKey?: string;

	/**
	 *  set to true to not show a warning for using demo keys.
	 */
	suppressDemoKeyWarning?: boolean;
}
/**
 *  the defaults used if options are not passed to a new BrowserApi object.
 */
export let defaultBrowserApiOptions: IBrowserApiOptions = {
    endpointOrigin: "https://PhantomJsCloud.com",
    apiKey: "a-demo-key-with-low-quota-per-ip-address",
	suppressDemoKeyWarning: false,
}



/** internal use: the user's request and it's options */
interface IBrowserApiTask {
	userRequest: ioDatatypes.IUserRequest;
	customOptions: IBrowserApiOptions;
}


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

		if (this.options.apiKey === defaultBrowserApiOptions.apiKey && this.options.suppressDemoKeyWarning !== true) {
			console.warn("\n------\nWARNING: You are using a demo key for PhantomJs Cloud, and are limited to 100 Pages/Day.  Sign Up to get 500 Pages/Day free.\n------\n");
		}

		this._autoscaler = new utils.AutoscaleConsumer<IBrowserApiTask, ioDatatypes.IUserResponse>(this._task_worker.bind(this));
	}

	private _autoscaler: utils.AutoscaleConsumer<IBrowserApiTask, ioDatatypes.IUserResponse>;

	/**
	 * the autoscaler worker function
	 * @param task
	 */
	private _task_worker(task: IBrowserApiTask): PromiseLike<ioDatatypes.IUserResponse> {

		utils.debugLog("_task_worker START");
		_.defaults(task.customOptions, this.options);

		/**
		 *  path including apiKey
		 */
		let finalPath = this._endpointPath + task.customOptions.apiKey + "/";

		return this._browserV2RequestezEndpoint.post(task.userRequest, undefined, task.customOptions.endpointOrigin, finalPath)
			.then((httpResponse) => {
				//utils.debugLog("_task_worker httpResponse", httpResponse.data);

				return Promise.resolve(httpResponse.data);

			}, (err) => {

				let errResponse: Axios.AxiosXHR<ioDatatypes.IUserResponse> = err.innerData
				return Promise.reject(err);
				//utils.debugLog("_task_worker errResponse", errResponse);
				//let statusCode = errResponse.status;
				//let ex = new PhantomJsCloudBrowserApiException("error processing request, see .payload for details.  statusCode=" + statusCode, statusCode, errResponse.data, errResponse.headers as any);
				//return Promise.reject(ex);
			}).finally(() => {
				utils.debugLog("_task_worker FINISH");
			});

	}
	/**
	 * make a single browser request (PhantomJs call)
	 * @param request
	 * @param callback
	 */
	public requestSingle(request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, callback?: (err: Error, result: ioDatatypes.IUserResponse) => void): PromiseLike<ioDatatypes.IUserResponse>;
    public requestSingle(request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, customOptions?: IBrowserApiOptions, callback?: (err: Error, result: ioDatatypes.IUserResponse) => void): PromiseLike<ioDatatypes.IUserResponse>;
    public requestSingle(request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, customOptions?: IBrowserApiOptions, callback?: (err: Error, result: ioDatatypes.IUserResponse) => void): PromiseLike<ioDatatypes.IUserResponse> {

		utils.debugLog("requestSingle");

		if (callback == null && customOptions != null) {
			//handle function overload
			if (typeof customOptions == "function") {
				callback = customOptions as any;
				customOptions = null;
			}
		}
		if (customOptions == null) {
			customOptions = {};
		}

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

		return this._autoscaler.process(task)
			.then((result) => {
				if (callback != null) {
					callback(null, result);
				}
				return Promise.resolve(result);
			}, (err) => {
				if (callback != null) {
					callback(err, null);
				}
				return Promise.reject(err);
			});
	}

	/**
	 * make more than 1 browser request (PhantomJs call).  These are executed in parallel and is already optimized for PhantomJs Cloud auto-scaling, (The more your requests, the faster they will process.)
	 * @param requests
	 * @param callback
	 */
	public requestBatch(requests: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest)[], callback?: (err: Error, item: { request: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest); result: ioDatatypes.IUserResponse }) => void): PromiseLike<ioDatatypes.IUserResponse>[];
	public requestBatch(requests: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest)[], customOptions?: IBrowserApiOptions, callback?: (err: Error, item: { request: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest); result: ioDatatypes.IUserResponse }) => void): PromiseLike<ioDatatypes.IUserResponse>[];
	public requestBatch(requests: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest)[], customOptions?: IBrowserApiOptions, callback?: (err: Error, item: { request: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest); result: ioDatatypes.IUserResponse }) => void): PromiseLike<ioDatatypes.IUserResponse>[] {

		if (callback == null && customOptions != null) {
			//handle function overload
			if (typeof customOptions == "function") {
				callback = customOptions as any;
				customOptions = null;
			}
		}

		let responsePromises: PromiseLike<ioDatatypes.IUserResponse>[] = [];
		if (callback != null) {
			_.forEach(requests, (request) => {
				responsePromises.push(this.requestSingle(request, customOptions, (err, result) => { callback(err, { request, result }); }));
			});
		} else {
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




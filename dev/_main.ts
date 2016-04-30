import refs = require("./refs");

import Promise = refs.Promise;
import PromiseRetry = refs.PromiseRetry;



import ioDatatypes = require("./io-data-types");
import _ = refs.lodash;

module utils {

	/**
 *  a helper for constructing reusable endpoint functions
 */
	export class EzEndpointFunction<TSubmitPayload, TRecievePayload>{

		constructor(
			public urlRoot: string,
			public path: string,
			/** default is to retry for up to 10 seconds, (no retries after 10 seconds) */
			public retryOptions: refs._BluebirdRetryInternals.IOptions = { timeout: 60000, interval: 100, backoff: 2 , max_interval:5000 },
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
			return { urlRoot: this.urlRoot, path: this.path, retryOptions: this.retryOptions, requestOptions: this.requestOptions };
		}

		public post(submitPayload?: TSubmitPayload, /**setting a key overrides the key put in ctor.requestOptions. */customRequestOptions?: Axios.AxiosXHRConfigBase<TRecievePayload>): Promise<Axios.AxiosXHR<TRecievePayload>> {

			let lastErrorResult: any = null;
			return PromiseRetry<Axios.AxiosXHR<TRecievePayload>>(() => {
				let endpoint = this.urlRoot + this.path
				//log.debug("EzEndpointFunction axios.post", { endpoint });


				let finalRequestOptions: Axios.AxiosXHRConfigBase<TRecievePayload>;
				if (customRequestOptions == null || Object.keys(customRequestOptions).length === 0) {
					finalRequestOptions = this.requestOptions;
				} else {
					finalRequestOptions = _.defaults({}, customRequestOptions, this.requestOptions);
				}

				return (axios.post<TRecievePayload>(endpoint, submitPayload, finalRequestOptions
				) as any as Promise<Axios.AxiosXHR<TRecievePayload>>)
					.then((result) => {
						return Promise.resolve(result);
					}, (err: Axios.AxiosXHR<TRecievePayload>) => {
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
			}, this.retryOptions)
				.catch((err: any) => {
					if (err.interceptResult != null) {
						return err.interceptResult;
					}

					//let payloadStr = submitPayload == null ? "" : serialization.JSONX.inspectStringify(submitPayload);
					//let payloadStrSummarized = stringHelper.summarize(payloadStr, 2000);
					//log.error("failed ez call .post()", this.toJson(), err, lastErrorResult, payloadStr.length, payloadStrSummarized);
					return Promise.reject(err);
				});
		}
		public get(/**setting a key overrides the key put in ctor.requestOptions. */customRequestOptions?: Axios.AxiosXHRConfigBase<TRecievePayload>): Promise<Axios.AxiosXHR<TRecievePayload>> {
			return PromiseRetry<Axios.AxiosXHR<TRecievePayload>>(() => {
				let endpoint = this.urlRoot + this.path
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

class PhantomJsCloudException extends Error {
}


class PhantomJsCloud {

	private ezEndpoint: utils.EzEndpointFunction<ioDatatypes.IUserRequest,ioDatatypes.IUserResponse>; 
	constructor(public apiKey: string = "a-demo-key-with-low-quota-per-ip-address", public options: PhantomJsCloud.Options = {}) {
		//
		this.ezEndpoint = new utils.EzEndpointFunction<ioDatatypes.IUserRequest, ioDatatypes.IUserResponse>(options.endpoint, "");
	}

	public requestSingle(pageRequest: ioDatatypes.PageRequest): PromiseLike<ioDatatypes.IUserResponse>;
	public requestSingle(userRequest: ioDatatypes.IUserRequest): PromiseLike<ioDatatypes.IUserResponse>;
	public requestSingle(singleRequest: any): PromiseLike<ioDatatypes.IUserResponse> {
		let userRequest: ioDatatypes.IUserRequest;
		if (singleRequest.pages != null && _.isArray(singleRequest.pages)){
			userRequest = singleRequest;
		} else {
			userRequest = { pages: [singleRequest] };
		}
		if (userRequest.pages == null || _.isArray(userRequest.pages) !== true || userRequest.pages.length === 0) {
			return Promise.reject(new PhantomJsCloudException("invalid input.  request not sent."));
		}

		return this.ezEndpoint.post(userRequest)
			.then((axiosResponse) => {
				return Promise.resolve(axiosResponse.data);
			}, (errResponse) => {
				let responsePayload: string;
				if (errResponse.data == null) {
					responsePayload = "NULL";
				} else {
					responsePayload = JSON.stringify(errResponse.data);
				}
				let error = new PhantomJsCloudException(`request failed due to error ${errResponse.status.toString()}.  reply from server=` + responsePayload);
				(<any>error)["statusCode"] = errResponse.status as any;

				return Promise.reject(error);
			});
	}
	

}
namespace PhantomJsCloud {

	export interface Options {
		/** the endpoint you want to point at.  if not set, will default to "https://PhantomJsCloud.com/api/browser/v2/" */
		endpoint?: string;
		isDebug?: boolean;
	}

	export let PageRequest = ioDatatypes.PageRequest;



}

export = PhantomJsCloud;




//console.log("hello world");



//export let out = "put";
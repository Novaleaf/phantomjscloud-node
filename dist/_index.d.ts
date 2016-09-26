/// <reference types="node" />
export import ioDatatypes = require("./io-data-types");
export declare function setDebug(isDebug: boolean): void;
/**
 * errors thrown by this module derive from this
 */
export declare class PhantomJsCloudException extends Error {
}
/**
 * errors thrown by the BrowserApi derive from this
 */
export declare class PhantomJsCloudBrowserApiException extends PhantomJsCloudException {
    statusCode: number;
    payload: any;
    headers: {
        [key: string]: string;
    };
    constructor(message: string, statusCode: number, payload: any, headers: {
        [key: string]: string;
    });
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
export declare let defaultBrowserApiOptions: IBrowserApiOptions;
/**
 * The PhantomJsCloud Browser Api
 */
export declare class BrowserApi {
    private _endpointPath;
    private _browserV2RequestezEndpoint;
    options: IBrowserApiOptions;
    constructor(/**pass your PhantomJsCloud.com ApiKey here.   If you don't, you'll use the "demo" key, which is good for about 100 pages/day.   Signup at https://Dashboard.PhantomJsCloud.com to get 500 Pages/Day free*/ apiKey?: string);
    constructor(options?: IBrowserApiOptions);
    private _autoscaler;
    /**
     * the autoscaler worker function
     * @param task
     */
    private _task_worker(task);
    /**
     * make a single browser request (PhantomJs call)
     * @param request
     * @param callback
     */
    requestSingle(request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, callback?: (err: Error, result: ioDatatypes.IUserResponse) => void): PromiseLike<ioDatatypes.IUserResponse>;
    requestSingle(request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, customOptions?: IBrowserApiOptions, callback?: (err?: Error, result?: ioDatatypes.IUserResponse) => void): PromiseLike<ioDatatypes.IUserResponse>;
    /**
     * make more than 1 browser request (PhantomJs call).  These are executed in parallel and is already optimized for PhantomJs Cloud auto-scaling, (The more your requests, the faster they will process.)
     * @param requests
     * @param callback
     */
    requestBatch(requests: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest)[], callback?: (err: Error, item: {
        request: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest);
        result: ioDatatypes.IUserResponse;
    }) => void): PromiseLike<ioDatatypes.IUserResponse>[];
    requestBatch(requests: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest)[], customOptions?: IBrowserApiOptions, callback?: (err?: Error, item?: {
        request: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest);
        result?: ioDatatypes.IUserResponse;
    }) => void): PromiseLike<ioDatatypes.IUserResponse>[];
}

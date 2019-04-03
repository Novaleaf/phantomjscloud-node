import xlib = require("xlib");
/** the definitions for types used by phantomjscloud.   see https://phantomjscloud.com/docs/http-api/ for more details */
export import ioDatatypes = require("./io-data-types");
/**
* errors thrown by this module derive from this
*/
export declare class PhantomJsCloudException extends xlib.diagnostics.Exception {
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
    /** the endpoint you want to point at, for example using with a private cloud.  if not set, will default to the PhantomJsCloud public api.
        * @default "https://api.PhantomJsCloud.com"
    */
    endpointOrigin?: string;
    /**pass your PhantomJsCloud.com ApiKey here.   If you don't, you'll use the "demo" key, which is good for about 100 pages/day.
    * Signup at https://Dashboard.PhantomJsCloud.com to get 500 Pages/Day free*/
    apiKey?: string;
    /**
    *  set to true to not show a warning for using demo keys.
    */
    suppressDemoKeyWarning?: boolean;
    /**override the options used to configure the endpoint. */
    endpointOptions?: xlib.net.IRemoteHttpEndpointOptions;
}
/**
* The PhantomJsCloud Browser Api
*/
export declare class BrowserApi {
    private _endpointPath;
    private _defaultBrowserOptions;
    options: IBrowserApiOptions;
    constructor(/**options, or pass your PhantomJsCloud.com ApiKey here.   If you don't, you'll use the "demo" key, which is good for about 100 pages/day.   Signup at https://Dashboard.PhantomJsCloud.com to get 500 Pages/Day free*/ keyOrOptions?: string | IBrowserApiOptions);
    /** @hidden the low-level endpoint used to make the requests.  exposed for debugging support only. */
    _endpoint: xlib.net.RemoteHttpEndpoint<ioDatatypes.IUserRequest, ioDatatypes.IUserResponse>;
    /**
    * make a single browser request (PhantomJs call)
    * @param request
    * @param callback
    */
    requestSingle(request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, callback?: (err?: xlib.net.axios.AxiosError, result?: ioDatatypes.IUserResponse) => void): Promise<ioDatatypes.IUserResponse>;
    /**
    * make more than 1 browser request (PhantomJs call).  These are executed in parallel and is already optimized for PhantomJs Cloud auto-scaling, (The more your requests, the faster they will process.)
    * @param requests
    * @param callback
    */
    requestBatch(requests: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest)[], 
    /** note: the callback will be executed once for every request in the array submitted. */
    callback?: (err: Error, item: {
        request: (ioDatatypes.IUserRequest | ioDatatypes.IPageRequest);
        result: ioDatatypes.IUserResponse;
    }) => void): Promise<ioDatatypes.IUserResponse>[];
}
//# sourceMappingURL=_index.d.ts.map
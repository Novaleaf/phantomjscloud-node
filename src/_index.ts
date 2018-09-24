global.__xlibInitArgs = {
    //envLevel: "DEV",
    //logLevel: "ERROR",
    //disableEnvAutoRead: false, //won't read env vars from environment, which can override your passed in vars    
    silentInit: true,
    //let any previously set args override these
    ...global.__xlibInitArgs
};
import xlib = require( "xlib" );
import _ = xlib.lodash;
import __ = xlib.lolo;
import bb = xlib.promise.bluebird;




const log = xlib.diagnostics.log;
//log.overrideLogLevel( "WARN" );


/** the definitions for types used by phantomjscloud.   see https://phantomjscloud.com/docs/http-api/ for more details */
export import ioDatatypes = require( "./io-data-types" );



/**
* errors thrown by this module derive from this
*/
export class PhantomJsCloudException<TData=never> extends xlib.diagnostics.Exception<TData> {
}

/**
* errors thrown by the BrowserApi derive from this
*/
export class PhantomJsCloudBrowserApiException extends PhantomJsCloudException<{ statusCode: number, payload: any }> {
    constructor( message: string, public statusCode: number, public payload: any, public headers: { [ key: string ]: string } ) {
        super( message );
    }
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
export class BrowserApi {

    private _endpointPath = "/api/browser/v2/";

    private _defaultBrowserOptions: IBrowserApiOptions = {
        endpointOrigin: "https://api.PhantomJsCloud.com",
        apiKey: "a-demo-key-with-low-quota-per-ip-address",
        suppressDemoKeyWarning: false,
        endpointOptions: {
            retryOptions: { timeout: 66000, max_tries: 1, interval: 1000, throw_original: true },
            requestOptions: { timeout: 65000 },
            autoscalerOptions: { busyGrowDelayMs: 20000, busyExtraPenalty: 1, growDelayMs: 2000, idleOrBusyDecreaseMs: 3000, minParallel: 4, },
            endpoint: {},
            preRetryErrorIntercept:
                //if the API request fails, this function figures out if we should retry the request or report the failure to the user.
                async ( err ) => {
                    if ( err.response == null ) {
                        //no response so retry normally
                        return "RETRY";
                    }
                    //custom workflow for known phantomjscloud error levels
                    switch ( err.response.status ) {
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
                    if ( err.response.status >= 500 ) {
                        //ok to retry normally
                        return "RETRY";
                    } else {
                        return "ABORT";
                    }
                },
        }
    };


    public options: IBrowserApiOptions;

    constructor(/**pass your PhantomJsCloud.com ApiKey here.   If you don't, you'll use the "demo" key, which is good for about 100 pages/day.   Signup at https://Dashboard.PhantomJsCloud.com to get 500 Pages/Day free*/ apiKey?: string );
    constructor( options?: IBrowserApiOptions );
    constructor( keyOrOptions: string | IBrowserApiOptions = {} as any ) {
        if ( typeof keyOrOptions === "string" ) {
            this.options = { apiKey: keyOrOptions };
        } else {
            this.options = keyOrOptions;
        }


        _.defaultsDeep( this.options, this._defaultBrowserOptions );
        //set the actual endpoint to be used internally, if not set via custom options
        _.defaultsDeep( this.options, {
            endpointOptions: {
                endpoint:
                    { origin: this.options.endpointOrigin, path: `${ this._endpointPath }${ this.options.apiKey }/` }
            }
        } as IBrowserApiOptions );

        if ( this.options.apiKey === this._defaultBrowserOptions.apiKey && this.options.suppressDemoKeyWarning !== true ) {
            log.warn( "\n------\nWARNING: You are using a demo key for PhantomJs Cloud, and are limited to 100 Pages/Day.  Sign Up to get 500 Pages/Day free.\n------\n" );
        }

        this._endpoint = new xlib.net.RemoteHttpEndpoint<ioDatatypes.IUserRequest, ioDatatypes.IUserResponse>( this.options.endpointOptions );
    }

    /** @hidden the low-level endpoint used to make the requests.  exposed for debugging support only. */
    public _endpoint: xlib.net.RemoteHttpEndpoint<ioDatatypes.IUserRequest, ioDatatypes.IUserResponse>;


	/**
	* make a single browser request (PhantomJs call)
	* @param request
	* @param callback
	*/
    public async requestSingle( request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest,
        callback?: ( err?: xlib.net.axios.AxiosError, result?: ioDatatypes.IUserResponse ) => void ): Promise<ioDatatypes.IUserResponse> {

        //convert the request into a userRequest object, if it was a pageRequest
        let _request = request as any;
        let userRequest: ioDatatypes.IUserRequest;
        if ( _request.pages != null && _.isArray( _request.pages ) ) {
            userRequest = _request;
        } else {
            userRequest = { pages: [ _request ] };
        }
        //set outputAsJson
        _.forEach( userRequest.pages, ( page ) => {
            page.outputAsJson = true;
        } );
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
        const { toInspect } = await xlib.promise.awaitInspect( this._endpoint.post( userRequest ) );
        if ( toInspect.isFulfilled() ) {
            const axiosResponse = toInspect.value();
            if ( callback != null ) {
                callback( undefined, axiosResponse.data );
            }
            return axiosResponse.data;
        } else {
            const err = toInspect.reason() as xlib.net.axios.AxiosError;
            if ( callback != null ) {
                callback( err, undefined );
            }
            return bb.reject( err );
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
    }


	/**
	* make more than 1 browser request (PhantomJs call).  These are executed in parallel and is already optimized for PhantomJs Cloud auto-scaling, (The more your requests, the faster they will process.)
	* @param requests
	* @param callback
	*/
    public requestBatch( requests: (
        ioDatatypes.IUserRequest | ioDatatypes.IPageRequest )[],
        /** note: the callback will be executed once for every request in the array submitted. */
        callback?: ( err: Error, item: { request: ( ioDatatypes.IUserRequest | ioDatatypes.IPageRequest ); result: ioDatatypes.IUserResponse } ) => void ): Promise<ioDatatypes.IUserResponse>[] {

        let responsePromises: Promise<ioDatatypes.IUserResponse>[] = [];
        if ( callback != null ) {
            let _cb: typeof callback = callback;
            _.forEach( requests, ( request ) => {
                responsePromises.push( this.requestSingle( request, ( err, result ) => { _cb( err, { request, result: result } ); } ) );
            } );
        } else {
            _.forEach( requests, ( request ) => {
                responsePromises.push( this.requestSingle( request ) );
            } );
        }

        return responsePromises;
    }
}


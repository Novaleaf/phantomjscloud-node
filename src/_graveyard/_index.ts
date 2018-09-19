// global.__xlibInitArgs = {
//     //envLevel: "DEV",
//     //logLevel: "ERROR",
//     //disableEnvAutoRead: false, //won't read env vars from environment, which can override your passed in vars    
//     silentInit: true,
//     //let any previously set args override these
//     ...global.__xlibInitArgs
// };
// import xlib = require( "xlib" );
// import _ = xlib.lodash;
// import __ = xlib.lolo;
// import bb = xlib.promise.bluebird;




// const log = xlib.diagnostics.log;// let log =  new xlib.diagnostics.Logger( __filename );
// log._overrideLogLevel( "WARN" );
// //let log = new xlib.diagnostics.

// //import Promise = refs.Promise;
// //import PromiseRetry = refs.PromiseRetry;


// export import ioDatatypes = require( "./io-data-types" );

// /**
//  *  helper utils used by the phantomjscloud api.  
//  */
// import utils = require( "./utils" );

// //export function setDebug(isDebug: boolean) {
// //    utils.isDebug = isDebug;
// //}

// /**
//  * errors thrown by this module derive from this
//  */
// export class PhantomJsCloudException extends Error {
// }

// /**
//  * errors thrown by the BrowserApi derive from this
//  */
// export class PhantomJsCloudBrowserApiException extends PhantomJsCloudException {
//     constructor( message: string, public statusCode: number, public payload: any, public headers: { [ key: string ]: string } ) {
//         super( message );
//     }
// }


// export interface IBrowserApiOptions {
//     /** the endpoint you want to point at, for example using with a private cloud.  if not set, will default to the PhantomJsCloud public api. 
//      * @default "https://api.PhantomJsCloud.com"
//     */
//     endpointOrigin?: string;
// 	/**pass your PhantomJsCloud.com ApiKey here.   If you don't, you'll use the "demo" key, which is good for about 100 pages/day.   
// 		* Signup at https://Dashboard.PhantomJsCloud.com to get 500 Pages/Day free*/
//     apiKey?: string;

// 	/**
// 	 *  set to true to not show a warning for using demo keys.
// 	 */
//     suppressDemoKeyWarning?: boolean;

//     /**override HTTP request options, default to undefined (use defaults) */
//     requestOptions?: {
//         /** default timeout for the network request is 65000 (65 seconds) */
//         timeout?: number;
//     };
//     /**override network failure retry options, default to undefined (use defaults) */
//     retryOptions?: {
//         /** assumes the network request timed out if it takes longer than this.  default is 66000 (66 seconds) */
//         timeout?: number;

//         /** maximum number of attempts to try the operation.   default is 3*/
//         max_tries?: number;
//         /**  initial wait time between retry attempts in milliseconds(default 1000)*/
//         interval?: number;

//         /**  if specified, increase interval by this factor between attempts*/
//         backoff?: number;
//         /** if specified, maximum amount that interval can increase to*/
//         max_interval?: number;
//     };
//     /** allow customizing the local autoscaler.  For advanced optimization only! we do NOT recommend doing this, as it can cause most of your requests to fail with 429 (too many simultaneous requests) errors.   */
//     autoscale?: Partial<utils.IAutoscaleConsumerOptions>;
// }
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



// /**
//  * The PhantomJsCloud Browser Api
//  */
// export class BrowserApi {

//     private _endpointPath = "/api/browser/v2/";

//     private _browserV2RequestezEndpoint = new xlib.net.EzEndpoint<ioDatatypes.IUserRequest, ioDatatypes.IUserResponse>(
//         {},
//         { timeout: 66000, max_tries: 3, interval: 1000 },
//         { timeout: 65000 },
//         //if the API request fails, this function figures out if we should retry the request or report the failure to the user.
//         async ( err ) => {
//             if ( err.response == null ) {
//                 //no response so retry normally
//                 return;
//             }
//             //custom workflow for known phantomjscloud error levels
//             switch ( err.response.status ) {
//                 ///////////// FAIL
//                 case 400: //bad request
//                 case 401: //unauthorized
//                 case 402: //payment required
//                 case 403: //forbidden
//                 case 424: { //failed dependency
//                     //user needs to modify their request
//                     throw err;
//                 }
//                 ///////////////  RETRY
//                 case 503: //server to busy
//                 case 429: { //too many simulatneous requests
//                     //stall our thread increase time
//                     this._autoscaler.stall();
//                     //ok to retry normally
//                     return;
//                 }
//                 case 500: //internal server error
//                 case 502: { //bad gateway
//                     //ok to retry normally
//                     return;
//                 }
//             }
//             //standard workflow
//             if ( err.response.status >= 500 ) {
//                 //ok to retry normally
//                 return;
//             } else {
//                 throw err;
//             }
//         }
//     );


//     public options: IBrowserApiOptions;

//     constructor(/**pass your PhantomJsCloud.com ApiKey here.   If you don't, you'll use the "demo" key, which is good for about 100 pages/day.   Signup at https://Dashboard.PhantomJsCloud.com to get 500 Pages/Day free*/ apiKey?: string );
//     constructor( options?: IBrowserApiOptions );
//     constructor( keyOrOptions: string | IBrowserApiOptions = {} as any ) {
//         if ( typeof keyOrOptions === "string" ) {
//             this.options = { apiKey: keyOrOptions };
//         } else {
//             this.options = keyOrOptions;
//         }
//         _.defaults( this.options, defaultBrowserApiOptions );

//         if ( this.options.apiKey === defaultBrowserApiOptions.apiKey && this.options.suppressDemoKeyWarning !== true ) {
//             log.warn( "\n------\nWARNING: You are using a demo key for PhantomJs Cloud, and are limited to 100 Pages/Day.  Sign Up to get 500 Pages/Day free.\n------\n" );
//         }
//         //this._browserV2RequestezEndpoint = new xlib.net.EzEndpoint<ioDatatypes.IUserRequest, ioDatatypes.IUserResponse>({origin:this.options.endpointOrigin, path});

//         this._autoscaler = new utils.AutoscaleConsumer<IBrowserApiTask, ioDatatypes.IUserResponse>( this._task_worker.bind( this ), this.options.autoscale );
//     }

//     private _autoscaler: utils.AutoscaleConsumer<IBrowserApiTask, ioDatatypes.IUserResponse>;

// 	/**
// 	 * the autoscaler worker function
// 	 * @param task
// 	 */
//     private _task_worker( task: IBrowserApiTask ): PromiseLike<ioDatatypes.IUserResponse> {

//         return bb.try( () => {
//             log.debug( "_task_worker START" );
//             _.defaults( task.customOptions, this.options );

// 			/**
// 			 *  path including apiKey
// 			 */
//             let finalPath = this._endpointPath + task.customOptions.apiKey + "/";


//             //this._browserV2RequestezEndpoint.post(task.userRequest, "hi", "bye", 123);



//             return this._browserV2RequestezEndpoint.post( task.userRequest, task.customOptions.requestOptions, task.customOptions.retryOptions, { origin: task.customOptions.endpointOrigin, path: finalPath } )
//                 //return this._browserV2RequestezEndpoint.post(task.userRequest, undefined, task.customOptions.endpointOrigin, finalPath)
//                 .then( ( httpResponse ) => {
//                     //log.warn("_task_worker httpResponse", httpResponse.data);

//                     return Promise.resolve( httpResponse.data );

//                 }, ( err ) => {

//                     //log.warn("_task_worker errResponse", err);

//                     //let errResponse: Axios.AxiosXHR<ioDatatypes.IUserResponse> = err.innerData
//                     return Promise.reject( err );
//                     //let statusCode = errResponse.status;
//                     //let ex = new PhantomJsCloudBrowserApiException("error processing request, see .payload for details.  statusCode=" + statusCode, statusCode, errResponse.data, errResponse.headers as any);
//                     //return Promise.reject(ex);
//                 } ).finally( () => {
//                     log.debug( "_task_worker FINISH" );
//                 } );
//         } );
//     }
// 	/**
// 	 * make a single browser request (PhantomJs call)
// 	 * @param request
// 	 * @param callback
// 	 */
//     public async requestSingle( request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, callback?: ( err: Error, result: ioDatatypes.IUserResponse ) => void ): Promise<ioDatatypes.IUserResponse>;
//     public async requestSingle( request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, customOptions?: IBrowserApiOptions, callback?: ( err?: Error, result?: ioDatatypes.IUserResponse ) => void ): Promise<ioDatatypes.IUserResponse>;
//     async requestSingle( request: ioDatatypes.IUserRequest | ioDatatypes.IPageRequest, callbackOrOptions?: any, callback?: ( err?: Error, result?: ioDatatypes.IUserResponse ) => void ): Promise<ioDatatypes.IUserResponse> {

//         let customOptions: IBrowserApiOptions = callbackOrOptions as any;


//         //	return Promise.try(() => {
//         log.debug( "requestSingle" );

//         if ( callback == null && callbackOrOptions != null ) {
//             //handle function overload
//             if ( typeof callbackOrOptions == "function" ) {
//                 callback = callbackOrOptions as any;
//                 customOptions = {};
//             }
//         }
//         if ( callbackOrOptions == null ) {
//             customOptions = {};
//         }

//         //convert the request into a userRequest object, if it was a pageRequest
//         let _request = request as any;
//         let userRequest: ioDatatypes.IUserRequest;
//         if ( _request.pages != null && _.isArray( _request.pages ) ) {
//             userRequest = _request;
//         } else {
//             userRequest = { pages: [ _request ] };
//         }
//         //set outputAsJson
//         _.forEach( userRequest.pages, ( page ) => {
//             page.outputAsJson = true;
//         } );


//         let task: IBrowserApiTask = {
//             userRequest,
//             customOptions
//         };
//         try {
//             let result = await this._autoscaler.process( task );
//             if ( callback != null ) {
//                 callback( undefined, result );
//             }
//             return result;
//         } catch ( err ) {
//             if ( callback != null ) {
//                 callback( err, undefined );
//             } else {
//                 throw err;
//             }
//         }
//     }


// 	/**
// 	 * make more than 1 browser request (PhantomJs call).  These are executed in parallel and is already optimized for PhantomJs Cloud auto-scaling, (The more your requests, the faster they will process.)
// 	 * @param requests
// 	 * @param callback
// 	 */
//     public requestBatch( requests: (
//         ioDatatypes.IUserRequest | ioDatatypes.IPageRequest )[],
//         callback?: ( err: Error, item: { request: ( ioDatatypes.IUserRequest | ioDatatypes.IPageRequest ); result: ioDatatypes.IUserResponse } ) => void ): Promise<ioDatatypes.IUserResponse>[];
//     public requestBatch(
//         requests: ( ioDatatypes.IUserRequest | ioDatatypes.IPageRequest )[],
//         customOptions?: IBrowserApiOptions, callback?: ( err?: Error, item?: { request: ( ioDatatypes.IUserRequest | ioDatatypes.IPageRequest ); result?: ioDatatypes.IUserResponse } ) => void ): Promise<ioDatatypes.IUserResponse>[];
//     requestBatch(
//         requests: ( ioDatatypes.IUserRequest | ioDatatypes.IPageRequest )[],
//         customOptionsOrCallback?: any,
//         callback?: ( err?: Error, item?: { request: ( ioDatatypes.IUserRequest | ioDatatypes.IPageRequest ); result?: ioDatatypes.IUserResponse } ) => void ): Promise<ioDatatypes.IUserResponse>[] {

//         let customOptions: IBrowserApiOptions = customOptionsOrCallback;
//         if ( callback == null && customOptions != null ) {
//             //handle function overload
//             if ( typeof customOptions === "function" ) {
//                 callback = customOptions as any;
//                 customOptions = undefined;
//             }
//         }

//         let responsePromises: Promise<ioDatatypes.IUserResponse>[] = [];
//         if ( callback != null ) {
//             let _cb: typeof callback = callback;
//             _.forEach( requests, ( request ) => {
//                 responsePromises.push( this.requestSingle( request, customOptions, ( err, result ) => { _cb( err, { request, result: result } ); } ) );
//             } );
//         } else {
//             _.forEach( requests, ( request ) => {
//                 responsePromises.push( this.requestSingle( request, customOptions ) );
//             } );
//         }

//         //if (callback != null) {
//         //	Promise.all(responsePromises)
//         //		.then((results) => {
//         //			if (callback != null) {
//         //				callback(null, results);
//         //			}
//         //			return Promise.resolve(results);
//         //		}, (err) => {
//         //			if (callback != null) {
//         //				callback(err, null);
//         //			}
//         //			return Promise.reject(err);
//         //		});
//         //}

//         return responsePromises;
//     }
// }


// namespace _test {

//     describe( __filename, () => {
//         log.info( "testing if all ok" );

//         let browserApi = new BrowserApi();
//         //let browserApi = new BrowserApi({ endpointOrigin: "http://api.phantomjscloud.com" });
//         describe( "success cases", () => {
//             describe( "basic browserApi functionality", () => {

//                 it( "plainText example.com", () => {
//                     let pageRequest: ioDatatypes.IPageRequest = {
//                         url: "https://www.example.com",
//                         renderType: "plainText",
//                     };
//                     return browserApi.requestSingle( pageRequest )
//                         .then( ( pjscResponse ) => {
//                             if ( pjscResponse.content.data.indexOf( "example" ) >= 0 ) {
//                                 return Promise.resolve();
//                             }
//                             return Promise.reject( log.error( "example.com content should contain the word 'example'", { pjscResponse } ) );
//                         } )

//                 } );

//             } );


//             //describe("perf tests", () => {

//             //	const fs = require("fs");
//             //	const svg_sample_979_17470485_content: string = fs.readFileSync(__dirname + "/../tests/svg-sample-979_17470485.html", { encoding: "utf8" });


//             //	// const warmupRequest: ioDatatypes.IPageRequest = {
//             //	// 	url: "",
//             //	// 	content: "<html>hi</html>",
//             //	// 	"renderType": "png", "renderSettings": { "quality": 75, "viewport": { "width": 624, "height": 420 }, "clipRectangle": { "top": 0, "left": 0, "width": 624, "height": 420 }, "zoomFactor": 1 }, "requestSettings": { "waitInterval": 0 }, "outputAsJson": true
//             //	// };
//             //	let testRequest: ioDatatypes.IPageRequest = {
//             //		"url": "",
//             //		"content": svg_sample_979_17470485_content,
//             //		"renderType": "png", "renderSettings": { "quality": 75, "viewport": { "width": 624, "height": 420 }, "clipRectangle": { "top": 0, "left": 0, "width": 624, "height": 420 }, "zoomFactor": 1 }, "requestSettings": { "waitInterval": 0 }, "outputAsJson": true
//             //	}

//             //	function testPass(testName: string, passName: string, browserApi: BrowserApi): PromiseLike<any> {
//             //		// //warm up request
//             //		// const warmupStart = __.utcNowTimestamp();
//             //		// //return browserApi.requestSingle(testRequest_complexSvgSmallPng)
//             //		// return browserApi.requestSingle(warmupRequest)
//             //		// 	.then(() => {
//             //		// 		const warmupEnd = __.utcNowTimestamp();
//             //		// 		const warmupElapsedMs = warmupEnd - warmupStart;
//             //		// 		//log.warn("warmup request elapsedms=", endBasic - startBasic);
//             //		const testStart = __.utcNowTimestamp();
//             //		return browserApi.requestSingle(testRequest)
//             //			//return browserApi.requestSingle(basicPageRequest)
//             //			.then((pjscResponse) => {
//             //				const testEnd = __.utcNowTimestamp();
//             //				const testElapsedMs = testEnd - testStart;
//             //				log.warn(testName, {
//             //					passName,
//             //					//warmupElapsedMs, 
//             //					testElapsedMs,
//             //					statusCode: pjscResponse.statusCode
//             //				});
//             //				return Promise.resolve();
//             //				// if (pjscResponse.content.data.indexOf("example") >= 0) {
//             //				// 	return Promise.resolve();
//             //				// }
//             //				// return Promise.reject(log.error("example.com content should contain the word 'example'", { pjscResponse }));
//             //			});
//             //		// })
//             //	}

//             //	let test = it("svg gen sample 979_17470485_SEQUENTIAL", () => {

//             //		let testName = "SEQUENTIAL";
//             //		const browserApi = new BrowserApi();
//             //		return testPass(testName, "0", browserApi)
//             //			.then(() => {
//             //				return testPass(testName, "1", browserApi);
//             //			})
//             //			.then(() => {
//             //				return testPass(testName, "2", browserApi);
//             //			})
//             //			.then(() => {
//             //				return testPass(testName, "3", browserApi);
//             //			})
//             //			.then(() => {
//             //				return testPass(testName, "4", browserApi);
//             //			})
//             //			.then(() => {
//             //				return testPass(testName, "5", browserApi);
//             //			})
//             //			.then(() => {
//             //				return testPass(testName, "6", browserApi);
//             //			})
//             //			.then(() => {
//             //				return testPass(testName, "7", browserApi);
//             //			})
//             //			.then(() => {
//             //				return testPass(testName, "8", browserApi);
//             //			})
//             //			.then(() => {
//             //				return testPass(testName, "9", browserApi);
//             //			})

//             //	});
//             //	test.timeout(20000);

//             //	test = it("svg gen sample 979_17470485_PARALLEL", () => {
//             //		let testName = "PARALLEL";
//             //		const browserApi = new BrowserApi();
//             //		const allPasses = [];
//             //		for (let i = 0; i < 8; i++) {
//             //			allPasses.push(testPass(testName, i.toString(), browserApi));
//             //		}
//             //		return Promise.all(allPasses);
//             //	});
//             //	test.timeout(20000);
//         } );
//         //	// test = it("svg gen sample 979_17470485_PARALLEL_OLD", () => {

//         //	// 	let testName = "PARALLEL_OLD";

//         //	// 	const browserApi = new BrowserApi({ autoscale: { workerMin: 2 } });
//         //	// 	const allPasses = [];
//         //	// 	for (let i = 0; i < 8; i++) {
//         //	// 		allPasses.push(testPass(testName, i.toString(), browserApi));
//         //	// 	}
//         //	// 	return Promise.all(allPasses);

//         //	// });
//         //	// test.timeout(20000);
//         //});


//         describe( "fail cases", () => {
//             describe( "network failures", () => {

//                 let test = it( "invalid domain", () => {

//                     let pageRequest: ioDatatypes.IPageRequest = {
//                         url: "https://www.exadsfakjalkjghlalkjrtiuibe.com",
//                         renderType: "plainText",
//                     };
//                     return browserApi.requestSingle( pageRequest )
//                         .then( ( pjscResponse ) => {
//                             throw log.error( "should have failed...", { pjscResponse } );
//                         }, ( err ) => {
//                             if ( err.response != null ) {
//                                 const axiosErr = err as xlib.net._axiosDTs.AxiosErrorResponse<any>;
//                                 log.assert( axiosErr.response != null && axiosErr.response.status === 424, "expected error status 424", { axiosErr } );
//                             }
//                         } );
//                 } );
//                 test.timeout( 10000 );

//             } );
//         } );
//     } );

// }

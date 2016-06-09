import refs = require("./refs");
import Promise = refs.Promise;
export declare function debugLog(...args: any[]): void;
/**set to true to enable debug outputs */
export declare let isDebug: boolean;
/**
 * options for the AutoscaleConsumer
 */
export declare class AutoscaleConsumerOptions {
    /** the minimum number of workers.  below this, we will instantly provision new workers for added work.  default=2 */
    workerMin: number;
    /** maximum number of parallel workers.  default=30 */
    workerMax: number;
    /** if there is pending work, how long (in ms) to wait before increasing our number of workers.  This should not be too fast otherwise you can overload the autoscaler.  default=3000 (3 seconds), which would result in 20 workers after 1 minute of operation on a very large work queue. */
    workersLinearGrowthMs: number;
    /** how long (in ms) for an idle worker (no work remaining) to wait before attempting to grab new work.  default=1000 (1 second) */
    workerReaquireMs: number;
    /** the max time a worker will be idle before disposing itself.  default=20000 (20 seconds) */
    workerMaxIdleMs: number;
}
/**
 * allows consumption of an autoscaling process.  asynchronously executes work, scheduling the work to be executed in a graceful "ramping work up" fashion so to take advantage of the autoscaler increase-in-capacity features.
 * technical details: enqueues all process requests into a central pool and executes workers on them.  if there is additional queued work, increases workers over time.
 */
export declare class AutoscaleConsumer<TInput, TOutput> {
    /** The "WorkerThread", this function processes work. it's execution is automatically managed by this object. */
    private _workProcessor;
    options: AutoscaleConsumerOptions;
    constructor(
        /** The "WorkerThread", this function processes work. it's execution is automatically managed by this object. */
        _workProcessor: (input: TInput) => PromiseLike<TOutput>, options?: AutoscaleConsumerOptions);
    private _pendingTasks;
    process(input: TInput): Promise<TOutput>;
    private _workerCount;
    private _workerLastAddTime;
    private _trySpawnWorker();
    private __autoTrySpawnHandle;
    /**
     *  recursively loops itself
     * @param idleMs
     */
    private _workerLoop(idleMs?);
    private _workerLoop_disposeHelper();
}
/**
*  a helper for constructing reusable endpoint functions
*/
export declare class EzEndpointFunction<TSubmitPayload, TRecievePayload> {
    origin: string;
    path: string;
    /** default is to retry for up to 10 seconds, (no retries after 10 seconds) */
    retryOptions: refs._BluebirdRetryInternals.IOptions;
    /** default is to timeout (err 545) after 60 seconds*/
    requestOptions: Axios.AxiosXHRConfigBase<TRecievePayload>;
    /** allows aborting retries (if any).  return a resolved promise to continue retry normally,  return any rejected promise to abort retries and return the result you are returning.
    NOTE:   error's of statusCode 545 are request timeouts
    DEFAULT:  by default we will retry error 500 and above. */
    preRetryIntercept: (err: Axios.AxiosXHR<TRecievePayload>) => Promise<void>;
    constructor(origin?: string, path?: string, 
        /** default is to retry for up to 10 seconds, (no retries after 10 seconds) */
        retryOptions?: refs._BluebirdRetryInternals.IOptions, 
        /** default is to timeout (err 545) after 60 seconds*/
        requestOptions?: Axios.AxiosXHRConfigBase<TRecievePayload>, 
        /** allows aborting retries (if any).  return a resolved promise to continue retry normally,  return any rejected promise to abort retries and return the result you are returning.
        NOTE:   error's of statusCode 545 are request timeouts
        DEFAULT:  by default we will retry error 500 and above. */
        preRetryIntercept?: (err: Axios.AxiosXHR<TRecievePayload>) => Promise<void>);
    toJson(): {
        origin: string;
        path: string;
        retryOptions: refs._BluebirdRetryInternals.IOptions;
        requestOptions: Axios.AxiosXHRConfigBase<TRecievePayload>;
    };
    post(submitPayload?: TSubmitPayload, /**setting a key overrides the key put in ctor.requestOptions. */ customRequestOptions?: Axios.AxiosXHRConfigBase<TRecievePayload>, customOrigin?: string, customPath?: string): Promise<Axios.AxiosXHR<TRecievePayload>>;
    get(/**setting a key overrides the key put in ctor.requestOptions. */ customRequestOptions?: Axios.AxiosXHRConfigBase<TRecievePayload>, customOrigin?: string, customPath?: string): Promise<Axios.AxiosXHR<TRecievePayload>>;
}

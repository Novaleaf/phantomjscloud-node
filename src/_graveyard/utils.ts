import xlib = require( "xlib" );
//import Promise = xlib.promise.bluebird;
import _ = xlib.lodash;



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



const log = xlib.diagnostics.log; //let log = new xlib.diagnostics.Logger( __filename, xlib.environment.LogLevel.WARN );
log.overrideLogLevel( "WARN" );

/**
 * options for the AutoscaleConsumer
 */
export interface IAutoscaleConsumerOptions {
	/** the minimum number of workers.  below this, we will instantly provision new workers for added work.  default=8 */
	workerMin: number;
	/** maximum number of parallel workers.  default=60 */
	workerMax: number;
	/** if there is pending work, how long (in ms) to wait before increasing our number of workers.  This should not be too fast otherwise you can overload the autoscaler.  default=4000 (4 seconds), which would result in 15 workers after 1 minute of operation on a very large work queue. */
	workersLinearGrowthMs: number;
	/** how long (in ms) for an idle worker (no work remaining) to wait before attempting to grab new work.  default=100 (100 ms) */
	workerReaquireMs: number;
	/** the max time a worker will be idle before disposing itself.  default=10000 (10 seconds) */
	workerMaxIdleMs: number;
}
const autoscaleConsumerOptionsDefaults: IAutoscaleConsumerOptions = {
	/** the minimum number of workers.  below this, we will instantly provision new workers for added work.  default=8 */
	workerMin: 8,
	/** maximum number of parallel workers.  default=60 */
	workerMax: 60,
	/** if there is pending work, how long (in ms) to wait before increasing our number of workers.  This should not be too fast otherwise you can overload the autoscaler.  default=4000 (4 seconds), which would result in 15 workers after 1 minute of operation on a very large work queue. */
	workersLinearGrowthMs: 4000,
	/** how long (in ms) for an idle worker (no work remaining) to wait before attempting to grab new work.  default=100 (100 ms) */
	workerReaquireMs: 100,
	/** the max time a worker will be idle before disposing itself.  default=10000 (10 seconds) */
	workerMaxIdleMs: 10000,
}

interface IPendingTask<TInput, TOutput> {
	input: TInput;
	resolve: ( result: TOutput ) => void;
	reject: ( error: Error ) => void;
}

/**
 * allows consumption of an autoscaling process.  asynchronously executes work, scheduling the work to be executed in a graceful "ramping work up" fashion so to take advantage of the autoscaler increase-in-capacity features.
 * technical details: enqueues all process requests into a central pool and executes workers on them.  if there is additional queued work, increases workers over time.
 */
export class AutoscaleConsumer<TInput, TOutput>{

	public options: IAutoscaleConsumerOptions;

	private _pendingTasks: IPendingTask<TInput, TOutput>[] = [];
	private _workerCount: number = 0;
	private _workerLastAddTime: Date = new Date( 0 );
	private __autoTrySpawnHandle: NodeJS.Timer | null;

	constructor(
		/** The "WorkerThread", this function processes work. it's execution is automatically managed by this object. */
		private _workProcessor: ( input: TInput ) => PromiseLike<TOutput>,
		_options: Partial<IAutoscaleConsumerOptions> = {}
	) {
		//let defaultOptions = new AutoscaleConsumerOptions();
		this.options = _.defaults( _options, autoscaleConsumerOptionsDefaults );
	}



	public process( input: TInput ): PromiseLike<TOutput> { // Promise<TOutput> {

		let toReturn = new xlib.promise.bluebird<TOutput>( ( resolve, reject ) => {
			this._pendingTasks.push( { input, resolve, reject } );
		} );
		this._trySpawnWorker();
		return toReturn;
	}
	/** inform that the autoscaler should stall growing.  we do this by resetting the linearGrowth timer. */
	public stall() {
		this._workerLastAddTime = new Date();
	}



	private _trySpawnWorker() {
		//debugLog("AutoscaleConsumer._tryStartProcessing called");
		if ( this._workerCount >= this.options.workerMax || this._pendingTasks.length === 0 ) {
			return;
		}

		let nextAddTime = this._workerLastAddTime.getTime() + this.options.workersLinearGrowthMs;
		let now = Date.now();

		let timeToAddWorker = false;

		if ( this._workerCount < this.options.workerMin ) {
			timeToAddWorker = true;
		}
		if ( now >= nextAddTime ) {
			//if we don't have much work remaining, don't add more workers
			//if ((this._workerCount * this.options.workerMinimumQueueMultiplier) < this._pendingRequests.length)
			timeToAddWorker = true;
		}

		if ( timeToAddWorker === true ) {
			this._workerCount++;
			this._workerLastAddTime = new Date();
			setTimeout( () => { this._workerLoop() } );
		}

		if ( this.__autoTrySpawnHandle == null ) {
			//set a periodic auto-try-spawn worker to kick off
			this.__autoTrySpawnHandle = setInterval( () => {
				this._trySpawnWorker();
				if ( this._pendingTasks.length == 0 ) {
					//stop this period attempt because no work to do.
					clearInterval( this.__autoTrySpawnHandle as any );
					this.__autoTrySpawnHandle = null;
				}
			}, 100 );
		}
	}

	/**
	 *  recursively loops itself
	 * @param idleMs
	 */
	private _workerLoop( idleMs: number = 0 ) {


		if ( this._pendingTasks.length === 0 ) {
			//no work to do, dispose or wait
			//also instantly dispose of the worker if there's the minimum number of workers or less (because we will instantly spawn them up if needed).
			if ( idleMs > this.options.workerMaxIdleMs || this._workerCount <= this.options.workerMin ) {
				//already idle too long, dispose
				this._workerLoop_disposeHelper();
			} else {
				//retry this workerLoop after a short idle time
				setTimeout( () => { this._workerLoop( idleMs + this.options.workerReaquireMs ) }, this.options.workerReaquireMs );
			}
			return;
		}

		let work = this._pendingTasks.shift() as IPendingTask<TInput, TOutput>;
		if ( work == null ) {
			throw log.error( "pending task is non existant", { work, pendingCount: this._pendingTasks.length } );
		}

		xlib.promise.bluebird.try( () => {
			log.debug( "AUTOSCALECONSUMER._workerLoop() starting request processing (workProcessor) concurrent=" + this._workerCount );
			return this._workProcessor( work.input );
		} ).then( ( output ) => {
			log.debug( "AUTOSCALECONSUMER._workerLoop() finished workProcessor() SUCCESS. concurrent=" + this._workerCount );
			work.resolve( output );
		}, ( error ) => {
			log.debug( "AUTOSCALECONSUMER._workerLoop() finished workProcessor() ERROR. concurrent=" + this._workerCount );
			work.reject( error );
		} ).finally( () => {

			//fire another loop next tick
			setTimeout( () => { this._workerLoop(); } );

			//since we had work to do, there might be more work to do/scale up workers for. fire a "try start processing"
			this._trySpawnWorker();
		} );
	}

	private _workerLoop_disposeHelper() {

		log.debug( "AUTOSCALECONSUMER._workerLoop() already idle too long, dispose.   concurrent=" + this._workerCount );
		this._workerCount--;
	}



}


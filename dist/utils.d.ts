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
/**
 * allows consumption of an autoscaling process.  asynchronously executes work, scheduling the work to be executed in a graceful "ramping work up" fashion so to take advantage of the autoscaler increase-in-capacity features.
 * technical details: enqueues all process requests into a central pool and executes workers on them.  if there is additional queued work, increases workers over time.
 */
export declare class AutoscaleConsumer<TInput, TOutput> {
    /** The "WorkerThread", this function processes work. it's execution is automatically managed by this object. */
    private _workProcessor;
    options: IAutoscaleConsumerOptions;
    private _pendingTasks;
    private _workerCount;
    private _workerLastAddTime;
    private __autoTrySpawnHandle;
    constructor(
    /** The "WorkerThread", this function processes work. it's execution is automatically managed by this object. */
    _workProcessor: (input: TInput) => PromiseLike<TOutput>, _options?: Partial<IAutoscaleConsumerOptions>);
    process(input: TInput): PromiseLike<TOutput>;
    /** inform that the autoscaler should stall growing.  we do this by resetting the linearGrowth timer. */
    stall(): void;
    private _trySpawnWorker;
    /**
     *  recursively loops itself
     * @param idleMs
     */
    private _workerLoop;
    private _workerLoop_disposeHelper;
}
//# sourceMappingURL=utils.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var refs = require("./refs");
var xlib = refs.xlib;
var Promise = xlib.promise.bluebird;
var _ = xlib.lodash;
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
var log = new xlib.logging.Logger(__filename, xlib.environment.LogLevel.WARN);
var autoscaleConsumerOptionsDefaults = {
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
};
/**
 * allows consumption of an autoscaling process.  asynchronously executes work, scheduling the work to be executed in a graceful "ramping work up" fashion so to take advantage of the autoscaler increase-in-capacity features.
 * technical details: enqueues all process requests into a central pool and executes workers on them.  if there is additional queued work, increases workers over time.
 */
var AutoscaleConsumer = (function () {
    function AutoscaleConsumer(
        /** The "WorkerThread", this function processes work. it's execution is automatically managed by this object. */
        _workProcessor, _options) {
        if (_options === void 0) { _options = {}; }
        this._workProcessor = _workProcessor;
        this._pendingTasks = [];
        this._workerCount = 0;
        this._workerLastAddTime = new Date(0);
        //let defaultOptions = new AutoscaleConsumerOptions();
        this.options = _.defaults(_options, autoscaleConsumerOptionsDefaults);
    }
    AutoscaleConsumer.prototype.process = function (input) {
        var _this = this;
        var toReturn = new Promise(function (resolve, reject) {
            _this._pendingTasks.push({ input: input, resolve: resolve, reject: reject });
        });
        this._trySpawnWorker();
        return toReturn;
    };
    AutoscaleConsumer.prototype._trySpawnWorker = function () {
        var _this = this;
        //debugLog("AutoscaleConsumer._tryStartProcessing called");
        if (this._workerCount >= this.options.workerMax || this._pendingTasks.length === 0) {
            return;
        }
        var nextAddTime = this._workerLastAddTime.getTime() + this.options.workersLinearGrowthMs;
        var now = Date.now();
        var timeToAddWorker = false;
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
            setTimeout(function () { _this._workerLoop(); });
        }
        if (this.__autoTrySpawnHandle == null) {
            //set a periodic auto-try-spawn worker to kick off
            this.__autoTrySpawnHandle = setInterval(function () {
                _this._trySpawnWorker();
                if (_this._pendingTasks.length == 0) {
                    //stop this period attempt because no work to do.
                    clearInterval(_this.__autoTrySpawnHandle);
                    _this.__autoTrySpawnHandle = null;
                }
            }, 100);
        }
    };
    /**
     *  recursively loops itself
     * @param idleMs
     */
    AutoscaleConsumer.prototype._workerLoop = function (idleMs) {
        var _this = this;
        if (idleMs === void 0) { idleMs = 0; }
        if (this._pendingTasks.length === 0) {
            //no work to do, dispose or wait
            //also instantly dispose of the worker if there's the minimum number of workers or less (because we will instantly spawn them up if needed).
            if (idleMs > this.options.workerMaxIdleMs || this._workerCount <= this.options.workerMin) {
                //already idle too long, dispose
                this._workerLoop_disposeHelper();
            }
            else {
                //retry this workerLoop after a short idle time
                setTimeout(function () { _this._workerLoop(idleMs + _this.options.workerReaquireMs); }, this.options.workerReaquireMs);
            }
            return;
        }
        var work = this._pendingTasks.shift();
        if (work == null) {
            throw log.error("pending task is non existant", { work: work, pendingCount: this._pendingTasks.length });
        }
        Promise.try(function () {
            log.debug("AUTOSCALECONSUMER._workerLoop() starting request processing (workProcessor) concurrent=" + _this._workerCount);
            return _this._workProcessor(work.input);
        }).then(function (output) {
            log.debug("AUTOSCALECONSUMER._workerLoop() finished workProcessor() SUCCESS. concurrent=" + _this._workerCount);
            work.resolve(output);
        }, function (error) {
            log.debug("AUTOSCALECONSUMER._workerLoop() finished workProcessor() ERROR. concurrent=" + _this._workerCount);
            work.reject(error);
        }).finally(function () {
            //fire another loop next tick
            setTimeout(function () { _this._workerLoop(); });
            //since we had work to do, there might be more work to do/scale up workers for. fire a "try start processing"
            _this._trySpawnWorker();
        });
    };
    AutoscaleConsumer.prototype._workerLoop_disposeHelper = function () {
        log.debug("AUTOSCALECONSUMER._workerLoop() already idle too long, dispose.   concurrent=" + this._workerCount);
        this._workerCount--;
    };
    return AutoscaleConsumer;
}());
exports.AutoscaleConsumer = AutoscaleConsumer;
//# sourceMappingURL=utils.js.map
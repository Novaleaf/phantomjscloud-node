/// <reference path="../typings/main.d.ts" />
export import Promise = require("bluebird");
export import Axios = require("axios");
export import lodash = require("lodash");
export declare module _BluebirdRetryInternals {
    interface IOptions {
        /**  initial wait time between attempts in milliseconds(default 1000)*/
        interval?: number;
        /**  if specified, increase interval by this factor between attempts*/
        backoff?: number;
        /** if specified, maximum amount that interval can increase to*/
        max_interval?: number;
        /** total time to wait for the operation to succeed in milliseconds*/
        timeout?: number;
        /** maximum number of attempts to try the operation*/
        max_tries?: number;
    }
    /**
     *  Stopping
The library also supports stopping the retry loop before the timeout occurs by throwing a new instance of retry.StopError from within the called function.

For example:

var retry = require('bluebird-retry');
var i = 0;
var err;
var swing = function() {
    i++;
    console.log('strike ' + i);
    if (i == 3) {
        throw new retry.StopError('yer out');
    }
    throw new Error('still up at bat');
};

retry(swing, {timeout: 10000})
.catch(function(e) {
    console.log(e.message)
});
Will display:

strike 1
strike 2
strike 3
yer out
The StopError constructor accepts one argument. If it is invoked with an instance of Error, then the promise is rejected with that error argument. Otherwise the promise is rejected with the StopError itself.*

     */
    class StopError {
        constructor(
            /** The StopError constructor accepts one argument. If it is invoked with an instance of Error, then the promise is rejected with that error argument. Otherwise the promise is rejected with the StopError itself.*/
            message?: string | Error);
    }
    interface IRetryStatic {
        <TValue>(fn: () => PromiseLike<TValue>, options?: IOptions): Promise<TValue>;
        /** Stopping
The library also supports stopping the retry loop before the timeout occurs by throwing a new instance of retry.StopError from within the called function.
        The StopError constructor accepts one argument. If it is invoked with an instance of Error, then the promise is rejected with that error argument. Otherwise the promise is rejected with the StopError itself.*/
        StopError: typeof StopError;
    }
}
/**
 *  The ```bluebird-retry``` module:  https://www.npmjs.com/package/bluebird-retry
utility for retrying a bluebird promise until it succeeds
This very simple library provides a function for retrying an asynchronous operation until it succeeds. An "asynchronous operation" is embodied by a function that returns a promise or returns synchronously.

It supports regular intervals and exponential backoff with a configurable limit, as well as an overall timeout for the operation that limits the number of retries.

The bluebird library supplies the promise implementation.

Basic Usage
var Promise = require('bluebird');
var retry = require('bluebird-retry');

var count = 0;
function myfunc() {
    console.log('myfunc called ' + (++count) + ' times');
    if (count < 3) {
        return Promise.reject(new Error('fail the first two times'));
    } else {
        return Promise.resolve('succeed the third time');
    }
}

retry(myfunc).done(function(result) {
    console.log(result);
});
 */
export declare var PromiseRetry: _BluebirdRetryInternals.IRetryStatic;

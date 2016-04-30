"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var refs = require("./refs");
var Promise = refs.Promise;
var PromiseRetry = refs.PromiseRetry;
var ioDatatypes = require("./io-data-types");
var _ = refs.lodash;
var utils;
(function (utils) {
    /**
 *  a helper for constructing reusable endpoint functions
 */
    var EzEndpointFunction = (function () {
        function EzEndpointFunction(urlRoot, path, 
            /** default is to retry for up to 10 seconds, (no retries after 10 seconds) */
            retryOptions, 
            /** default is to timeout (err 545) after 60 seconds*/
            requestOptions, 
            /** allows aborting retries (if any).  return null to continue retry normally,  return any non-null to abort retries and return the result you are returning.
            NOTE:   error's of statusCode 545 are request timeouts
            DEFAULT:  by default we will retry error 500 and above. */
            preRetryIntercept) {
            if (retryOptions === void 0) { retryOptions = { timeout: 60000, interval: 100, backoff: 2, max_interval: 5000 }; }
            if (requestOptions === void 0) { requestOptions = { timeout: 60000 }; }
            if (preRetryIntercept === void 0) { preRetryIntercept = function (err) {
                if (err.status <= 499) {
                    //console.assert(false, "err");					
                    return Promise.reject(err);
                }
                else {
                    return null;
                }
            }; }
            this.urlRoot = urlRoot;
            this.path = path;
            this.retryOptions = retryOptions;
            this.requestOptions = requestOptions;
            this.preRetryIntercept = preRetryIntercept;
        }
        EzEndpointFunction.prototype.toJson = function () {
            return { urlRoot: this.urlRoot, path: this.path, retryOptions: this.retryOptions, requestOptions: this.requestOptions };
        };
        EzEndpointFunction.prototype.post = function (submitPayload, /**setting a key overrides the key put in ctor.requestOptions. */ customRequestOptions) {
            var _this = this;
            var lastErrorResult = null;
            return PromiseRetry(function () {
                var endpoint = _this.urlRoot + _this.path;
                //log.debug("EzEndpointFunction axios.post", { endpoint });
                var finalRequestOptions;
                if (customRequestOptions == null || Object.keys(customRequestOptions).length === 0) {
                    finalRequestOptions = _this.requestOptions;
                }
                else {
                    finalRequestOptions = _.defaults({}, customRequestOptions, _this.requestOptions);
                }
                return axios.post(endpoint, submitPayload, finalRequestOptions)
                    .then(function (result) {
                    return Promise.resolve(result);
                }, function (err) {
                    //log.info(err);
                    if (err.status === 0 && err.statusText === "" && err.data === "") {
                        //log.debug("EzEndpointFunction axios.post timeout.", { endpoint });
                        err.status = 524;
                        err.statusText = "A Timeout Occurred";
                        err.data = "Axios->EzEndpointFunction timeout.";
                    }
                    if (_this.preRetryIntercept != null) {
                        var interceptResult = _this.preRetryIntercept(err);
                        if (interceptResult != null) {
                            var stopError = new PromiseRetry.StopError("preRetryIntercept abort");
                            stopError["interceptResult"] = interceptResult;
                            return Promise.reject(stopError);
                        }
                    }
                    lastErrorResult = err;
                    return Promise.reject(err);
                });
            }, this.retryOptions)
                .catch(function (err) {
                if (err.interceptResult != null) {
                    return err.interceptResult;
                }
                //let payloadStr = submitPayload == null ? "" : serialization.JSONX.inspectStringify(submitPayload);
                //let payloadStrSummarized = stringHelper.summarize(payloadStr, 2000);
                //log.error("failed ez call .post()", this.toJson(), err, lastErrorResult, payloadStr.length, payloadStrSummarized);
                return Promise.reject(err);
            });
        };
        EzEndpointFunction.prototype.get = function (/**setting a key overrides the key put in ctor.requestOptions. */ customRequestOptions) {
            var _this = this;
            return PromiseRetry(function () {
                var endpoint = _this.urlRoot + _this.path;
                //log.debug("EzEndpointFunction axios.get", { endpoint });
                //return axios.post<TRecievePayload>(endpoint, submitPayload, this.requestOptions) as any;
                var finalRequestOptions;
                if (customRequestOptions == null || Object.keys(customRequestOptions).length === 0) {
                    finalRequestOptions = _this.requestOptions;
                }
                else {
                    finalRequestOptions = _.defaults({}, customRequestOptions, _this.requestOptions);
                }
                return axios.get(endpoint, finalRequestOptions)
                    .then(function (result) {
                    return Promise.resolve(result);
                }, function (err) {
                    //log.info(err);
                    if (err.status === 0 && err.statusText === "" && err.data === "") {
                        //log.debug("EzEndpointFunction axios.get timeout.", { endpoint });
                        err.status = 524;
                        err.statusText = "A Timeout Occurred";
                        err.data = "Axios->EzEndpointFunction timeout.";
                    }
                    if (_this.preRetryIntercept != null) {
                        var interceptResult = _this.preRetryIntercept(err);
                        if (interceptResult != null) {
                            var stopError = new PromiseRetry.StopError("preRetryIntercept abort");
                            stopError["interceptResult"] = interceptResult;
                            return Promise.reject(stopError);
                        }
                    }
                    return Promise.reject(err);
                });
            }, this.retryOptions).catch(function (err) {
                if (err.interceptResult != null) {
                    return err.interceptResult;
                }
                //og.error("failed ez call .get()", this.toJson(), err);
                return Promise.reject(err);
            });
        };
        return EzEndpointFunction;
    }());
    utils.EzEndpointFunction = EzEndpointFunction;
})(utils || (utils = {}));
var PhantomJsCloudException = (function (_super) {
    __extends(PhantomJsCloudException, _super);
    function PhantomJsCloudException() {
        _super.apply(this, arguments);
    }
    return PhantomJsCloudException;
}(Error));
var PhantomJsCloud = (function () {
    function PhantomJsCloud(apiKey, options) {
        if (apiKey === void 0) { apiKey = "a-demo-key-with-low-quota-per-ip-address"; }
        if (options === void 0) { options = {}; }
        this.apiKey = apiKey;
        this.options = options;
        //
        this.ezEndpoint = new utils.EzEndpointFunction(options.endpoint, "");
    }
    PhantomJsCloud.prototype.requestSingle = function (singleRequest) {
        var userRequest;
        if (singleRequest.pages != null && _.isArray(singleRequest.pages)) {
            userRequest = singleRequest;
        }
        else {
            userRequest = { pages: [singleRequest] };
        }
        if (userRequest.pages == null || _.isArray(userRequest.pages) !== true || userRequest.pages.length === 0) {
            return Promise.reject(new PhantomJsCloudException("invalid input.  request not sent."));
        }
        return this.ezEndpoint.post(userRequest)
            .then(function (axiosResponse) {
            return Promise.resolve(axiosResponse.data);
        }, function (errResponse) {
            var responsePayload;
            if (errResponse.data == null) {
                responsePayload = "NULL";
            }
            else {
                responsePayload = JSON.stringify(errResponse.data);
            }
            var error = new PhantomJsCloudException(("request failed due to error " + errResponse.status.toString() + ".  reply from server=") + responsePayload);
            error["statusCode"] = errResponse.status;
            return Promise.reject(error);
        });
    };
    return PhantomJsCloud;
}());
var PhantomJsCloud;
(function (PhantomJsCloud) {
    PhantomJsCloud.PageRequest = ioDatatypes.PageRequest;
})(PhantomJsCloud || (PhantomJsCloud = {}));
module.exports = PhantomJsCloud;
//console.log("hello world");
//export let out = "put"; 
//# sourceMappingURL=_main.js.map
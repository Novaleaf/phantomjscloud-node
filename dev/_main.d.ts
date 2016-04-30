import ioDatatypes = require("./io-data-types");
declare class PhantomJsCloud {
    apiKey: string;
    options: PhantomJsCloud.Options;
    private ezEndpoint;
    constructor(apiKey?: string, options?: PhantomJsCloud.Options);
    requestSingle(pageRequest: ioDatatypes.PageRequest): PromiseLike<ioDatatypes.IUserResponse>;
    requestSingle(userRequest: ioDatatypes.IUserRequest): PromiseLike<ioDatatypes.IUserResponse>;
}
declare namespace PhantomJsCloud {
    interface Options {
        /** the endpoint you want to point at.  if not set, will default to "https://PhantomJsCloud.com/api/browser/v2/" */
        endpoint?: string;
        isDebug?: boolean;
    }
    let PageRequest: typeof ioDatatypes.PageRequest;
}
export = PhantomJsCloud;

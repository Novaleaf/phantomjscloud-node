# phantomjscloud

#IMPORTANT: this library is still in development. features may change or break over the next few days.

The official PhantomJs Cloud API Client Library for Node.js



## Requirements
1. Promises.  We use Bluebird



## Basic Usage

1. **Install**:  ```npm install phantomjscloud --save```
2. **Use**:

		import phantomJsCloud = require("phantomjscloud");
		var browser = phantomJsCloud.BrowserApi();
		
		browser.requestSingle({ url: "http://www.example.com", renderType:"plainText" })
			.then((userResponse) => {
				console.log(JSON.stringify(userResponse.content));
			});


## Options

### ```var browser = phantomJsCloud.BrowserApi(apiKey:string | options:{apiKey:string; endpointOrigin:string}) => BrowserApi;```
Optional.  For Setting ApiKey or Endpoint.

The ```BrowserApi``` class constructor takes in either an ```apiKey:string``` or an ```options:{apiKey:string; endpointOrigin:string}``` object.  if no argument is passed, the default "demo" key is used with the public cloud endpoint.

If you use the default demo key, you get 100 Pages/Day.  If you sign up for an account at [Dashboard.PhantomJsCloud.com](https://Dashboard.PhantomJsCloud.com) you will get 500 Pages/Day free.

### ```browser.requestSingle(request: IPageRequest | IUserRequest ) => Promise<IUserResponse>```
For making a single request.

The ```request``` can either be a PageRequest or UserRequest object.  See  [https://phantomjscloud.com/docs/](https://phantomjscloud.com/docs/) for details

[The request default values can be seen here.](https://phantomjscloud.com/examples/helpers/pageRequestDefaults)

### ```browser.requestBatch(requests: (IPageRequest | IUserRequest)[] ) => Promise<IUserResponse>[]```
submit multiple requests at the same time, and get an array of promises back.


### Typescript
If you use Visual Studio or VSCode the typings will automatically load when you ```import phantomjscloud = require("phantomjscloud");```




## Contributing

This is the official, reference API for PhantomJsCloud.  You can help out by writing API Client Libraries for other languages *(lots of requests for PHP and Python!)*
	 
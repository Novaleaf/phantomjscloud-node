# phantomjs cloud


This library provides a simple and high quality mechanism for interacting with [PhantomJs](http://PhantomJs.org) via Node.  It leverages the [PhantomJs Cloud](https://PhantomJsCloud.com) Service to allow multiple calls in parallel at high performance.



## Requirements
1. Use [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).  We use [Bluebird](http://bluebirdjs.com/).



## Basic Usage

1. **Install**:  ```npm install phantomjscloud --save```
2. **Use**:

		import phantomJsCloud = require("phantomjscloud");
		var browser = phantomJsCloud.BrowserApi();
		
		browser.requestSingle({ url: "http://www.example.com", renderType:"plainText" })
			.then((userResponse) => {
				console.log(JSON.stringify(userResponse.content));
			});

	**or a slightly more complex example using [Typescript](https://www.typescriptlang.org/)**:

		//typings will automatically be loaded
		import phantomJsCloud = require("phantomjscloud");
		
		let apiKey = undefined;//leave undefined to use a demo key.  get a free key at https://Dashboard.PhantomJsCloud.com
		let browser = new phantomJsCloud.BrowserApi(apiKey);
		
		//the page you wish to render
		let pageRequest: phantomJsCloud.ioDatatypes.IPageRequest = { url: "http://www.example.com" };
		
		//make a request to render a single page, returning the plain-text contents of the page.
		browser.requestSingle({ url: "http://www.example.com", renderType:"plainText" })
			.then((userResponse) => {
				console.log(JSON.stringify({
					//the content of the page you requested
					content: userResponse.content,
					//metadata about your request, such as billing
					meta: userResponse.meta,
					//the status code of your request
					statusCode: userResponse.statusCode
				}, null, "\t")); //pretty-print
			});


## Options

### ```var browser = phantomJsCloud.BrowserApi(apiKey:string | options:{apiKey:string; endpointOrigin:string}) => BrowserApi;```
Optional.  For Setting ApiKey or Endpoint.

The ```BrowserApi``` class constructor takes in either an ```apiKey:string``` or an ```options:{apiKey:string; endpointOrigin:string}``` object.  if no argument is passed, the default "demo" key is used with the public cloud endpoint.

If you use the default demo key, you get 100 Pages/Day.  If you sign up for an account at [Dashboard.PhantomJsCloud.com](https://Dashboard.PhantomJsCloud.com) you will get 500 Pages/Day free.

### ```browser.requestSingle(request: IPageRequest | IUserRequest ) => Promise<IUserResponse>```
For making a single request.

The ```request``` can either be a ```IPageRequest``` or ```IUserRequest``` object.  See  [https://phantomjscloud.com/docs/](https://phantomjscloud.com/docs/) for details

[The request default values can be seen here.](https://phantomjscloud.com/examples/helpers/pageRequestDefaults)

### ```browser.requestBatch(requests: (IPageRequest | IUserRequest)[] ) => Promise<IUserResponse>[]```
submit multiple requests at the same time, and get an array of promises back.  



### Typescript Typings
If you use Visual Studio or VSCode the IntelliSense will automatically load when you: ```import phantomjscloud = require("phantomjscloud");``` 

You do not need to load anything from the DefinitelyTyped nor Typings projects. 
 

## Technical details

Internally we pool all requests and execute in a FIFO fashion.  If there are pending requests, we gracefully ramp-up the rate of requests to match PhantomJsCloud's autoscale capacity. 

## Roadmap

1. web crawler
2. batch api framework (store results to S3, Google Cloud Storage, etc)
3. page automation helpers (button clicking, etc.   you can do this already, but you need to know a lot to do it...)

## Contributing

This is the official, reference API for [PhantomJsCloud.com](https://PhantomJsCloud.com)  You can help out by writing API Client Libraries for other languages *(lots of requests for PHP and Python!)*
	 
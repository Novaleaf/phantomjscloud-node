# phantomjs cloud


This library provides a simple and high quality mechanism for interacting with [PhantomJs](http://PhantomJs.org) via Node.  It leverages the [PhantomJs Cloud](https://PhantomJsCloud.com) Service to allow multiple calls in parallel at high performance.



## Requirements
1. Internet access.  This works in Node.js and Browsers (via Browserify or Webpack).
	



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
		let pageRequest: phantomJsCloud.ioDatatypes.IPageRequest = { url: "http://www.example.com", renderType:"plainText" };
		
		//make a request to render a single page, returning the plain-text contents of the page.
		browser.requestSingle(pageRequest)
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

### ```var browser = phantomJsCloud.BrowserApi(apiKeyOrOptions?) : BrowserApi;```
Constructing the browserApi, and optionally for setting default configuration options.

- **```apiKeyOrOptions```**: Optional.  If set, can be either an ```apiKey:string``` or an ```options``` object with the parameters ```{apiKey?; endpointOrigin?}```.  
 - ```apiKey:string``` If not set, the default "demo" key is used with the public cloud endpoint. If you use the default demo key, you get 100 Pages/Day.  If you sign up for an account at [Dashboard.PhantomJsCloud.com](https://Dashboard.PhantomJsCloud.com) you will get 500 Pages/Day free.
  - ```endpointOrigin:string``` Used if you subscribe to a Private Cloud + SLA.  Defaults to the PhantomJs Cloud Public Endpoint.
- **```RETURNS```**: A ```BrowserApi``` object that is used to make the requests to the PhantomJs Cloud.

### ```browser.requestSingle(request, customOptions?, callback?) : Promise<IUserResponse>```
For making a single request.

- **```request```**:  Either be a [```IPageRequest```](https://phantomjscloud.com/docs/#_io_datatypes_.ipagerequest) or [```IUserRequest```](https://phantomjscloud.com/docs/index.html#_io_datatypes_.iuserrequest) object.  See  [https://phantomjscloud.com/docs/](https://phantomjscloud.com/docs/) for full details.  [The request default values can be seen here.](https://phantomjscloud.com/examples/helpers/pageRequestDefaults)
- **```customOptions```**: Optional.  can override the options set in the ```BrowserApi``` class constructor.
- **```callback```**:  Optional.  For people who don't use promises (not recommended!)  If you use this, the function should have the signature ```(err: Error, result: IUserResponse) => void```
- **```RETURNS```**: A Promise returning a [```IUserResponse```](https://phantomjscloud.com/docs/index.html#_io_datatypes_.iuserresponse).      


### ```browser.requestBatch(requests, customOptions?, callback? ) : Promise<IUserResponse>[]```
Submit multiple requests at the same time, and get an array of promises back.  

- **```requests```**:  An array.  Each element should be either be a [```IPageRequest```](https://phantomjscloud.com/docs/#_io_datatypes_.ipagerequest) or [```IUserRequest```](https://phantomjscloud.com/docs/index.html#_io_datatypes_.iuserrequest) object.  
- **```customOptions```**: Optional.  can override the options set in the ```BrowserApi``` class constructor.
- **```callback```**:  Optional.  For people who don't use promises (not recommended!)  If you use this, the function should have the signature ```(err: Error, item: {request, result}) => void```  This will be called once for each request sent.
- **```RETURNS```**: An array of Promises.  Use a construct like [```bluebird.all()```](http://bluebirdjs.com/docs/api/promise.all.html) to wait for all to finish if you wish.


### Typescript Typings
If you use Visual Studio or VSCode the IntelliSense will automatically load when you: ```import phantomjscloud = require("phantomjscloud");``` 

You do not need to load anything from the DefinitelyTyped nor Typings projects. 
 

## Technical details

Internally this library will pool all requests and execute in a FIFO fashion.  The number of parallel requests increases automatically:  We gracefully ramp-up the rate of requests to match PhantomJsCloud's autoscale capacity. 

## Roadmap

1. web crawler
2. batch api framework (store results to S3, Google Cloud Storage, etc)
3. page automation helpers (button clicking, etc.   you can do this already, but you need to know a lot to do it...)

## Contributing

This is the official, reference API for [PhantomJsCloud.com](https://PhantomJsCloud.com)  You can help out by writing API Client Libraries for other languages *(lots of requests for PHP and Python!)*
	 
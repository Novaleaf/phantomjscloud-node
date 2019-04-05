# PhantomJsCloud


This library provides a simple and high quality mechanism for interacting with ***Chrome***  as a scaleable cloud service.  It leverages [PhantomJsCloud.com](https://PhantomJsCloud.com) *(A Headless Browser Service)* to allow multiple calls in parallel at high performance.

- [PhantomJsCloud](#phantomjscloud)
	- [Chrome by default.](#chrome-by-default)
	- [Requirements](#requirements)
	- [Platforms](#platforms)
	- [Basic Usage](#basic-usage)
	- [Options](#options)
		- [phantomJsCloud.BrowserApi()](#phantomjscloudbrowserapi)
		- [browser.requestSingle()](#browserrequestsingle)
		- [browser.requestBatch()](#browserrequestbatch)
	- [Typescript Typings](#typescript-typings)
	- [Examples](#examples)
			- [Capture Amazon.com as a PDF](#capture-amazoncom-as-a-pdf)
			- [All Parameters](#all-parameters)
	- [Technical details](#technical-details)
	- [Roadmap](#roadmap)
	- [Contributing](#contributing)
		- [Building](#building)

## Chrome by default.

- You may also use the obsolete [PhantomJs](http://PhantomJs.org) Browser instead of the default (Chrome Latest, v74+, via Puppeteer) by setting the ```backend="phantomjs"``` parameter (see options, below).

## Requirements
-  Internet access.  
-  Tested on Nodejs ```10.15.2```, but should work with Nodejs >= ```6.x```

***Optional***: Get an ApiKey by creating an account at [PhantomJsCloud.com](https://PhantomJsCloud.com) 

## Platforms
- This works in Node.js and Browsers (via Browserify or Webpack).
- Also tested to work using node via **Amazon Lambda** and **Google Cloud Functions**.
	



## Basic Usage

1. **Install**:  ```npm install phantomjscloud --save```
2. **Use**:

```javascript
		var phantomJsCloud = require("phantomjscloud");
		var browser = new phantomJsCloud.BrowserApi();
		
		browser.requestSingle({ url: "http://www.example.com", renderType: "plainText" }, (err, userResponse) => {
			//can use a callback like this example, or a Promise (see the Typescript example below)
			if (err != null) {
				throw err;
			}
			console.log(JSON.stringify(userResponse.content));
		});
```

**or a slightly more complex example using ***async/await*** via [Typescript](https://www.typescriptlang.org/)**:

```javascript
		//typings will automatically be loaded
		import phantomJsCloud = require("phantomjscloud");
		
		let apiKey = undefined;//leave undefined to use a demo key.  get a free key at https://Dashboard.PhantomJsCloud.com
		let browser = new phantomJsCloud.BrowserApi(apiKey);
		
		async function doWork(){
			//the page you wish to render
			let pageRequest: phantomJsCloud.ioDatatypes.IPageRequest = { url: "http://www.example.com", renderType:"plainText" };			

			//make a request to render a single page, returning the plain-text contents of the page.
			const userResponse = await browser.requestSingle(pageRequest);
			console.log(JSON.stringify({
				//the content of the page you requested
				content: userResponse.content,
				//metadata about your request, such as billing
				meta: userResponse.meta,
				//the status code of your request
				statusCode: userResponse.statusCode
			}, null, "\t")); //pretty-print

		}
		doWork();
```

## Options

### phantomJsCloud.BrowserApi()

```var browser = new phantomJsCloud.BrowserApi(apiKeyOrOptions?) : BrowserApi;```

Constructing the browserApi, and optionally for setting default configuration options.

- **```apiKeyOrOptions```**: Optional.  If set, can be either an ```apiKey:string``` 
or an ```options``` object with the parameters ```{apiKey, endpointOrigin, suppressDemoKeyWarning, requestOptions, retryOptions }```.  
  - ```apiKey:string```  Optional. If not set, the default "demo" key is used with the public cloud endpoint. If you use the default demo key, you get 100 Pages/Day.  If you sign up for an account at [PhantomJsCloud.com](https://PhantomJsCloud.com) you will get 500 Pages/Day free.
  - ```endpointOrigin:string```  Optional. Used if you subscribe to a Private Cloud + SLA.  Defaults to the PhantomJs Cloud Public Endpoint.
  - ```suppressDemoKeyWarning```  Optional.  set to true to not show a warning for using demo keys.
  - ```requestOptions``` Optional. override HTTP request options, default to undefined (use defaults).  Takes the following parameters:
    - ```timeout``` Optional.   default timeout for the network request is 65000 (65 seconds)
  - ```retryOptions``` Optional.  override network failure retry options, default to undefined (use defaults)  Takes the following parameters:
    - ```timeout```  Optional.   assumes the network request timed out if it takes longer than this.  default is 66000 (66 seconds)
    - ```max_tries```  Optional.  maximum number of attempts to try the operation.   default is 3
    - ```interval```  Optional.  initial wait time between retry attempts in milliseconds(default 1000)
    - ```backoff```  Optional.  if specified, increase interval by this factor between attempts
    - ```max_interval```  Optional.  if specified, maximum amount that interval can increase to
- **```RETURNS```**: A ```BrowserApi``` object that is used to make the requests to the PhantomJs Cloud.

### browser.requestSingle() 
```browser.requestSingle(request, customOptions?, callback?) : Promise<IUserResponse>```

For making a single request.

- **```request```**:  Either be a [```IPageRequest```](https://phantomjscloud.com/docs/http-api/#_io_datatypes_.ipagerequest) or [```IUserRequest```](https://phantomjscloud.com/docs/http-api/index.html#_io_datatypes_.iuserrequest) object.  See  [https://phantomjscloud.com/docs/http-api/](https://phantomjscloud.com/docs/http-api/) for full details.  [The request default values can be seen here.](https://phantomjscloud.com/examples/helpers/pageRequestDefaults)
- **```customOptions```**: Optional.  can override the options set in the ```BrowserApi``` class constructor.
- **```callback```**:  Optional.  For people who don't use promises.  If you use this, the function should have the signature ```(err: Error, result: IUserResponse) => void```
- **```RETURNS```**: A Promise returning a [```IUserResponse```](https://phantomjscloud.com/docs/http-api/index.html#_io_datatypes_.iuserresponse).      


### browser.requestBatch() 

```browser.requestBatch(requests, customOptions?, callback? ) : Promise<IUserResponse>[]```

Submit multiple requests at the same time, and get an array of promises back.  

- **```requests```**:  An array.  Each element should be either be a [```IPageRequest```](https://phantomjscloud.com/docs/http-api/#_io_datatypes_.ipagerequest) or [```IUserRequest```](https://phantomjscloud.com/docs/http-api/index.html#_io_datatypes_.iuserrequest) object.  
- **```customOptions```**: Optional.  can override the options set in the ```BrowserApi``` class constructor.
- **```callback```**:  Optional.  For people who don't use promises.  If you use this, the function should have the signature ```(err: Error, item: {request, result}) => void```  This will be called once for each request sent.
- **```RETURNS```**: An array of Promises.  Use a construct like [```bluebird.all()```](http://bluebirdjs.com/docs/api/promise.all.html) to wait for all to finish if you wish.

## Typescript Typings
If you use Visual Studio or VSCode the IntelliSense will automatically load when you: ```import phantomjscloud = require("phantomjscloud");``` 

You do not need to load anything from the DefinitelyTyped nor Typings projects. 
 
## Examples
Here are some basic examples.  Look at the [phantomjscloud-node-examples project on github](https://github.com/Novaleaf/phantomjscloud-node-examples) for more.

#### Capture Amazon.com as a PDF
**```Basic Javascript```**


```javascript
	var pageRequest = { url: "https://amazon.com", renderType: "pdf" };
	console.log("about to request page from PhantomJs Cloud.  request =", JSON.stringify(pageRequest, null, "\t"));
	
	browser.requestSingle(pageRequest, (err, userResponse) => {
		if (userResponse.statusCode != 200) {
			throw new Error("invalid status code" + userResponse.statusCode);
		}
	
		fs.writeFile(userResponse.content.name, userResponse.content.data,
			{
				encoding: userResponse.content.encoding,
			}, (err) => {
				console.log("captured page written to " + userResponse.content.name);
			});
	});
```

**```Typescript with Promises```**


```javascript	
	//the page you wish to render
	let pageRequest: phantomJsCloud.ioDatatypes.IPageRequest = { url: "https://amazon.com", renderType: "pdf" };
	
	console.log("about to request page from PhantomJs Cloud.  request =", JSON.stringify(pageRequest, null, "\t"));
	browser.requestSingle(pageRequest)
		.then((userResponse) => {
	
			if (userResponse.statusCode != 200) {			
				throw new Error("invalid status code" + userResponse.statusCode);
			}
			
			fs.writeFile(userResponse.content.name, userResponse.content.data,
				{
					encoding: userResponse.content.encoding,
				}, (err) => {
					console.log("captured page written to " + userResponse.content.name);
				});
		});
```

#### All Parameters
Shows using all parameters in a request, capturing the page as a ```.jpg``` image.  Most the parameters used are the defaults, but you can see a list of the most up-to-date [default values here](https://phantomjscloud.com/examples/helpers/pageRequestDefaults).

**```Typescript with Promises```**


```javascript	
	//the page you wish to render
	let userRequest: phantomJsCloud.ioDatatypes.IUserRequest = {
			pages:[
				{
					"url": "http://example.com",
					"content": null,
					"urlSettings": {
						"operation": "GET",
						"encoding": "utf8",
						"headers": {},
						"data": null
					},
					renderType: 'jpg',
					outputAsJson: false,
					requestSettings: {
						ignoreImages: false,
						disableJavascript: false,
						userAgent: 'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Safari/534.34 PhantomJS/2.0.0 (PhantomJsCloud.com/2.0.1)',
						xssAuditingEnabled: false,
						webSecurityEnabled: false,
						resourceWait: 15000,
						resourceTimeout: 35000,
						maxWait: 35000,
						ioWait: 2000,
						waitInterval: 1000,
						stopOnError: false,
						resourceModifier: [],
						customHeaders: {},
						clearCache: false,
						clearCookies: false,
						cookies: [],
						deleteCookies: [],
					},
					suppressJson: [
						'events.value.resourceRequest.headers',
						'events.value.resourceResponse.headers',
						'frameData.content',
						'frameData.childFrames',
					],
					renderSettings: {
						quality: 70,
						viewport: {
						height: 1280,
						width: 1280,
						},
						zoomFactor: 1,
						passThroughHeaders: false,
						emulateMedia: 'screen',
						omitBackground: false,
						passThroughStatusCode: false,
					},
					scripts: {
						pageNavigated: [],
						load: [],
						domReady: [],
						loadFinished: [],
					},
					scriptSettings: {
						stopOnError: false,
						async: false,
					},
					}
			],
			proxy:false
		};
	
	console.log("about to request page from PhantomJs Cloud.  request =", JSON.stringify(userRequest, null, "\t"));
	browser.requestSingle(userRequest)
		.then((userResponse) => {
	
			if (userResponse.statusCode != 200) {			
				throw new Error("invalid status code" + userResponse.statusCode);
			}
			
			fs.writeFile(userResponse.content.name, userResponse.content.data,
				{
					encoding: userResponse.content.encoding,
				}, (err) => {
					console.log("captured page written to " + userResponse.content.name);
				});
		});
```
 

## Technical details

Internally this library will pool all requests and execute in a FIFO fashion.  The number of parallel requests increases automatically:  We gracefully ramp-up the rate of requests to match PhantomJsCloud's autoscale capacity. 

## Roadmap

1. web crawler
2. batch api framework (store results to S3, Google Cloud Storage, etc)
3. page automation helpers (button clicking, etc.   you can do this already, but you need to know a lot to do it...)

## Contributing

This is the official, reference API for [PhantomJsCloud.com](https://PhantomJsCloud.com)  You can help out by writing API Client Libraries for other languages *(lots of requests for PHP and Python!)*

### Building

If you want to build this yourself:


- install ```npm install mocha -g```
- install dependencies ```npm install```
- Install vscode and run the project (see ```.vscode/launch.json``` for actual execution args)
	 
/**
 * @hidden
 */
export interface IProcessManagerOptions {
    /** where input files are read from.
     * must already exist.  can have pending inputs in it upon startup.
     */
    inputPath: string;
    /** where input files are moved to for processing.  and where output files are put.
     * marked with "done.txt" when complete.
     * must already exist and be empty
     */
    outputPath: string;
    /** how often to watch the temp folder for new input files*/
    requestWatchInterval: number;
    /** how many ms we will wait if the activeRequest is unresponsive */
    activeRequestFrozenTimeout: number;
    isDebug: boolean;
    /**
     *  friendly identifier used for debug purposes
     */
    id: string;
}
/** options specific to rendering pdfs.  IMPORTANT NOTE:  we strongly recommend using ```px``` as your units of measurement.  */
export interface IPdfOptions {
    /** height and width are optional if format is specified.  Use of ```px``` is strongly recommended.  Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'. */
    width?: string;
    /** height and width are optional if format is specified.  Use of ```px``` is strongly recommended.  Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'. */
    height?: string;
    /** Border is optional and defaults to 0. A non-uniform border can be specified in the form {left: '2cm', top: '2cm', right: '2cm', bottom: '3cm'} Use of ```px``` is strongly recommended.  */
    border?: string;
    /** Supported formats are: 'A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'. . */
    format?: string;
    /** optional.   ('portrait', 'landscape')  and defaults to 'portrait' */
    orientation?: string;
    /** settings for headers of the pdf */
    header?: IPdfHeaderFooter;
    /** settings for footers of the pdf */
    footer?: IPdfHeaderFooter;
    /** set the DPI for pdf generation.  defaults to 150, which causes each page to be 2x as large (use "fit to paper" when printing)  If you want exact, proper page dimensions, set this to 72. */
    dpi?: number;
}
/**Various methods in the phantom object, as well as in WebPage instances, utilize phantom.cookies objects. These are best created via object literals. */
export interface ICookie {
    name: string;
    value: string;
    domain: string;
    path?: string;
    httponly?: boolean;
    secure?: boolean;
    /** unix epoch timestamp (in ms) Javascript Example: ```(new Date()).getTime() + (1000 * 60 * 60)   // <-- expires in 1 hour ``` */
    expires?: number;
}
/** adjustable parameters for when making network requests to the url specified.  used by PageRequest. */
export interface IUrlSettings {
    /** GET (default) or POST*/
    operation: string;
    /** defaults to 'utf8'*/
    encoding?: string;
    /** custom headers for the taret page.   if you want to set headers for every sub-resource requested, use the ```pageRequest.requestSettings.customHeaders``` parameter instead.*/
    headers?: {
        [key: string]: string;
    };
    /** submitted in POST BODY of your request. */
    data?: any;
}
/** settings related to requesting internet resources (your page and resources referenced by your page) */
export interface IRequestSettings {
    /**
     *  set to true to skip loading of inlined images.  If you are not outputing a screenshot, you can usually set this to true, which will decrease load times.
     */
    ignoreImages?: boolean;
    /**
     * set to true to disable all Javascript from being processed on your page.
     */
    disableJavascript?: boolean;
    /**
     * default useragent is ```"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Safari/534.34 PhantomJS/2.0.0 (PhantomJsCloud.com/2.0.1)"```
     */
    userAgent?: string;
    /**
     * username/password for simple HTTP authentication
     */
    authentication?: {
        userName: string;
        password: string;
    };
    /**
     *  set to true to prohibit cross-site scripting attempts (XSS)
     */
    xssAuditingEnabled?: boolean;
    /**
     * set to true to enable web security.  default is false
     */
    webSecurityEnabled?: boolean;
    /** maximum amount of time to wait for each external resources to load. (.js, .png, etc) if the time exceeds this, we don't cancel the resource request, but we don't delay rendering the page if everything else is done.  */
    resourceWait?: number;
    /** maximum amount of time to wait for each external resource to load.  we kill the request if it exceeds this amount. */
    resourceTimeout?: number;
    /** the maximum amount of time (timeout) you wish to wait for the page to finish loading.  When rendering a page, we will give you whatever is ready at this time (page may be incompletely loaded).
     * Can be increased up to 5 minutes, but that only should be used as a last resort, as it is a relatively expensive page render.
      */
    maxWait?: number;
    /** Milliseconds to delay rendering after the last resource is finished loading (default is 1000ms).  This is useful in case there are any AJAX requests or animations that need to finish up.  If additional network requests are made while we are waiting, the waitInterval will restart once finished again.
     * This can safely be set to 0 if you know there are no AJAX or animations you need to wait for (decreasing your billed costs)
     */
    waitInterval?: number;
    /** if true, will stop page load upon the first error detected, and move to next phase (render or next page) */
    stopOnError?: boolean;
    /** array of regex + adjustment parametes for modifying or rejecting resources being loaded by the webpage.
     * Example:  ```"resourceModifier": [{regex:".*css.*",isBlacklisted:true}{"regex": "http://mydomain.com.*","setHeader": {"hello": "world","Accept-encoding": "tacos"}}]```
     * **IMPORTANT NOTE**: If you use this to blacklist resources, it is strongly recommended you also set the **```clearCache```** parameter.  This is because cached resources are not requested, and thus will not be able to be blacklisted.
     */
    resourceModifier?: IResourceModifier[];
    /**
     * specify additional request headers here.  They will be sent to the server for every request issued (the page and resources).  Unicode is not supported (ASCII only)
     * example: ```customHeaders:{"myHeader":"myValue","yourHeader":"someValue"}```
     * if you want to set headers for just the target page (and not every sub-request) use the ```pageRequest.urlSettings.headers``` parameter.
     */
    customHeaders?: {
        [key: string]: string;
    };
    /**
     *  if true, will clear the browser memory cache before processing the request.  Good for expiring data, and very important if blacklisting resources (see [resourceModifier](#_io_datatypes_.pagerequest.requestsettings.resourcemodifier)  parameter).  Default is false.
     */
    clearCache?: boolean;
    /**
     *  if true, will clear cookies before processing the request.  Default is false.
     * **IMPORTANT NOTE**: to protect your privacy, we always clear cookies after completing your transaction.  This option is only useful if making multiple requests in one transaction (IE: multiple **```pageRequests```** in a **```userRequest```** API call)
     */
    clearCookies?: boolean;
    /**
     * Set Cookies for any domain, prior to loading this pageRequest.  If a cookie already exists with the same domain+path+name combination, it will be replaced.
     * See [ICookie](#_io_datatypes_.icookie)  for documentation on the cookie parameters.
     */
    cookies?: ICookie[];
    /**
     * delete any cookie with a matching "name" property before processing the request.
     */
    deleteCookies?: string[];
}
/**
 * Execute your own custom JavaScript inside the page being loaded.
 * **INPUT**
 * You can pass in either the url to a script to load, or the text of the script itself.  Example: ```scripts:{domReady:["//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js","return 'Hello, World!';"]}```
 * **OUTPUT**
 * Your scripts can return data to you in the ```pageResponse.scriptOutput``` object.  You can access this directly via ```windows._pjscMeta.scriptOutput``` or your script can simply return a value and it will be set as the ```scriptOutput``` (not available on external, url loaded scripts)
 * Also, if you use the ```pageRequest.renderType="script"``` setting, your response will be the ```scriptOutput``` itself (in JSON format) which allows you to construct your own custom API.  A very powerfull feature! *
 */
export interface IScripts {
    /**
         * triggers when the dom is ready for the current page.  Please note that the page may still be loading.
         */
    domReady: string[];
    /**
         *  triggers when we determine the page has been completed.  If your page is being rendered, this occurs immediately before then.
         * **IMPORTANT NOTE**:  Generally you do NOT want to load external scripts (url based) here, as it will hold up rendering.  Consider putting your external scripts in ```domReady```
         */
    loadFinished: string[];
}
/** The parameters for requesting and rendering a page.  When you submit an array of IPageRequests, they are loaded in-orrder, and only the last one is rendered.
 * All variables except 'url' are optional.
 */
export interface IPageRequest {
    /** required.  the target page you wish to load */
    url: string;
    /** if specified, will be used as the content of the page you are loading (no network request will be made for the ```url```).  However, the ```url``` property is still required, as that will be used as the page's "pretend" url
     * example:  ```content:"<h1>Hello, World!</h1>",url:"about:blank"```
     */
    content?: string;
    /** adjustable parameters for when making network requests to the url specified */
    urlSettings?: IUrlSettings;
    /** "html": returns the html text,
    "jpeg"|"jpg" :  The default.  renders page as jpeg.   transparency not supported. (use ```png``` for transparency),
    "png": renders page as png,
    "pdf": renders page as a pdf,
    "script": returns the contents of ```window['_pjscMeta'].scriptOutput```.   see the [scripts](#_io_datatypes_.pagerequest.scripts)  parameter for more details,
    "plainText": return the text without html tags (page plain text),*/
    renderType?: string;
    /** TRUE to return the page conents and metadata as a JSON object.  see [IUserResponse](#_io_datatypes_.iuserresponse)
     * if FALSE, we return the rendered content in it's native form.
     */
    outputAsJson?: boolean;
    /** settings related to requesting internet resources (your page and resources referenced by your page) */
    requestSettings?: IRequestSettings;
    /** add the nodes from your pageResponse that you do not wish to transmit.  This reduces the size of your data, thus reducing cost and transmission time.
     * if you need the data in these nodes, simply remove it from this array.
     */
    suppressJson?: string[];
    /** settings related to rendering of the last page of your request.  See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details*/
    renderSettings?: IRenderSettings;
    /**
     * Execute your own custom JavaScript inside the page being loaded.
     * see ```IScripts``` docs for more details.
     */
    scripts?: IScripts;
}
export declare function pageRequestDefaultsGet(): IPageRequest;
/**
 * properties exposed to your custom ```scripts``` via ```window._pjscMeta```
 */
export interface IScriptPjscMeta {
    /** Scripts can access (readonly) details about the page being loaded via ```window._pjscMeta.pageResponse```  See [IPageResponse](#_io_datatypes_.ipageresponse)  for more details. */
    pageResponse: IPageResponse;
    /** Your scripts can return data to you in the ```pageResponse.scriptOutput``` object.  You can access this directly via ```windows._pjscMeta.scriptOutput``` or your script can simply return a value and it will be set as the ```scriptOutput``` (not available on external, url loaded scripts) */
    scriptOutput: {};
    /** how many custom scripts have been loaded so far*/
    scriptsExecuted: number;
    /** set to false by default.  if true, will delay rendering until you set it back to false. good if you are waiting on an AJAX event. */
    manualWait: boolean;
    /** set to false by default.   set to true to force rendering immediately.  good for example, when you want to render as soon as domReady happens */
    forceFinish: boolean;
    /** allows you to override specific pageRequest options with values you compute in your script (based on the document at runtime) */
    optionsOverrides: {
        /** set the clipRectangle for image rendering.   here is an example you can run in your domReady or loadFinished script: ```_pjscMeta.optionsOverrides.clipRectangle = document.querySelector("h1").getBoundingClientRect();```  */
        clipRectangle?: IClipRectangleOptions;
    };
}
/** regex + adjustment parametes for modifying or rejecting resources being loaded by the webpage.    Example:  ```{regex:".*css.*",isBlacklisted:true}```  */
export interface IResourceModifier {
    /** pattern used to match a resource's url
    examples:  it really depends what the site is and what you are wanting to block, but for example to block anything with the text "facebook" or "linkedin" in the url:

    ```javascript requestModifiers:[{regex:".*facebook.*",isBlacklisted:true},{regex:".*linkedin.*",isBlacklisted:true}]```
    
    It's especially useful if you just need the text, as you can block all css files from loading, such as: ```".*\.css.*"```
      
    Don't use this to block images.   instead,  images are blocked by using the ```requestSettings.ignoreImages:true property```*/
    regex: string;
    /** if true, blacklists the request unless a later matching resourceAdjustor changes it back to false (we process in a FIFO fashion)
        by default, we don't blacklist anything. You should keep it this way when rendering jpeg (where the visuals matter),
        if processing text/data, blacklisting .css files ['.*\.css.*'] will work fine.
     check the response.metrics for other resources you could blacklist (example: facebook, google analytics, ad networks)
     */
    isBlacklisted?: boolean;
    /** changes the current URL of the network request. This is an excellent and only way to provide alternative implementation of a remote resource.
     * you can even use a dataURI so that you can set the contents directly, Example: ```data:,Hello%2C%20World!```
     * additionally, you can use special marker tokens to replace parts of the changeUrl with the original resource url.  the special marker tokens are ```$$port``` ```$$protocol```` ```$$host``` ```$$path```.  For example ```changeUrl="$$protocol://example.com$$path"```
     * also, you can use the ```changeCaptureRegex``` parameter to provide custom marker tokens.
     */
    changeUrl?: string;
    /** special pattern matching regex.  capture groups can replace parts of the ```changeUrl``` that use the special marker tokens ```$$0```, ```$$1```, etc on to ```$$9``` .
    for example: if ```resourceUrl="http://google.com/somescript.js"``` ```changeCaptureRegex="^.*?/(.*)$"``` would create a match group for everything after the last ```/``` character and ```changeUrl="http://example.com/$$1"``` would then get evaluated to  ```"http://example.com/somescript.js"``` */
    changeCaptureRegex?: string;
    /** optional key/value pairs for adjusting the headers of this resource's request.  example: ```{"Accept-encoding":"gzip", "hello":"world"}```*/
    setHeader?: {
        [key: string]: string;
    };
}
/** This property defines the rectangular area of the web page to be rasterized when using the requestType of png or jpeg. If no clipping rectangle is set, the entire web page is captured. */
export interface IClipRectangleOptions {
    top: number;
    left: number;
    width: number;
    height: number;
}
/** when a page is rendered, use these settings.  */
export interface IRenderSettings {
    /** jpeg quality.  0 to 100.  default 70.  ignored for png, use pngOptions to set png quality. */
    quality?: number;
    /** pdf specific settings.  Example:
    ``` {
        border: "0",
        footer: {
            firstPage: "", height: "1cm", lastPage: "", onePage: "", repeating: "<h1><span style='float:right'>%pageNum%/%numPages%</span></h1>"
        },
        format: "letter",
        header: {
            firstPage: "", height: "0cm", lastPage: "", onePage: "", repeating: ""
        },
        height: "11in",
        orientation: "portrait",
        width: "8.5in", 	}
    ``` */
    pdfOptions?: IPdfOptions;
    /** optional png quality options passed to PngQuant.  you must set pngOptions.optimize=true to enable these, otherwise the original non-modified png is returned.    */
    pngOptions?: IPngOptions;
    /** size of the browser in pixels*/
    viewport?: {
        width: number;
        /** height is not used when taking screenshots (png/pdf).  The image will be as tall as required to fit the content.  To set your screenshot's dimensions, use the pageRequest.clipRectangle property.  */
        height: number;
    };
    /** This property specifies the scaling factor for the screenshot (requestType png/pdf) choices.  The default is 1, i.e. 100% zoom. */
    zoomFactor?: number;
    /** This property defines the rectangular area of the web page to be rasterized when using the requestType of png or jpeg. If no clipping rectangle is set, the entire web page is captured.
    Beware: if you capture too large an  image it can cause your request to fail (out of memory).  you can choose any dimensions you wish as long as you do not exceed 32M pixels */
    clipRectangle?: IClipRectangleOptions;
    /** specify an IFrame to render instead of the full page.  must be the frame's name.*/
    renderIFrame?: string;
    /** default false.   If true, we will pass through all headers received from the target URL, with the exception of "Content-Type" (unless the renderType=```html```)*/
    passThroughHeaders?: boolean;
}
/** optional png quality options passed to PngQuant.  you must set pngOptions.optimize=true to enable these, otherwise the original non-modified png is returned.    */
export interface IPngOptions {
    /** default false, which is to return the original png.   if you pass true, we will optimize the png using PngQuant.  smaller file size but takes longer to process */
    optimize?: boolean;
    /** default 0.  If conversion results in quality below the min quality the image won't be compressed */
    qualityMin?: number;
    /** 1 to 100.  default 80.  Instructs pngquant to use the least amount of colors required to meet or exceed the max quality. */
    qualityMax?: number;
    /** 2 to 256.  default 256.    */
    colors?: number;
    /** default 8.   (very fast).  value can rage between 1 (slow) and 11 (fast and rough) */
    speed?: number;
    /** default false.  true to disable dithering */
    noDither?: boolean;
}
/** options for specifying headers or footers in a pdf render.  */
export interface IPdfHeaderFooter {
    /** required.  Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'.*/
    height: string;
    /** specify a header used for each page.  use wildcards for pageNum,numPages as shown in this example:
    ```repeating:<h1><span style='float:right'>%pageNum%/%numPages%</span></h1>``` */
    repeating?: string;
    /** if specified, this is used for the first page (instead of the repeating) */
    firstPage?: string;
    /** if specified, this is used for the last page (instead of the repeating) */
    lastPage?: string;
    /** if specified, this is used for single page pdfs (instead of the repeating)  */
    onePage?: string;
}
/** The 'main' form of user request, allows specifying pages to load in order.  Later will provide other 'global' options such as geolocation choices. */
export interface IUserRequest {
    /** array of pages you want to load, in order.  Only the last successfully loaded page will be rendered.*/
    pages: IPageRequest[];
    /** Use proxy servers for your request.  default=```false```.
     * set to ```true``` to enable our builtin proxy servers, or use the parameters found at [IProxyOptions](#_io_datatypes_.iuserrequest.iproxyoptions) for more control/options, including the ability to specify your own custom proxy server.
     * IMPORTANT:  for now, to use the builtin proxy servers, you must use the api endpoints found at  [api-static.phantomjscloud.com](http://api-static.phantomjscloud.com) This is because our proxy provider requires Whitelisting us by Static IP addresses.  This requirement will be removed after we exit Beta.
     * Additionally, When you use proxy servers, be aware that requests will be slower, so consider increasing the ```pageRequest.resourceTimeout``` parameter like the Proxy Example does.
     */
    proxy?: boolean | IProxyOptions;
}
/** allows specifying a proxy for your ```userRequest``` (all the pageRequests it contains)  To use the built-in proxy servers, you must set the ```geolocation``` parameter.
 *  Alternatively, you may use your own custom proxy server by setting the ```custom``` parameter. */
export interface IProxyOptions {
    /** specify the geographic region of the builtin proxy server you use.
     * defaults to ```any```.  possible values are ```any```, ```us``` (usa), ```de``` (germany), ```gb``` (great britan), ```ca``` (canada), ```sg``` (singapore)
     * IMPORTANT: Not yet implemented.  So for now, all values are treated as ```any```
     */
    geolocation?: string;
    /** specify what builtin proxy server you use.
     * by default, the auto-proxy system will randomly pick from an available proxy server.
        *	If you want to specify a specific (fixed) proxy server, set this ```instanceId``` to a number, then all requests will direct to the same builtin server..
        * If you want to use the proxy server in a round-robin style (recommended!) each request should increment this ```instanceId``` by one.
        */
    instanceId?: number;
    /** allows you to use a custom proxy server.  if you set this, the built-in proxy will not be used. default=NULL */
    custom?: IProxyCustomOptions;
}
export interface IProxyCustomOptions {
    /** the address and port of the proxy server to use.  ex: ```192.168.1.42:8080```  If your proxy requires a IP to whitelist, use ```api-static.phantomjscloud.com``` for your requests.   */
    host: string;
    /** type of the proxy server.  default is ```http``` available types are ```http```, ```socks5```, and ```none``` */
    type?: string;
    /** authentication information for the proxy.  ex: ```username:password```*/
    auth?: string;
}
/** This is returned to you when "outputAsJson=true".  */
export interface IUserResponse {
    /** the original request, without defaults applied.   to see the request with defaults, see ```pageResponses.pageRequest``` */
    originalRequest: IUserRequest;
    /** a collection of load/processing information for each page you requested. */
    pageResponses: IPageResponse[];
    /** the rendered output of the last pageRequest */
    content: {
        /** the final url of the page after redirects */
        url: string;
        /** data in either base64 or utf8 format */
        data: string;
        /** filename you could use if saving the content to disk. this will be something like 'content.text', 'content.jpeg', 'content.pdf'
         * thus this informs you of the content type
         */
        name: string;
        /** utf8 or base64 */
        encoding: string;
        /** headers of the target url, only set if ```pageRequest.renderSettings.passThroughHeaders===true``` */
        headers?: {
            name: string;
            value: string;
        }[];
        /** the size of data, in bytes */
        size: number;
        statusCode: number;
    };
    /** metadata about the transaction */
    meta?: {
        /** information about the PhantomJsCloud.com system processing this transaction*/
        backend?: {
            os: string;
            /** identifier of the system, for troubleshooting purposes */
            id: string;
            /** PhantomJs */
            platform: string;
            /** version of phantomjs. (major/minor/point)*/
            platformVersion: any;
            /** number of requests processed by this backend */
            requestsProcessed: number;
        };
        /** how much this transaction costs.
        NOTE: the creditCost, prepaidCreditsRemaining, and dailySubscriptionCreditsRemaining are also returning in the HTTP Response Headers via the keys
        ```pjsc-credit-cost```, ```pjsc-daily-subscription-credits-remaining```, and ```pjsc-prepaid-credits-remaining```
        */
        billing?: {
            elapsedMs: number;
            bytes: number;
            /** the total cost of this response */
            creditCost?: number;
            prepaidCreditsRemaining?: number;
            /** estimation of your remaining daily creditBalance.  This is incrementally refilled hourly.*/
            dailySubscriptionCreditsRemaining?: number;
        };
        /** hint our pjsc-be-phantom writes so api endpoint knows if should send back only the content. */
        outputAsJson?: boolean;
    };
    /** the HTTP Status Code PhantomJsCloud returns to you */
    statusCode: number;
}
/** Information about the page transaction (request and it's response).   */
export interface IPageResponse {
    /** the request you sent, including defaults for any parameters you did not include */
    pageRequest: IPageRequest;
    /** information about the processing of your request */
    metrics: {
        pageStatus: string;
        startTime: string;
        endTime: string;
        elapsedMs: number;
    };
    /** events that occured during requesting and loading of the page and it's content */
    events: Array<{
        key: string;
        time: string;
        value: any;
    }>;
    /**
     *  cookies set at the moment the page transaction completed.
     */
    cookies: ICookie[];
    /**
     *  headers for the primary resource (the url requested).  for headers of other resources, inspect the pageResponse.events (key='resourceReceived')
     */
    headers: {
        name: string;
        value: string;
    }[];
    /** the Frames contained in the page.   The first is always the main page itself, even if no other frames are present. */
    frameData: IPageFrame;
    /**
     *
     */
    scriptOutput: any;
    /** the status code for the page, a shortcut to metrics.targetUrlReceived.value.status */
    statusCode: number;
}
/** information about the frames of the page*/
export interface IPageFrame {
    /** number of children contained by this frame*/
    childCount: number;
    /** the name of the frame.  use this when requesting the frame to be rendered */
    name: string;
    /** the url of the frame*/
    url: string;
    /** the html content of the frame*/
    content: string;
    /** the children of this page (a hiearchy of frames) */
    childFrames: IPageFrame[];
}

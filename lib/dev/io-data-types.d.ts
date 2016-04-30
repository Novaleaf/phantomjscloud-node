/** options specific to rendering pdfs.  IMPORTANT NOTE:  we strongly recommend using ```px``` as your units of measurement.  */
export interface IPdfOptions {
    /** height and width are optional if format is specified.  Use of ```px``` is strongly recommended.  Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'. */
    width?: string;
    /** height and width are optional if format is specified.  Use of ```px``` is strongly recommended.  Supported dimension units are: 'mm', 'cm', 'in', 'px'. No unit means 'px'. */
    height?: string;
    /** Border is optional and defaults to 0. A non-uniform border can be specified in the form {left: '2cm', top: '2cm', right: '2cm', bottom: '3cm'} Use of ```px``` is strongly recommended.  */
    border?: string;
    /** Supported formats are: 'A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'.  Internally we convert this to a width+height using 150dpi. */
    format?: string;
    /** optional.   ('portrait', 'landscape')  and defaults to 'portrait' */
    orientation?: string;
    /** settings for headers of the pdf */
    header?: IPdfHeaderFooter;
    /** settings for footers of the pdf */
    footer?: IPdfHeaderFooter;
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
/** The parameters for requesting and rendering a page.  When you submit an array of IPageRequests, they are loaded in-orrder, and only the last one is rendered.
 * All variables except 'url' are optional.
 */
export declare class PageRequest {
    /** required.  the target page you wish to load */
    url: string;
    /** if specified, will be used as the content of the page you are loading (no network request will be made for the ```url```).  However, the ```url``` property is still required, as that will be used as the page's "pretend" url
     * example:  ```content:"<h1>Hello, World!</h1>",url:"about:blank"```
     */
    content: string;
    /** adjustable parameters for when making network requests to the url specified */
    urlSettings: {
        operation: string;
        encoding?: string;
        headers?: {
            [key: string]: string;
        };
        data?: any;
    };
    /** "html": returns the html text,
    "jpeg"|"jpg" :  The default.  renders page as jpeg.   transparency not supported. (use ```png``` for transparency),
    "png": renders page as png,
    "pdf": renders page as a pdf,
    "script": returns the contents of ```window['_pjscMeta'].scriptOutput```.   see the [scripts](#_io_datatypes_.pagerequest.scripts)  parameter for more details,
    "plainText": return the text without html tags (page plain text),*/
    renderType: string;
    /** TRUE to return the page conents and metadata as a JSON object.  see [IUserResponse](#_io_datatypes_.iuserresponse)
     * if FALSE, we return the rendered content in it's native form.
     */
    outputAsJson: boolean;
    /** settings related to requesting internet resources (your page and resources referenced by your page) */
    requestSettings: {
        ignoreImages: boolean;
        disableJavascript: boolean;
        userAgent: string;
        authentication: {
            userName: string;
            password: string;
        };
        xssAuditingEnabled: boolean;
        webSecurityEnabled: boolean;
        resourceWait: number;
        resourceTimeout: number;
        maxWait: number;
        waitInterval: number;
        stopOnError: boolean;
        resourceModifier: IResourceModifier[];
        customHeaders: {
            [name: string]: string;
        };
        clearCache: boolean;
        clearCookies: boolean;
        cookies: ICookie[];
        deleteCookies: string[];
    };
    /** add the nodes from your pageResponse that you do not wish to transmit.  This reduces the size of your data, thus reducing cost and transmission time.
     * if you need the data in these nodes, simply remove it from this array.
     */
    suppressJson: string[];
    /** settings related to rendering of the last page of your request.  See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details*/
    renderSettings: IRenderSettings;
    /**
     * Execute your own custom JavaScript inside the page being loaded.
     * **INPUT**
     * You can pass in either the url to a script to load, or the text of the script itself.  Example: ```scripts:{domReady:["//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js","return 'Hello, World!';"]}```
     * **OUTPUT**
     * Your scripts can return data to you in the ```pageResponse.scriptOutput``` object.  You can access this directly via ```windows._pjscMeta.scriptOutput``` or your script can simply return a value and it will be set as the ```scriptOutput``` (not available on external, url loaded scripts)
     * Also, if you use the ```pageRequest.renderType="script"``` setting, your response will be the ```scriptOutput``` itself (in JSON format) which allows you to construct your own custom API.  A very powerfull feature!
     * **METADATA**
     *
     */
    scripts: {
        domReady: string[];
        loadFinished: string[];
    };
}
/**
 * properties exposed to your custom ```scripts``` via ```window._pjscMeta``` *
 */
export interface IScriptPjscMeta {
    /** Scripts can access (readonly) details about the page being loaded via ```window._pjscMeta.pageResponse```  See [IPageResponse](#_io_datatypes_.ipageresponse)  for more details. */
    pageResponse: IPageResponse;
    /** Your scripts can return data to you in the ```pageResponse.scriptOutput``` object.  You can access this directly via ```windows._pjscMeta.scriptOutput``` or your script can simply return a value and it will be set as the ```scriptOutput``` (not available on external, url loaded scripts) */
    scriptOutput: {};
    /** how many custom scripts have been loaded so far*/
    scriptsExecuted: number;
}
/** regex + adjustment parametes for modifying or rejecting resources being loaded by the webpage.    Example:  ```{regex:".*css.*",isBlacklisted:true}```  */
export interface IResourceModifier {
    /** pattern used to match a resource's url
    examples:  it really depends what the site is and what you are wanting to block, but for example to block anything with the text "facebook" or "linkedin" in the url:

```requestModifiers:[{regex:".*facebook.*",isBlacklisted:true},{regex:".*linkedin.*",isBlacklisted:true}]```
    
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
     */
    changeUrl?: string;
    /** optional key/value pairs for adjusting the headers of this resource's request.  example: ```{"Accept-encoding":"gzip", "hello":"world"}```*/
    setHeader?: {
        [key: string]: string;
    };
}
/** when a page is rendered, use these settings.  */
export interface IRenderSettings {
    /** jpeg quality.  0 to 100.  default 70.  ignored for png */
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
        width: "8.5in",
    }
    ``` */
    pdfOptions?: IPdfOptions;
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
    clipRectangle?: {
        top: number;
        left: number;
        width: number;
        height: number;
    };
    /** specify an IFrame to render instead of the full page.  must be the frame's name.*/
    renderIFrame?: string;
    /** default false.   If true, we will pass through all headers received from the target URL, with the exception of "Content-Type" (unless the renderType=```html```)*/
    passThroughHeaders?: boolean;
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
    pages: PageRequest[];
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
    pageRequest: PageRequest;
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

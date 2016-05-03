"use strict";
///** scroll the browser to the targeted position over time.  */
//export interface IScrollPositionOptions {
//	top: number;
//	left: number;
//	/** pixels per second to scroll towards the target.  once the target is reached, scrolling stops.  if zero or not set, we instantly snap to the target position */
//	velocity?: number;
//	/** if set to true, will delay page-rendering until the scroll position is reached (as determined by the velocity parameter).  
//	if you choose outputAsJson, you will be notified if this causes your page rendering to be delayed.
//	default is false. */
//	delayRenderUntilFinished?: boolean;
//}
///**  experimental!   various settings to support authentication.  please send feedback to support@phantomjscloud.com */
//export interface IAuthenticationOptions {
//	/** sets the user name used for HTTP authentication. */
//	userName?: string;
//	/** sets the password used for HTTP authentication. */
//	password?: string;
//}
/** The parameters for requesting and rendering a page.  When you submit an array of IPageRequests, they are loaded in-orrder, and only the last one is rendered.
 * All variables except 'url' are optional.
 */
var PageRequest = (function () {
    function PageRequest() {
        /** required.  the target page you wish to load */
        this.url = null;
        /** if specified, will be used as the content of the page you are loading (no network request will be made for the ```url```).  However, the ```url``` property is still required, as that will be used as the page's "pretend" url
         * example:  ```content:"<h1>Hello, World!</h1>",url:"about:blank"```
         */
        this.content = null;
        /** adjustable parameters for when making network requests to the url specified */
        this.urlSettings = {
            /** GET (default) or POST*/
            operation: "GET",
            /** defaults to 'utf8'*/
            encoding: "utf8",
            /** custom headers for the taret page.   if you want to set headers for every sub-resource requested, use the ```pageRequest.requestSettings.customHeaders``` parameter instead.*/
            headers: {},
            /** submitted in POST BODY of your request. */
            data: null
        };
        /** "html": returns the html text,
        "jpeg"|"jpg" :  The default.  renders page as jpeg.   transparency not supported. (use ```png``` for transparency),
        "png": renders page as png,
        "pdf": renders page as a pdf,
        "script": returns the contents of ```window['_pjscMeta'].scriptOutput```.   see the [scripts](#_io_datatypes_.pagerequest.scripts)  parameter for more details,
        "plainText": return the text without html tags (page plain text),*/
        this.renderType = "jpg";
        //passThroughResponseHeaders: boolean = false;
        /** TRUE to return the page conents and metadata as a JSON object.  see [IUserResponse](#_io_datatypes_.iuserresponse)
         * if FALSE, we return the rendered content in it's native form.
         */
        this.outputAsJson = false;
        /** settings related to requesting internet resources (your page and resources referenced by your page) */
        this.requestSettings = {
            /**
             *  set to true to skip loading of inlined images
             */
            ignoreImages: false,
            /**
             * set to true to disable all Javascript from being processed on your page.
             */
            disableJavascript: false,
            /**
             * default useragent is ```"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Safari/534.34 PhantomJS/2.0.0 (PhantomJsCloud.com/2.0.1)"```
             */
            userAgent: "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/534.34 (KHTML, like Gecko) Safari/534.34 PhantomJS/2.0.0 (PhantomJsCloud.com/2.0.1)",
            /**
             * username/password for simple HTTP authentication
             */
            authentication: { userName: "guest", password: "guest" },
            /**
             *  set to true to prohibit cross-site scripting attempts (XSS)
             */
            xssAuditingEnabled: false,
            /**
             * set to true to enable web security.  default is false
             */
            webSecurityEnabled: false,
            /** maximum amount of time to wait for each external resources to load. (.js, .png, etc) if the time exceeds this, we don't cancel the resource request, but we don't delay rendering the page if everything else is done.  */
            resourceWait: 15000,
            /** maximum amount of time to wait for each external resource to load.  we kill the request if it exceeds this amount. */
            resourceTimeout: 35000,
            /** the maximum amount of time (timeout) you wish to wait for the page to finish loading.  When rendering a page, we will give you whatever is ready at this time (page may be incompletely loaded).
             * Can be increased up to 5 minutes, but that only should be used as a last resort, as it is a relatively expensive page render.
              */
            maxWait: 35000,
            /** Milliseconds to delay rendering after the last resource is finished loading (default is 1000ms).  This is useful in case there are any AJAX requests or animations that need to finish up.  If additional network requests are made while we are waiting, the waitInterval will restart once finished again.
             * This can safely be set to 0 if you know there are no AJAX or animations you need to wait for (decreasing your billed costs)
             */
            waitInterval: 1000,
            /** if true, will stop page load upon the first error detected, and move to next phase (render or next page) */
            stopOnError: false,
            /** array of regex + adjustment parametes for modifying or rejecting resources being loaded by the webpage.
             * Example:  ```"resourceModifier": [{regex:".*css.*",isBlacklisted:true}{"regex": "http://mydomain.com.*","setHeader": {"hello": "world","Accept-encoding": "tacos"}}]```
             * **IMPORTANT NOTE**: If you use this to blacklist resources, it is strongly recommended you also set the **```clearCache```** parameter.  This is because cached resources are not requested, and thus will not be able to be blacklisted.
             */
            resourceModifier: [],
            /**
             * specify additional request headers here.  They will be sent to the server for every request issued (the page and resources).  Unicode is not supported (ASCII only)
             * example: ```customHeaders:{"myHeader":"myValue","yourHeader":"someValue"}```
             * if you want to set headers for just the target page (and not every sub-request) use the ```pageRequest.urlSettings.headers``` parameter.
             */
            customHeaders: {},
            /**
             *  if true, will clear the browser memory cache before processing the request.  Good for expiring data, and very important if blacklisting resources (see [resourceModifier](#_io_datatypes_.pagerequest.requestsettings.resourcemodifier)  parameter).  Default is false.
             */
            clearCache: false,
            /**
             *  if true, will clear cookies before processing the request.  Default is false.
             * **IMPORTANT NOTE**: to protect your privacy, we always clear cookies after completing your transaction.  This option is only useful if making multiple requests in one transaction (IE: multiple **```pageRequests```** in a **```userRequest```** API call)
             */
            clearCookies: false,
            /**
             * Set Cookies for any domain, prior to loading this pageRequest.  If a cookie already exists with the same domain+path+name combination, it will be replaced.
             * See [ICookie](#_io_datatypes_.icookie)  for documentation on the cookie parameters.
             */
            cookies: [],
            /**
             * delete any cookie with a matching "name" property before processing the request.
             */
            deleteCookies: []
        };
        /** add the nodes from your pageResponse that you do not wish to transmit.  This reduces the size of your data, thus reducing cost and transmission time.
         * if you need the data in these nodes, simply remove it from this array.
         */
        this.suppressJson = ["events.value.resourceRequest.headers", "events.value.resourceResponse.headers", "frameData.content", "frameData.childFrames"];
        /** settings related to rendering of the last page of your request.  See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details*/
        this.renderSettings = {
            /** See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details */
            quality: 70,
            /** See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details */
            pdfOptions: {
                border: null,
                footer: {
                    firstPage: null, height: "1cm", lastPage: null, onePage: null, repeating: "<span style='float:right'>%pageNum%/%numPages%</span>"
                },
                /** 'A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'.    if you want a different size, set this to null and use the ```height``` and ```width``` parameters instead. */
                format: "letter",
                header: null,
                /** ex: "11in" */
                height: null,
                orientation: "portrait",
                /** ex: "8.5in" */
                width: null,
            },
            /** See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details */
            clipRectangle: null,
            /** See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details */
            renderIFrame: null,
            /** See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details */
            viewport: { height: 1280, width: 1280 },
            /** See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details */
            zoomFactor: 1.0,
            /** See the [IRenderSettings](#_io_datatypes_.irendersettings) documentation (below) for details */
            passThroughHeaders: false,
        };
        //scrollTo?: IScrollPositionOptions;
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
        this.scripts = {
            /**
             * triggers when the dom is ready for the current page.  Please note that the page may still be loading.
             */
            domReady: [],
            ///**
            // * will execute scripts when your page is starting to be requested.
            // * **IMPORTANT NOTE**: For advanced use only.  This is triggered before your page starts loading, so work done by your script may not be applied properly.  Consider using ```domReady``` instead.
            // */
            //loadStarted: <string[]>[],
            ///**
            // *  triggers whenever the url changes, such as for when you first navigate to the target page, or when there is a redirect
            // * **IMPORTANT NOTE**: For advanced use only.  This is triggered before your page starts loading, so work done by your script may not be applied properly.  Consider using ```domReady``` instead.
            // */
            //urlChanged: <string[]>[],
            ///** will execute scripts once the page you requested has been loaded, before any sub-resources have been loaded.  Note: triggers for every redirect also.  (IE: Triggers whenever the recieved resource URL matches the current page URL
            // * **IMPORTANT NOTE**: For advanced use only.  This is triggered before your page starts loading, so work done by your script may not be applied properly.  Consider using ```domReady``` instead.
            // */
            //targetUrlReceived: <string[]>[],
            /**
             *  triggers when we determine the page has been completed.  If your page is being rendered, this occurs immediately before then.
             * **IMPORTANT NOTE**:  Generally you do NOT want to load external scripts (url based) here, as it will hold up rendering.  Consider putting your external scripts in ```domReady```
             */
            loadFinished: [],
        };
    }
    return PageRequest;
}());
exports.PageRequest = PageRequest;
//# sourceMappingURL=io-data-types.js.map
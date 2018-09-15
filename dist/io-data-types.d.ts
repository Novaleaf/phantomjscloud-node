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
/** the new options for rendering PDF's using our Chrome [[IPageRequest.backend|backend]].  If you are using the old ```WebKit``` [[IPageRequest.backend|backend]], see ```IPdfOptions_WebKit```
    *
    Note: by default PDF's use the CSS ```@screen``` media type.  to change this, set [[IRenderSettings.emulateMedia]] to a value such as ```print```

    *  If you want to rename the file (used if the user saves the pdf) set the ```Content-Disposition``` header via [[IRenderSettings.extraResponseHeaders]].
    For example: ```"Content-Disposition":'attachment; filename="downloaded.pdf"'```
*/
export interface IPdfOptions {
    /** a HTML template, use the following CSS classes to inject print values into their respective elements:
        * ```date```, ```title```, ```url```, ```pageNumber```, ```totalPages```
    *
    * alternatively, you could pass the special classes as variables, as shown in this example:  ```<span>Page %pageNumber% of %totalPages%</span>```
    *
    * If the associated margin is not explicitly set, setting a template will automatically set the margin to ```"1in"```
        *
        Note:  page css is not available to this template, so include inline-css for styling.

        
        @example  ```<span style='font-size: 15px; height: 200px; background-color: black; color: white; margin: 20px;'>Header or Footer. <span style='font-size: 10px;'>Keep templates simple, and inline CSS.
        Page:<span class='pageNumber'>XX</span>/<span class='totalPages'>YY</span></span></span>```
    */
    headerTemplate?: string;
    /** a HTML template, use the following classes to inject print values into their respective elements:
        * ```date```, ```title```, ```url```, ```pageNumber```, ```totalPages```
    *
    * If the associated margin is not explicitly set, setting a template will automatically set the margin to ```"1in"```
        *
        Note:  page css is not available to this template, so include inline-css for styling.

        @example  ```<span style='font-size: 15px; height: 200px; background-color: black; color: white; margin: 20px;'>Header or Footer. <span style='font-size: 10px;'>Keep templates simple, and inline CSS.
        Page:<span class='pageNumber'>XX</span>/<span class='totalPages'>YY</span></span></span>```
    */
    footerTemplate?: string;
    landscape?: boolean;
    /** Paper ranges to print, e.g., '1-5, 8, 11-13'.  */
    pageRanges?: string;
    /** standard paper size to use.  Supported options are ```Letter```, ```Legal```, ```Tabloid```, ```Ledger```, and ```A0``` to ```A6```
        * @default "Letter"
    */
    format?: string;
    /** optional dimensions used if you don't specify ```format```.
        *
    pass a number with one of the following units:  ```px```, ```in```, ```cm```, or ```mm```.
    @example "88cm"
     */
    width?: string;
    /** optional dimensions used if you don't specify ```format```.
        *
    pass a number with one of the following units:  ```px```, ```in```, ```cm```, or ```mm```.
    @example "88cm"
     */
    height?: string;
    /** optional margin
        *  use units such as those used for ```width``` or ```height``` properties
    @default no margin.
       */
    margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
    /** if set to true, will use the CSS ```@page``` size if any is present. */
    preferCSSPageSize?: boolean;
}
/**  @deprecated for the old ```WebKit``` [[IPageRequest.backend|backend]] rendering only.  For the new ```Chrome``` [[IPageRequest.backend|backend]], see the ```IPdfOptions``` documentation.
    * options specific to rendering pdfs.  IMPORTANT NOTE:  we strongly recommend using ```px``` as your units of measurement.

    @Example
    ```json
    {
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
    ```
    */
export interface IPdfOptions_WebKit {
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
    header?: IPdfHeaderFooter_WebKit;
    /** settings for footers of the pdf */
    footer?: IPdfHeaderFooter_WebKit;
    /** set the DPI for pdf generation.  defaults to 150, which causes each page to be 2x as large (use "fit to paper" when printing)  If you want exact, proper page dimensions, set this to 72. */
    dpi?: number;
}
/**The parameters used for constructing browser cookies */
export interface ICookie {
    name: string;
    value: string;
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```). */
    url?: string;
    domain?: string;
    path?: string;
    /** unix epoch timestamp (in ms) Javascript Example:
        * ```(new Date()).getTime() + (1000 * 60 * 60)   // <-- expires in 1 hour ``` */
    expires?: number;
    /** @deprecated:  for ```WebKit``` [[IPageRequest.backend|backend]].  for ```Chrome``` [[IPageRequest.backend|backend]], use ```httpOnly``` */
    httponly?: boolean;
    /** ```chrome``` version of ```httponly``` */
    httpOnly?: boolean;
    secure?: boolean;
    /**
        * @deprecated: all cookies are good for the duration of the request
        */
    session?: boolean;
    /** "Strict" or "Lax" */
    sameSite?: "Strict" | "Lax";
}
/** adjustable parameters for when making network requests to the url specified.  used by [[IPageRequest]]. */
export interface IUrlSettings {
    /** valid choices: ```GET```, ```POST```, ```PATCH```, ```PUT```, ```DELETE``` or ```OPTIONS```.
        * The old ```WebKit``` [[IPageRequest.backend|backend]] only supports ```GET``` or ```POST```
    *
    * @default "GET"
    */
    operation?: string;
    /** @deprecated: for use with the ```WebKit``` [[IPageRequest.backend|backend]] only.   the new Chrome [[IPageRequest.backend|backend]] defaults to 'utf8'
        * @default "utf8"
    */
    encoding?: string;
    /** custom headers for the taret page.   if you want to set headers for every sub-resource requested, use the [[IRequestSettings.customHeaders]] parameter instead.*/
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
        * @default false
     */
    xssAuditingEnabled?: boolean;
    /**
     * set to true to enable web security.
     * IMPORTANT: only the first [[IPageRequest]] can set this property, and it is reused for the remainder of your request.
        * @default false
     */
    webSecurityEnabled?: boolean;
    /** maximum amount of time (in ms) to wait for each external resources to load.
     * (.js, .png, etc) if the time exceeds this, we don't cancel the resource request,
     * but we don't delay rendering the [[IPageRequest]] if everything else is done.  */
    resourceWait?: number;
    /** maximum amount of time to wait for each external resource to load.
     * we kill the request if it exceeds this amount. */
    resourceTimeout?: number;
    /** the maximum amount of time (ms timeout) you wish to wait for the page to finish loading.
     * When rendering a page, we will give you whatever is ready at this time (page may be incompletely loaded).
     * Can be increased up to 5 minutes (300000) , but that only should be used as a last resort,
     * as it is a relatively expensive page render (you are billed for render time).
        * if this value is exceeded, the current page will be rendered and statusCode 424 returned.
      */
    maxWait?: number;
    /** Milliseconds to delay rendering after the last resource is finished loading (default is 1000ms).  This is useful in case there are any AJAX requests or animations that need to finish up.  If additional network requests are made while we are waiting, the waitInterval will restart once finished again.
     * This can safely be set to 0 if you know there are no AJAX or animations you need to wait for (decreasing your billed costs)
     */
    waitInterval?: number;
    /** if true, will stop [[IPageRequest]] load upon the first error detected, and move to next phase (render or next page) */
    stopOnError?: boolean;
    /** array of regex + adjustment parametes for modifying or rejecting resources being loaded by the webpage.
     * Example:  ```"resourceModifier": [{regex:".*css.*",isBlacklisted:true}{"regex": "http://mydomain.com.*","setHeader": {"hello": "world","Accept-encoding": "tacos"}}]```
     */
    resourceModifier?: IResourceModifier[];
    /**
     * BEWARE:  setting custom headers can corrupt your request. use with care.
     * specify additional request headers here.  They will be sent to the server for every request issued (the page and resources).  Unicode is not supported (ASCII only)
     * example: ```customHeaders:{"myHeader":"myValue","yourHeader":"someValue"}```
     * if you want to set headers for just the target page (and not every sub-request) use the [[IUrlSettings.headers]] parameter.
     */
    customHeaders?: {
        [key: string]: string;
    };
    /**
        * if true, clears cache between chained [[IPageRequest]] navigations.
        * note: only important if multiple pages are navigated in one [[IUserRequest]].  cache is never shared between api calls.
        * @default false
     */
    clearCache?: boolean;
    /**
        * if true, clears all cookies upon initial navigation to the targetUrl.
        consider using the ```deleteCookies``` property for targeted removals.
        * note: only important if multiple pages are navigated in one [[IUserRequest]].  cookies are never shared between api calls.
        * @default false
     */
    clearCookies?: boolean;
    /**
        * You must specify name, value, and either domain or url.
     * Set Cookies for any domain, prior to loading this [[IPageRequest]].  If a cookie already exists with the same domain+path+name combination, it will be replaced.
     * See [[ICookie]]  for documentation on the cookie parameters.
     */
    cookies?: ICookie[];
    /**
     * delete any cookie with a matching "name" property before processing the request.
     */
    deleteCookies?: string[];
    /**  new for ```Chrome``` [[IPageRequest.backend|backend]] (not supported in ```WebKit```).
     * if set, will override the viewport and useragent.
        */
    emulateDevice?: "random" | "iPhone 4" | "iPhone 4 landscape" | "iPhone X" | "iPhone X landscape" | "Nexus 4" | "Nexus 4 landscape" | "Nexus 10" | "Nexus 10 landscape" | "Windows IE11 1080p" | "Windows IE11 1080p landscape" | "Surface 3 Chrome" | "Surface 3 Chrome landscape" | "googlebot";
}
/**
 * Execute your own custom JavaScript inside the page being loaded.
 * **INPUT**
 * You can pass in either the url to a script to load, or the text of the script itself.  Example: ```scripts:{domReady:["//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js","return 'Hello, World!';"]}```
 * **OUTPUT**
 * Your scripts can return data to you in the ```pageResponse.scriptOutput``` object.  You can access this directly via ```windows._pjscMeta.scriptOutput``` or your script can simply return a value and it will be set as the ```scriptOutput``` (not available on external, url loaded scripts)
 * Also, if you use the **[[IPageRequest.renderType]]="script"** setting, your response will be the ```scriptOutput``` itself (in JSON format) which allows you to construct your own custom API.  A very powerful feature! *
 */
export interface IScripts {
    /**
         * triggers when the dom is ready for the current page.  Please note that the page may still be loading.
         */
    domReady: string[];
    /**
         *  triggers when we determine the [[IPageRequest]] has been completed.  If your page is being rendered, this occurs immediately before then.
         * **IMPORTANT NOTE**:  Generally you do NOT want to load external scripts (url based) here, as it will hold up rendering.  Consider putting your external scripts in ```domReady```
         */
    loadFinished: string[];
    /**
    * new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
    * will execute scripts when your [[IPageRequest]] navigation is started.
    * **IMPORTANT NOTE**: For advanced use only.  This is triggered before your page starts loading, so work done by your script may not be applied properly.  Consider using ```domReady``` instead.
    */
    pageNavigated: string[];
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
        * triggered when the page.load event occurs
     */
    load: string[];
}
/** The parameters for requesting and rendering a page.  When you submit an array of IPageRequests, they are loaded in-order, and only the last one is rendered.
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
    "script": returns the contents of ```window['_pjscMeta'].scriptOutput```.   see the [[IScripts]]  parameter for more details,
    "plainText": return the text without html tags (page plain text),*/
    renderType?: string;
    /** TRUE to return the page contents and metadata as a JSON object.  see [[IUserResponse]]
     * if FALSE, we return the rendered content in it's native form.
     */
    outputAsJson?: boolean;
    /** settings related to requesting internet resources (your page and resources referenced by your page) */
    requestSettings?: IRequestSettings;
    /** add the nodes from your pageResponse that you do not wish to transmit.  This reduces the size of your data, thus reducing cost and transmission time.
     * if you need the data in these nodes, simply remove it from this array.
     */
    suppressJson?: string[];
    /** settings related to rendering of the last page of your request.  See the [[IRenderSettings]] documentation (below) for details*/
    renderSettings?: IRenderSettings;
    /**
     * Execute your own custom JavaScript inside the page being loaded.
     * see ```IScripts``` docs for more details.
     */
    scripts?: IScripts;
    /** choose what browser renders your request
        *
* @default "default"
     */
    backend?: IBackendType;
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```)..  extra settings if you use injected ```scripts```. */
    scriptSettings?: IScriptSettings;
}
/** select the browser engine you will use
    *
* you may choose from the following shortcuts:  "```default```", "```preview```", "```webkit```", "```chrome```"

* ```default```:  currently ```webkit pjs2.1.1```, will change to ```chrome v68``` soon

* ```preview```:  currently ```chrome v68```. may change at any time as this is for testing new backends or feature enhancements.

* ```webkit```:  the latest stabke version of the default PhantomJs rendering engine:  ```webkit pjs2.1.1```

* ```chrome```:  the latest stable version of chrome, (currently ```chrome v68```)
    
* or choose a specific backend: ```chrome v68```, ```webkit pjs2.1.1```, ```webkit pjs2.5beta```

* */
export declare type IBackendType = "default" | "chrome" | "webkit" | "preview" | "chrome v68" | "webkit pjs2.1.1" | "webkit pjs2.5beta";
/** all [[IBackendType]] choices are converted into one of these internally */
export declare type IDiscreteBackendType = "webkit pjs2.1.1" | "webkit pjs2.5beta" | "chrome v68";
export interface IScriptSettings {
    /** if true and your script errors, processing will abort.   default false. */
    stopOnError?: boolean;
}
/**@hidden */
export declare function pageRequestDefaultsGet(): IPageRequest;
/**
 * properties exposed to your custom ```scripts``` via ```window._pjscMeta```
 */
export interface IScriptPjscMeta {
    /**
        * @deprecated: For ```WebKit``` [[IPageRequest.backend|backend]] only.  (not for ```Chrome```).
        * Scripts can access (readonly) details about the page being loaded via ```window._pjscMeta.pageResponse```  See [[IPageResponse]] for more details. */
    pageResponse?: IPageResponse;
    /** Your scripts can return data to you in the ```pageResponse.scriptOutput``` object.  You can access this directly via ```windows._pjscMeta.scriptOutput``` or your script can simply return a value and it will be set as the ```scriptOutput``` (not available on external, url loaded scripts) */
    scriptOutput: {};
    /** how many custom scripts have been loaded so far*/
    scriptsExecuted: number;
    /** set to false by default.  if true, will delay rendering until you set it back to false. good if you are waiting on an AJAX event. */
    manualWait: boolean;
    /** set to false by default.   set to true to force rendering immediately.  good for example, when you want to render as soon as domReady happens */
    forceFinish: boolean;
    /** allows you to override specific [[IPageRequest]] options with values you compute in your script (based on the document at runtime) */
    optionsOverrides: {
        /** set the clipRectangle for image rendering.   here is an example you can run in your domReady or loadFinished script: ```_pjscMeta.optionsOverrides.clipRectangle = document.querySelector("h1").getBoundingClientRect();```  */
        clipRectangle?: IClipOptions;
    };
}
/** regex + adjustment parameters for modifying or rejecting resources being loaded by the webpage.    Example:  ```{regex:".*css.*",isBlacklisted:true}```  */
export interface IResourceModifier {
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
        *
        * pass one of the categories to modify all requests of that type.
        *
    * can be used in instead of, or in addition to, the [[IResourceModifier.category|category]] or [[IResourceModifier.regex|regex]] property (results are additive)
     */
    type?: "document" | "stylesheet" | "image" | "media" | "font" | "script" | "texttrack" | "xhr" | "fetch" | "eventsource" | "websocket" | "manifest" | "other";
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
            *
            * pass one of the listed categories to modify all requests of that type.
            *
        * can be used in instead of, or in addition to, the [[IResourceModifier.type|type]] or [[IResourceModifier.regex|regex]] property (results are additive)
            */
    category?: "navigationRequest" | "pageResource" | "subFrameResource";
    /** pattern used to match a resource's url.
        *
    * can be used in instead of, or in addition to, the [[IResourceModifier.category|category]] or [[IResourceModifier.type|type]] property (results are additive)
        *
    examples:  it really depends what the site is and what you are wanting to block, but for example to block anything with the text "facebook" or "linkedin" in the url:

    ```javascript requestModifiers:[{regex:".*facebook.*",isBlacklisted:true},{regex:".*linkedin.*",isBlacklisted:true}]```
    
    It's especially useful if you just need the text, as you can block all css files from loading, such as: ```".*\.css.*"```
      
    Don't use this to block images.   instead,  images are blocked by using the [[IRequestSettings.ignoreImages]]=true property```*/
    regex?: string;
    /** if true, blacklists the request unless a later matching resourceAdjustor changes it back to false (we process in a FIFO fashion)
        by default, we don't blacklist anything. You should keep it this way when rendering jpeg (where the visuals matter),
        if processing text/data, blacklisting .css files ['.*\.css.*'] will work fine.
     check the response.metrics for other resources you could blacklist (example: facebook, google analytics, ad networks)
     */
    isBlacklisted?: boolean;
    /** changes the current URL of the network request.
        *
        *
        * You can inject parts of the original URL into your changeUrl using one of the special marker tokens: ```$$port``` ```$$protocol```` ```$$host``` or ```$$path```.
        *
        * ***Note*** You can use [[IResourceModifier.changeCaptureRegex|changeCaptureRegex]] to construct custom marker tokens that can be used inside of your [[IResourceModifier.changeUrl|changeUrl]] string.
        *
        * @example ```changeUrl="$$protocol://example.com/redirect/$$path"```  would change the URL ```https://mysite.org/products/item1.html``` to ```https://example.com/redirect/products/item1.html```
        */
    changeUrl?: string;
    /** special pattern matching regex.  capture groups can replace parts of the ```changeUrl``` that use the special marker tokens ```$$0```, ```$$1```, etc on to ```$$9``` .
        *
        * ***Note*** You use [[IResourceModifier.changeCaptureRegex|changeCaptureRegex]] to construct custom marker tokens that can be used inside of your [[IResourceModifier.changeUrl|changeUrl]] string.
    
    for example: if ```resourceUrl="http://google.com/somescript.js"``` ```changeCaptureRegex="^.*?/(.*)$"``` would create a match group for everything after the last ```/``` character and ```changeUrl="http://example.com/$$1"``` would then get evaluated to  ```"http://example.com/somescript.js"``` */
    changeCaptureRegex?: string;
    /** optional key/value pairs for adjusting the headers of this resource's request.  example: ```{"Accept-encoding":"gzip", "hello":"world"}```*/
    setHeader?: {
        [key: string]: string;
    };
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
        *
        set the response to be returned to the requesting page.
        warning: setting this to an empty object will force a blank response.   to skip this, do not set it, or set to null.*/
    setResponse?: {
        /** set the response body */
        body?: string;
        /** sets the Content-Type response header */
        contentType?: string;
        /** set response headers */
        headers?: {
            [key: string]: string;
        };
        /** set response status code.
            * @default 200
         */
        status?: number;
    };
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
        *
        set to override the method. */
    method?: string;
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
        *
        set to override the post body. */
    postData?: string;
}
/** allows selecting focused content.
    * For images, This property defines the rectangular area of the web page to be rasterized when using the requestType of png or jpeg.

    * alternatively, you could use the [[IRenderSettings.selector]] option

    * If no clipping rectangle is set, the entire web page is captured. */
export interface IClipOptions {
    /** @default 0 */
    top?: number;
    /** @default 0 */
    left?: number;
    width: number;
    height: number;
}
/** when a page is rendered, use these settings.  */
export interface IRenderSettings {
    /** jpeg quality.  0 to 100.  default 70.  ignored for png, use pngOptions to set png quality. */
    quality?: number;
    /** settings useful for generating PDF's
        *
    * **Note**: by default, when generating a PDF we set the **[[IRenderSettings.emulateMedia]]="screen"** property.   Consider setting [[IRenderSettings.emulateMedia]]="print" for a more print-friendly PDF

    @Example
    ```json
    { format: "A4",
        headerTemplate:"<div style='color:blue;font-size:18px;'><div class='pageNumber'>0</div>/<div class='totalPages'>0</div></div>",
        landscape:true,
        preferCSSPageSize:true,
        pageRanges:"1-3", 	}
    ```*/
    pdfOptions?: IPdfOptions;
    /** optional png quality options passed to PngQuant.  you must set pngOptions.optimize=true to enable these, otherwise the original non-modified png is returned.    */
    pngOptions?: IPngOptions;
    /** size of the browser in pixels*/
    viewport?: {
        width: number;
        /**
         * by default, height is not used when taking screenshots (png/pdf).  The image will be as tall as required to fit the content.
         * To customize your screenshot dimensions, use the [[IRenderSettings.clipRectangle]] property.  */
        height: number;
        /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
         * if set, the meta viewport tag is used
         * @default false
         */
        isMobile?: boolean;
        /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
         * if touch events are supported
         * @default false
         */
        hasTouch?: boolean;
        /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
         * if landscape mode is used
         * @default false
         */
        isLandscape?: boolean;
    };
    /** This property specifies the scaling factor for the screenshot (requestType png/pdf) choices.  The default is 1, i.e. 100% zoom. */
    zoomFactor?: number;
    /** This property defines the rectangular area of the web page to be rasterized when using the requestType of png or jpeg. If no clipping rectangle is set, the entire web page is captured.
    Beware: if you capture too large an  image it can cause your request to fail (out of memory).  you can choose any dimensions you wish as long as you do not exceed 32M pixels
    new for Chrome: as an alternative to clipRect, specify [[IRenderSettings.selector]] to automatically set the viewport.*/
    clipRectangle?: IClipOptions;
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
        *
    * as an alternative to ```clipRectangle``` you may pass a CSS selector.
    * such as "h1", and the bounding rectangle of that element will be used.

    * CSS selectors are like JQuery.  For help, please see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors

    * For PlainText or Html, you can pass a selector which will render only the specified element.

    * For image rendering (jpeg/png) You may also send the send the special "_viewport" selector

    * note: selector takes precidence over any clipRectangle settings.
    */
    selector?: string;
    /** @deprecated for ```WebKit``` [[IPageRequest.backend|backend]] only.  not supported in ```Chrome```.  use ```clipRectangle.selector``` instead.
     * specify an IFrame to render instead of the full page.  must be the frame's name.*/
    renderIFrame?: string;
    /** If true, we will pass through all headers received from the target URL.
     * However, we do not pass through "content-*" and "transfer-*" headers, except for "Content-Type" if you render "html".
     * Please note: this can potentially corrupt your response, so use with caution.
     * ```extraResponseHeaders``` override these headers.
     * @default false*/
    passThroughHeaders?: boolean;
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
        *
        * if true, will pass the content statusCode, irrespective of if your api call was successful.
        *
    * Note:  you can always check the target URL's status code by inspecting the ```pjsc-content-status-code``` response header.
     */
    passThroughStatusCode?: boolean;
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
     * If true, and outputting a PNG, will hide the default white background (useful for capturing transparency).
        * If true and outputting a PDF, will hide the background graphics altogether.
     * @default false
     */
    omitBackground?: boolean;
    /** BEWARE:  setting custom headers can corrupt your response, making it appear to fail when it did not. use with care.
     * custom response headers you want sent along with your response.
     * For example, to rename the file being downloaded,
     * you can add ```'Content-Disposition: attachment; filename="downloaded.pdf"'```
      */
    extraResponseHeaders?: {
        [name: string]: string;
    };
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
     * override the CSS media type of the page.
     * @default "screen"*/
    emulateMedia?: "screen" | "print";
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
/**
    * @deprecated for use with the old ```WebKit``` [[IPageRequest.backend|backend]].   for the new ```Chrome``` based [[IPageRequest.backend|backend]], see ```IPdfOptions```
    *
     options for specifying headers or footers in a pdf render.  */
export interface IPdfHeaderFooter_WebKit {
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
/** The 'maximal' form of user request, allows specifying multiple [[IPageRequest]]'s to load in order, and other misc global options.
    *
    * ***Note***: if you need to send a single [[IPageRequest]], can can send it directly (no need to wrap it in an [[IUserRequest]] object)
 */
export interface IUserRequest {
    /** array of pages you want to load, in order.  Only the last successfully loaded page will be rendered.*/
    pages: IPageRequest[];
    /** set to use a custom proxy server */
    proxy?: IProxyOptions;
    /** choose what browser renders your request
        * @default "default"
    */
    backend?: IBackendType;
    /** @hidden, the explicit browser engine we will use to process the request */
    backendDiscrete?: IDiscreteBackendType;
    /** setting this forces the value of the outputAsJson parameter, regardless of what the last page's value of outputAsJson was set to.  default is undefined.*/
    outputAsJson?: boolean;
    /**
     * new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
     * set to true to enable web security.  default is false.
     * setting this overrides the same setting in [[IPageRequest.requestSettings]]
     * */
    webSecurityEnabled?: boolean;
}
/** allows specifying a proxy for your [[IUserRequest]] (all the [[IPageRequest]] it contains)  To use the built-in proxy servers, you must set the ```geolocation``` parameter.
 *  Alternatively, you may use your own custom proxy server by setting the ```custom``` parameter. */
export interface IProxyOptions {
    /** allows you to use a custom proxy server.  if you set this, the built-in proxy will not be used. default=NULL */
    custom?: IProxyCustomOptions;
}
export interface IProxyCustomOptions {
    /**For ```Chrome``` [[IPageRequest.backend|backend]], pass the full URL:  such as ```http://proxy.example.com:8088```.
        *
        * For old ```WebKit``` [[IPageRequest.backend|backend]]: the address and port of the proxy server to use.  ex: ```192.168.1.42:8080```  If your proxy requires a IP to whitelist, use ```api-static.phantomjscloud.com``` for your requests.   */
    host: string;
    /**@deprecated: old ```WebKit``` [[IPageRequest.backend|backend]] only.   If using the ```Chrome``` [[IPageRequest.backend|backend]], pass the type as part of the host parameter.
        * for  type of the proxy server.  default is ```http``` available types are ```http```, ```socks5```, and ```none``` */
    type?: string;
    /** if your proxy requires basic HTTP authentication information.
        *
        * this auth pair will be sent via basic http auth (overriding [[IRequestSettings.authentication]])
    
        *
        @example  "username:password"
    */
    auth?: string;
    /** new for ```Chrome``` [[IPageRequest.backend|backend]].  (not available on ```WebKit```).
        *
        * the headers that should be supplied for proxy authentication.  they will be sent with every resource request
        *
    * @example {"Proxy-Authorization":"Basic yoursecretkey"}
        */
    authHeaders?: {
        [name: string]: string;
    };
}
/** This is returned to you when "outputAsJson=true".  */
export interface IUserResponse {
    /** the original request, without defaults applied.   to see the request with defaults, see [[IPageResponse.pageRequest]] */
    originalRequest: IUserRequest;
    /** a collection of load/processing information for each [[IPageRequest]] you requested. */
    pageResponses: IPageResponse[];
    /** the rendered output of the last [[IPageRequest]] */
    content: {
        /** the final url of the [[IPageRequest]] after redirects */
        url: string;
        /** data in either base64 or utf8 format */
        data: string;
        /** filename you could use if saving the content to disk. this will be something like 'content.text', 'content.jpeg', 'content.pdf'
         * thus this informs you of the content type
         */
        name: string;
        /** utf8 or base64 */
        encoding: string;
        /** headers of the target url, only set if [[IRenderSettings.passThroughHeaders]]===true */
        headers?: {
            [name: string]: string;
        };
        /** the size of data, in bytes */
        size: number;
        statusCode: number;
        /** extra response headers you want sent with your response.  set by [[IRenderSettings.extraResponseHeaders]] */
        extraHeaders?: {
            [name: string]: string;
        };
        /** new for Chrome [[IPageRequest.backend|backend]].  for debugging your request, if our [[IPageRequest]] didn't succeed with statusCode 200, we'll output the last thing waited on. */
        pageExecLastWaitedOn?: string;
        /** set via [[IRenderSettings.passThroughStatusCode]], if this is true, when returning the response to you, the content's status code will be sent, irrespective of your API statusCode. */
        passThroughStatusCode?: boolean;
        /** new for Chrome [[IPageRequest.backend|backend]].  if your [[IPageRequest]] had any runtime errors, they will be listed here. */
        errors?: {
            name: string;
            message: string;
            frame: string;
        }[];
        /** @hidden */
        debugDiags?: string[];
    };
    /** metadata about the transaction */
    meta?: {
        /** information about the PhantomJsCloud.com system processing this transaction*/
        backend?: {
            os: string;
            /** identifier of the system, for troubleshooting purposes */
            id: string;
            /** Chrome or PhantomJs */
            platform: string;
            /**  (major/minor/point)*/
            platformVersion: any;
            /** number of requests processed by this [[IPageRequest.backend|backend]] */
            requestsProcessed: number;
        };
        /** how much this transaction costs.
        NOTE: the creditCost, prepaidCreditsRemaining, and dailySubscriptionCreditsRemaining are also returning in the HTTP Response Headers via the keys
        ```pjsc-credit-cost```, ```pjsc-daily-subscription-credits-remaining```, and ```pjsc-prepaid-credits-remaining```
        */
        billing?: {
            /** the start time of your [[IUserRequest]]. */
            startTime?: string;
            /** the end time of your [[IUserRequest]]. */
            endTime?: string;
            elapsedMs: number;
            bytes: number;
            /** the total cost of this response */
            creditCost?: number;
            prepaidCreditsRemaining?: number;
            /** estimation of your remaining daily creditBalance.  This is incrementally refilled hourly.*/
            dailySubscriptionCreditsRemaining?: number;
        };
        /** debug trace information provided by the api. */
        trace?: {
            time: string;
            /** time since last trace call */
            elapsedMs: number;
            /** debug message or object */
            data: any;
        }[];
        /** if true, informs our server to send back JSON, including the response plus metadata.  if False, if should send back only the content.
            *
        @default false
        */
        outputAsJson?: boolean;
    };
    /** the HTTP Status Code PhantomJsCloud returns to you */
    statusCode: number;
    /** if an error was detected, we will try to supply a statusMessage to help debug.  Additionally,this will be placed as the ```pjsc-status-message``` response header. */
    statusMessage?: string;
}
/** Information about the [[IPageRequest]] transaction (request and it's response).   */
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
    /** events that occured during requesting and loading of the [[IPageRequest]] and it's content */
    events: Array<{
        key: string;
        time: string;
        value: any;
    }>;
    /**
     *  cookies set at the moment the [[IPageRequest]] transaction completed.
     */
    cookies: ICookie[];
    /**
     *  headers for the primary resource (the url requested).  for headers of other resources, inspect the pageResponse.events (key='resourceReceived')
     */
    headers: {
        [name: string]: string;
    };
    /** the Frames contained in the page.   The first is always the main page itself, even if no other frames are present. */
    frameData: IPageFrame;
    /**
     * run a script and direct output to
     */
    scriptOutput: any;
    /** the status code for the page, a shortcut to metrics.targetUrlReceived.value.status */
    statusCode: number;
    errors: any[];
    /** if any issues were discovered, we will provide this string in the response, to help with debugging */
    pageExecWaitingOn?: string;
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
//# sourceMappingURL=io-data-types.d.ts.map
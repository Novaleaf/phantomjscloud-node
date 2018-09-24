"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const xlib = require("xlib");
const phantomjscloud = require("./_index");
const __ = xlib.lolo;
const log = __.log;
const apiKey = xlib.environment.getEnvironmentVariable("phantomjscloud_apikey");
describe(__filename, () => {
    let browser;
    before(() => {
        browser = new phantomjscloud.BrowserApi({ apiKey });
    });
    it("basic e2e", () => __awaiter(this, void 0, void 0, function* () {
        const pageRequest = { url: "https://www.example.com", renderType: "html", backend: "chrome" };
        const userResponse = yield browser.requestSingle(pageRequest);
        log.assert(userResponse.content.data.indexOf("Example Domain") >= 0);
    }));
    describe("basic browserApi functionality", () => {
        it("plainText example.com", () => __awaiter(this, void 0, void 0, function* () {
            let pageRequest = {
                url: "https://www.example.com",
                renderType: "plainText",
            };
            return browser.requestSingle(pageRequest)
                .then((pjscResponse) => {
                if (pjscResponse.content.data.indexOf("example") >= 0) {
                    return Promise.resolve();
                }
                return Promise.reject(log.error("example.com content should contain the word 'example'", { pjscResponse }));
            });
        }));
    });
    it("invalid domain", () => {
        let pageRequest = {
            url: "https://www.exadsfakjalkjghlalkjrtiuibe.com",
            renderType: "plainText",
        };
        let result = browser.requestSingle(pageRequest)
            .then((pjscResponse) => {
            throw log.error("should have failed...", { pjscResponse });
        }, (err) => {
            if (err.response != null) {
                const axiosErr = err;
                log.assert(axiosErr.response != null && axiosErr.response.status === 424, "expected error status 424", { axiosErr });
            }
        });
    }).timeout(10000);
    //describe("perf tests", () => {
    //	const fs = require("fs");
    //	const svg_sample_979_17470485_content: string = fs.readFileSync(__dirname + "/../tests/svg-sample-979_17470485.html", { encoding: "utf8" });
    //	// const warmupRequest: ioDatatypes.IPageRequest = {
    //	// 	url: "",
    //	// 	content: "<html>hi</html>",
    //	// 	"renderType": "png", "renderSettings": { "quality": 75, "viewport": { "width": 624, "height": 420 }, "clipRectangle": { "top": 0, "left": 0, "width": 624, "height": 420 }, "zoomFactor": 1 }, "requestSettings": { "waitInterval": 0 }, "outputAsJson": true
    //	// };
    //	let testRequest: ioDatatypes.IPageRequest = {
    //		"url": "",
    //		"content": svg_sample_979_17470485_content,
    //		"renderType": "png", "renderSettings": { "quality": 75, "viewport": { "width": 624, "height": 420 }, "clipRectangle": { "top": 0, "left": 0, "width": 624, "height": 420 }, "zoomFactor": 1 }, "requestSettings": { "waitInterval": 0 }, "outputAsJson": true
    //	}
    //	function testPass(testName: string, passName: string, browserApi: BrowserApi): PromiseLike<any> {
    //		// //warm up request
    //		// const warmupStart = __.utcNowTimestamp();
    //		// //return browserApi.requestSingle(testRequest_complexSvgSmallPng)
    //		// return browserApi.requestSingle(warmupRequest)
    //		// 	.then(() => {
    //		// 		const warmupEnd = __.utcNowTimestamp();
    //		// 		const warmupElapsedMs = warmupEnd - warmupStart;
    //		// 		//log.warn("warmup request elapsedms=", endBasic - startBasic);
    //		const testStart = __.utcNowTimestamp();
    //		return browserApi.requestSingle(testRequest)
    //			//return browserApi.requestSingle(basicPageRequest)
    //			.then((pjscResponse) => {
    //				const testEnd = __.utcNowTimestamp();
    //				const testElapsedMs = testEnd - testStart;
    //				log.warn(testName, {
    // 					passName,
    // 					//warmupElapsedMs, 
    // 					testElapsedMs,
    // 					statusCode: pjscResponse.statusCode
    // 				});
    // 				return Promise.resolve();
    // 				// if (pjscResponse.content.data.indexOf("example") >= 0) {
    // 				// 	return Promise.resolve();
    // 				// }
    // 				// return Promise.reject(log.error("example.com content should contain the word 'example'", { pjscResponse }));
    // 			});
    // 		// })
    // 	}
    // 	let test = it("svg gen sample 979_17470485_SEQUENTIAL", () => {
    // 		let testName = "SEQUENTIAL";
    // 		const browserApi = new BrowserApi();
    // 		return testPass(testName, "0", browserApi)
    // 			.then(() => {
    // 				return testPass(testName, "1", browserApi);
    // 			})
    // 			.then(() => {
    // 				return testPass(testName, "2", browserApi);
    // 			})
    // 			.then(() => {
    // 				return testPass(testName, "3", browserApi);
    // 			})
    // 			.then(() => {
    // 				return testPass(testName, "4", browserApi);
    // 			})
    // 			.then(() => {
    // 				return testPass(testName, "5", browserApi);
    // 			})
    // 			.then(() => {
    // 				return testPass(testName, "6", browserApi);
    // 			})
    // 			.then(() => {
    // 				return testPass(testName, "7", browserApi);
    // 			})
    // 			.then(() => {
    // 				return testPass(testName, "8", browserApi);
    // 			})
    // 			.then(() => {
    // 				return testPass(testName, "9", browserApi);
    // 			})
    // 	});
    // 	test.timeout(20000);
    // 	test = it("svg gen sample 979_17470485_PARALLEL", () => {
    // 		let testName = "PARALLEL";
    // 		const browserApi = new BrowserApi();
    // 		const allPasses = [];
    // 		for (let i = 0; i < 8; i++) {
    // 			allPasses.push(testPass(testName, i.toString(), browserApi));
    // 		}
    // 		return Promise.all(allPasses);
    // 	});
    // 	test.timeout(20000);
});
//# sourceMappingURL=_unit.test.js.map
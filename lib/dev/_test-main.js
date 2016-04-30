"use strict";
var assert = require('assert');
describe("Test Suite 1", function () {
    it("Test A", function () {
        assert.ok(true, "This shouldn't fail");
    });
    it("Test B", function () {
        assert.ok(1 === 1, "This shouldn't fail");
        assert.ok(false, "This should fail ts");
    });
});
//# sourceMappingURL=_test-main.js.map
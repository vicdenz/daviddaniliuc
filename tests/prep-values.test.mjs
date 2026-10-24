import test from "node:test";
import assert from "node:assert/strict";
import {
  formatValue,
  formatArguments,
  formatExample,
} from "../prep/src/value-format.mjs";

test("test data keeps arrays inline and preserves JSON values and escaped strings", () => {
  const value = {
    nums: [1, 2, 3],
    matrix: [
      [1, 2],
      [3, 4],
    ],
    strings: ["a,b", 'a"b', "a\nb", "[1,2]"],
    empty: [],
    flag: false,
    nothing: null,
  };
  const formatted = formatValue(value);
  assert.match(formatted, /"nums": \[1, 2, 3\]/);
  assert.match(formatted, /"matrix": \[\[1, 2\], \[3, 4\]\]/);
  assert.deepEqual(JSON.parse(formatted), value);
  assert.equal(formatValue([1, 2, 3]), "[1, 2, 3]");
});

test("function inputs show one named argument per line without changing the positional data", () => {
  const input = [[2, 7, 11, 15], 9];
  assert.equal(
    formatArguments(input, [{ name: "nums" }, { name: "target" }]),
    "nums = [2, 7, 11, 15]\ntarget = 9",
  );
  assert.deepEqual(input, [[2, 7, 11, 15], 9]);
  assert.equal(formatArguments([[]]), "arg1 = []");
  assert.equal(formatArguments([]), "(no arguments)");
});

test("JSON examples are compact while Python source and non-JSON examples remain untouched", () => {
  assert.equal(formatExample("[\n 1,\n 2\n]", "language-json"), "[1, 2]");
  assert.equal(
    formatExample("[\n 1,\n 2\n]", "language-python"),
    "[\n 1,\n 2\n]",
  );
  assert.equal(formatExample("Input: nums = [1, 2]"), "Input: nums = [1, 2]");
});

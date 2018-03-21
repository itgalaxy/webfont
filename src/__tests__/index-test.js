import index from "..";
import test from "ava";

test("should exported", t => {
  t.true(typeof index === "function");
});

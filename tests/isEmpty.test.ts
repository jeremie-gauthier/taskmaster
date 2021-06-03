import { isEmpty } from "../src/lib/utils/index.ts";

import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.97.0/testing/asserts.ts";

Deno.test("[isEmpty] valid cases", () => {
  assertEquals(isEmpty([]), true);
  assertEquals(isEmpty(""), true);
  assertEquals(isEmpty([0]), false);
  assertEquals(isEmpty(["0", "1"]), false);
});

Deno.test("[isEmpty] invalid cases", () => {
  // @ts-expect-error testing invalid type case
  assertThrows(() => isEmpty(), TypeError);
});

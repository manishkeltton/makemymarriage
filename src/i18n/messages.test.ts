import { expect, it } from "vitest";
import en from "./messages/en.json";
import hi from "./messages/hi.json";

it("keeps English and Hindi message keys aligned", () => {
  expect(Object.keys(hi)).toEqual(Object.keys(en));
  expect(Object.keys(hi.Scaffold)).toEqual(Object.keys(en.Scaffold));
  expect(Object.values(hi.Scaffold).every((value) => value.length > 0)).toBe(
    true,
  );
});

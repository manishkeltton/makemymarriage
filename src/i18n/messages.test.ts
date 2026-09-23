import { expect, it } from "vitest";
import en from "./messages/en.json";
import hi from "./messages/hi.json";

it("keeps English and Hindi message keys aligned", () => {
  expect(Object.keys(hi)).toEqual(Object.keys(en));
  for (const namespace of Object.keys(en) as Array<keyof typeof en>) {
    expect(Object.keys(hi[namespace]).sort()).toEqual(
      Object.keys(en[namespace]).sort(),
    );
    for (const messages of [en[namespace], hi[namespace]]) {
      expect(
        Object.values(messages).every((value) => value.trim().length > 0),
      ).toBe(true);
    }
  }
});

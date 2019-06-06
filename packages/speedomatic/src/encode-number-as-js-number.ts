import { bignum } from "./bignum";

export function encodeNumberAsJSNumber(s: number | string, isWrapped = false): string {
  return bignum(s, "number", isWrapped);
}

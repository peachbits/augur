const rawDecode = require("ethereumjs-abi").rawDecode;
import { formatAbiRawDecodedDataArray } from "./format-abi-raw-decoded-data-array";
import { strip0xPrefix } from "./strip-0x-prefix";

export function abiDecodeData(inputs, abiEncodedData) {
  const dataInputTypes = inputs.filter(function (input) {
    return !input.indexed;
  }).map(function (input) {
    return input.type;
  });
  const abiRawDecodedDataArray = rawDecode(dataInputTypes, Buffer.from(strip0xPrefix(abiEncodedData), "hex"));
  return formatAbiRawDecodedDataArray(dataInputTypes, abiRawDecodedDataArray);
}



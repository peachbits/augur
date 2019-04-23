"use strict";

var generateAbiMap = require("./generate-abi-map");
var readJsonFile = require("../utils/read-json-file");

var e = module.exports = {
  abi: generateAbiMap(require("@augurproject/artifacts").abi),
  addresses: require("@augurproject/artifacts").addresses,
  uploadBlockNumbers: require("@augurproject/artifacts").uploadBlockNumbers
};

module.exports.reloadAddresses = function (callback) {
  readJsonFile(require.resolve("@augurproject/artifacts/build/addresses.json"), function (err, data) {
    if (err) return callback(err);

    e.addresses = data;

    readJsonFile(require.resolve("@augurproject/artifacts/build/upload-block-numbers.json"), function (err, data) {
      if (err) return callback(err);
      e.uploadBlockNumbers = data;

      callback(null, e);
    });
  });
};

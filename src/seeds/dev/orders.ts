import * as Knex from "knex";
import Promise = require("bluebird");

exports.seed = function (knex: Knex): Promise<any> {
    // Deletes ALL existing entries
    return knex("orders").del()
        .then(() => {
          // Inserts seed entries
          return knex.raw(`INSERT INTO orders
            (order_id, market, outcome, share_token, order_type, order_creator, creation_time, creation_block_number, price, amount, tokens_escrowed, shares_escrowed)
            VALUES (
              '0x1000000000000000000000000000000000000000000000000000000000000000',
              '0x0000000000000000000000000000000000000001',
              0,
              '0x1000000000000000000000000000000000000000',
              'buy',
              '0x0000000000000000000000000000000000000b0b',
              1506473500,
              1400001,
              700000000000000000,
              1000000000000000000,
              700000000000000000,
              0
            ), (
              '0x2000000000000000000000000000000000000000000000000000000000000000',
              '0x0000000000000000000000000000000000000001',
              0,
              '0x1000000000000000000000000000000000000000',
              'buy',
              '0x000000000000000000000000000000000000d00d',
              1506473515,
              1400002,
              600000000000000000,
              2000000000000000000,
              1200000000000000000,
              0
            ), (
              '0x3000000000000000000000000000000000000000000000000000000000000000',
              '0x0000000000000000000000000000000000000001',
              1,
              '0x2000000000000000000000000000000000000000',
              'buy',
              '0x000000000000000000000000000000000000d00d',
              1506473515,
              1400002,
              600000000000000000,
              2000000000000000000,
              1200000000000000000,
              0
            ), (
              '0x4000000000000000000000000000000000000000000000000000000000000000',
              '0x0000000000000000000000000000000000000001',
              1,
              '0x2000000000000000000000000000000000000000',
              'sell',
              '0x000000000000000000000000000000000000d00d',
              1506473515,
              1400002,
              600000000000000000,
              2000000000000000000,
              1200000000000000000,
              0
            )`);
        });
};

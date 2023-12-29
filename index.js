const express = require("express");
const dontenv = require("dotenv");
const ccxt = require("ccxt");
const axios = require("axios");
const { config } = require("dotenv");

dontenv.config();

const app = express();
const port = process.env.PORT;

// app.get("/run", (req, res, next) => {
const binanceClient = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET,
});

const confg = {
  asset: "BTC",
  base: "USDT",
  allocation: 0.1,
  spred: 0.2,
  tickInterval: 20000,
};

const tick = async () => {
  const { asset, base, allocation, spred } = confg;

  // console.log("Binance Api inteegration", markets);
  let marketPrice;
  const market = `${asset}/${base}`;
  const orders = await binanceClient.fetchOpenOrders(market);
  console.log("orders", orders);
  orders.forEach(async (order) => {
    await binanceClient.canceleOrder(order.id);
  });
  try {
    const results = await Promise.all([
      axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      ),
      axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd"
      ),
    ]);

    marketPrice = results[0].data.bitcoin.usd / results[1].data.tether.usd;
  } catch (err) {
    console.log(err.message);
  }
  const sellprice = marketPrice * (1 + spred);
  const buyPrice = marketPrice * (1 - spred);
  const balanc = await binanceClient.fetchBalance();
  const balance = 0.00345;
  console.log("balance", balance);
  const assetBalance = balance; //balance.BTC.free;
  console.log(assetBalance);
  const baseBalance = 500; //balance.USDT.free;
  console.log(baseBalance);

  const sellVolume = assetBalance * allocation;
  const buyVolume = (baseBalance * allocation) / marketPrice;
  console.log("sellVolume", sellVolume, allocation, buyPrice);

  await binanceClient.createLimitSellOrder(market, sellVolume, sellprice);
  await binanceClient.createLimiteBuyOrder(market, buyVolume, buyPrice);

  console.log(`
    Next tick for ${market}....\n
    Create Limit Sellorder for ${sellVolume} at ${sellprice}.\n
    Create Limit Buy Order for ${buyVolume} at ${buyPrice}.
    `);
};

const run = () => {
  const binanceClient = new ccxt.binance({
    apiKey: process.env.API_KEY,
    secret: process.env.API_SECERETE,
  });
  tick(confg, binanceClient);

  setInterval(tick, confg.tickInterval, config, binanceClient);
};

run();

app.listen(port, () => [
  console.log(`Bot has started runing on this port ${port}`),
]);

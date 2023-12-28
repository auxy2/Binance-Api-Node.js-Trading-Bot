const express = require("express");
const dontenv = require("dotenv");
const ccxt = require("ccxt");
const axios = require("axios");
const { config } = require("dotenv");

dontenv.config();

const app = express();
const port = process.env.PORT;

app.get("/run", (req, res, next) => {
  const binanceClient = new ccxt.binance({
    apiKey: process.env.API_KEY,
    secrete: process.env.API_SECERETE,
  });

  const tick = async () => {
    const { asset, base, allocation, spred } = config;
    const markets = await binanceClient.loadMarkets();

    console.log(markets);
    res.status(200).send(markets);

    const market = "BTC/USD";
    const orders = await binanceClient.fetchOpenOrders(market);
    console.log("orders", orders);
    orders.forEach(async (order) => {
      await binanceClient.canceleOrder(order.id);
    });

    const results = await promise.all([
      axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      ),
      axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd"
      ),
    ]);

    const marketPrice =
      results[0].data.bitcoin.usd / results[1].data.tether.usd;

    const sellprice = marketPrice * (1 + spred);
    const buyPrice = marketPrice * (1 - spred);
    const balance = await binanceClient.fetchBalance();
    const assetBalance = balance.free[asset];
    const baseBalance = balance.free[base];

    const sellVolume = assetBalance * allocation;
    const buyVolume = (baseBalance * allocation) / marketPrice;

    await binanceClient.createLimiteSellOrder(market, sellVolume, buyPrice);
    await binanceClient.createLimiteBuyOrder(market, sellVolume, buyPrice);

    console.log(`
    Next tick for ${market}....\n
    Create Limit Sellorder for ${sellVolume} at ${sellprice}.\n
    Create Limit Buy Order for ${buyVolume} at ${buyPrice}.
    `);
  };

  const run = () => {
    const config = {
      asset: "BTC",
      base: "USDT",
      allocation: 0.1,
      spred: 0.2,
      tickInterval: 20000,
    };

    const binanceClient = new ccxt.binance({
      apiKey: process.env.API_KEY,
      secrete: process.env.API_SECERETE,
    });

    tick(config, binanceClient);
    setInterval(tick, config.tickInterval, config, binanceClient);
  };

  run();
});

app.listen(port, () => [
  console.log(`Bot has started runing on this port ${port}`),
]);

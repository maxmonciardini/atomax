import { AlpacaClient } from "@master-chief/alpaca";
import { User } from "../models/User";
import BuyOrder from "../types/BuyOrder";
import discordBot from "../discord/bot";
import { TextChannel } from "discord.js";
import objectToPrettyJSON from "../util/objectToPrettyJSON";

export const placeBuyOrder = async (params: BuyOrder, user: User) => {
  const { qty, notional, symbol } = params;

  const channel = discordBot.channels.cache.get("882463600629923921");

  if (!(channel instanceof TextChannel)) {
    return console.error("Not a text channel!");
  }

  try {
    const alpacaClient = new AlpacaClient({
      credentials: {
        key: user.alpacaApiKey,
        secret: user.alpacaSecretKey,
        paper: user.alpacaPaperTrading
      },
      rate_limit: true
    });

    if (qty && notional) {
      throw new Error("Please specify only a quantity or a notional amount!");
    }

    if (!qty && !notional) {
      throw new Error("Please specify either a quantity or a notional amount!");
    }

    const asset = await alpacaClient.getSnapshot({ symbol });
    const latestClosePrice = asset.minuteBar.c;
    const stopLossPrice = latestClosePrice - latestClosePrice * 0.0225;

    const result = await alpacaClient.placeOrder({
      symbol,
      ...(qty && { qty }),
      ...(notional && { notional }),
      side: "buy",
      type: "stop",
      time_in_force: "day",
      stop_price: stopLossPrice,
      stop_loss: {
        stop_price: stopLossPrice
      }
    });

    channel.send(`Buy order placed!\n${objectToPrettyJSON(result)}`);
  } catch (err) {
    channel.send(`Something went wrong!\n\n${err.message}`);
  }
};
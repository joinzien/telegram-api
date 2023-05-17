// SPDX-License-Identifier: MIT

"use strict";

const message = require("./messages.js");
const buildMessage = require("./buildMessage.js");

class Telegram {
  constructor(token) {
    this.token = token;
  }

  async parse(rawInput) {
    const rawJson = JSON.parse(rawInput);

    if (Object.prototype.hasOwnProperty.call(rawJson, "callback_query")) {
      const user = rawJson.callback_query.message.chat.id;
      const message = rawJson.callback_query.data;

      return { user, message };
    }

    const user = rawJson.message.chat.id;
    const message = rawJson.message.text;

    return { user, message };
  }

  async addMenu(menuFile) {
    const endpoint = "setMyCommands";

    const body = message.buildMenu(menuFile);

    return message.sendPayload(body, endpoint, this.token);
  }

  async send(chatId, response) {
    if (response === undefined) {
      return "undefined response";
    }

    const formattedReply = response.replaceAll("<br/>", "\n");
    const replyMessages = await buildMessage.splitReply(formattedReply);

    const responses = [];

    for (let i = 0; i < replyMessages.length; i++) {
      const { reply, buttons } = await buildMessage.splitButtons(
        replyMessages[i]
      );

      const response = await message.send(reply, buttons, chatId, this.token);
      responses.push(response);
    }

    return responses;
  }
}

module.exports = { Telegram };

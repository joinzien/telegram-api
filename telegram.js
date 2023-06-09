// SPDX-License-Identifier: MIT

"use strict";

const message = require("./send.js");
const edit = require("./edit.js");
const buildMessage = require("./build.js");

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

    return buildMessage.sendPayload(body, endpoint, this.token);
  }

  containsRefresh(reply) {
    return message.doesReplyContainsTag(
      reply,
      message.refreshMarkupStart,
      message.refreshMarkupEnd,
    );
  }

  refreshName(reply) {
    return message.extractName(
      reply,
      message.refreshMarkupStart,
      message.refreshMarkupEnd,
    );
  }

  async send(chatId, response) {
    if (response === undefined) {
      return "undefined response";
    }
    const replyMessages = message.preProcess(response);

    const messageIDs = [];

    for (let i = 0; i < replyMessages.length; i++) {
      const response = await message.send(replyMessages[i], chatId, this.token);

      if (response.status === 200) {
        const messageID = response.data.result.message_id;
        messageIDs.push(messageID);
      }
    }

    // Set the message ID and name
    let stateName = "";
    if (message.doesReplyContainsTag(response, message.messageMarkupStart)) {
      stateName = message.extractName(
        response,
        message.messageMarkupStart,
        message.messageMarkupEnd,
      );
    }

    const messageIDsString = messageIDs.join(", ");
    const result = { name: stateName, value: messageIDsString };

    return result;
  }

  async edit(chatId, messageId, response) {
    if (response === undefined) {
      return "undefined response";
    }
    const replyMessages = message.preProcess(response);

    for (let i = 0; i < replyMessages.length; i++) {
      await edit.send(replyMessages[i], chatId, messageId, this.token);
    }

    const result = { name: "", value: messageId };
    return result;
  }
}

module.exports = { Telegram };

// SPDX-License-Identifier: MIT

"use strict";

const message = require("./messages.js");
const buildMessage = require("./buildMessage.js");

class Telegram {
  constructor(token) {
    this.token = token;
  }

  async parse(rawInput) {
    return rawInput
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

    const { reply, buttons } = await buildMessage.splitButtons(response);
    const replyMessages = await buildMessage.splitReply(reply);

    let  responses = []

    for (let i = 0; i < replyMessages.length; i++) {
        const reply = replyMessages[i];

        // We only want the buttons on the last mmessge of the batch
        let currentButtons = [];
        let lastMessage = false;
        if (i === replyMessages.length - 1) {
            currentButtons = buttons;
            lastMessage = true;
        }

        const response = await message.send(reply, currentButtons, chatId, lastMessage, this.token);   
        responses.push(response)       
    }

    return responses
  }
}  

module.exports = { Telegram};
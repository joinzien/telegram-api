// SPDX-License-Identifier: MIT

"use strict";
const axios = require("axios");
const fs = require("fs");

const buildMessage = require("./buildMessage.js");

function buildKeyboard(buttons) {
  const buttonRow = [];

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    buttonRow.push({ text: button.label, callback_data: button.action });
  }

  const keyboard = {
    inline_keyboard: [buttonRow],
  };

  return keyboard;
}

function buildTextMessage(message, keyboard, chatId) {
  const body = {
    chat_id: chatId,
    text: message,
    reply_markup: keyboard,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  return body;
}

function buildPhotoMessage(photo, caption, keyboard, chatId) {
  const body = {
    chat_id: chatId,
    reply_markup: keyboard,
    caption,
    photo,
  };

  return body;
}

function buildAudioMessage(audio, caption, keyboard, chatId) {
  const body = {
    chat_id: chatId,
    caption,
    reply_markup: keyboard,
    audio,
  };

  return body;
}

function buildVideoMessage(video, caption, keyboard, chatId) {
  const body = {
    chat_id: chatId,
    caption,
    reply_markup: keyboard,
    video,
  };

  return body;
}

function buildMenu(menuFile) {
  const lines = fs.readFileSync(menuFile).toString().split("\n");

  const menuitems = [];

  for (const i in lines) {
    const items = lines[i].split(" - ");

    if (items.length === 2) {
      const command = items[0];
      const description = items[1];

      const newCommand = { command, description };
      menuitems.push(newCommand);
    }
  }

  const body = { commands: menuitems };

  return body;
}

function buildConfig() {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  return config;
}

async function sendPayload(body, endpoint, telegramToken) {
  const baseUrl = "https://api.telegram.org/bot";
  const fullUrl = `${baseUrl}${telegramToken}/${endpoint}`;
  const config = buildConfig();

  return await axios.post(fullUrl, body, config);
}

async function sendMessage(message, keyboard, chatId, telegramToken) {
  const body = buildTextMessage(message, keyboard, chatId);
  const endpoint = "sendMessage";

  return sendPayload(body, endpoint, telegramToken);
}

async function sendMediaMessage(message, keyboard, chatId, telegramToken) {
  // Check if we have a caption
  const replys = await buildMessage.mediaSplitter([message]);

  const media = replys[0];
  let caption = "";
  if (replys.length > 1) {
    caption = replys[1];
  }

  const extension = media.split(".").pop().toLowerCase();

  let body = {};
  let endpoint = "sendMessage";

  switch (extension) {
    case "png":
    case "jpg":
      body = buildPhotoMessage(media, caption, keyboard, chatId);
      endpoint = "sendPhoto";
      break;

    case "mp4":
      body = buildVideoMessage(media, caption, keyboard, chatId);
      endpoint = "sendVideo";
      break;

    case "mp3":
      body = buildAudioMessage(media, caption, keyboard, chatId);
      endpoint = "sendAudio";
      break;

    default:
      body = buildTextMessage(media, caption, keyboard, chatId);
      endpoint = "sendMessage";
      break;
  }

  return sendPayload(body, endpoint, telegramToken);
}

async function preProcess(response) {
  const formattedReply = response.replaceAll("<br/>", "\n");
  const replyMessages = await buildMessage.splitReply(formattedReply);

  return replyMessages;
}

async function send(message, chatId, telegramToken) {
  const { reply, buttons } = await buildMessage.splitButtons(message);
  const keyboard = buildKeyboard(buttons);

  if (buildMessage.isMediaMessage(reply)) {
    // Send a media message
    const response = await sendMediaMessage(
      reply,
      keyboard,
      chatId,
      telegramToken
    );

    return response;
  } else {
    // Send a text message
    const response = await sendMessage(reply, keyboard, chatId, telegramToken);

    return response;
  }
}

module.exports = { send, buildMenu, preProcess, sendPayload };

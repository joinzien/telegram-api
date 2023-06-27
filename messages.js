// SPDX-License-Identifier: MIT

"use strict";
const axios = require("axios");
const fs = require("fs");

const buildMessage = require("./buildMessage.js");

const messageMarkupStart = "[message|";
const messageMarkupSeparator = "|";
const messageMarkupEnd = "]";

const refreshMarkupStart = "[refresh|";
const refreshMarkupSeparator = "|";
const refreshMarkupEnd = "]";

function buildKeyboard(buttons) {
  const buttonGrid = [];
  let buttonRow = [];
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];

    if (button.label === "row" && button.action === "separator") {
      buttonGrid.push(buttonRow);
      buttonRow = [];
    } else {
      buttonRow.push({ text: button.label, callback_data: button.action });
    }
  }

  if (buttonRow.length > 0) {
    buttonGrid.push(buttonRow);
  }

  const keyboard = {
    inline_keyboard: buttonGrid,
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

  return axios.post(fullUrl, body, config);
}

async function sendMessage(message, keyboard, chatId, telegramToken) {
  const body = buildTextMessage(message, keyboard, chatId);
  const endpoint = "sendMessage";

  return sendPayload(body, endpoint, telegramToken);
}

async function sendMediaMessage(message, keyboard, chatId, telegramToken) {
  // Check if we have a caption
  const replys = buildMessage.mediaSplitter([message]);

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

function removeTag(message, tagStart, tagEnd) {
  const separatorStart = message.indexOf(tagStart);

  if (separatorStart !== -1) {
    const startOfMessage = message.slice(0, separatorStart);

    const separatorMid = separatorStart + tagStart.length;
    const restOfMessage = message.slice(separatorMid);
    const separatorEnd = restOfMessage.indexOf(tagEnd);
    const endOfMessage = restOfMessage.slice(separatorEnd + 1);

    const filteredMessage = startOfMessage + endOfMessage;
    return filteredMessage;
  }

  return message;
}

function preProcess(response) {
  const noMessageTag = removeTag(
    response,
    messageMarkupStart,
    messageMarkupEnd
  );
  const noRefreshTag = removeTag(
    noMessageTag,
    refreshMarkupStart,
    refreshMarkupEnd
  );

  const formattedReply = noRefreshTag.replaceAll("<br/>", "\n");
  const replyMessages = buildMessage.splitReply(formattedReply);

  return replyMessages;
}

async function send(message, chatId, telegramToken) {
  const { reply, buttons } = buildMessage.splitButtons(message);
  const keyboard = buildKeyboard(buttons);

  if (reply.length === 0) {
    return "No message body";
  }

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

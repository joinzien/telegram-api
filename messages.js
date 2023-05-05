// SPDX-License-Identifier: MIT

"use strict";
const axios = require("axios");
const fs = require("fs");

const buildMessage = require("./buildMessage.js");

function buildKeyboard(buttons, hideKeyboard) {
  if (buttons.length <= 0) {
    if (hideKeyboard) {
      const keyboard = {
        remove_keyboard: true,
      };

      return keyboard;
    } else {
      const keyboard = {};

      return keyboard;
    }
  }

  const buttonsRow = [];

  for (let i = 0; i < buttons.length; i++) {
    buttonsRow.push(buttons[i]);
  }

  const buttonGrid = [buttonsRow];

  const keyboard = {
    keyboard: buttonGrid,
    resize_keyboard: true,
    one_time_keyboard: true,
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

function buildPhotoMessage(photo, keyboard, chatId) {
  const body = {
    chat_id: chatId,
    reply_markup: keyboard,
    photo,
  };

  return body;
}

function buildAudioMessage(audio, keyboard, chatId) {
  const body = {
    chat_id: chatId,
    reply_markup: keyboard,
    audio,
  };

  return body;
}

function buildVideoMessage(video, keyboard, chatId) {
  const body = {
    chat_id: chatId,
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

async function sendMediaMessage(media, keyboard, chatId, telegramToken) {
  const extension = media.split(".").pop().toLowerCase();

  let body = {};
  let endpoint = "sendMessage";

  switch (extension) {
    case "png":
    case "jpg":
      body = buildPhotoMessage(media, keyboard, chatId);
      endpoint = "sendPhoto";
      break;

    case "mp4":
      body = buildVideoMessage(media, keyboard, chatId);
      endpoint = "sendVideo";
      break;

    case "mp3":
      body = buildAudioMessage(media, keyboard, chatId);
      endpoint = "sendAudio";
      break;

    default:
      body = buildTextMessage(media, keyboard, chatId);
      endpoint = "sendMessage";
      break;
  }

  return sendPayload(body, endpoint, telegramToken);
}

async function send(message, buttons, chatId, hideKeyboard, telegramToken) {
  const keyboard = buildKeyboard(buttons, hideKeyboard);

  if (buildMessage.isMediaMessage(message)) {
    // Send a media message
    const response = await sendMediaMessage(
      message,
      keyboard,
      chatId,
      telegramToken
    );

    return response;
  } else {
    // Send a text message
    const response = await sendMessage(
      message,
      keyboard,
      chatId,
      telegramToken
    );

    return response;
  }
}

module.exports = { send, buildMenu, sendPayload };

// SPDX-License-Identifier: MIT

"use strict";
const fs = require("fs");

const buildMessage = require("./build.js");

const messageMarkupStart = "[message|";
const messageMarkupEnd = "]";

const refreshMarkupStart = "[refresh|";
const refreshMarkupEnd = "]";

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

async function sendMessage(message, keyboard, chatId, telegramToken) {
  const body = buildTextMessage(message, keyboard, chatId);
  const endpoint = "sendMessage";

  return buildMessage.sendPayload(body, endpoint, telegramToken);
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

  return buildMessage.sendPayload(body, endpoint, telegramToken);
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

function doesReplyContainsTag(reply, tagStart) {
  const separatorStart = reply.indexOf(tagStart);

  return separatorStart !== -1;
}

function extractName(reply, tagStart, tagEnd) {
  const nameStart = reply.indexOf(tagStart) + tagStart.length;
  const nameEnd = reply.indexOf(tagEnd);
  const stateName = reply.substring(nameStart, nameEnd);

  return stateName;
}

function preProcess(response) {
  const noMessageTag = removeTag(
    response,
    messageMarkupStart,
    messageMarkupEnd,
  );
  const noRefreshTag = removeTag(
    noMessageTag,
    refreshMarkupStart,
    refreshMarkupEnd,
  );

  const formattedReply = noRefreshTag.replaceAll("<br/>", "\n");
  const replyMessages = buildMessage.splitReply(formattedReply);

  return replyMessages;
}

async function send(message, chatId, telegramToken) {
  const { reply, buttons } = buildMessage.splitButtons(message);
  const keyboard = buildMessage.buildKeyboard(buttons);

  if (reply.length === 0) {
    return "No message body";
  }

  if (buildMessage.isMediaMessage(reply)) {
    // Send a media message
    const response = await sendMediaMessage(
      reply,
      keyboard,
      chatId,
      telegramToken,
    );

    return response;
  } else {
    // Send a text message
    const response = await sendMessage(reply, keyboard, chatId, telegramToken);

    return response;
  }
}

module.exports = {
  send,
  buildMenu,
  preProcess,
  doesReplyContainsTag,
  extractName,
  messageMarkupStart,
  messageMarkupEnd,
  refreshMarkupStart,
  refreshMarkupEnd,
};

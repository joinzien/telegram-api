// SPDX-License-Identifier: MIT

"use strict";

const buildMessage = require("./build.js");

function buildTextMessage(message, keyboard, chatId, messageId) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text: message,
    reply_markup: keyboard,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  return body;
}

function buildPhotoMessage(photo, caption, keyboard, chatId, messageId) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: keyboard,
    caption,
    photo,
  };

  return body;
}

function buildAudioMessage(audio, caption, keyboard, chatId, messageId) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    caption,
    reply_markup: keyboard,
    audio,
  };

  return body;
}

function buildVideoMessage(video, caption, keyboard, chatId, messageId) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    caption,
    reply_markup: keyboard,
    video,
  };

  return body;
}

async function editMessage(
  message,
  keyboard,
  chatId,
  messageId,
  telegramToken
) {
  const body = buildTextMessage(message, keyboard, chatId, messageId);
  const endpoint = "editMessageText";

  return buildMessage.sendPayload(body, endpoint, telegramToken);
}

async function editMediaMessage(
  message,
  keyboard,
  chatId,
  messageId,
  telegramToken
) {
  // Check if we have a caption
  const replys = buildMessage.mediaSplitter([message]);

  const media = replys[0];
  let caption = "";
  if (replys.length > 1) {
    caption = replys[1];
  }

  const extension = media.split(".").pop().toLowerCase();

  let body = {};
  let endpoint = "editMessageText";

  switch (extension) {
    case "png":
    case "jpg":
      body = buildPhotoMessage(media, caption, keyboard, chatId, messageId);
      endpoint = "editMessageText";
      break;

    case "mp4":
      body = buildVideoMessage(media, caption, keyboard, chatId, messageId);
      endpoint = "editMessageText";
      break;

    case "mp3":
      body = buildAudioMessage(media, caption, keyboard, chatId, messageId);
      endpoint = "editMessageText";
      break;

    default:
      body = buildTextMessage(media, caption, keyboard, chatId, messageId);
      endpoint = "editMessageText";
      break;
  }

  return buildMessage.sendPayload(body, endpoint, telegramToken);
}

async function send(message, chatId, messageId, telegramToken) {
  const { reply, buttons } = buildMessage.splitButtons(message);
  const keyboard = buildMessage.buildKeyboard(buttons);

  if (reply.length === 0) {
    return "No message body";
  }

  if (buildMessage.isMediaMessage(reply)) {
    // Send a media message
    const response = await editMediaMessage(
      reply,
      keyboard,
      chatId,
      messageId,
      telegramToken
    );

    return response;
  } else {
    // Send a text message
    const response = await editMessage(
      reply,
      keyboard,
      chatId,
      messageId,
      telegramToken
    );

    return response;
  }
}

module.exports = {
  send,
};

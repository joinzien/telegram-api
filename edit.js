// SPDX-License-Identifier: MIT

"use strict";

const buildMessage = require("./build.js");

const parseMode = "HTML";

function buildTextMessage(message, keyboard, chatId, messageId) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text: message,
    reply_markup: keyboard,
    parse_mode: parseMode,
    disable_web_page_preview: true,
  };

  return body;
}

function buildMediaMessage(type, media, caption, keyboard, chatId, messageId) {
  const mediaPayload = {
    type,
    media,
    caption,
  };

  const body = {
    chat_id: chatId,
    message_id: messageId,
    media: mediaPayload,
    reply_markup: keyboard,
    parse_mode: parseMode,
  };

  return body;
}

async function editMessage(
  message,
  keyboard,
  chatId,
  messageId,
  telegramToken,
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
  telegramToken,
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
  const endpoint = "editMessageMedia";

  switch (extension) {
    case "png":
    case "jpg":
      body = buildMediaMessage(
        "photo",
        media,
        caption,
        keyboard,
        chatId,
        messageId,
      );
      break;

    case "mp4":
      body = buildMediaMessage(
        "video",
        media,
        caption,
        keyboard,
        chatId,
        messageId,
      );
      break;

    case "mp3":
      body = buildMediaMessage(
        "audio",
        media,
        caption,
        keyboard,
        chatId,
        messageId,
      );
      break;

    default:
      body = buildTextMessage(media, caption, keyboard, chatId, messageId);
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
      telegramToken,
    );

    return response;
  } else {
    // Send a text message
    const response = await editMessage(
      reply,
      keyboard,
      chatId,
      messageId,
      telegramToken,
    );

    return response;
  }
}

module.exports = {
  send,
};

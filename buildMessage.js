// Copyright Zien X Ltd

"use strict";

const pageBreakMarkup = "[pagebreak]";

const buttonMarkupStart = "[button|";
const buttonMarkupSeparator = "|";
const buttonMarkupEnd = "]";

const urlMarkup = "http";

function isMediaMessage(message) {
  const containsUrl = message.includes(urlMarkup);

  return containsUrl
}

async function breakApartMedia(message) {
  const containsUrl = message.includes(urlMarkup);

  if (containsUrl !== true) {
    const splitMessage = [message];
    return splitMessage;
  }

  const splitMessage = [];

  // Break off the front part of the message
  const mediaStart = message.indexOf(urlMarkup);
  const frontString = message.slice(0, mediaStart).trimEnd();
  if (frontString.length > 0) {
    splitMessage.push(frontString);
  }

  // Break off the media
  const restOfString = message.slice(mediaStart);
  const mediaEnd = restOfString.indexOf(" ");

  if (mediaEnd === -1) {
    splitMessage.push(restOfString);
  } else {
    const mediaMessage = restOfString.slice(0, mediaEnd);
    splitMessage.push(mediaMessage);

    // break off the end part of the message
    const endString = restOfString.slice(mediaEnd).trim();
    if (endString.length > 0) {
      splitMessage.push(endString);
    }
  }

  return splitMessage;
}

async function mediaSplitter(responses) {
  const replyMessages = [];

  for (let i = 0; i < responses.length; i++) {
    const message = responses[i];

    const splitMessage = await breakApartMedia(message);

    for (let i = 0; i < splitMessage.length; i++) {
      const reply = splitMessage[i];
      replyMessages.push(reply);
    }
  }

  return replyMessages;
}

async function splitReply(reply) {
  // Split based on page breaks
  const pageSplits = reply.split(pageBreakMarkup);

  // Split out the media messages
  const replyMessages = mediaSplitter(pageSplits);

  return replyMessages;
}

async function splitButtons(response) {
  const buttons = [];
  let reply = "";

  let content = response;
  while (content.length) {
    const buttonStart = content.indexOf(buttonMarkupStart);

    if (buttonStart === -1) {
      reply = reply + content;
      content = "";
    } else {
      const frontOfString = content.slice(0, buttonStart);
      reply = reply + frontOfString;

      const restOfString = content.slice(buttonStart);

      const buttonEnd = restOfString.indexOf(buttonMarkupEnd);
      const rawButtonText = restOfString.slice(1, buttonEnd);
      const buttonSeparator = rawButtonText.indexOf(buttonMarkupSeparator);
      const buttonText = rawButtonText.slice(buttonSeparator + 1, buttonEnd);
      buttons.push(buttonText);

      content = restOfString.slice(buttonEnd + 1);
    }
  }

  return { reply, buttons };
}

module.exports = { isMediaMessage, splitReply, splitButtons };
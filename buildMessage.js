// SPDX-License-Identifier: MIT

"use strict";

const pageBreakMarkup = "[pagebreak]";

const buttonMarkupStart = "[button|";
const buttonMarkupSeparator = "|";
const buttonMarkupEnd = "]";

const separatorMarkup = "[row]";

const urlMarkup = "http";
const linkMarkup = "<a href";

function isMediaMessage(message) {
  const urlCount = message.split(urlMarkup).length - 1;
  const linkCount = message.split(linkMarkup).length - 1;
  const mediaUrlCount = urlCount - linkCount;

  if (urlCount === 0) {
    // No URLs
    return false;
  } else if (mediaUrlCount > 0) {
    // At least one more URL than links, so this is a media message
    return true;
  }

  // The same number of URLs and links, so they are all links
  return false;
}

function breakApartMedia(message) {
  const containsUrl = message.includes(urlMarkup);

  if (containsUrl !== true) {
    const splitMessage = [message];
    return splitMessage;
  }

  const urlCount = message.split(urlMarkup).length - 1;
  const linkCount = message.split(linkMarkup).length - 1;

  if (urlCount === linkCount) {
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

function mediaSplitter(responses) {
  const replyMessages = [];

  for (let i = 0; i < responses.length; i++) {
    const message = responses[i];

    const splitMessage = breakApartMedia(message);

    for (let i = 0; i < splitMessage.length; i++) {
      const reply = splitMessage[i];
      replyMessages.push(reply);
    }
  }

  return replyMessages;
}

function splitReply(reply) {
  // Split based on page breaks
  const pageSplits = reply.split(pageBreakMarkup);

  return pageSplits;
}

function parseButton(rawButtonText) {
  const buttonSeparator = rawButtonText.indexOf(buttonMarkupSeparator);
  const buttonValues = rawButtonText.slice(buttonSeparator + 1);

  const separator = buttonValues.indexOf(buttonMarkupSeparator);
  const buttonEnd = buttonValues.indexOf(buttonMarkupEnd);

  const buttonLabel = buttonValues.slice(0, separator);
  const buttonAction = buttonValues.slice(separator + 1, buttonEnd);

  return { label: buttonLabel, action: buttonAction };
}

function splitButtons(response) {
  const buttons = [];
  let reply = "";

  let content = response;
  while (content.length) {
    const separatorStart = content.indexOf(separatorMarkup);
    const buttonStart = content.indexOf(buttonMarkupStart);

    const bothFound =
      separatorStart !== -1 &&
      buttonStart !== -1 &&
      separatorStart < buttonStart;
    const onlySeparatorFound = separatorStart !== -1 && buttonStart === -1;
    const separatorFound = bothFound || onlySeparatorFound;
    const buttonFound = buttonStart !== -1;

    if (separatorFound) {
      const separatorEnd = separatorStart + separatorMarkup.length;
      content = content.slice(separatorEnd);

      const row = { label: "row", action: "separator" };
      buttons.push(row);
    } else if (buttonFound) {
      const frontOfString = content.slice(0, buttonStart);
      reply = reply + frontOfString;

      const restOfString = content.slice(buttonStart);
      const buttonEnd = restOfString.indexOf(buttonMarkupEnd);
      content = restOfString.slice(buttonEnd + 1);

      const rawButtonText = restOfString.slice(0, buttonEnd + 1);
      const button = parseButton(rawButtonText);
      buttons.push(button);
    } else {
      reply = reply + content;
      content = "";
    }
  }

  return { reply, buttons };
}

module.exports = { isMediaMessage, splitReply, splitButtons, mediaSplitter };

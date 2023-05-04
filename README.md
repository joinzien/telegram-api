# Telegram API
A simple API for interacting with Telegram chats.

## Markup supported

- <br/> Line break
- [pagebreak] Allow multi-message responses
- [button|text] Add a quick reply button
- Links/Media Just include the URL
- S3 set MP3s to `audio/mp3`, WhatsApp accepted `audio/mpeg`, so you will need to manually set the filetype. 
- <strong>bold</strong>
- <em>italic</em>
- <ins>underline</ins>
- <strike>strikethrough</strike>
- <a href="http://www.example.com/">inline URL</a>
- <code>inline fixed-width code</code>
- <pre>pre-formatted fixed-width code block</pre>
- <pre><code class="language-python">pre-formatted fixed-width code block written in the Python programming language</code></pre>

## API Usage

### Create a bot
`const chatbot = new telegram.Telegram(telegramToken)`

### Parse a Message
`const { user, message } = await chatbot.parse(rawMessage)`

### Send a Message
`const result = await chatbot.send(user, message)`
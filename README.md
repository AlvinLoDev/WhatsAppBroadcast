# WhatsAppBroadcast

Simple WhatsApp broadcast script built with Node.js and `whatsapp-web.js`.

This project sends a predefined message to phone numbers listed in `numbers.txt` in safe batches with delays to reduce spam-like behavior.

## Features

- WhatsApp session persistence using `LocalAuth`
- Reads targets from `numbers.txt`
- Normalizes phone numbers automatically
- Sends messages in batches
- Randomized delay between messages
- Retry on failed sends
- Stops automatically after repeated failures
- Logs success/failure to `broadcast.log`

## Requirements

- Node.js 18+
- WhatsApp account that can be used via WhatsApp Web
- Chromium/Chrome available for Puppeteer

## Installation

```bash
npm install
```

## Usage

1. Update the phone numbers in `numbers.txt`.
2. Edit the message in `index.js` if needed.
3. Run the script:

```bash
node index.js
```

4. Scan the QR code when prompted.
5. Wait until the script finishes sending all batches.

## Example `numbers.txt`

```txt
628979728413
628123456789
628987654321
```

## Important Notes

- Use this only for legitimate and authorized messaging.
- Avoid sending the same message too aggressively.
- WhatsApp may limit or block suspicious activity.
- Keep message content respectful and compliant with applicable rules.

## Project Structure

```txt
.
├── index.js
├── numbers.txt
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── session/
└── broadcast.log
```

## License

This project is provided as-is for educational and internal use.

# syzyGyPT

This is a minimal Electron implementation of [SmartGPT](https://www.youtube.com/watch?v=wVzuvf9D9BU) as discussed by [AI Explained](https://www.youtube.com/@ai-explained-) on youtube.

Demo: [syzyGyPT](https://perryman.tech/syzyGyPT)
Please be aware this framework can use a lot of tokens quickly, and may cost more than you expect.

**Note**: This framework can consume a large number of tokens quickly and may cost more than you expect.

## Features
* Client-side API calls through index.html and renderer.js
* Fetch requests for sending data
* Option to save API keys in local storage (be cautious with key trust)
* Basic release (fine-tune options not yet implemented)

## Usage

### Web App

```bash
# Clone this repository
git clone https://github.com/Perryman/syzyGyPT
# Go into the repository
cd syzyGyPT
# Start a web server of your choice, e.g. Python
python -m http.server 8080
# Browse to the website
http://localhost:8080
```

### Standalone Electron App

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer.

```bash
# Clone this repository
git clone https://github.com/Perryman/syzyGyPT
# Go into the repository
cd syzyGyPT
# Install dependencies
npm install
# Run the app
npm start
```
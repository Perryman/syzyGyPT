/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

const answerMessage =
  "Answer: Let's work this out in a step by step way to be sure we have the right answer.";
const researcherMessage =
  "You are a researcher tasked with investigating the 3 response options provided. List the flaws and faulty logic of each answer option. Let's work this out in a step by step way to be sure we have all the errors:";
const resolverMessage =
  "You are a resolver tasked with 1) finding which of the 3 answer options the researcher thought was best 2) improving that answer, and 3) Printing the improved answer in full. Let's work this out in a step by step way to be sure we have the right answer:";

class Renderer {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.controller = new AbortController();
  }

  async makeApiCall(messages, model) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
      signal: this.controller.signal,
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(
        "message:" +
          data.error.message +
          "\n" +
          "type:" +
          data.error.type +
          "\n" +
          "param:" +
          data.error.param +
          "\n" +
          "code:" +
          data.error.code
      );
    }

    return data.choices[0].message.content;
  }

  async getOutputs(userInput, selectedModel) {
    const question = `Question. ${userInput} ${answerMessage}}`;
    const messages = [{ role: "user", content: question }];

    const outputPromises = [
      this.makeApiCall(messages, selectedModel),
      this.makeApiCall(messages, selectedModel),
      this.makeApiCall(messages, selectedModel),
    ];

    return await Promise.all(outputPromises);
  }

  async getReflectionOutput(userInput, outputs, selectedModel) {
    const question = `Question. ${userInput} ${answerMessage}}`;
    outputs = outputs.map((output, index) => {
      return `Answer Option ${index + 1}: ${output}`;
    });

    const researcherPrompt =
      userInput + "\n\n" + outputs.join("\n") + "\n\n" + researcherMessage;

    const messages = [
      { role: "user", content: question },
      { role: "assistant", content: outputs.join("\n") },
      { role: "user", content: researcherPrompt },
    ];

    return await this.makeApiCall(messages, selectedModel);
  }

  async getFinalOutput(userInput, outputs, reflectionOutput, selectedModel) {
    const question = `Question. ${userInput}`;
    outputs = outputs.map((output, index) => {
      return `Answer Option ${index + 1}: ${output}`;
    });

    const researcherPrompt =
      userInput + "\n\n" + outputs.join("\n") + researcherMessage;

    const messages = [
      { role: "user", content: question },
      { role: "assistant", content: outputs.join("\n") },
      { role: "user", content: researcherPrompt },
      { role: "assistant", content: reflectionOutput },
      { role: "user", content: resolverMessage },
    ];

    return await this.makeApiCall(messages, selectedModel);
  }
}

async function handleProcess() {
  try {
    showProcessingIndicator("Processing...", 5);
    clearTextFields();

    const apiKey = document.getElementById("api-key").value;
    const renderer = new Renderer(apiKey);
    const userInput = document.getElementById("user-input").value;
    const selectedModel = document.getElementById("model-select").value;

    document.getElementById("cancel").addEventListener("click", () => {
      renderer.controller.abort();
      renderer.controller = new AbortController();
    });

    const outputs = await renderer.getOutputs(userInput, selectedModel);

    updateProcessingIndicator(2);

    for (let i = 0; i < 3; i++) {
      document.getElementById(`output-${i + 1}`).value = outputs[i];
    }

    const reflectionOutput = await renderer.getReflectionOutput(
      userInput,
      outputs,
      selectedModel
    );
    document.getElementById("reflection-output").value = reflectionOutput;

    updateProcessingIndicator(1);

    const finalOutput = await renderer.getFinalOutput(
      userInput,
      outputs,
      reflectionOutput,
      selectedModel
    );

    removeProcessingIndicator();

    document.getElementById("final-output").value = finalOutput;

    document.getElementById("cancel").addEventListener("click", () => {
      renderer.controller.abort();
      renderer.controller = new AbortController();
    });
  } catch (error) {
    removeProcessingIndicator();
    showError(error.message);
  }
}

document.getElementById("api-key").value = localStorage.getItem("apiKey");

// If the user has previously checked the "Remember me" checkbox, then check the checkbox
if (localStorage.getItem("apiKey")) {
  document.getElementById("remember-me").checked = true;
}

document.getElementById("submit").addEventListener("click", handleProcess);

document.getElementById("remember-me").addEventListener("change", function () {
  if (this.checked) {
    localStorage.setItem("apiKey", document.getElementById("api-key").value);
  } else {
    localStorage.removeItem("apiKey");
  }
});

// Now create a function to save the API key if the text input changes
document.getElementById("api-key").addEventListener("change", function () {
  if (document.getElementById("remember-me").checked) {
    localStorage.setItem("apiKey", this.value);
  }
});

function showError(message) {
  const errorContainer = document.createElement("div");
  errorContainer.className = "error-container";

  const errorMessage = document.createElement("div");
  errorMessage.className = "error-message";
  errorMessage.innerText = message;

  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.innerText = "x";
  closeButton.onclick = function () {
    document.body.removeChild(errorContainer);
  };

  errorContainer.appendChild(errorMessage);
  errorContainer.appendChild(closeButton);

  document.body.appendChild(errorContainer);
}

function showProcessingIndicator(message, count) {
  const indicatorContainer = document.createElement("div");
  indicatorContainer.className = "indicator-container";
  indicatorContainer.id = "indicator-container";

  const indicatorMessage = document.createElement("div");
  indicatorMessage.className = "indicator-message";
  indicatorMessage.innerText = `${message} (Pending Requests: ${count})`;

  indicatorContainer.appendChild(indicatorMessage);
  document.body.appendChild(indicatorContainer);
}

function updateProcessingIndicator(count) {
  const indicatorContainer = document.getElementById("indicator-container");
  const indicatorMessage =
    indicatorContainer.querySelector(".indicator-message");
  indicatorMessage.innerText = `Processing... (Pending Requests: ${count})`;
}

function removeProcessingIndicator() {
  const indicatorContainer = document.getElementById("indicator-container");
  document.body.removeChild(indicatorContainer);
}

function clearTextFields() {
  document.getElementById("reflection-output").value = "";
  document.getElementById("final-output").value = "";
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`output-${i}`).value = "";
  }
}

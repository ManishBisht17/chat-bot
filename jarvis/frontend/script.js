const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const chatWindow = document.getElementById("chat-window");

let generatedChoices = [];
let waitingForSelection = false;
let selectedNumbers = [];

// Initialize marked for markdown parsing
marked.setOptions({
  breaks: true,
  gfm: true,
  headerIds: false,
  mangle: false
});

// Helper function to sanitize HTML content
const sanitizeHTML = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

userInput.addEventListener("input", () => {
  sendBtn.disabled = !userInput.value.trim();
});

userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !sendBtn.disabled) {
    sendBtn.click();
  }
});

// Enhanced function to append messages to the chat window
const appendMessage = (message, sender, isMarkdown = false) => {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  if (isMarkdown && sender === 'bot-message') {
    // Parse markdown for bot messages that contain markdown
    messageDiv.classList.add('markdown-content');
    const sanitizedMessage = sanitizeHTML(message);
    messageDiv.innerHTML = marked.parse(sanitizedMessage);
  } else {
    // Regular text for user messages and non-markdown bot messages
    messageDiv.textContent = message;
  }

  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

// Function to display generated ideas
const displayChoices = (choices) => {
  const choiceContainer = document.createElement("div");
  choiceContainer.className = "choice-container";

  choices.forEach((choice, index) => {
    const choiceDiv = document.createElement("div");
    choiceDiv.className = "choice";
    
    // Add choice number and hover effect
    const numberSpan = document.createElement("span");
    numberSpan.className = "choice-number";
    numberSpan.textContent = `${index + 1}. `;
    
    const textSpan = document.createElement("span");
    textSpan.className = "choice-text";
    textSpan.textContent = choice.replace(/^\d+\.\s*/, '');
    
    choiceDiv.appendChild(numberSpan);
    choiceDiv.appendChild(textSpan);
    choiceContainer.appendChild(choiceDiv);
  });

  chatWindow.appendChild(choiceContainer);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  appendMessage(
    "Please choose one idea or more ideas by typing their numbers (e.g., 1 and 2).",
    "bot-message"
  );
  waitingForSelection = true;
  selectedNumbers = [];
};

// Function to handle idea selection from user input
const handleUserInput = async () => {
  const message = userInput.value.trim().toLowerCase();
  
  if (waitingForSelection) {
    // Handle single number input
    if (/^\d+$/.test(message)) {
      const selectedNumber = parseInt(message);
      if (selectedNumber >= 1 && selectedNumber <= 3) {
        if (selectedNumbers.includes(selectedNumber)) {
          appendMessage(
            "You've already selected this idea. Choose a different one.",
            "bot-message"
          );
        } else if (selectedNumbers.length >= 2) {
          appendMessage(
            "You can only select up to 2 ideas.",
            "bot-message"
          );
        } else {
          selectedNumbers.push(selectedNumber);
          userInput.value = "";
          await selectIdeas(selectedNumbers);
        }
      } else {
        appendMessage(
          "Please select a number between 1 and 3.",
          "bot-message"
        );
      }
    }
    // Handle "number and number" format
    else if (message.includes('and')) {
      const numbers = message.split('and')
        .map(num => parseInt(num.trim()))
        .filter(num => !isNaN(num));
      
      if (numbers.length === 2) {
        if (numbers.every(num => num >= 1 && num <= 3)) {
          if (numbers[0] === numbers[1]) {
            appendMessage(
              "Please select two different numbers.",
              "bot-message"
            );
          } else {
            selectedNumbers = numbers;
            userInput.value = "";
            await selectIdeas(selectedNumbers);
          }
        } else {
          appendMessage(
            "Please select numbers between 1 and 3.",
            "bot-message"
          );
        }
      } else {
        appendMessage(
          "Please use format like '1 and 2' or just enter a single number.",
          "bot-message"
        );
      }
    }
    // Handle other inputs as new prompts
    else if (message.length > 0) {
      waitingForSelection = false;
      selectedNumbers = [];
      await handleNewPrompt(message);
    }
  } else {
    await handleNewPrompt(message);
  }
};

// Function to handle new prompts using axios
const handleNewPrompt = async (message) => {
  if (!message) return appendMessage("First enter any prompt", "bot-message");

  appendMessage(message, "user-message");
  sendBtn.disabled = true;

  try {
    const response = await axios.post("http://localhost:8080/ai/query", { message });
    generatedChoices = response.data.choices;
    displayChoices(generatedChoices);
  } catch (error) {
    appendMessage(
      `Error: ${error.response?.data?.message || "Unable to connect to the server."}`,
      "bot-message"
    );
  } finally {
    userInput.value = "";
    sendBtn.disabled = false;
    userInput.focus();
  }
};

// Enhanced function to handle multiple idea selections using axios
const selectIdeas = async (selectedNumbers) => {
  try {
    const response = await axios.post("http://localhost:8080/ai/query", {
      selectedIdeas: selectedNumbers,
      choices: generatedChoices
    });

    // Display the detailed suggestion(s) with markdown formatting
    response.data.detailedSuggestions.forEach((suggestion) => {
      // Display the selected idea without markdown
      appendMessage(`Selected Idea: ${suggestion.idea}`, "bot-message");
      
      // Display the detailed suggestion with markdown formatting
      appendMessage(suggestion.suggestion, "bot-message", true);
    });

    // Reset selection state after displaying suggestions
    waitingForSelection = false;
  } catch (error) {
    appendMessage(
      `Error: ${error.response?.data?.message || "Unable to connect to the server."}`,
      "bot-message"
    );
  }
};

// Handle click events for the send button
sendBtn.addEventListener("click", handleUserInput);

// Add loading indicator functions
const showLoadingIndicator = () => {
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "loading-indicator";
  loadingDiv.innerHTML = "...";
  chatWindow.appendChild(loadingDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

const removeLoadingIndicator = () => {
  const loadingIndicator = chatWindow.querySelector(".loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.remove();
  }
};
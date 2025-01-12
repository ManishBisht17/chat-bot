const sendBtn = document.getElementById("send-btn");
const userInput = document.getElementById("user-input");
const chatWindow = document.getElementById("chat-window");

let generatedChoices = [];

// Enable/disable send button based on input
userInput.addEventListener("input", () => {
  sendBtn.disabled = !userInput.value.trim();
});

// Handle Enter key
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !sendBtn.disabled) {
    sendBtn.click();
  }
});

// Function to append messages to the chat window
const appendMessage = (message, sender) => {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;
  messageDiv.textContent = message;
  chatWindow.appendChild(messageDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

// Function to display generated ideas with selection options
const displayChoices = (choices) => {
  const choiceContainer = document.createElement("div");
  choiceContainer.className = "choice-container";

  choices.forEach((choice, index) => {
    const choiceDiv = document.createElement("div");
    choiceDiv.className = "choice";

    // Add choice text
    const choiceText = document.createElement("span");
    choiceText.textContent = `${index + 1}. ${choice}`;
    choiceDiv.appendChild(choiceText);

    // Add a button for selection
    const selectBtn = document.createElement("button");
    selectBtn.textContent = "Select";
    selectBtn.className = "select-btn";
    selectBtn.addEventListener("click", () => selectIdea(index + 1));
    choiceDiv.appendChild(selectBtn);

    choiceContainer.appendChild(choiceDiv);
  });

  chatWindow.appendChild(choiceContainer);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  
  // Prompt the user to select an idea
  appendMessage("Please choose one or more ideas by clicking the Select button.", "bot-message");
};

// Send button click event to generate ideas
sendBtn.addEventListener("click", async () => {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage(message, "user-message");
  sendBtn.disabled = true;

  try {
    const response = await fetch("http://localhost:8080/ai/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Failed to get a response from the server.");
    }

    const data = await response.json();
    generatedChoices = data.choices;
    displayChoices(generatedChoices);

  } catch (error) {
    appendMessage("Error: Unable to connect to the server.", "bot-message");
  } finally {
    userInput.value = "";
    sendBtn.disabled = false;
    userInput.focus();
  }
});

// Function to handle idea selection
const selectIdea = async (selectedNumber) => {
  try {
    const response = await fetch("http://localhost:8080/ai/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        selectedIdeas: [selectedNumber],
        choices: generatedChoices,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get a response from the server.");
    }

    const data = await response.json();
    
    // Display the detailed suggestion(s)
    data.detailedSuggestions.forEach((suggestion) => {
      appendMessage(`Idea: ${suggestion.idea}`, "bot-message");
      appendMessage(`Suggestion: ${suggestion.suggestion}`, "bot-message");
    });

  } catch (error) {
    appendMessage("Error: Unable to connect to the server.", "bot-message");
  }
};
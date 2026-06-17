const todoInput = document.getElementById("todo-input");
const addButton = document.getElementById("add-button");
const todoList = document.getElementById("todo-list");
const alertBox = document.getElementById("alert-box");
const alertClose = document.getElementById("alert-close");
const summaryEmoji = document.getElementById("summary-emoji");
const summaryTitle = document.getElementById("summary-title");
const summaryMessage = document.getElementById("summary-message");
const historyToggle = document.getElementById("history-toggle");
const historySection = document.getElementById("history-section");
const historyList = document.getElementById("history-list");
const historyStorageKey = "dailyTodoHistory";

function getTodayKey() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });
}

function getCurrentCounts() {
  const totalCount = todoList.children.length;
  const remainingCount = todoList.querySelectorAll(
    ".todo-item:not(.is-completed)",
  ).length;
  const completedCount = totalCount - remainingCount;

  return {
    totalCount: totalCount,
    completedCount: completedCount,
    remainingCount: remainingCount,
  };
}

function getHistoryMessage(historyEntry) {
  if (historyEntry.totalTasks === 0) {
    return "🌱 A soft little reset day. Tomorrow can bloom beautifully.";
  }

  if (historyEntry.remainingTasks === 0) {
    return "👑 Everything got done today. That is main-character energy.";
  }

  if (historyEntry.completedTasks >= historyEntry.totalTasks - 1) {
    return "🌟 So close to a perfect streak. You did amazing today.";
  }

  if (historyEntry.completedTasks >= historyEntry.remainingTasks) {
    return "💖 Steady progress is still progress. You're doing great.";
  }

  return "🫶 A gentle start still counts. Keep going one task at a time.";
}

function getDailyHistory() {
  return JSON.parse(localStorage.getItem(historyStorageKey)) || {};
}

function saveDailyHistory(history) {
  localStorage.setItem(historyStorageKey, JSON.stringify(history));
}

function formatHistoryDate(dateKey) {
  const date = new Date(dateKey + "T00:00:00");

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderHistory() {
  const history = getDailyHistory();
  const historyEntries = Object.entries(history).sort(function (a, b) {
    return b[0].localeCompare(a[0]);
  });

  historyList.innerHTML = "";

  if (historyEntries.length === 0) {
    const emptyCard = document.createElement("div");
    emptyCard.className = "history-empty";
    emptyCard.textContent =
      "No daily history just yet. Finish a tiny task and your first card will appear here.";
    historyList.append(emptyCard);
    return;
  }

  historyEntries.forEach(function (entry) {
    const dateKey = entry[0];
    const historyEntry = entry[1];
    const card = document.createElement("article");
    const date = document.createElement("p");
    const stats = document.createElement("div");
    const completedStat = document.createElement("div");
    const remainingStat = document.createElement("div");
    const message = document.createElement("p");

    card.className = "history-item";
    date.className = "history-date";
    stats.className = "history-stats";
    completedStat.className = "history-stat";
    remainingStat.className = "history-stat";
    message.className = "history-message";

    date.textContent = formatHistoryDate(dateKey);
    completedStat.innerHTML =
      "<span>Completed</span><span>" +
      historyEntry.completedTasks +
      " / " +
      historyEntry.totalTasks +
      "</span>";
    remainingStat.innerHTML =
      "<span>Remaining</span><span>" +
      historyEntry.remainingTasks +
      "</span>";
    message.textContent = historyEntry.message;

    stats.append(completedStat);
    stats.append(remainingStat);
    card.append(date);
    card.append(stats);
    card.append(message);
    historyList.append(card);
  });
}

function saveTodayHistorySnapshot() {
  const counts = getCurrentCounts();
  const todayKey = getTodayKey();
  const history = getDailyHistory();

  history[todayKey] = {
    totalTasks: counts.totalCount,
    completedTasks: counts.completedCount,
    remainingTasks: counts.remainingCount,
    message: getHistoryMessage({
      totalTasks: counts.totalCount,
      completedTasks: counts.completedCount,
      remainingTasks: counts.remainingCount,
    }),
  };

  saveDailyHistory(history);
  renderHistory();
}

function refreshTodoView() {
  updateSummary();
  saveTodos();
  saveTodayHistorySnapshot();
}

function toggleHistorySection() {
  const isHidden = historySection.hasAttribute("hidden");

  if (isHidden) {
    historySection.removeAttribute("hidden");
    historyToggle.classList.add("is-history-active");
    historyToggle.setAttribute("aria-expanded", "true");
    renderHistory();
    return;
  }

  historySection.setAttribute("hidden", "");
  historyToggle.classList.remove("is-history-active");
  historyToggle.setAttribute("aria-expanded", "false");
}

function updateSummary() {
  const counts = getCurrentCounts();
  const totalCount = counts.totalCount;
  const remainingCount = counts.remainingCount;

  if (totalCount === 0) {
    summaryEmoji.textContent = "🐣";
    summaryTitle.textContent = "A Fresh Start!";
    summaryMessage.textContent = "Your adventure begins here ✨";
  } else if (totalCount > 0 && remainingCount === 0) {
    summaryEmoji.textContent = "👑";
    summaryTitle.textContent = "Quest Complete!";
    summaryMessage.textContent = "You earned today's victory 🏆✨";
  } else if (remainingCount >= 4) {
    summaryEmoji.textContent = "⚔️";
    summaryTitle.textContent = "Mission in Progress!";
    summaryMessage.textContent = ` ${remainingCount} tasks are waiting for you ⚔️✨`;
  } else if (remainingCount >= 2 && remainingCount <= 3) {
    summaryEmoji.textContent = "🌿";
    summaryTitle.textContent = "So Close!";
    summaryMessage.textContent = `Just ${remainingCount} tasks left before victory 🏆`;
  } else if (remainingCount === 1) {
    summaryEmoji.textContent = "😤";
    summaryTitle.textContent = "One last push!";
    summaryMessage.textContent = "Just 1 task left — you've got this 💪🔥";
  }
}

function saveTodos() {
  const todoItems = todoList.querySelectorAll(".todo-item");
  const todos = Array.from(todoItems).map(function (todoItem) {
    const text = todoItem.querySelector(".todo-text").textContent;
    const completed = todoItem.classList.contains("is-completed");
    return {
      text: text,
      completed: completed,
    };
  });
  localStorage.setItem("todos", JSON.stringify(todos));
}

function loadTodos() {
  const savedTodos = localStorage.getItem("todos");
  if (savedTodos) {
    const todos = JSON.parse(savedTodos);
    todos.forEach(function (todo) {
      const text = todo.text;
      const completed = todo.completed;

      const todoItem = createTodoItem(text, completed);
      todoList.append(todoItem);
    });
  }
}

function createTodoItem(text, completed) {
  const todoItem = document.createElement("article");
  todoItem.className = "todo-item";

  const todoMain = document.createElement("label");
  todoMain.className = "todo-main";

  const checkbox = document.createElement("input");
  todoMain.append(checkbox);

  checkbox.addEventListener("change", function () {
    if (checkbox.checked) {
      todoItem.classList.add("is-completed");
    } else {
      todoItem.classList.remove("is-completed");
    }
    refreshTodoView();
  });

  const checkboxUI = document.createElement("span");
  checkboxUI.className = "checkbox-ui";
  todoMain.append(checkboxUI);

  const todoText = document.createElement("span");
  todoText.className = "todo-text";
  todoText.textContent = text;
  todoMain.append(todoText);

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.textContent = "🗑";
  deleteButton.setAttribute("aria-label", "Delete task");
  todoItem.append(todoMain);
  todoItem.append(deleteButton);

  deleteButton.addEventListener("click", function () {
    todoItem.remove();
    refreshTodoView();
  });

  checkbox.type = "checkbox";
  checkbox.checked = completed;
  if (completed === true) {
    todoItem.classList.add("is-completed");
  }
  return todoItem;
}

todoInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addButton.click();
  }
});

addButton.addEventListener("click", function () {
  const taskName = todoInput.value.trim();
  if (taskName === "") {
    alertBox.style.display = "flex";

    return;
  }

  alertBox.style.display = "none";

  const todoItem = createTodoItem(taskName, false);
  todoList.append(todoItem);
  refreshTodoView();
  todoInput.value = "";
  todoInput.focus();
});

alertClose.addEventListener("click", function () {
  alertBox.style.display = "none";
  todoInput.focus();
});

historyToggle.addEventListener("click", function () {
  toggleHistorySection();
});

loadTodos();
renderHistory();
refreshTodoView();

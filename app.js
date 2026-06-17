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
const currentDateTitle = document.getElementById("current-date-title");
const currentDateCopy = document.getElementById("current-date-copy");

const appStorageKey = "dailyTodoData";

let appState = loadAppState();
let expandedHistoryDate = null;

function getTodayKey() {
  const now = new Date();
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  const bangkokTime = new Date(utcTime + 7 * 60 * 60000);
  const year = bangkokTime.getFullYear();
  const month = String(bangkokTime.getMonth() + 1).padStart(2, "0");
  const day = String(bangkokTime.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function formatLongDate(dateKey) {
  const dateParts = dateKey.split("-");

  if (dateParts.length !== 3) {
    return dateKey;
  }

  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]) - 1;
  const day = Number(dateParts[2]);
  const date = new Date(year, month, day);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateKey) {
  const dateParts = dateKey.split("-");

  if (dateParts.length !== 3) {
    return dateKey;
  }

  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]) - 1;
  const day = Number(dateParts[2]);
  const date = new Date(year, month, day);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTaskId() {
  return "task-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
}

function normalizeTask(task) {
  return {
    id: task && task.id ? String(task.id) : getTaskId(),
    text: task && task.text ? String(task.text) : "",
    completed: Boolean(task && task.completed),
  };
}

function createEmptyDayRecord() {
  return {
    tasks: [],
  };
}

function buildStateFromLegacyTodos() {
  let legacyTodos = [];

  try {
    legacyTodos = JSON.parse(localStorage.getItem("todos")) || [];
  } catch (error) {
    legacyTodos = [];
  }

  const todayKey = getTodayKey();
  const normalizedTasks = legacyTodos
    .map(function (task) {
      return normalizeTask(task);
    })
    .filter(function (task) {
      return task.text.trim() !== "";
    });

  return {
    selectedDate: todayKey,
    days: {
      [todayKey]: {
        tasks: normalizedTasks,
      },
    },
  };
}

function loadAppState() {
  let savedState = null;

  try {
    savedState = JSON.parse(localStorage.getItem(appStorageKey));
  } catch (error) {
    savedState = null;
  }

  if (!savedState || typeof savedState !== "object") {
    return buildStateFromLegacyTodos();
  }

  const todayKey = getTodayKey();
  const rawDays = savedState.days && typeof savedState.days === "object" ? savedState.days : {};
  const normalizedDays = {};

  Object.keys(rawDays).forEach(function (dateKey) {
    const day = rawDays[dateKey];
    const tasks = Array.isArray(day && day.tasks) ? day.tasks : [];

    normalizedDays[dateKey] = {
      tasks: tasks
        .map(function (task) {
          return normalizeTask(task);
        })
        .filter(function (task) {
          return task.text.trim() !== "";
        }),
    };
  });

  if (!normalizedDays[todayKey]) {
    normalizedDays[todayKey] = createEmptyDayRecord();
  }

  return {
    selectedDate: todayKey,
    days: normalizedDays,
  };
}

function saveAppState() {
  try {
    localStorage.setItem(appStorageKey, JSON.stringify(appState));
  } catch (error) {
    return;
  }
}

function ensureTodayRecord() {
  const todayKey = getTodayKey();

  appState.selectedDate = todayKey;

  if (!appState.days[todayKey]) {
    appState.days[todayKey] = createEmptyDayRecord();
  }

  return appState.days[todayKey];
}

function getCurrentDateKey() {
  ensureTodayRecord();
  return appState.selectedDate;
}

function getCurrentTasks() {
  return ensureTodayRecord().tasks;
}

function getCountsForTasks(tasks) {
  const totalCount = tasks.length;
  const completedCount = tasks.filter(function (task) {
    return task.completed;
  }).length;
  const remainingCount = totalCount - completedCount;

  return {
    totalCount: totalCount,
    completedCount: completedCount,
    remainingCount: remainingCount,
  };
}

function getCurrentCounts() {
  return getCountsForTasks(getCurrentTasks());
}

function getHistoryMessage(counts) {
  if (counts.totalCount === 0) {
    return "🌱 A soft little reset day. Tomorrow can bloom beautifully.";
  }

  if (counts.remainingCount === 0) {
    return "👑 Everything got done today. That is main-character energy.";
  }

  if (counts.completedCount >= counts.totalCount - 1) {
    return "🌟 So close to a perfect streak. You did amazing today.";
  }

  if (counts.completedCount >= counts.remainingCount) {
    return "💖 Steady progress is still progress. You're doing great.";
  }

  return "🫶 A gentle start still counts. Keep going one task at a time.";
}

function renderCurrentDateBanner() {
  const currentDateKey = getCurrentDateKey();
  const counts = getCurrentCounts();

  currentDateTitle.textContent = formatLongDate(currentDateKey);

  if (counts.totalCount === 0) {
    currentDateCopy.textContent = "Fresh day, fresh little wins. Your task list is ready.";
    return;
  }

  currentDateCopy.textContent = counts.completedCount + " finished, " + counts.remainingCount + " still waiting for you today.";
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
    summaryMessage.textContent = remainingCount + " tasks are waiting for you ⚔️✨";
  } else if (remainingCount >= 2) {
    summaryEmoji.textContent = "🌿";
    summaryTitle.textContent = "So Close!";
    summaryMessage.textContent = "Just " + remainingCount + " tasks left before victory 🏆";
  } else if (remainingCount === 1) {
    summaryEmoji.textContent = "😤";
    summaryTitle.textContent = "One last push!";
    summaryMessage.textContent = "Just 1 task left — you've got this 💪🔥";
  }
}

function createTodoItem(task) {
  const todoItem = document.createElement("article");
  const todoMain = document.createElement("label");
  const checkbox = document.createElement("input");
  const checkboxUI = document.createElement("span");
  const todoText = document.createElement("span");
  const deleteButton = document.createElement("button");

  todoItem.className = "todo-item";
  todoMain.className = "todo-main";
  checkboxUI.className = "checkbox-ui";
  todoText.className = "todo-text";
  deleteButton.className = "delete-button";

  checkbox.type = "checkbox";
  checkbox.checked = task.completed;
  deleteButton.type = "button";
  deleteButton.textContent = "🗑";
  deleteButton.setAttribute("aria-label", "Delete task");

  if (task.completed) {
    todoItem.classList.add("is-completed");
  }

  checkbox.addEventListener("change", function () {
    const currentTasks = getCurrentTasks();
    const targetTask = currentTasks.find(function (item) {
      return item.id === task.id;
    });

    if (!targetTask) {
      return;
    }

    targetTask.completed = checkbox.checked;
    persistAndRender();
  });

  deleteButton.addEventListener("click", function () {
    const currentDateKey = getCurrentDateKey();

    appState.days[currentDateKey].tasks = getCurrentTasks().filter(function (item) {
      return item.id !== task.id;
    });

    persistAndRender();
  });

  todoText.textContent = task.text;

  todoMain.appendChild(checkbox);
  todoMain.appendChild(checkboxUI);
  todoMain.appendChild(todoText);
  todoItem.appendChild(todoMain);
  todoItem.appendChild(deleteButton);

  return todoItem;
}

function renderCurrentTasks() {
  todoList.innerHTML = "";

  getCurrentTasks().forEach(function (task) {
    todoList.appendChild(createTodoItem(task));
  });
}

function createHistoryTaskItem(task) {
  const item = document.createElement("li");
  const badge = document.createElement("span");
  const text = document.createElement("span");

  item.className = "history-task-item";
  badge.className = "history-task-badge";
  badge.textContent = task.completed ? "✅" : "🌱";
  text.textContent = task.text;

  if (task.completed) {
    item.classList.add("is-completed");
  }

  item.appendChild(badge);
  item.appendChild(text);

  return item;
}

function renderHistory() {
  const dayEntries = Object.entries(appState.days).sort(function (a, b) {
    return b[0].localeCompare(a[0]);
  });

  historyList.innerHTML = "";

  if (dayEntries.length === 0) {
    const emptyCard = document.createElement("div");
    emptyCard.className = "history-empty";
    emptyCard.textContent = "No daily history just yet. Your cute little archive will appear here.";
    historyList.appendChild(emptyCard);
    return;
  }

  dayEntries.forEach(function (entry) {
    const dateKey = entry[0];
    const dayRecord = entry[1];
    const tasks = Array.isArray(dayRecord.tasks) ? dayRecord.tasks : [];
    const counts = getCountsForTasks(tasks);
    const isExpanded = expandedHistoryDate === dateKey;
    const card = document.createElement("article");
    const headerRow = document.createElement("div");
    const headerText = document.createElement("span");
    const headerButton = document.createElement("button");
    const headerIcon = document.createElement("span");
    const details = document.createElement("div");
    const date = document.createElement("p");
    const stats = document.createElement("div");
    const totalStat = document.createElement("div");
    const completedStat = document.createElement("div");
    const remainingStat = document.createElement("div");
    const message = document.createElement("p");
    const taskHeading = document.createElement("p");
    const taskList = document.createElement("ul");

    card.className = "history-item";
    headerRow.className = "history-accordion-row";
    headerButton.className = "history-accordion-button";
    headerText.className = "history-accordion-text";
    headerIcon.className = "history-accordion-icon";
    details.className = "history-accordion-panel";
    headerButton.type = "button";
    headerButton.setAttribute("aria-expanded", String(isExpanded));
    details.hidden = !isExpanded;
    date.className = "history-date";
    stats.className = "history-stats";
    totalStat.className = "history-stat";
    completedStat.className = "history-stat";
    remainingStat.className = "history-stat";
    message.className = "history-message";
    taskHeading.className = "history-task-heading";
    taskList.className = "history-task-list";

    headerText.textContent = formatShortDate(dateKey);
    headerIcon.textContent = isExpanded ? "📖" : "📘";

    date.textContent = formatLongDate(dateKey);
    totalStat.innerHTML = "<span>Total tasks</span><span>" + counts.totalCount + "</span>";
    completedStat.innerHTML = "<span>Completed</span><span>" + counts.completedCount + " / " + counts.totalCount + "</span>";
    remainingStat.innerHTML = "<span>Remaining</span><span>" + counts.remainingCount + "</span>";
    message.textContent = getHistoryMessage(counts);
    taskHeading.textContent = "Task list for this day";
    headerButton.addEventListener("click", function () {
      if (expandedHistoryDate === dateKey) {
        expandedHistoryDate = null;
      } else {
        expandedHistoryDate = dateKey;
      }

      renderHistory();
    });

    if (tasks.length === 0) {
      const emptyTask = document.createElement("li");

      emptyTask.className = "history-task-item";
      emptyTask.textContent = "No tasks were added on this day yet.";
      taskList.appendChild(emptyTask);
    } else {
      tasks.forEach(function (task) {
        taskList.appendChild(createHistoryTaskItem(task));
      });
    }

    stats.appendChild(totalStat);
    stats.appendChild(completedStat);
    stats.appendChild(remainingStat);

    headerButton.appendChild(headerIcon);
    headerRow.appendChild(headerText);
    headerRow.appendChild(headerButton);

    details.appendChild(date);
    details.appendChild(stats);
    details.appendChild(message);
    details.appendChild(taskHeading);
    details.appendChild(taskList);

    card.appendChild(headerRow);
    card.appendChild(details);
    historyList.appendChild(card);
  });
}

function persistAndRender() {
  saveAppState();
  renderCurrentDateBanner();
  renderCurrentTasks();
  updateSummary();
  renderHistory();
}

function toggleHistorySection() {
  const isHidden = historySection.hasAttribute("hidden");

  if (isHidden) {
    historySection.removeAttribute("hidden");
    historyToggle.classList.add("is-history-active");
    historyToggle.setAttribute("aria-expanded", "true");
    return;
  }

  historySection.setAttribute("hidden", "");
  historyToggle.classList.remove("is-history-active");
  historyToggle.setAttribute("aria-expanded", "false");
}

todoInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addButton.click();
  }
});

addButton.addEventListener("click", function () {
  const taskName = todoInput.value.trim();
  const currentDateKey = getCurrentDateKey();

  if (taskName === "") {
    alertBox.style.display = "flex";
    return;
  }

  alertBox.style.display = "none";

  appState.days[currentDateKey].tasks.push({
    id: getTaskId(),
    text: taskName,
    completed: false,
  });

  persistAndRender();
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

ensureTodayRecord();
persistAndRender();

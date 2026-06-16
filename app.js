const todoInput = document.getElementById("todo-input");
const addButton = document.getElementById("add-button");
const todoList = document.getElementById("todo-list");
const alertBox = document.getElementById("alert-box");
const alertClose = document.getElementById("alert-close");
const summaryEmoji = document.getElementById("summary-emoji");
const summaryTitle = document.getElementById("summary-title");
const summaryMessage = document.getElementById("summary-message");

function updateSummary() {
  const totalCount = todoList.children.length;
  const remainingCount = todoList.querySelectorAll(".todo-item:not(.is-completed)").length;
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
    updateSummary();
    saveTodos();
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
  deleteButton.setAttribute("aria-label", "ลบงาน");
  todoItem.append(todoMain);
  todoItem.append(deleteButton);

  deleteButton.addEventListener("click", function () {
    todoItem.remove();
    updateSummary();
    saveTodos();
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
  todoList.append(todoItem); //เอา todoItem ใส่ใน todoList
  updateSummary();
  saveTodos();
  todoInput.value = ""; //ล้างช่อง input
  todoInput.focus();
});
alertClose.addEventListener("click", function () {
  alertBox.style.display = "none";
  todoInput.focus();
});
loadTodos();
updateSummary();

const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");
const list = document.getElementById("list");
const balance = document.getElementById("balance");
const moneyPlus = document.getElementById("money-plus");
const moneyMinus = document.getElementById("money-minus");
const summaryText = document.getElementById("summary-text");
const balanceCompare = document.getElementById("balance-compare");
const historyCount = document.getElementById("history-count");
const emptyState = document.getElementById("empty-state");
const formTitle = document.getElementById("form-title");
const formDescription = document.getElementById("form-description");
const submitButton = document.getElementById("submit-button");
const cancelEditButton = document.getElementById("cancel-edit");
const transactionTypeInputs = document.querySelectorAll(
  'input[name="transaction-type"]',
);
const localStorageKey = "expenseAppData";
const notebookSelect = document.getElementById("notebook-select");
const addNotebookBtn = document.getElementById("add-notebook-btn");
const renameNotebookBtn = document.getElementById("rename-notebook-btn");
const deleteNotebookBtn = document.getElementById("delete-notebook-btn");
const notebookMeta = document.getElementById("notebook-meta");

let state = JSON.parse(localStorage.getItem(localStorageKey)) || {
  notebooks: [
    {
      id: "personal",
      name: "ส่วนตัว",
      transactions: [],
    },
  ],
  selectedNotebookId: "personal",
};
let editingTransactionId = null;

function updateBalanceComparison() {
  const selectedNotebook = getSelectedNotebook();
  const todaySavings = getDailySavingsTotal(selectedNotebook.transactions, 0);
  const yesterdaySavings = getDailySavingsTotal(
    selectedNotebook.transactions,
    1,
  );
  const hasTodayTransactions = hasTransactionsOnDay(
    selectedNotebook.transactions,
    0,
  );

  if (selectedNotebook.transactions.length === 0) {
    balanceCompare.textContent =
      "🚀 ยังไม่มีรายการ ลองบันทึกรายรับหรือรายจ่ายแรกกันเลย";
    return;
  }

  if (!hasTodayTransactions) {
    balanceCompare.textContent =
      "🌤️ เช้านี้คุณยังไม่ได้ออมเงินเลย เริ่มวันนี้ด้วยเงินออมก้อนแรกกัน!";
    return;
  }

  if (todaySavings > yesterdaySavings) {
    balanceCompare.textContent = "😊 เก่งมาก วันนี้เงินออมเพิ่มขึ้น!";
  } else if (todaySavings < yesterdaySavings) {
    balanceCompare.textContent =
      "😢 วันนี้ออมน้อยกว่าเมื่อวานนิดนึง พรุ่งนี้เอาใหม่นะ!";
  } else {
    balanceCompare.textContent = "🙂 ดีมาก รักษาระดับการออมไว้ได้!";
  }
}

function getDateKeyFromOffset(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return date.toDateString();
}

function getTransactionDateKey(transaction) {
  if (!transaction.createdAt) {
    return "";
  }

  return new Date(transaction.createdAt).toDateString();
}

function hasTransactionsOnDay(transactions, daysAgo) {
  const targetDateKey = getDateKeyFromOffset(daysAgo);

  return transactions.some(function (transaction) {
    return getTransactionDateKey(transaction) === targetDateKey;
  });
}

function getDailySavingsTotal(transactions, daysAgo) {
  const targetDateKey = getDateKeyFromOffset(daysAgo);

  return transactions.reduce(function (total, transaction) {
    if (getTransactionDateKey(transaction) !== targetDateKey) {
      return total;
    }

    return total + transaction.amount;
  }, 0);
}

function saveData() {
  localStorage.setItem(localStorageKey, JSON.stringify(state));
}

function getSelectedNotebook() {
  return state.notebooks.find(function (notebook) {
    return notebook.id === state.selectedNotebookId;
  });
}

function renderNotebookOptions() {
  notebookSelect.innerHTML = "";

  state.notebooks.forEach(function (notebook) {
    const option = document.createElement("option");
    option.value = notebook.id;
    option.textContent = notebook.name;

    if (notebook.id === state.selectedNotebookId) {
      option.selected = true;
    }

    notebookSelect.appendChild(option);
  });
}

function renderNotebookMeta() {
  const selectedNotebook = getSelectedNotebook();

  if (selectedNotebook.transactions.length === 0) {
    notebookMeta.textContent = "ยังไม่มีการบันทึกในหน้านี้";
    return;
  }

  const latestTransaction =
    selectedNotebook.transactions[selectedNotebook.transactions.length - 1];

  notebookMeta.textContent = latestTransaction.createdAt
    ? `บันทึกล่าสุด: ${formatDateTime(latestTransaction.createdAt)}`
    : "ไม่มีวันเวลาบันทึก";
}

function formatCurrency(number) {
  return number.toLocaleString("th-TH") + " บาท";
}

function formatDateTime(dateString) {
  const date = new Date(dateString);

  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getAlertOptions(options = {}) {
  return {
    background: "#fff8fb",
    color: "#5b4a59",
    confirmButtonText: "ตกลง",
    cancelButtonText: "ยกเลิก",
    reverseButtons: true,
    customClass: {
      popup: "expense-alert",
      title: "expense-alert-title",
      htmlContainer: "expense-alert-text",
      confirmButton: "expense-alert-confirm",
      cancelButton: "expense-alert-cancel",
      input: "expense-alert-input",
    },
    ...options,
  };
}

function resetForm() {
  form.reset();
  editingTransactionId = null;
  formTitle.textContent = "เพิ่มธุรกรรม";
  formDescription.textContent = "ระบุชื่อรายการและจำนวนเงิน";
  submitButton.textContent = "เพิ่มรายการ";
  cancelEditButton.classList.remove("show");
}

function getSelectedTransactionType() {
  const selectedTypeInput = document.querySelector(
    'input[name="transaction-type"]:checked',
  );

  return selectedTypeInput ? selectedTypeInput.value : "income";
}

function setSelectedTransactionType(type) {
  transactionTypeInputs.forEach(function (input) {
    input.checked = input.value === type;
  });
}

function startEditTransaction(id) {
  const selectedNotebook = getSelectedNotebook();

  const transaction = selectedNotebook.transactions.find(function (item) {
    return item.id === id;
  });

  if (!transaction) {
    return;
  }

  editingTransactionId = id;
  text.value = transaction.text;
  amount.value = Math.abs(transaction.amount);
  setSelectedTransactionType(transaction.amount >= 0 ? "income" : "expense");
  formTitle.textContent = "แก้ไขธุรกรรม";
  formDescription.textContent = "ปรับชื่อรายการหรือจำนวนเงินแล้วกดบันทึก";
  submitButton.textContent = "บันทึกการแก้ไข";
  cancelEditButton.classList.add("show");
  text.focus();
}

function renderTransactions() {
  list.innerHTML = "";

  const selectedNotebook = getSelectedNotebook();

  selectedNotebook.transactions.forEach(function (transaction) {
    showTransaction(transaction);
  });

  historyCount.textContent = `ทั้งหมด ${selectedNotebook.transactions.length} รายการ`;
  emptyState.classList.toggle(
    "show",
    selectedNotebook.transactions.length === 0,
  );
}

function addTransaction(event) {
  event.preventDefault();

  const textValue = text.value.trim();
  const amountValue = +amount.value;
  const transactionType = getSelectedTransactionType();

  if (textValue === "" || amount.value === "") {
    Swal.fire({
      ...getAlertOptions(),
      icon: "warning",
      title: "ข้อมูลไม่ครบ",
      text: "กรุณากรอกข้อมูลให้ครบถ้วน",
    });
    return;
  }

  if (amountValue <= 0) {
    Swal.fire({
      ...getAlertOptions(),
      icon: "warning",
      title: "จำนวนเงินไม่ถูกต้อง",
      text: "กรุณากรอกจำนวนเงินมากกว่า 0",
    });
    return;
  }

  const finalAmount =
    transactionType === "expense"
      ? -Math.abs(amountValue)
      : Math.abs(amountValue);

  if (editingTransactionId !== null) {
    updateTransaction(textValue, finalAmount);
    return;
  }

  const transaction = {
    id: Date.now(),
    text: textValue,
    amount: finalAmount,
    createdAt: new Date().toISOString(),
  };

  const selectedNotebook = getSelectedNotebook();
  selectedNotebook.transactions.push(transaction);
  saveData();
  renderTransactions();
  renderNotebookMeta();
  updateBalance();
  resetForm();
}

function showTransaction(transaction) {
  const item = document.createElement("li");
  const details = document.createElement("div");
  const name = document.createElement("span");
  const dateText = document.createElement("small");
  const amountText = document.createElement("span");
  const actions = document.createElement("div");
  const editBtn = document.createElement("button");
  const deleteBtn = document.createElement("button");

  item.classList.add("transaction-item");
  details.classList.add("transaction-details");
  name.classList.add("transaction-name");
  dateText.classList.add("transaction-date");
  amountText.classList.add("transaction-amount");
  actions.classList.add("transaction-actions");

  if (transaction.amount > 0) {
    item.classList.add("income");
  } else {
    item.classList.add("expense");
  }

  editBtn.type = "button";
  editBtn.textContent = "✎";
  editBtn.classList.add("edit-btn");
  editBtn.setAttribute("aria-label", `แก้ไขรายการ ${transaction.text}`);
  editBtn.addEventListener("click", function () {
    startEditTransaction(transaction.id);
  });

  deleteBtn.type = "button";
  deleteBtn.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3.75C9 3.336 9.336 3 9.75 3h4.5c.414 0 .75.336.75.75V5h3.25a.75.75 0 0 1 0 1.5H17.5v11a2.5 2.5 0 0 1-2.5 2.5h-6A2.5 2.5 0 0 1 6.5 17.5v-11H5.75a.75.75 0 0 1 0-1.5H9V3.75Zm1.5.75V5h3V4.5h-3Zm-2.5 2v11c0 .552.448 1 1 1h6c.552 0 1-.448 1-1v-11h-8Zm2.25 2.25a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Zm3.5 0a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Z"/></svg>';
  deleteBtn.classList.add("delete-btn");
  deleteBtn.setAttribute("aria-label", `ลบรายการ ${transaction.text}`);
  deleteBtn.addEventListener("click", function () {
    removeTransaction(transaction.id);
  });

  name.textContent = transaction.text;
  dateText.textContent = transaction.createdAt
    ? formatDateTime(transaction.createdAt)
    : "ไม่มีวันเวลาบันทึก";
  amountText.textContent = formatCurrency(transaction.amount);

  details.appendChild(name);
  details.appendChild(dateText);

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(details);
  item.appendChild(amountText);
  item.appendChild(actions);

  list.appendChild(item);
}

function updateBalance() {
  let total = 0;
  let income = 0;
  let expense = 0;

  const selectedNotebook = getSelectedNotebook();

  selectedNotebook.transactions.forEach(function (transaction) {
    total = total + transaction.amount;

    if (transaction.amount > 0) {
      income = income + transaction.amount;
    } else {
      expense = expense + transaction.amount;
    }
  });

  balance.textContent = formatCurrency(total);
  moneyPlus.textContent = formatCurrency(income);
  moneyMinus.textContent = formatCurrency(Math.abs(expense));
  updateBalanceComparison();

  summaryText.classList.remove(
    "summary-positive",
    "summary-negative",
    "summary-neutral",
  );

  if (selectedNotebook.transactions.length === 0) {
    summaryText.textContent = "ยังไม่มีรายการในหน้านี้";
    summaryText.classList.add("summary-neutral");
  } else if (total > 0) {
    summaryText.textContent = "ตอนนี้รายรับมากกว่ารายจ่าย";
    summaryText.classList.add("summary-positive");
  } else if (total < 0) {
    summaryText.textContent = "ตอนนี้รายจ่ายมากกว่ารายรับ";
    summaryText.classList.add("summary-negative");
  } else {
    summaryText.textContent = "ตอนนี้รายรับและรายจ่ายเท่ากัน";
    summaryText.classList.add("summary-neutral");
  }
}

async function deleteNotebook() {
  const selectedNotebook = getSelectedNotebook();
  const result = await Swal.fire(
    getAlertOptions({
      icon: "warning",
      title: "ยืนยันการลบ",
      text: `ต้องการลบหน้าบันทึก "${selectedNotebook.name}" หรือไม่`,
      showCancelButton: true,
      confirmButtonText: "ลบหน้าบันทึก",
    }),
  );

  if (!result.isConfirmed) {
    return;
  }

  state.notebooks = state.notebooks.filter(function (notebook) {
    return notebook.id !== state.selectedNotebookId;
  });

  if (state.notebooks.length === 0) {
    const defaultNotebook = {
      id: "personal",
      name: "ส่วนตัว",
      transactions: [],
    };

    state.notebooks.push(defaultNotebook);
    state.selectedNotebookId = defaultNotebook.id;
  } else {
    state.selectedNotebookId = state.notebooks[0].id;
  }

  saveData();
  renderNotebookOptions();
  renderTransactions();
  renderNotebookMeta();
  updateBalance();
  resetForm();
}

async function renameNotebook() {
  const selectedNotebook = getSelectedNotebook();
  const result = await Swal.fire(
    getAlertOptions({
      title: "แก้ชื่อหน้าบันทึก",
      input: "text",
      inputValue: selectedNotebook.name,
      inputLabel: "ชื่อใหม่",
      confirmButtonText: "บันทึกชื่อ",
      showCancelButton: true,
      inputValidator: function (value) {
        if (!value || value.trim() === "") {
          return "กรุณากรอกชื่อหน้าบันทึก";
        }
      },
    }),
  );

  if (!result.isConfirmed) {
    return;
  }

  selectedNotebook.name = result.value.trim();

  saveData();
  renderNotebookOptions();
}

async function createNotebook() {
  const result = await Swal.fire(
    getAlertOptions({
      title: "สร้างหน้าบันทึกใหม่",
      input: "text",
      inputLabel: "ชื่อหน้าบันทึก",
      confirmButtonText: "สร้างหน้าบันทึก",
      showCancelButton: true,
      inputValidator: function (value) {
        if (!value || value.trim() === "") {
          return "กรุณากรอกชื่อหน้าบันทึก";
        }
      },
    }),
  );

  if (!result.isConfirmed) {
    return;
  }

  const newNotebook = {
    id: "notebook-" + Date.now(),
    name: result.value.trim(),
    transactions: [],
  };

  state.notebooks.push(newNotebook);
  state.selectedNotebookId = newNotebook.id;

  saveData();
  renderNotebookOptions();
  renderTransactions();
  renderNotebookMeta();
  updateBalance();
  resetForm();
}

form.addEventListener("submit", addTransaction);
cancelEditButton.addEventListener("click", resetForm);
addNotebookBtn.addEventListener("click", createNotebook);
renameNotebookBtn.addEventListener("click", renameNotebook);
deleteNotebookBtn.addEventListener("click", deleteNotebook);
notebookSelect.addEventListener("change", function () {
  state.selectedNotebookId = notebookSelect.value;
  saveData();
  renderTransactions();
  renderNotebookMeta();
  updateBalance();
  resetForm();
});

renderNotebookOptions();
renderTransactions();
renderNotebookMeta();
updateBalance();

function removeTransaction(id) {
  const selectedNotebook = getSelectedNotebook();

  selectedNotebook.transactions = selectedNotebook.transactions.filter(
    function (transaction) {
      return transaction.id !== id;
    },
  );

  saveData();
  if (editingTransactionId === id) {
    resetForm();
  }

  renderTransactions();
  renderNotebookMeta();
  updateBalance();
}

function updateTransaction(textValue, amountValue) {
  const selectedNotebook = getSelectedNotebook();

  selectedNotebook.transactions = selectedNotebook.transactions.map(
    function (transaction) {
      if (transaction.id === editingTransactionId) {
        return {
          ...transaction,
          text: textValue,
          amount: amountValue,
        };
      }

      return transaction;
    },
  );

  saveData();
  renderTransactions();
  renderNotebookMeta();
  updateBalance();
  resetForm();
}

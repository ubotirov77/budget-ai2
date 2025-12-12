document.addEventListener("DOMContentLoaded", () => {

  /* ================================
     LOCAL STORAGE
  ================================= */
  let incomeData  = JSON.parse(localStorage.getItem("incomeData")  || "[]");
  let expenseData = JSON.parse(localStorage.getItem("expenseData") || "[]");

  function saveData() {
    localStorage.setItem("incomeData", JSON.stringify(incomeData));
    localStorage.setItem("expenseData", JSON.stringify(expenseData));
  }

  /* ================================
     ELEMENTS
  ================================= */
  const els = {
    totalIncome: document.getElementById("total-income"),
    totalExpenses: document.getElementById("total-expenses"),
    totalBalance: document.getElementById("total-balance"),

    incomeList: document.getElementById("income-list"),
    expenseTableBody: document.getElementById("expense-table-body"),
    expenseCount: document.getElementById("expense-count"),

    incomeForm: document.getElementById("income-form"),
    incomeSource: document.getElementById("income-source"),
    incomeAmount: document.getElementById("income-amount"),

    expenseForm: document.getElementById("expense-form"),
    expenseDesc: document.getElementById("expense-desc"),
    expenseCategory: document.getElementById("expense-category"),
    expenseAmount: document.getElementById("expense-amount"),

    langSelect: document.getElementById("lang-select"),
    currencySelect: document.getElementById("currency-select"),

    aiAnalyzeBtn: document.getElementById("ai-analyze-btn"),
    aiPopup: document.getElementById("ai-popup"),
    aiPopupOutput: document.getElementById("popup-ai-output"),
    aiCloseBtn: document.getElementById("ai-close-btn")
  };

  /* ================================
     CURRENCY
  ================================= */
  let currentCurrency = localStorage.getItem("budgetCurrency") || "KRW";

  function formatCurrency(num) {
    num = Number(num) || 0;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currentCurrency,
        maximumFractionDigits: 0
      }).format(num);
    } catch {
      return `${currentCurrency} ${num}`;
    }
  }

  if (els.currencySelect) {
    els.currencySelect.value = currentCurrency;
    els.currencySelect.addEventListener("change", () => {
      currentCurrency = els.currencySelect.value;
      localStorage.setItem("budgetCurrency", currentCurrency);
      renderAll();
    });
  }

  /* ================================
     RENDERING
  ================================= */
  function renderSummary() {
    const inc = incomeData.reduce((s, i) => s + i.amount, 0);
    const exp = expenseData.reduce((s, e) => s + e.amount, 0);
    const bal = inc - exp;

    els.totalIncome.textContent = formatCurrency(inc);
    els.totalExpenses.textContent = formatCurrency(exp);
    els.totalBalance.textContent = formatCurrency(bal);
  }

  function renderIncomeList() {
    els.incomeList.innerHTML = "";
    incomeData.forEach((item, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${item.source}</span>
        <span>${formatCurrency(item.amount)}</span>
        <button class="delete-btn">✖</button>
      `;
      li.querySelector("button").onclick = () => {
        incomeData.splice(i, 1);
        saveData();
        renderAll();
      };
      els.incomeList.appendChild(li);
    });
  }

  function renderExpenseTable() {
    els.expenseTableBody.innerHTML = "";
    expenseData.forEach((item, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.date}</td>
        <td>${item.desc}</td>
        <td>${item.category}</td>
        <td class="right">${formatCurrency(item.amount)}</td>
        <td><button class="delete-btn">✖</button></td>
      `;
      tr.querySelector("button").onclick = () => {
        expenseData.splice(i, 1);
        saveData();
        renderAll();
      };
      els.expenseTableBody.appendChild(tr);
    });
    els.expenseCount.textContent = `${expenseData.length} items`;
  }

  function renderAll() {
    renderSummary();
    renderIncomeList();
    renderExpenseTable();
  }

  /* ================================
     FORMS
  ================================= */
  els.incomeForm.addEventListener("submit", e => {
    e.preventDefault();
    const src = els.incomeSource.value.trim();
    const amt = Number(els.incomeAmount.value);
    if (!src || amt <= 0) return;

    incomeData.push({ source: src, amount: amt });
    saveData();
    els.incomeSource.value = "";
    els.incomeAmount.value = "";
    renderAll();
  });

  els.expenseForm.addEventListener("submit", e => {
    e.preventDefault();
    const desc = els.expenseDesc.value.trim();
    const cat  = els.expenseCategory.value;
    const amt  = Number(els.expenseAmount.value);
    if (!desc || amt <= 0) return;

    expenseData.push({
      date: new Date().toISOString().slice(0,10),
      desc,
      category: cat,
      amount: amt
    });
    saveData();
    els.expenseDesc.value = "";
    els.expenseAmount.value = "";
    renderAll();
  });

  /* ================================
     AI PROMPT
  ================================= */
  function buildPrompt(lang) {
    const inc = incomeData.reduce((s,i)=>s+i.amount,0);
    const exp = expenseData.reduce((s,e)=>s+e.amount,0);
    const bal = inc - exp;

    const incLines = incomeData.map(i => `- ${i.source}: ${i.amount}`).join("\n") || "- None";
    const expLines = expenseData.map(e => `- [${e.category}] ${e.desc} (${e.date}): ${e.amount}`).join("\n") || "- None";

    return `
Analyze this personal budget clearly and simply.

Total income: ${inc} ${currentCurrency}
Total expenses: ${exp} ${currentCurrency}
Balance: ${bal} ${currentCurrency}

Income:
${incLines}

Expenses:
${expLines}

Give:
A) Short summary
B) Spending patterns
C) Weak points
D) Category analysis
E) Measurable improvements
F) Future projection
G) Brutally honest paragraph
H) 5 money management tips

Rules:
- Plain text only
- Short sections
- No markdown
`;
  }

  /* ================================
     BACKEND CALL (FIXED)
  ================================= */
  async function sendToBackend(prompt) {
    els.aiPopup.classList.add("show");
    els.aiPopupOutput.textContent = "Analyzing...";

    try {
      const res = await fetch("https://budget-ai2.onrender.com/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }

      const data = await res.json();
      els.aiPopupOutput.innerHTML = (data.analysis || "No response").replace(/\n/g,"<br>");
    } catch (err) {
      console.error(err);
      els.aiPopupOutput.textContent = "AI request failed.";
    }
  }

  /* ================================
     AI BUTTON
  ================================= */
  els.aiAnalyzeBtn.addEventListener("click", () => {
    const lang = els.langSelect ? els.langSelect.value : "en";
    sendToBackend(buildPrompt(lang));
  });

  /* ================================
     POPUP CLOSE
  ================================= */
  els.aiCloseBtn.onclick = () => els.aiPopup.classList.remove("show");
  els.aiPopup.onclick = e => {
    if (e.target === els.aiPopup) els.aiPopup.classList.remove("show");
  };

  /* ================================
     INIT
  ================================= */
  renderAll();
});

/* ================================
   SERVICE WORKER
================================= */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

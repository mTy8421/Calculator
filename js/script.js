// State Variables
let display = "0";
let expression = "";
let history = [];
let isRad = false;
let memory = 0;
let showHistory = false;

// DOM Elements
const mainDisplayEl = document.getElementById("mainDisplay");
const expressionDisplayEl = document.getElementById("expressionDisplay");
const historyOverlayEl = document.getElementById("historyOverlay");
const historyListEl = document.getElementById("historyList");
const historyBtn = document.getElementById("historyBtn");
const memIndicatorEl = document.getElementById("memIndicator");
const btnDeg = document.getElementById("btnDeg");
const btnRad = document.getElementById("btnRad");

// Initialize
updateUI();

// --- Main Functions ---

function input(value) {
  if (display === "Error") {
    display = value;
  } else if (
    display === "0" &&
    ![".", "+", "-", "*", "/", "^", "%"].includes(value)
  ) {
    display = value;
  } else {
    display += value;
  }
  updateUI();
  scrollToEnd();
}

function clearAll() {
  display = "0";
  expression = "";
  updateUI();
}

function del() {
  if (display === "Error") {
    clearAll();
    return;
  }
  if (display.length === 1) {
    display = "0";
  } else {
    display = display.slice(0, -1);
  }
  updateUI();
}

function calculate() {
  try {
    let calcString = display;

    // Replace symbols with JS Syntax
    calcString = calcString.replace(/×/g, "*").replace(/÷/g, "/");
    calcString = calcString.replace(/\^/g, "**");
    calcString = calcString.replace(/π/g, "Math.PI");
    calcString = calcString.replace(/e/g, "Math.E");
    calcString = calcString.replace(/√\(([^)]+)\)/g, "Math.sqrt($1)"); // sqrt(x)
    calcString = calcString.replace(/√(\d+(\.\d+)?)/g, "Math.sqrt($1)"); // sqrtNumber

    // Trig Functions (Deg vs Rad)
    const trigFuncs = ["sin", "cos", "tan"];
    trigFuncs.forEach((func) => {
      const regex = new RegExp(`${func}\\(([^)]+)\\)`, "g");
      calcString = calcString.replace(regex, (match, args) => {
        if (isRad) {
          return `Math.${func}(${args})`;
        } else {
          return `Math.${func}((${args}) * Math.PI / 180)`;
        }
      });
    });

    // Logs
    calcString = calcString.replace(/log\(/g, "Math.log10(");
    calcString = calcString.replace(/ln\(/g, "Math.log(");

    // Basic safety check
    if (
      !/^[0-9+\-*/().\sMathPIE_**]+$/.test(
        calcString.replace(
          /Math\.(sin|cos|tan|sqrt|log|log10|PI|E)/g,
          "",
        ),
      )
    ) {
      // Allow safe execution
    }

    // Execute
    const result = new Function("return " + calcString)();

    // Formatting
    let formattedResult = Math.round(result * 10000000000) / 10000000000;

    if (!isFinite(formattedResult) || isNaN(formattedResult)) {
      throw new Error("Math Error");
    }

    // Update History
    history.unshift({ expr: display, res: formattedResult });
    history = history.slice(0, 10); // Keep last 10
    renderHistory();

    expression = display + " =";
    display = String(formattedResult);
  } catch (error) {
    expression = display;
    display = "Error";
  }
  updateUI();
}

// --- Memory Functions ---

function handleMemory(action) {
  const current = parseFloat(display);
  if (isNaN(current)) return;

  switch (action) {
    case "MC":
      memory = 0;
      break;
    case "MR":
      display = String(memory);
      break;
    case "M+":
      memory += current;
      break;
    case "M-":
      memory -= current;
      break;
  }
  updateUI();
}

// --- UI & Utility Functions ---

function setMode(rad) {
  isRad = rad;
  updateUI();
}

function updateUI() {
  mainDisplayEl.innerText = display;
  expressionDisplayEl.innerText = expression;

  // Update Deg/Rad Buttons
  if (isRad) {
    btnRad.className =
      "px-3 py-1 rounded-full transition-all bg-cyan-600 text-white shadow-lg shadow-cyan-500/30";
    btnDeg.className =
      "px-3 py-1 rounded-full transition-all hover:text-slate-200";
  } else {
    btnDeg.className =
      "px-3 py-1 rounded-full transition-all bg-cyan-600 text-white shadow-lg shadow-cyan-500/30";
    btnRad.className =
      "px-3 py-1 rounded-full transition-all hover:text-slate-200";
  }

  // Memory Indicator
  memIndicatorEl.style.display = memory !== 0 ? "block" : "none";
}

function scrollToEnd() {
  const container = mainDisplayEl.parentElement;
  container.scrollLeft = container.scrollWidth;
}

// --- History Logic ---

historyBtn.addEventListener("click", () => {
  showHistory = !showHistory;
  if (showHistory) {
    historyOverlayEl.classList.remove("hidden");
    historyBtn.classList.add("bg-cyan-900/50", "text-cyan-400");
    historyBtn.classList.remove("text-slate-400");
  } else {
    historyOverlayEl.classList.add("hidden");
    historyBtn.classList.remove("bg-cyan-900/50", "text-cyan-400");
    historyBtn.classList.add("text-slate-400");
  }
});

function renderHistory() {
  if (history.length === 0) {
    historyListEl.innerHTML =
      '<p class="text-slate-600 text-center mt-10 text-sm">ไม่มีประวัติการคำนวณ</p>';
    return;
  }

  historyListEl.innerHTML = history
    .map(
      (item, index) => `
          <div class="mb-3 text-right border-b border-slate-800 pb-2 last:border-0 cursor-pointer hover:bg-slate-800/50 rounded px-2"
               onclick="loadHistory('${item.res}')">
              <div class="text-slate-400 text-sm">${item.expr}</div>
              <div class="text-cyan-400 font-medium text-lg">= ${item.res}</div>
          </div>
      `,
    )
    .join("");
}

function loadHistory(value) {
  display = String(value);
  updateUI();
  // Close history automatically if preferred, or leave open
  // showHistory = false;
  // historyOverlayEl.classList.add('hidden');
}

function clearHistory() {
  history = [];
  renderHistory();
}

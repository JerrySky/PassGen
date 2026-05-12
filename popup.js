const defaults = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*"
};

const storageKey = "passgen-popup-state";

const elements = {
  passwordOutput: document.getElementById("passwordOutput"),
  strengthLabel: document.getElementById("strengthLabel"),
  summaryLength: document.getElementById("summaryLength"),
  summaryTypes: document.getElementById("summaryTypes"),
  feedback: document.getElementById("feedback"),
  lengthRange: document.getElementById("lengthRange"),
  lengthValue: document.getElementById("lengthValue"),
  refreshButton: document.getElementById("refreshButton"),
  copyButton: document.getElementById("copyButton"),
  symbolInput: document.getElementById("symbolInput"),
  symbolHint: document.getElementById("symbolHint"),
  uppercase: document.getElementById("uppercase"),
  lowercase: document.getElementById("lowercase"),
  numbers: document.getElementById("numbers"),
  symbols: document.getElementById("symbols")
};

let currentPassword = "";

function getStateSnapshot() {
  return {
    currentPassword,
    length: elements.lengthRange.value,
    uppercase: elements.uppercase.checked,
    lowercase: elements.lowercase.checked,
    numbers: elements.numbers.checked,
    symbols: elements.symbols.checked,
    symbolInput: sanitizeSymbols(elements.symbolInput.value)
  };
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(getStateSnapshot()));
}

function updateSummary(groups, password = currentPassword) {
  elements.strengthLabel.textContent = `强度：${calculateStrength(password, groups)}`;
  elements.summaryLength.textContent = `${elements.lengthRange.value} 位`;
  elements.summaryTypes.textContent = `${groups.length} 种`;
}

function getSelectedGroups() {
  const groups = [];

  if (elements.uppercase.checked) {
    groups.push({ type: "uppercase", chars: defaults.uppercase });
  }

  if (elements.lowercase.checked) {
    groups.push({ type: "lowercase", chars: defaults.lowercase });
  }

  if (elements.numbers.checked) {
    groups.push({ type: "number", chars: defaults.numbers });
  }

  if (elements.symbols.checked) {
    const symbolChars = sanitizeSymbols(elements.symbolInput.value);
    if (symbolChars) {
      groups.push({ type: "symbol", chars: symbolChars });
    }
  }

  return groups;
}

function sanitizeSymbols(value) {
  return Array.from(new Set(value.split(""))).join("");
}

function randomIndex(max) {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return values[0] % max;
}

function pickCharacter(chars) {
  return chars[randomIndex(chars.length)];
}

function shuffle(items) {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function classifyCharacter(char) {
  if (defaults.uppercase.includes(char)) {
    return "uppercase";
  }

  if (defaults.lowercase.includes(char)) {
    return "lowercase";
  }

  if (defaults.numbers.includes(char)) {
    return "number";
  }

  return "symbol";
}

function calculateStrength(password, groups) {
  let score = 0;

  score += Math.min(password.length, 32);
  score += groups.length * 10;

  if (password.length >= 12) {
    score += 10;
  }

  if (password.length >= 20) {
    score += 10;
  }

  if (score < 38) {
    return "低";
  }

  if (score < 62) {
    return "中";
  }

  return "高";
}

function renderPassword(password) {
  const fragment = document.createDocumentFragment();

  password.split("").forEach((char) => {
    const span = document.createElement("span");
    span.className = `char ${classifyCharacter(char)}`;
    span.textContent = char;
    fragment.appendChild(span);
  });

  elements.passwordOutput.replaceChildren(fragment);
}

function setFeedback(message) {
  elements.feedback.textContent = message;
}

function ensureAtLeastOneChecked(event) {
  const inputs = [
    elements.uppercase,
    elements.lowercase,
    elements.numbers,
    elements.symbols
  ];

  const checkedInputs = inputs.filter((input) => input.checked);

  if (checkedInputs.length === 0) {
    event.target.checked = true;
    setFeedback("至少要保留一种字符类型。");
    return false;
  }

  return true;
}

function updateSymbolState() {
  const enabled = elements.symbols.checked;
  elements.symbolInput.disabled = !enabled;
  elements.symbolHint.textContent = enabled ? "可自定义字符" : "默认关闭";

  if (enabled && !sanitizeSymbols(elements.symbolInput.value)) {
    elements.symbolInput.value = defaults.symbols;
  }
}

function restoreState() {
  const rawState = localStorage.getItem(storageKey);

  if (!rawState) {
    return false;
  }

  try {
    const state = JSON.parse(rawState);

    elements.lengthRange.value = String(
      Math.min(128, Math.max(6, Number(state.length) || 16))
    );
    elements.lengthValue.textContent = elements.lengthRange.value;
    elements.uppercase.checked = Boolean(state.uppercase);
    elements.lowercase.checked = Boolean(state.lowercase);
    elements.numbers.checked = Boolean(state.numbers);
    elements.symbols.checked = Boolean(state.symbols);

    if (
      !elements.uppercase.checked &&
      !elements.lowercase.checked &&
      !elements.numbers.checked &&
      !elements.symbols.checked
    ) {
      elements.lowercase.checked = true;
    }

    elements.symbolInput.value = sanitizeSymbols(state.symbolInput || defaults.symbols) || defaults.symbols;
    updateSymbolState();

    if (typeof state.currentPassword !== "string" || !state.currentPassword) {
      return false;
    }

    currentPassword = state.currentPassword;
    renderPassword(currentPassword);
    updateSummary(getSelectedGroups(), currentPassword);
    setFeedback("已恢复上次密码。");
    return true;
  } catch (error) {
    localStorage.removeItem(storageKey);
    return false;
  }
}

function generatePassword() {
  const groups = getSelectedGroups();
  const length = Number(elements.lengthRange.value);

  if (groups.length === 0) {
    setFeedback("没有可用字符类型。");
    return;
  }

  const requiredCharacters = groups.map((group) => ({
    value: pickCharacter(group.chars),
    type: group.type
  }));

  const characters = [...requiredCharacters];

  while (characters.length < length) {
    const selectedGroup = groups[randomIndex(groups.length)];
    characters.push({
      value: pickCharacter(selectedGroup.chars),
      type: selectedGroup.type
    });
  }

  const shuffled = shuffle(characters);
  currentPassword = shuffled.map((item) => item.value).join("");

  renderPassword(currentPassword);
  updateSummary(groups);
  saveState();
  setFeedback("已生成新密码。");
}

async function copyPassword() {
  if (!currentPassword) {
    return;
  }

  try {
    await navigator.clipboard.writeText(currentPassword);
    setFeedback("密码已复制到剪贴板。");
  } catch (error) {
    setFeedback("复制失败，请检查浏览器权限。");
  }
}

function handleLengthInput() {
  elements.lengthValue.textContent = elements.lengthRange.value;
  generatePassword();
}

function handleOptionsChange(event) {
  const valid = ensureAtLeastOneChecked(event);
  updateSymbolState();

  if (!valid) {
    return;
  }

  generatePassword();
}

function handleSymbolInput() {
  elements.symbolInput.value = sanitizeSymbols(elements.symbolInput.value);

  if (elements.symbols.checked && !elements.symbolInput.value) {
    setFeedback("特殊字符集合不能为空。");
    return;
  }

  generatePassword();
}

elements.lengthRange.addEventListener("input", handleLengthInput);
elements.refreshButton.addEventListener("click", generatePassword);
elements.copyButton.addEventListener("click", copyPassword);
elements.symbolInput.addEventListener("input", handleSymbolInput);

[elements.uppercase, elements.lowercase, elements.numbers, elements.symbols].forEach((input) => {
  input.addEventListener("change", handleOptionsChange);
});

if (!restoreState()) {
  elements.lengthValue.textContent = elements.lengthRange.value;
  updateSymbolState();
  generatePassword();
}

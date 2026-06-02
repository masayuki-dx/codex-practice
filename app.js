const STORAGE_KEY = "unit-progress-app-v1";
const SUBJECTS = ["英語", "数学", "理科", "国語", "社会"];

const form = document.getElementById("unitForm");
const dateInput = document.getElementById("dateInput");
const subjectInput = document.getElementById("subjectInput");
const unitNameInput = document.getElementById("unitNameInput");
const statusInput = document.getElementById("statusInput");
const understandingInput = document.getElementById("understandingInput");
const memoInput = document.getElementById("memoInput");
const summaryArea = document.getElementById("summaryArea");
const unitList = document.getElementById("unitList");
const totalCount = document.getElementById("totalCount");
const reviewFilterButton = document.getElementById("reviewFilterButton");
const csvButton = document.getElementById("csvButton");

let units = loadUnits();
let reviewOnly = false;

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadUnits() {
  const savedText = localStorage.getItem(STORAGE_KEY);

  if (!savedText) {
    return [];
  }

  try {
    const savedUnits = JSON.parse(savedText);
    return Array.isArray(savedUnits) ? savedUnits : [];
  } catch (error) {
    alert("保存データを読み込めませんでした。新しいデータとして開始します。");
    return [];
  }
}

function saveUnits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
}

function resetForm() {
  form.reset();
  dateInput.value = getToday();
  statusInput.value = "学習中";
  understandingInput.value = "3";
}

function addUnit(event) {
  event.preventDefault();

  const unit = {
    id: Date.now().toString(),
    date: dateInput.value,
    subject: subjectInput.value,
    unitName: unitNameInput.value.trim(),
    status: statusInput.value,
    understanding: Number(understandingInput.value),
    memo: memoInput.value.trim()
  };

  units.push(unit);
  saveUnits();
  resetForm();
  render();
}

function deleteUnit(id) {
  if (!confirm("この単元を削除しますか？")) {
    return;
  }

  units = units.filter((unit) => unit.id !== id);
  saveUnits();
  render();
}

function toggleReviewFilter() {
  reviewOnly = !reviewOnly;
  render();
}

function getSummary() {
  return SUBJECTS.map((subject) => {
    const subjectUnits = units.filter((unit) => unit.subject === subject);
    const doneCount = subjectUnits.filter((unit) => unit.status === "完了").length;
    const reviewCount = subjectUnits.filter((unit) => unit.status === "復習必要").length;

    return {
      subject,
      total: subjectUnits.length,
      done: doneCount,
      review: reviewCount
    };
  });
}

function renderSummary() {
  totalCount.textContent = `${units.length}単元`;

  summaryArea.innerHTML = getSummary().map((item) => {
    return `
      <article class="summary-card">
        <p class="summary-subject">${escapeHtml(item.subject)}</p>
        <p class="summary-number">単元 ${item.total}</p>
        <p class="summary-number">完了 ${item.done}</p>
        <p class="summary-number">復習 ${item.review}</p>
      </article>
    `;
  }).join("");
}

function renderUnitList() {
  const visibleUnits = units
    .filter((unit) => !reviewOnly || unit.status === "復習必要")
    .sort((a, b) => b.date.localeCompare(a.date));

  reviewFilterButton.classList.toggle("active", reviewOnly);
  reviewFilterButton.textContent = reviewOnly ? "すべて表示" : "復習必要だけ表示";

  if (visibleUnits.length === 0) {
    unitList.innerHTML = `<p class="empty">表示する単元がありません。</p>`;
    return;
  }

  unitList.innerHTML = visibleUnits.map((unit) => {
    return `
      <article class="unit-card">
        <div class="unit-top">
          <div>
            <h3 class="unit-title">${escapeHtml(unit.unitName)}</h3>
            <div class="unit-meta">
              <span class="badge subject">${escapeHtml(unit.subject)}</span>
              <span class="badge ${getStatusClass(unit.status)}">${escapeHtml(unit.status)}</span>
              <span class="badge not-started">${escapeHtml(unit.date)}</span>
              <span class="badge not-started">理解度 ${unit.understanding}</span>
            </div>
          </div>
          <button class="delete-button" type="button" onclick="deleteUnit('${unit.id}')">削除</button>
        </div>
        <p class="memo">${escapeHtml(unit.memo || "メモなし")}</p>
      </article>
    `;
  }).join("");
}

function getStatusClass(status) {
  if (status === "未着手") {
    return "not-started";
  }

  if (status === "学習中") {
    return "studying";
  }

  if (status === "完了") {
    return "done";
  }

  return "review";
}

function render() {
  renderSummary();
  renderUnitList();
}

function exportCsv() {
  if (units.length === 0) {
    alert("CSV出力する単元がありません。");
    return;
  }

  const header = ["日付", "教科", "単元名", "状態", "理解度", "メモ"];
  const rows = units.map((unit) => [
    unit.date,
    unit.subject,
    unit.unitName,
    unit.status,
    unit.understanding,
    unit.memo
  ]);

  const csvText = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `unit-progress-${getToday()}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

form.addEventListener("submit", addUnit);
reviewFilterButton.addEventListener("click", toggleReviewFilter);
csvButton.addEventListener("click", exportCsv);

resetForm();
render();

let cases = JSON.parse(localStorage.getItem("salesCasesV3")) || [];
let editingId = null;

const staffList = ["矢部", "早坂", "米山", "吉田"];

const elements = {
  applicationDate: document.getElementById("applicationDate"),
  staff: document.getElementById("staff"),
  status: document.getElementById("status"),
  customerName: document.getElementById("customerName"),
  propertyName: document.getElementById("propertyName"),
  contractDate: document.getElementById("contractDate"),
  startDate: document.getElementById("startDate"),
  brokerageFee: document.getElementById("brokerageFee"),
  adFee: document.getElementById("adFee"),
  splitCompany: document.getElementById("splitCompany"),
  brokeragePaymentDate: document.getElementById("brokeragePaymentDate"),
  adPaymentDate: document.getElementById("adPaymentDate"),
  notes: document.getElementById("notes"),

  monthFilter: document.getElementById("monthFilter"),
  staffFilter: document.getElementById("staffFilter"),
  statusFilter: document.getElementById("statusFilter"),
  paymentFilter: document.getElementById("paymentFilter"),
  sortOrder: document.getElementById("sortOrder"),
  searchInput: document.getElementById("searchInput"),

  caseTableBody: document.getElementById("caseTableBody"),
  staffSummaryBody: document.getElementById("staffSummaryBody"),

  applicationSales: document.getElementById("applicationSales"),
  paidSales: document.getElementById("paidSales"),
  unpaidSales: document.getElementById("unpaidSales"),
  caseCount: document.getElementById("caseCount"),

  saveBtn: document.getElementById("saveBtn"),
  resetBtn: document.getElementById("resetBtn"),
  exportExcelBtn: document.getElementById("exportExcelBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  clearFilterBtn: document.getElementById("clearFilterBtn")
};

function yen(value) {
  return "¥" + Number(value || 0).toLocaleString("ja-JP");
}

function formatDate(dateString) {
  if (!dateString) return "";
  return dateString.replaceAll("-", "/");
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function saveToLocalStorage() {
  localStorage.setItem("salesCasesV3", JSON.stringify(cases));
}

function getCaseSales(item) {
  return Number(item.brokerageFee || 0) + Number(item.adFee || 0);
}

function getPaidSales(item) {
  let total = 0;

  if (item.brokeragePaymentDate) {
    total += Number(item.brokerageFee || 0);
  }

  if (item.adPaymentDate) {
    total += Number(item.adFee || 0);
  }

  return total;
}

function getUnpaidSales(item) {
  return getCaseSales(item) - getPaidSales(item);
}

function isPaymentDone(item) {
  const brokerage = Number(item.brokerageFee || 0);
  const ad = Number(item.adFee || 0);

  const brokerageDone = brokerage === 0 || !!item.brokeragePaymentDate;
  const adDone = ad === 0 || !!item.adPaymentDate;

  return brokerageDone && adDone;
}

function resetForm() {
  editingId = null;
  elements.applicationDate.value = "";
  elements.staff.value = "矢部";
  elements.status.value = "申込中";
  elements.customerName.value = "";
  elements.propertyName.value = "";
  elements.contractDate.value = "";
  elements.startDate.value = "";
  elements.brokerageFee.value = "";
  elements.adFee.value = "";
  elements.splitCompany.value = "利用なし";
  elements.brokeragePaymentDate.value = "";
  elements.adPaymentDate.value = "";
  elements.notes.value = "";
  elements.saveBtn.textContent = "保存する";
}

function saveCase() {
  if (!elements.applicationDate.value) {
    alert("申込日を入力してください");
    return;
  }

  if (!elements.customerName.value.trim()) {
    alert("お客様名を入力してください");
    return;
  }

  const caseData = {
    id: editingId || Date.now(),
    applicationDate: elements.applicationDate.value,
    staff: elements.staff.value,
    status: elements.status.value,
    customerName: elements.customerName.value.trim(),
    propertyName: elements.propertyName.value.trim(),
    contractDate: elements.contractDate.value,
    startDate: elements.startDate.value,
    brokerageFee: Number(elements.brokerageFee.value || 0),
    adFee: Number(elements.adFee.value || 0),
    splitCompany: elements.splitCompany.value,
    brokeragePaymentDate: elements.brokeragePaymentDate.value,
    adPaymentDate: elements.adPaymentDate.value,
    notes: elements.notes.value.trim()
  };

  if (editingId) {
    cases = cases.map(item => item.id === editingId ? caseData : item);
  } else {
    cases.push(caseData);
  }

  saveToLocalStorage();
  resetForm();
  render();
}

function editCase(id) {
  const item = cases.find(caseItem => caseItem.id === id);
  if (!item) return;

  editingId = id;
  elements.applicationDate.value = item.applicationDate || "";
  elements.staff.value = item.staff || "矢部";
  elements.status.value = item.status || "申込中";
  elements.customerName.value = item.customerName || "";
  elements.propertyName.value = item.propertyName || "";
  elements.contractDate.value = item.contractDate || "";
  elements.startDate.value = item.startDate || "";
  elements.brokerageFee.value = item.brokerageFee || "";
  elements.adFee.value = item.adFee || "";
  elements.splitCompany.value = item.splitCompany || "利用なし";
  elements.brokeragePaymentDate.value = item.brokeragePaymentDate || "";
  elements.adPaymentDate.value = item.adPaymentDate || "";
  elements.notes.value = item.notes || "";

  elements.saveBtn.textContent = "更新する";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteCase(id) {
  if (!confirm("この案件を削除しますか？")) return;
  cases = cases.filter(item => item.id !== id);
  saveToLocalStorage();
  render();
}

function getFilteredCases() {
  const month = elements.monthFilter.value;
  const staff = elements.staffFilter.value;
  const status = elements.statusFilter.value;
  const payment = elements.paymentFilter.value;
  const keyword = elements.searchInput.value.trim().toLowerCase();

  let filtered = [...cases];

  if (month) {
    filtered = filtered.filter(item => item.applicationDate && item.applicationDate.startsWith(month));
  }

  if (staff !== "全員") {
    filtered = filtered.filter(item => item.staff === staff);
  }

  if (status !== "すべて") {
    filtered = filtered.filter(item => item.status === status);
  }

  if (payment === "入金済") {
    filtered = filtered.filter(item => isPaymentDone(item));
  }

  if (payment === "未入金") {
    filtered = filtered.filter(item => !isPaymentDone(item));
  }

  if (keyword) {
    filtered = filtered.filter(item =>
      (item.customerName || "").toLowerCase().includes(keyword) ||
      (item.propertyName || "").toLowerCase().includes(keyword)
    );
  }

  filtered.sort((a, b) => {
    const dateA = new Date(a.applicationDate || "1900-01-01");
    const dateB = new Date(b.applicationDate || "1900-01-01");

    return elements.sortOrder.value === "asc" ? dateA - dateB : dateB - dateA;
  });

  return filtered;
}

function renderTable(filtered) {
  elements.caseTableBody.innerHTML = "";

  if (filtered.length === 0) {
    elements.caseTableBody.innerHTML = `
      <tr>
        <td colspan="11">該当する案件がありません</td>
      </tr>
    `;
    return;
  }

  filtered.forEach(item => {
    const contractDone = !!item.contractDate;
    const paymentDone = isPaymentDone(item);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${formatDate(item.applicationDate)}</td>
      <td><span class="staff-badge staff-${item.staff}">${item.staff}</span></td>
      <td><span class="status-badge status-${item.status}">${item.status}</span></td>
      <td>${item.customerName}</td>
      <td>${item.propertyName || ""}</td>
      <td>${yen(item.brokerageFee)}</td>
      <td>${yen(item.adFee)}</td>
      <td><strong>${yen(getCaseSales(item))}</strong></td>
      <td>
        <span class="contract-badge ${contractDone ? "contract-done" : "contract-wait"}">
          ${contractDone ? "✅ 契約済" : "⏳ 契約待ち"}
        </span>
      </td>
      <td>
        <span class="payment-badge ${paymentDone ? "payment-done" : "payment-wait"}">
          ${paymentDone ? "✅ 入金済" : "⚠️ 入金待ち"}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="secondary" onclick="editCase(${item.id})">編集</button>
          <button class="danger" onclick="deleteCase(${item.id})">削除</button>
        </div>
      </td>
    `;

    elements.caseTableBody.appendChild(tr);
  });
}

function renderDashboard(filtered) {
  const applicationSales = filtered.reduce((sum, item) => sum + getCaseSales(item), 0);
  const paidSales = filtered.reduce((sum, item) => sum + getPaidSales(item), 0);
  const unpaidSales = applicationSales - paidSales;

  elements.applicationSales.textContent = yen(applicationSales);
  elements.paidSales.textContent = yen(paidSales);
  elements.unpaidSales.textContent = yen(unpaidSales);
  elements.caseCount.textContent = `${filtered.length}件`;
}

function renderStaffSummary(filtered) {
  elements.staffSummaryBody.innerHTML = "";

  staffList.forEach(staff => {
    const staffCases = filtered.filter(item => item.staff === staff);

    const applicationSales = staffCases.reduce((sum, item) => sum + getCaseSales(item), 0);
    const paidSales = staffCases.reduce((sum, item) => sum + getPaidSales(item), 0);
    const unpaidSales = applicationSales - paidSales;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><span class="staff-badge staff-${staff}">${staff}</span></td>
      <td>${staffCases.length}件</td>
      <td>${yen(applicationSales)}</td>
      <td>${yen(paidSales)}</td>
      <td>${yen(unpaidSales)}</td>
    `;

    elements.staffSummaryBody.appendChild(tr);
  });
}

function render() {
  const filtered = getFilteredCases();
  renderDashboard(filtered);
  renderTable(filtered);
  renderStaffSummary(filtered);
}

function clearFilters() {
  elements.monthFilter.value = getCurrentMonth();
  elements.staffFilter.value = "全員";
  elements.statusFilter.value = "すべて";
  elements.paymentFilter.value = "すべて";
  elements.sortOrder.value = "desc";
  elements.searchInput.value = "";
  render();
}

function makeExportRows(filtered) {
  return filtered.map(item => ({
    "申込日": formatDate(item.applicationDate),
    "担当者": item.staff,
    "ステータス": item.status,
    "お客様名": item.customerName,
    "物件名": item.propertyName,
    "契約日": formatDate(item.contractDate),
    "契約開始日": formatDate(item.startDate),
    "仲介手数料": item.brokerageFee,
    "AD": item.adFee,
    "案件売上": getCaseSales(item),
    "仲介入金日": formatDate(item.brokeragePaymentDate),
    "AD入金日": formatDate(item.adPaymentDate),
    "入金済売上": getPaidSales(item),
    "未入金売上": getUnpaidSales(item),
    "分割": item.splitCompany,
    "備考": item.notes
  }));
}

function exportCsv() {
  const filtered = getFilteredCases();
  const rows = makeExportRows(filtered);

  if (rows.length === 0) {
    alert("出力するデータがありません");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(header => `"${String(row[header] ?? "").replaceAll('"', '""')}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `売上管理_${elements.monthFilter.value || "全期間"}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

function exportExcel() {
  const filtered = getFilteredCases();

  if (filtered.length === 0) {
    alert("出力するデータがありません");
    return;
  }

  const workbook = XLSX.utils.book_new();

  const caseRows = makeExportRows(filtered);
  const caseSheet = XLSX.utils.json_to_sheet(caseRows);
  XLSX.utils.book_append_sheet(workbook, caseSheet, "案件一覧");

  const applicationSales = filtered.reduce((sum, item) => sum + getCaseSales(item), 0);
  const paidSales = filtered.reduce((sum, item) => sum + getPaidSales(item), 0);
  const unpaidSales = applicationSales - paidSales;

  const summaryRows = [
    ["対象月", elements.monthFilter.value || "全期間"],
    ["案件数", filtered.length],
    ["申込ベース売上", applicationSales],
    ["入金済売上", paidSales],
    ["未入金売上", unpaidSales]
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "月間集計");

  const staffRows = staffList.map(staff => {
    const staffCases = filtered.filter(item => item.staff === staff);
    const staffApplicationSales = staffCases.reduce((sum, item) => sum + getCaseSales(item), 0);
    const staffPaidSales = staffCases.reduce((sum, item) => sum + getPaidSales(item), 0);

    return {
      "担当者": staff,
      "件数": staffCases.length,
      "申込ベース売上": staffApplicationSales,
      "入金済売上": staffPaidSales,
      "未入金売上": staffApplicationSales - staffPaidSales
    };
  });

  const staffSheet = XLSX.utils.json_to_sheet(staffRows);
  XLSX.utils.book_append_sheet(workbook, staffSheet, "担当者別集計");

  const paidRows = filtered
    .filter(item => getPaidSales(item) > 0)
    .map(item => ({
      "申込日": formatDate(item.applicationDate),
      "担当者": item.staff,
      "お客様名": item.customerName,
      "物件名": item.propertyName,
      "仲介手数料": item.brokerageFee,
      "AD": item.adFee,
      "仲介入金日": formatDate(item.brokeragePaymentDate),
      "AD入金日": formatDate(item.adPaymentDate),
      "入金済売上": getPaidSales(item)
    }));

  const paidSheet = XLSX.utils.json_to_sheet(paidRows);
  XLSX.utils.book_append_sheet(workbook, paidSheet, "入金済売上表");

  XLSX.writeFile(workbook, `姫なび賃貸_売上管理_${elements.monthFilter.value || "全期間"}.xlsx`);
}

elements.saveBtn.addEventListener("click", saveCase);
elements.resetBtn.addEventListener("click", resetForm);
elements.exportCsvBtn.addEventListener("click", exportCsv);
elements.exportExcelBtn.addEventListener("click", exportExcel);
elements.clearFilterBtn.addEventListener("click", clearFilters);

[
  elements.monthFilter,
  elements.staffFilter,
  elements.statusFilter,
  elements.paymentFilter,
  elements.sortOrder,
  elements.searchInput
].forEach(element => {
  element.addEventListener("input", render);
  element.addEventListener("change", render);
});

elements.monthFilter.value = getCurrentMonth();
render();
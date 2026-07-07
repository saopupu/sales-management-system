const form = document.getElementById("salesForm");
const editIndexInput = document.getElementById("editIndex");
const submitButton = document.getElementById("submitButton");
const clearButton = document.getElementById("clearButton");
const searchInput = document.getElementById("searchInput");
const monthFilter = document.getElementById("monthFilter");
const showAllButton = document.getElementById("showAllButton");
const csvButton = document.getElementById("csvButton");
const excelButton = document.getElementById("excelButton");

const totalSales = document.getElementById("totalSales");
const totalFee = document.getElementById("totalFee");
const totalAd = document.getElementById("totalAd");
const totalCount = document.getElementById("totalCount");
const unpaidFeeCount = document.getElementById("unpaidFeeCount");
const unpaidAdCount = document.getElementById("unpaidAdCount");
const staffSummary = document.getElementById("staffSummary");
const salesTableBody = document.getElementById("salesTableBody");

let salesData = JSON.parse(localStorage.getItem("salesData")) || [];

function yen(num) {
  return Number(num || 0).toLocaleString() + "円";
}

function saveData() {
  localStorage.setItem("salesData", JSON.stringify(salesData));
}

function getCurrentMonth() {
  const today = new Date();
  return today.toISOString().slice(0, 7);
}

monthFilter.value = getCurrentMonth();

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const sale = {
    applyDate: document.getElementById("applyDate").value,
    contractDate: document.getElementById("contractDate").value,
    startDate: document.getElementById("startDate").value,
    staff: document.getElementById("staff").value,
    customer: document.getElementById("customer").value,
    phone: document.getElementById("phone").value,
    property: document.getElementById("property").value,
    company: document.getElementById("company").value,
    rent: Number(document.getElementById("rent").value) || 0,
    managementFee: Number(document.getElementById("managementFee").value) || 0,
    ad: Number(document.getElementById("ad").value) || 0,
    adPaymentDate: document.getElementById("adPaymentDate").value,
    brokerageFee: Number(document.getElementById("brokerageFee").value) || 0,
    feePaymentDate: document.getElementById("feePaymentDate").value,
    installment: document.getElementById("installment").value,
    status: document.getElementById("status").value,
    memo: document.getElementById("memo").value
  };

  const editIndex = editIndexInput.value;

  if (editIndex === "") {
    salesData.push(sale);
  } else {
    salesData[editIndex] = sale;
    editIndexInput.value = "";
    submitButton.textContent = "登録する";
  }

  saveData();
  form.reset();
  render();
});

clearButton.addEventListener("click", function () {
  form.reset();
  editIndexInput.value = "";
  submitButton.textContent = "登録する";
});

searchInput.addEventListener("input", render);
monthFilter.addEventListener("change", render);

showAllButton.addEventListener("click", function () {
  monthFilter.value = "";
  render();
});

csvButton.addEventListener("click", function () {
  downloadCSV("sales-data.csv");
});

excelButton.addEventListener("click", function () {
  downloadCSV("sales-data-excel.csv");
});

function getFilteredData() {
  const keyword = searchInput.value.toLowerCase();
  const selectedMonth = monthFilter.value;

  return salesData.filter(function (sale) {
    const monthTarget = sale.contractDate || sale.applyDate || "";

    if (selectedMonth && !monthTarget.startsWith(selectedMonth)) {
      return false;
    }

    const targetText = `
      ${sale.applyDate}
      ${sale.contractDate}
      ${sale.startDate}
      ${sale.staff}
      ${sale.customer}
      ${sale.phone}
      ${sale.property}
      ${sale.company}
      ${sale.installment}
      ${sale.status}
      ${sale.adPaymentDate}
      ${sale.feePaymentDate}
      ${sale.memo}
    `.toLowerCase();

    return targetText.includes(keyword);
  });
}

function downloadCSV(filename) {
  const data = getFilteredData();

  if (data.length === 0) {
    alert("出力するデータがありません。");
    return;
  }

  const headers = [
    "申込日",
    "契約日",
    "契約開始日",
    "担当",
    "お客様名",
    "電話番号",
    "物件名",
    "管理会社",
    "家賃",
    "管理費",
    "AD",
    "AD入金日",
    "仲介手数料",
    "仲介入金日",
    "合計売上",
    "分割",
    "状態",
    "備考"
  ];

  const rows = data.map(function (sale) {
    const brokerageFee = Number(sale.brokerageFee) || 0;
    const ad = Number(sale.ad) || 0;

    return [
      sale.applyDate || "",
      sale.contractDate || "",
      sale.startDate || "",
      sale.staff || "",
      sale.customer || "",
      sale.phone || "",
      sale.property || "",
      sale.company || "",
      sale.rent || 0,
      sale.managementFee || 0,
      sale.ad || 0,
      sale.adPaymentDate || "",
      sale.brokerageFee || 0,
      sale.feePaymentDate || "",
      brokerageFee + ad,
      sale.installment || "利用なし",
      sale.status || "",
      sale.memo || ""
    ];
  });

  let csvContent = "\uFEFF";
  csvContent += headers.join(",") + "\n";

  rows.forEach(function (row) {
    csvContent += row.map(csvEscape).join(",") + "\n";
  });

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

function csvEscape(value) {
  const text = String(value ?? "");

  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return '"' + text.replace(/"/g, '""') + '"';
  }

  return text;
}

function render() {
  const filteredData = getFilteredData();

  let totalBrokerageFee = 0;
  let totalAdAmount = 0;
  let totalAmount = 0;
  let feeUnpaid = 0;
  let adUnpaid = 0;

  const staffTotals = {
    矢部: 0,
    早坂: 0,
    米山: 0,
    吉田: 0
  };

  salesTableBody.innerHTML = "";

  filteredData.forEach(function (sale) {
    const originalIndex = salesData.indexOf(sale);

    const brokerageFee = Number(sale.brokerageFee) || 0;
    const ad = Number(sale.ad) || 0;
    const rowTotal = brokerageFee + ad;

    totalBrokerageFee += brokerageFee;
    totalAdAmount += ad;
    totalAmount += rowTotal;

    if (brokerageFee > 0 && !sale.feePaymentDate) feeUnpaid++;
    if (ad > 0 && !sale.adPaymentDate) adUnpaid++;

    if (staffTotals[sale.staff] !== undefined) {
      staffTotals[sale.staff] += rowTotal;
    }

    const adPaymentText = sale.adPaymentDate
      ? `<span class="paid">${sale.adPaymentDate}</span>`
      : `<span class="unpaid">未入金</span>`;

    const feePaymentText = sale.feePaymentDate
      ? `<span class="paid">${sale.feePaymentDate}</span>`
      : `<span class="unpaid">未入金</span>`;

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${sale.applyDate || ""}</td>
      <td>${sale.contractDate || ""}</td>
      <td>${sale.startDate || ""}</td>
      <td>${sale.staff || ""}</td>
      <td>${sale.customer || ""}</td>
      <td>${sale.phone || ""}</td>
      <td>${sale.property || ""}</td>
      <td>${sale.company || ""}</td>
      <td>${yen(sale.rent)}</td>
      <td>${yen(sale.managementFee)}</td>
      <td>${yen(sale.ad)}</td>
      <td>${adPaymentText}</td>
      <td>${yen(sale.brokerageFee)}</td>
      <td>${feePaymentText}</td>
      <td>${sale.installment || "利用なし"}</td>
      <td><span class="status status-${sale.status || "申込"}">${sale.status || ""}</span></td>
      <td>${sale.memo || ""}</td>
      <td>
        <div class="action-buttons">
          <button class="edit-btn" onclick="editSale(${originalIndex})">編集</button>
          <button class="delete-btn" onclick="deleteSale(${originalIndex})">削除</button>
        </div>
      </td>
    `;

    salesTableBody.appendChild(tr);
  });

  totalSales.textContent = yen(totalAmount);
  totalFee.textContent = yen(totalBrokerageFee);
  totalAd.textContent = yen(totalAdAmount);
  totalCount.textContent = filteredData.length + "件";
  unpaidFeeCount.textContent = feeUnpaid + "件";
  unpaidAdCount.textContent = adUnpaid + "件";

  staffSummary.innerHTML = "";

  for (const staff in staffTotals) {
    const div = document.createElement("div");
    div.className = "staff-card";
    div.innerHTML = `
      <span>${staff}</span>
      <strong>${yen(staffTotals[staff])}</strong>
    `;
    staffSummary.appendChild(div);
  }
}

function editSale(index) {
  const sale = salesData[index];

  document.getElementById("applyDate").value = sale.applyDate || "";
  document.getElementById("contractDate").value = sale.contractDate || "";
  document.getElementById("startDate").value = sale.startDate || "";
  document.getElementById("staff").value = sale.staff || "";
  document.getElementById("customer").value = sale.customer || "";
  document.getElementById("phone").value = sale.phone || "";
  document.getElementById("property").value = sale.property || "";
  document.getElementById("company").value = sale.company || "";
  document.getElementById("rent").value = sale.rent || "";
  document.getElementById("managementFee").value = sale.managementFee || "";
  document.getElementById("ad").value = sale.ad || "";
  document.getElementById("adPaymentDate").value = sale.adPaymentDate || "";
  document.getElementById("brokerageFee").value = sale.brokerageFee || "";
  document.getElementById("feePaymentDate").value = sale.feePaymentDate || "";
  document.getElementById("installment").value = sale.installment || "利用なし";
  document.getElementById("status").value = sale.status || "申込";
  document.getElementById("memo").value = sale.memo || "";

  editIndexInput.value = index;
  submitButton.textContent = "更新する";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteSale(index) {
  const ok = confirm("このデータを削除しますか？");

  if (ok) {
    salesData.splice(index, 1);
    saveData();
    render();
  }
}

render();
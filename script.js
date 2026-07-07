const form = document.getElementById("salesForm");
const editIndexInput = document.getElementById("editIndex");
const submitButton = document.getElementById("submitButton");
const clearButton = document.getElementById("clearButton");
const searchInput = document.getElementById("searchInput");
const monthFilter = document.getElementById("monthFilter");
const showAllButton = document.getElementById("showAllButton");

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
    brokerageFee: Number(document.getElementById("brokerageFee").value) || 0,
    installment: document.getElementById("installment").value,
    status: document.getElementById("status").value,
    feePaid: document.getElementById("feePaid").checked,
    adPaid: document.getElementById("adPaid").checked,
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

function render() {
  const keyword = searchInput.value.toLowerCase();
  const selectedMonth = monthFilter.value;

  let totalBrokerageFee = 0;
  let totalAdAmount = 0;
  let totalAmount = 0;
  let feeUnpaid = 0;
  let adUnpaid = 0;
  let visibleCount = 0;

  const staffTotals = {
    矢部: 0,
    早坂: 0,
    米山: 0,
    吉田: 0
  };

  salesTableBody.innerHTML = "";

  salesData.forEach(function (sale, index) {
    const monthTarget = sale.contractDate || sale.applyDate || "";

    if (selectedMonth && !monthTarget.startsWith(selectedMonth)) {
      return;
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
      ${sale.memo}
    `.toLowerCase();

    if (!targetText.includes(keyword)) return;

    visibleCount++;

    const brokerageFee = Number(sale.brokerageFee) || 0;
    const ad = Number(sale.ad) || 0;
    const rowTotal = brokerageFee + ad;

    totalBrokerageFee += brokerageFee;
    totalAdAmount += ad;
    totalAmount += rowTotal;

    if (brokerageFee > 0 && !sale.feePaid) feeUnpaid++;
    if (ad > 0 && !sale.adPaid) adUnpaid++;

    if (staffTotals[sale.staff] !== undefined) {
      staffTotals[sale.staff] += rowTotal;
    }

    const feePaidText = sale.feePaid
      ? `<span class="paid">済</span>`
      : `<span class="unpaid">未</span>`;

    const adPaidText = sale.adPaid
      ? `<span class="paid">済</span>`
      : `<span class="unpaid">未</span>`;

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
      <td>${yen(sale.ad)}</td>
      <td>${yen(sale.brokerageFee)}</td>
      <td>${sale.installment || "利用なし"}</td>
      <td>${feePaidText}</td>
      <td>${adPaidText}</td>
      <td><span class="status status-${sale.status || "申込"}">${sale.status || ""}</span></td>
      <td>
        <div class="action-buttons">
          <button class="edit-btn" onclick="editSale(${index})">編集</button>
          <button class="delete-btn" onclick="deleteSale(${index})">削除</button>
        </div>
      </td>
    `;

    salesTableBody.appendChild(tr);
  });

  totalSales.textContent = yen(totalAmount);
  totalFee.textContent = yen(totalBrokerageFee);
  totalAd.textContent = yen(totalAdAmount);
  totalCount.textContent = visibleCount + "件";
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
  document.getElementById("brokerageFee").value = sale.brokerageFee || "";
  document.getElementById("installment").value = sale.installment || "利用なし";
  document.getElementById("status").value = sale.status || "申込";
  document.getElementById("feePaid").checked = sale.feePaid || false;
  document.getElementById("adPaid").checked = sale.adPaid || false;
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
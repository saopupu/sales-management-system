function render() {
  const data = getFilteredData();

  renderDashboard(data);
  renderStaffSummary(data);
  renderTable(data);
}

function getFilteredData() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const selectedMonth = document.getElementById("monthFilter").value;
  const data = getSalesData();

  return data.filter(function (sale) {
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

function renderDashboard(data) {
  let totalBrokerageFee = 0;
  let totalAd = 0;
  let totalSales = 0;
  let unpaidFeeCount = 0;
  let unpaidAdCount = 0;

  data.forEach(function (sale) {
    const brokerageFeeTaxIncluded = calculateBrokerageFee(
      sale.brokerageFee,
      sale.brokerageTaxType
    );

    const ad = Number(sale.ad) || 0;

    totalBrokerageFee += brokerageFeeTaxIncluded;
    totalAd += ad;
    totalSales += brokerageFeeTaxIncluded + ad;

    if (brokerageFeeTaxIncluded > 0 && !sale.feePaymentDate) {
      unpaidFeeCount++;
    }

    if (ad > 0 && !sale.adPaymentDate) {
      unpaidAdCount++;
    }
  });

  document.getElementById("totalSales").textContent = formatYen(totalSales);
  document.getElementById("totalFee").textContent = formatYen(totalBrokerageFee);
  document.getElementById("totalAd").textContent = formatYen(totalAd);
  document.getElementById("totalCount").textContent = data.length + "件";
  document.getElementById("unpaidFeeCount").textContent = unpaidFeeCount + "件";
  document.getElementById("unpaidAdCount").textContent = unpaidAdCount + "件";
}

function renderStaffSummary(data) {
  const staffSummary = document.getElementById("staffSummary");

  const staffTotals = {
    矢部: 0,
    早坂: 0,
    米山: 0,
    吉田: 0
  };

  data.forEach(function (sale) {
    const brokerageFeeTaxIncluded = calculateBrokerageFee(
      sale.brokerageFee,
      sale.brokerageTaxType
    );

    const ad = Number(sale.ad) || 0;
    const rowTotal = brokerageFeeTaxIncluded + ad;

    if (staffTotals[sale.staff] !== undefined) {
      staffTotals[sale.staff] += rowTotal;
    }
  });

  staffSummary.innerHTML = "";

  for (const staff in staffTotals) {
    const div = document.createElement("div");
    div.className = "staff-card";

    div.innerHTML = `
      <span>${staff}</span>
      <strong>${formatYen(staffTotals[staff])}</strong>
    `;

    staffSummary.appendChild(div);
  }
}
function renderTable(data) {
  const salesTableBody = document.getElementById("salesTableBody");
  const allData = getSalesData();

  salesTableBody.innerHTML = "";

  data.forEach(function (sale) {
    const originalIndex = allData.indexOf(sale);

    const brokerageFeeTaxIncluded = calculateBrokerageFee(
      sale.brokerageFee,
      sale.brokerageTaxType
    );

    const adPaymentText = sale.adPaymentDate
      ? `<span class="paid">${sale.adPaymentDate}</span>`
      : `<span class="unpaid">未入金</span>`;

    const feePaymentText = sale.feePaymentDate
      ? `<span class="paid">${sale.feePaymentDate}</span>`
      : `<span class="unpaid">未入金</span>`;

    const taxTypeText =
      sale.brokerageTaxType === "taxIncluded" ? "税込入力" : "税抜入力";

    const tr = document.createElement("tr");
tr.className = `case-row status-${sale.status || "申込"}`;
    tr.innerHTML = `
      <td>${sale.applyDate || ""}</td>
      <td>${sale.contractDate || ""}</td>
      <td>${sale.startDate || ""}</td>
      <td><span class="staff-badge staff-${sale.staff || ""}">${sale.staff || ""}</span></td>
      <td>${sale.customer || ""}</td>
      <td>${sale.phone || ""}</td>
      <td>${sale.property || ""}</td>
      <td>${sale.company || ""}</td>
      <td>${formatYen(sale.rent)}</td>
      <td>${formatYen(sale.managementFee)}</td>
      <td>${formatYen(sale.ad)}</td>
      <td>${adPaymentText}</td>
      <td>${formatYen(sale.brokerageFee)}</td>
      <td>${taxTypeText}</td>
      <td>${formatYen(brokerageFeeTaxIncluded)}</td>
      <td>${feePaymentText}</td>
      <td>${sale.installment || "利用なし"}</td>
     <td><span class="status-badge status-${sale.status || "申込"}">${sale.status || "申込"}</span></td>
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
}
function editSale(index) {
  const sale = getSalesData()[index];

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
  document.getElementById("brokerageTaxType").value = sale.brokerageTaxType || "taxExcluded";
  document.getElementById("feePaymentDate").value = sale.feePaymentDate || "";
  document.getElementById("installment").value = sale.installment || "利用なし";
  document.getElementById("status").value = sale.status || "申込";
  document.getElementById("memo").value = sale.memo || "";

  document.getElementById("editIndex").value = index;
  document.getElementById("submitButton").textContent = "更新する";

  updateTaxPreview();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function deleteSale(index) {
  const ok = confirm("このデータを削除しますか？");

  if (ok) {
    deleteSaleData(index);
    render();
  }
}
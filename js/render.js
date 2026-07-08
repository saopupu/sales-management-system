function render() {
  const data = getFilteredData();

  renderDashboard(data);
  renderStaffSummary();
  renderTable(data);
}

function getKeyword() {
  return document.getElementById("searchInput").value.toLowerCase();
}

function getSelectedMonth() {
  return document.getElementById("monthFilter").value;
}

function isSameMonth(dateText, selectedMonth) {
  if (!selectedMonth) {
    return true;
  }

  return dateText && dateText.startsWith(selectedMonth);
}

function matchesKeyword(sale, keyword) {
  const targetText = `
    ${sale.applyDate || ""}
    ${sale.contractDate || ""}
    ${sale.startDate || ""}
    ${sale.staff || ""}
    ${sale.customer || ""}
    ${sale.phone || ""}
    ${sale.property || ""}
    ${sale.company || ""}
    ${sale.installment || ""}
    ${sale.status || ""}
    ${sale.adPaymentDate || ""}
    ${sale.feePaymentDate || ""}
    ${sale.memo || ""}
  `.toLowerCase();

  return targetText.includes(keyword);
}

function getFilteredData() {
  const keyword = getKeyword();
  const selectedMonth = getSelectedMonth();
  const data = getSalesData();

  return data.filter(function (sale) {
    const monthTarget = sale.contractDate || sale.applyDate || "";

    if (selectedMonth && !monthTarget.startsWith(selectedMonth)) {
      return false;
    }

    return matchesKeyword(sale, keyword);
  });
}

function setText(id, text) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = text;
  }
}

function isStatus(sale, statusName) {
  const status = sale.status || "申込";
  const hasFeePayment = !!sale.feePaymentDate;
  const hasAdPayment = !!sale.adPaymentDate;

  if (statusName === "入金済み") {
    return hasFeePayment || hasAdPayment;
  }

  if (statusName === "契約済み") {
    return status === "契約済み" || status === "契約済";
  }

  if (statusName === "申込") {
    return status === "申込";
  }

  if (statusName === "審査落ち") {
    return status === "審査落ち";
  }

  if (statusName === "キャンセル") {
    return status === "キャンセル";
  }

  return status === statusName;
}

function getSaleTotal(sale) {
  const fee = calculateBrokerageFee(
    sale.brokerageFee,
    sale.brokerageTaxType
  );

  const ad = Number(sale.ad) || 0;

  return fee + ad;
}

function getTaxTypeText(taxType) {
  if (taxType === "free") {
    return "自由入力";
  }

  if (taxType === "taxIncluded") {
    return "税込入力";
  }

  return "税抜入力";
}

function renderDashboard(data) {
  let totalBrokerageFee = 0;
  let totalAd = 0;
  let totalSales = 0;
  let unpaidFeeCount = 0;
  let unpaidAdCount = 0;

  data.forEach(function (sale) {
    const fee = calculateBrokerageFee(
      sale.brokerageFee,
      sale.brokerageTaxType
    );

    const ad = Number(sale.ad) || 0;

    totalBrokerageFee += fee;
    totalAd += ad;
    totalSales += fee + ad;

    if (fee > 0 && !sale.feePaymentDate) {
      unpaidFeeCount++;
    }

    if (ad > 0 && !sale.adPaymentDate) {
      unpaidAdCount++;
    }
  });

  const applyCount = data.filter(function (sale) {
    return isStatus(sale, "申込");
  }).length;

  const contractCount = data.filter(function (sale) {
    return isStatus(sale, "契約済み");
  }).length;

  const rejectedCount = data.filter(function (sale) {
    return isStatus(sale, "審査落ち");
  }).length;

  const cancelCount = data.filter(function (sale) {
    return isStatus(sale, "キャンセル");
  }).length;

  setText("totalSales", formatYen(totalSales));
  setText("totalFee", formatYen(totalBrokerageFee));
  setText("totalAd", formatYen(totalAd));
  setText("totalCount", data.length + "件");
  setText("unpaidFeeCount", unpaidFeeCount + "件");
  setText("unpaidAdCount", unpaidAdCount + "件");
  setText("dashApplyCount", applyCount + "件");
  setText("dashContractCount", contractCount + "件");
  setText("dashRejectedCount", rejectedCount + "件");
  setText("dashCancelCount", cancelCount + "件");
}

function renderStaffSummary() {
  const staffSummary = document.getElementById("staffSummary");
  const allData = getSalesData();
  const selectedMonth = getSelectedMonth();
  const keyword = getKeyword();

  const staffTotals = {
    矢部: {
      applicationBase: 0,
      paymentBase: 0
    },
    早坂: {
      applicationBase: 0,
      paymentBase: 0
    },
    米山: {
      applicationBase: 0,
      paymentBase: 0
    },
    吉田: {
      applicationBase: 0,
      paymentBase: 0
    }
  };

  allData.forEach(function (sale) {
    if (!matchesKeyword(sale, keyword)) {
      return;
    }

    if (staffTotals[sale.staff] === undefined) {
      return;
    }

    const fee = calculateBrokerageFee(
      sale.brokerageFee,
      sale.brokerageTaxType
    );

    const ad = Number(sale.ad) || 0;

    const applicationMonthTarget = sale.applyDate || sale.contractDate || "";

    if (isSameMonth(applicationMonthTarget, selectedMonth)) {
      staffTotals[sale.staff].applicationBase += fee + ad;
    }

    if (fee > 0 && isSameMonth(sale.feePaymentDate, selectedMonth)) {
      staffTotals[sale.staff].paymentBase += fee;
    }

    if (ad > 0 && isSameMonth(sale.adPaymentDate, selectedMonth)) {
      staffTotals[sale.staff].paymentBase += ad;
    }
  });

  staffSummary.innerHTML = "";

  for (const staff in staffTotals) {
    const div = document.createElement("div");
    div.className = "staff-card";

    div.innerHTML = `
      <span>${staff}</span>
      <strong>${formatYen(staffTotals[staff].applicationBase)}</strong>
      <small>申込ベース</small>
      <strong>${formatYen(staffTotals[staff].paymentBase)}</strong>
      <small>入金ベース</small>
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

    const status = sale.status || "申込";

    const tr = document.createElement("tr");
    tr.className = `case-row status-${status}`;

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
      <td>${getTaxTypeText(sale.brokerageTaxType)}</td>
      <td>${formatYen(brokerageFeeTaxIncluded)}</td>
      <td>${feePaymentText}</td>
      <td>${sale.installment || "利用なし"}</td>
      <td><span class="status-badge status-${status}">${status}</span></td>
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
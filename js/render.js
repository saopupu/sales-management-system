function render() {
  const data = getFilteredData();

  renderDashboard(data);
  renderBossDashboard(data);
  renderStaffSummary(data);
  renderTable(data);
}

function getKeyword() {
  return document.getElementById("searchInput").value.toLowerCase();
}

function getSelectedMonth() {
  return document.getElementById("monthFilter").value;
}

/* =========================
   月判定
========================= */

// 案件一覧・契約件数用：契約日ベース
function getCaseMonth(sale) {
  const date = sale.contractDate || "";
  return date ? date.slice(0, 7) : "";
}

// 仲介手数料売上用：仲介手数料入金日ベース
function getFeePaymentMonth(sale) {
  const date = sale.feePaymentDate || "";
  return date ? date.slice(0, 7) : "";
}

// AD売上用：AD入金日ベース
function getAdPaymentMonth(sale) {
  const date = sale.adPaymentDate || "";
  return date ? date.slice(0, 7) : "";
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

// 案件一覧は契約日ベースで絞り込み
function getFilteredData() {
  const keyword = getKeyword();
  const selectedMonth = getSelectedMonth();
  const data = getSalesData();

  return data.filter(function (sale) {
    const caseMonth = getCaseMonth(sale);

    if (selectedMonth && caseMonth !== selectedMonth) {
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

function isContractStatus(sale) {
  const status = sale.status || "申込";
  return status === "契約済" || status === "契約済み";
}

function isStatus(sale, statusName) {
  const status = sale.status || "申込";

  if (statusName === "契約済み") {
    return isContractStatus(sale);
  }

  return status === statusName;
}

function getBrokerageFee(sale) {
  return calculateBrokerageFee(
    sale.brokerageFee,
    sale.brokerageTaxType
  );
}

function getAd(sale) {
  return Number(sale.ad) || 0;
}

// 申込・契約ベースの売上見込み
function getSaleTotal(sale) {
  return getBrokerageFee(sale) + getAd(sale);
}

// 選択月の入金売上
function getMonthlyPaymentTotal(sale, selectedMonth) {
  let total = 0;

  if (!selectedMonth) {
    if (sale.feePaymentDate) {
      total += getBrokerageFee(sale);
    }

    if (sale.adPaymentDate) {
      total += getAd(sale);
    }

    return total;
  }

  if (getFeePaymentMonth(sale) === selectedMonth) {
    total += getBrokerageFee(sale);
  }

  if (getAdPaymentMonth(sale) === selectedMonth) {
    total += getAd(sale);
  }

  return total;
}

function getMonthlyFeePayment(sale, selectedMonth) {
  if (!sale.feePaymentDate) {
    return 0;
  }

  if (!selectedMonth || getFeePaymentMonth(sale) === selectedMonth) {
    return getBrokerageFee(sale);
  }

  return 0;
}

function getMonthlyAdPayment(sale, selectedMonth) {
  if (!sale.adPaymentDate) {
    return 0;
  }

  if (!selectedMonth || getAdPaymentMonth(sale) === selectedMonth) {
    return getAd(sale);
  }

  return 0;
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

function createStaffData() {
  return {
    矢部: {
      applyCount: 0,
      contractCount: 0,
      rejectedCount: 0,
      cancelCount: 0,
      applicationSales: 0,
      paymentSales: 0,
      unpaidAmount: 0
    },
    早坂: {
      applyCount: 0,
      contractCount: 0,
      rejectedCount: 0,
      cancelCount: 0,
      applicationSales: 0,
      paymentSales: 0,
      unpaidAmount: 0
    },
    米山: {
      applyCount: 0,
      contractCount: 0,
      rejectedCount: 0,
      cancelCount: 0,
      applicationSales: 0,
      paymentSales: 0,
      unpaidAmount: 0
    },
    吉田: {
      applyCount: 0,
      contractCount: 0,
      rejectedCount: 0,
      cancelCount: 0,
      applicationSales: 0,
      paymentSales: 0,
      unpaidAmount: 0
    }
  };
}

/* =========================
   ダッシュボード
========================= */

function renderDashboard(data) {
  const selectedMonth = getSelectedMonth();

  let totalBrokerageFee = 0;
  let totalAd = 0;
  let totalSales = 0;
  let unpaidFeeCount = 0;
  let unpaidAdCount = 0;

  data.forEach(function (sale) {
    const fee = getBrokerageFee(sale);
    const ad = getAd(sale);

    // 売上は入金日ベース
    totalBrokerageFee += getMonthlyFeePayment(sale, selectedMonth);
    totalAd += getMonthlyAdPayment(sale, selectedMonth);
    totalSales += getMonthlyPaymentTotal(sale, selectedMonth);

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

function renderBossDashboard(data) {
  const selectedMonth = getSelectedMonth();

  let applicationSales = 0;
  let paymentSales = 0;
  let unpaidFeeCount = 0;
  let unpaidFeeAmount = 0;
  let unpaidAdCount = 0;
  let unpaidAdAmount = 0;

  data.forEach(function (sale) {
    const fee = getBrokerageFee(sale);
    const ad = getAd(sale);

    // 申込売上は表示中の契約案件ベース
    applicationSales += fee + ad;

    // 入金売上は入金日ベース
    paymentSales += getMonthlyPaymentTotal(sale, selectedMonth);

    if (fee > 0 && !sale.feePaymentDate) {
      unpaidFeeCount++;
      unpaidFeeAmount += fee;
    }

    if (ad > 0 && !sale.adPaymentDate) {
      unpaidAdCount++;
      unpaidAdAmount += ad;
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

  setText("bossApplicationSales", formatYen(applicationSales));
  setText("bossPaymentSales", formatYen(paymentSales));
  setText("bossApplyCount", applyCount + "件");
  setText("bossContractCount", contractCount + "件");
  setText("bossRejectedCount", rejectedCount + "件");
  setText("bossCancelCount", cancelCount + "件");
  setText("bossUnpaidFee", unpaidFeeCount + "件 / " + formatYen(unpaidFeeAmount));
  setText("bossUnpaidAd", unpaidAdCount + "件 / " + formatYen(unpaidAdAmount));

  renderStaffRanking(data);
}

function renderStaffRanking(data) {
  const rankingArea = document.getElementById("staffRanking");
  const selectedMonth = getSelectedMonth();

  if (!rankingArea) {
    return;
  }

  const staffTotals = createStaffData();

  data.forEach(function (sale) {
    if (!staffTotals[sale.staff]) {
      return;
    }

    // ランキングは入金売上ベース
    staffTotals[sale.staff].paymentSales += getMonthlyPaymentTotal(sale, selectedMonth);
  });

  const ranking = Object.keys(staffTotals).sort(function (a, b) {
    return staffTotals[b].paymentSales - staffTotals[a].paymentSales;
  });

  let html = "";

  ranking.forEach(function (staff, index) {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "④";

    html += `
      <div class="ranking-row">
        <span>${medal} ${staff}</span>
        <strong>${formatYen(staffTotals[staff].paymentSales)}</strong>
      </div>
    `;
  });

  rankingArea.innerHTML = html;
}

/* =========================
   担当者別集計
========================= */

function renderStaffSummary(data) {
  const staffSummary = document.getElementById("staffSummary");
  const staffTotals = createStaffData();
  const selectedMonth = getSelectedMonth();

  data.forEach(function (sale) {
    if (!staffTotals[sale.staff]) {
      return;
    }

    const total = getSaleTotal(sale);
    const paymentTotal = getMonthlyPaymentTotal(sale, selectedMonth);

    if (isStatus(sale, "申込")) {
      staffTotals[sale.staff].applyCount++;
    }

    if (isStatus(sale, "契約済み")) {
      staffTotals[sale.staff].contractCount++;
    }

    if (isStatus(sale, "審査落ち")) {
      staffTotals[sale.staff].rejectedCount++;
    }

    if (isStatus(sale, "キャンセル")) {
      staffTotals[sale.staff].cancelCount++;
    }

    // 申込売上は表示中の契約案件ベース
    staffTotals[sale.staff].applicationSales += total;

    // 入金売上は入金日ベース
    staffTotals[sale.staff].paymentSales += paymentTotal;

    // 未入金額
    if (!sale.feePaymentDate) {
      staffTotals[sale.staff].unpaidAmount += getBrokerageFee(sale);
    }

    if (!sale.adPaymentDate) {
      staffTotals[sale.staff].unpaidAmount += getAd(sale);
    }
  });

  staffSummary.innerHTML = "";

  for (const staff in staffTotals) {
    const item = staffTotals[staff];
    const totalCases =
      item.applyCount + item.contractCount + item.rejectedCount + item.cancelCount;

    const rate = totalCases > 0
      ? Math.round((item.contractCount / totalCases) * 100)
      : 0;

    const div = document.createElement("div");
    div.className = "staff-card";

    div.innerHTML = `
      <span>👤 ${staff}</span>

      <div class="staff-mini-grid">
        <p>申込件数<br><strong>${item.applyCount}件</strong></p>
        <p>契約件数<br><strong>${item.contractCount}件</strong></p>
        <p>審査落ち<br><strong>${item.rejectedCount}件</strong></p>
        <p>キャンセル<br><strong>${item.cancelCount}件</strong></p>
      </div>

      <hr>

      <small>申込売上</small>
      <strong>${formatYen(item.applicationSales)}</strong>

      <small>入金売上</small>
      <strong>${formatYen(item.paymentSales)}</strong>

      <small>未入金額</small>
      <strong>${formatYen(item.unpaidAmount)}</strong>

      <small>成約率</small>
      <strong>${rate}%</strong>
    `;

    staffSummary.appendChild(div);
  }
}

/* =========================
   案件一覧
========================= */

function renderTable(data) {
  const salesTableBody = document.getElementById("salesTableBody");
  const allData = getSalesData();

  salesTableBody.innerHTML = "";

  data.forEach(function (sale) {
    const originalIndex = allData.indexOf(sale);
    const brokerageFeeTaxIncluded = getBrokerageFee(sale);

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

/* =========================
   編集・削除
========================= */

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
function render() {
  const data = getFilteredData();

  renderDashboard(data);
  renderBossDashboard(data);
  renderStaffSummary(data);
  renderMonthlyPerformance();
  renderTable(data);
}

function getKeyword() {
  return document.getElementById("searchInput").value.toLowerCase();
}

function getSelectedMonth() {
  return document.getElementById("monthFilter").value;
}
// 申込み人数・成約率用：申込日ベース
function getApplicationMonth(sale) {
  const date = sale.applyDate || "";
  return date ? date.slice(0, 7) : "";
}

// 選択月に申込みされた案件を取得
function getMonthlyApplicationData(selectedMonth) {
  const allData = getSalesData();

  if (!selectedMonth) {
    return allData;
  }

  return allData.filter(function (sale) {
    return getApplicationMonth(sale) === selectedMonth;
  });
}

// パーセント計算
function calculateRate(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return Math.round((numerator / denominator) * 1000) / 10;
}

/* =========================
   月末実績データ
========================= */

const MONTHLY_PERFORMANCE_STORAGE_KEY = "himenaviMonthlyPerformance";

function getDefaultMonthlyPerformance() {
  return {
    inquiryCount: 0,
    assignedCounts: {
      矢部: 0,
      早坂: 0,
      米山: 0,
      吉田: 0
    }
  };
}

function getAllMonthlyPerformance() {
  try {
    const saved = localStorage.getItem(
      MONTHLY_PERFORMANCE_STORAGE_KEY
    );

    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error(
      "月末実績データの読み込みに失敗しました。",
      error
    );

    return {};
  }
}

function getMonthlyPerformance(month) {
  const defaultData = getDefaultMonthlyPerformance();

  if (!month) {
    return defaultData;
  }

  const allPerformance = getAllMonthlyPerformance();
  const saved = allPerformance[month] || {};

  return {
    inquiryCount: Number(saved.inquiryCount) || 0,

    assignedCounts: {
      矢部: Number(saved.assignedCounts?.矢部) || 0,
      早坂: Number(saved.assignedCounts?.早坂) || 0,
      米山: Number(saved.assignedCounts?.米山) || 0,
      吉田: Number(saved.assignedCounts?.吉田) || 0
    }
  };
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

    // 申込売上は表示中の案件ベース
    applicationSales += fee + ad;

    // 入金売上は入金日ベース
    paymentSales += getMonthlyPaymentTotal(
      sale,
      selectedMonth
    );

    if (fee > 0 && !sale.feePaymentDate) {
      unpaidFeeCount++;
      unpaidFeeAmount += fee;
    }

    if (ad > 0 && !sale.adPaymentDate) {
      unpaidAdCount++;
      unpaidAdAmount += ad;
    }
  });

  /*
   * 申込み人数と成約率は申込日ベースで集計します。
   * 契約済みや審査落ちへ変更しても、
   * 申込み人数から消えません。
   */
  const monthlyApplicationData =
    getMonthlyApplicationData(selectedMonth);

  const applyCount =
    monthlyApplicationData.length;

  const contractCount =
    monthlyApplicationData.filter(function (sale) {
      return isContractStatus(sale);
    }).length;

  const rejectedCount =
    monthlyApplicationData.filter(function (sale) {
      return isStatus(sale, "審査落ち");
    }).length;

  const cancelCount =
    monthlyApplicationData.filter(function (sale) {
      return isStatus(sale, "キャンセル");
    }).length;

  const contractRate = calculateRate(
    contractCount,
    applyCount
  );

  setText(
    "bossApplicationSales",
    formatYen(applicationSales)
  );

  setText(
    "bossPaymentSales",
    formatYen(paymentSales)
  );

  setText(
    "bossApplyCount",
    applyCount + "件"
  );

  setText(
    "bossContractCount",
    contractCount + "件"
  );

  setText(
    "bossContractRate",
    contractRate + "%"
  );

  setText(
    "bossRejectedCount",
    rejectedCount + "件"
  );

  setText(
    "bossCancelCount",
    cancelCount + "件"
  );

  setText(
    "bossUnpaidFee",
    unpaidFeeCount +
      "件 / " +
      formatYen(unpaidFeeAmount)
  );

  setText(
    "bossUnpaidAd",
    unpaidAdCount +
      "件 / " +
      formatYen(unpaidAdAmount)
  );

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
  const staffSummary =
    document.getElementById("staffSummary");

  if (!staffSummary) {
    return;
  }

  const selectedMonth = getSelectedMonth();

  // 申込日を基準にした、その月の申込み案件
  const applicationData =
    getMonthlyApplicationData(selectedMonth);

  const staffTotals = createStaffData();

  // 保存済みの振り分け人数
  const monthlyPerformance =
    getMonthlyPerformance(selectedMonth);

  /*
   * 申込み人数・契約人数・審査落ち・キャンセルは、
   * ステータスではなく申込日を基準に対象月を決めます。
   */
  applicationData.forEach(function (sale) {
    if (!staffTotals[sale.staff]) {
      return;
    }

    // 申込日がある案件は、現在のステータスに関係なく申込み人数に含める
    staffTotals[sale.staff].applyCount++;

    if (isContractStatus(sale)) {
      staffTotals[sale.staff].contractCount++;
    }

    if (isStatus(sale, "審査落ち")) {
      staffTotals[sale.staff].rejectedCount++;
    }

    if (isStatus(sale, "キャンセル")) {
      staffTotals[sale.staff].cancelCount++;
    }
  });

  /*
   * 売上と未入金額は、今までどおり
   * 画面に表示されている案件を使って集計します。
   */
  data.forEach(function (sale) {
    if (!staffTotals[sale.staff]) {
      return;
    }

    staffTotals[sale.staff].applicationSales +=
      getSaleTotal(sale);

    staffTotals[sale.staff].paymentSales +=
      getMonthlyPaymentTotal(
        sale,
        selectedMonth
      );

    if (!sale.feePaymentDate) {
      staffTotals[sale.staff].unpaidAmount +=
        getBrokerageFee(sale);
    }

    if (!sale.adPaymentDate) {
      staffTotals[sale.staff].unpaidAmount +=
        getAd(sale);
    }
  });

  staffSummary.innerHTML = "";

  for (const staff in staffTotals) {
    const item = staffTotals[staff];

    const rate = calculateRate(
  item.contractCount,
  item.applyCount
);

const assignedCount =
  Number(
    monthlyPerformance.assignedCounts[staff]
  ) || 0;

const inquiryRate = calculateRate(
  item.contractCount,
  assignedCount
);

    const div = document.createElement("div");

    div.className =
      `staff-card staff-card-${staff}`;

    div.innerHTML = `
      <span>👤 ${staff}</span>

      <div class="staff-mini-grid">

        <p>
          振り分け人数<br>
          <strong>${assignedCount}人</strong>
        </p>

        <p>
          申込み人数<br>
          <strong>${item.applyCount}人</strong>
        </p>

        <p>
          契約人数<br>
          <strong>${item.contractCount}人</strong>
        </p>

       <p>
  反響成約率<br>
  <strong>${inquiryRate}%</strong>
</p>

<p>
  申込成約率<br>
  <strong>${rate}%</strong>
</p>

        <p>
          審査落ち<br>
          <strong>${item.rejectedCount}人</strong>
        </p>

        <p>
          キャンセル<br>
          <strong>${item.cancelCount}人</strong>
        </p>

      </div>

      <hr>

      <small>申込売上</small>
      <strong>
        ${formatYen(item.applicationSales)}
      </strong>

      <small>入金売上</small>
      <strong>
        ${formatYen(item.paymentSales)}
      </strong>

      <small>未入金額</small>
      <strong>
        ${formatYen(item.unpaidAmount)}
      </strong>
    `;

    staffSummary.appendChild(div);
  }
}
/* =========================
   月末実績集計
========================= */

function getStaffElementSuffix(staff) {
  const suffixMap = {
    矢部: "Yabe",
    早坂: "Hayasaka",
    米山: "Yoneyama",
    吉田: "Yoshida"
  };

  return suffixMap[staff] || "";
}

function setInputValue(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

function renderMonthlyPerformance() {
  const selectedMonth = getSelectedMonth();

  const content =
    document.getElementById("monthlyPerformanceContent");

  const notice =
    document.getElementById("monthlyPerformanceNotice");

  if (!content) {
    return;
  }

  // 全期間表示中
  if (!selectedMonth) {
    setText(
      "monthlyPerformanceTitle",
      "表示月を選択してください"
    );

    if (notice) {
      notice.style.display = "block";
      notice.textContent =
        "月を選択すると入力・集計できます。";
    }

    content.style.display = "none";
    return;
  }

  content.style.display = "block";

  if (notice) {
    notice.style.display = "none";
  }

  const yearMonth = selectedMonth.split("-");

  setText(
    "monthlyPerformanceTitle",
    yearMonth[0] +
      "年" +
      Number(yearMonth[1]) +
      "月"
  );

  const performance =
    getMonthlyPerformance(selectedMonth);

  setInputValue(
    "monthlyInquiryCount",
    performance.inquiryCount || ""
  );

  const applicationData =
    getMonthlyApplicationData(selectedMonth);

  const staffNames = [
    "矢部",
    "早坂",
    "米山",
    "吉田"
  ];

  let totalAssignedCount = 0;
  let totalApplicationCount = 0;
  let totalContractCount = 0;

  staffNames.forEach(function (staff) {
    const suffix =
      getStaffElementSuffix(staff);

    const staffApplications =
      applicationData.filter(function (sale) {
        return sale.staff === staff;
      });

  const applyCount =
  staffApplications.length;

const contractCount =
  staffApplications.filter(function (sale) {
    return isContractStatus(sale);
  }).length;

const assignedCount =
  Number(
    performance.assignedCounts[staff]
  ) || 0;

const contractRate =
  calculateRate(
    contractCount,
    applyCount
  );

const inquiryRate =
  calculateRate(
    contractCount,
    assignedCount
  );

    totalAssignedCount += assignedCount;
    totalApplicationCount += applyCount;
    totalContractCount += contractCount;

    setInputValue(
      "assignedCount" + suffix,
      assignedCount || ""
    );

    setText(
      "monthlyApplyCount" + suffix,
      applyCount + "人"
    );

    setText(
      "monthlyContractCount" + suffix,
      contractCount + "人"
    );
setText(
  "monthlyInquiryRate" + suffix,
  inquiryRate + "%"
);
    setText(
      "monthlyContractRate" + suffix,
      contractRate + "%"
    );
  });

  const totalContractRate =
    calculateRate(
      totalContractCount,
      totalApplicationCount
    );

  const inquiryCount =
    Number(performance.inquiryCount) || 0;

  const inquiryApplicationRate =
    calculateRate(
      totalApplicationCount,
      inquiryCount
    );

  setText(
    "monthlyTotalAssignedCount",
    totalAssignedCount + "人"
  );

  setText(
    "monthlyTotalApplicationCount",
    totalApplicationCount + "人"
  );

  setText(
    "monthlyTotalContractCount",
    totalContractCount + "人"
  );

  setText(
    "monthlyTotalContractRate",
    totalContractRate + "%"
  );

  setText(
    "monthlyInquiryApplicationRate",
    inquiryApplicationRate + "%"
  );
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

async function deleteSale(index) {
  const ok = confirm(
    "このデータを削除しますか？"
  );

  if (!ok) {
    return;
  }

  const deleted =
    await deleteSaleData(index);

  if (!deleted) {
    return;
  }

  render();
}
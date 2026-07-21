function getSelectedStaff() {
  const staffFilter =
    document.getElementById("staffFilter");

  if (!staffFilter) {
    return "";
  }

  return staffFilter.value;
}

function getSelectedStatus() {
  const statusFilter =
    document.getElementById("statusFilter");

  if (!statusFilter) {
    return "";
  }

  return statusFilter.value;
}
function render() {
  /*
    申込月フィルターの選択肢を更新
  */

  updateApplyMonthFilter();

  /*
    ダッシュボード・集計用

    未定案件は毎月の売上へ
    重複加算しない
  */

  const data =
    getFilteredData(
      false
    );

  /*
    案件一覧用

    担当者・申込月・進捗で絞り込む
    未定案件はどの月にも表示
  */

  const selectedStaff =
    getSelectedStaff();

  const selectedApplyMonth =
    getSelectedApplyMonth();

  const selectedStatus = "";

  const tableData =
    getFilteredData(
      true
    ).filter(function (sale) {

      /*
        担当者で絞り込む
      */

      if (
        selectedStaff &&
        sale.staff !== selectedStaff
      ) {
        return false;
      }

      /*
        申込月で絞り込む
      */

      if (
        selectedApplyMonth &&
        (
          !sale.applyDate ||
          sale.applyDate.slice(
            0,
            7
          ) !== selectedApplyMonth
        )
      ) {
        return false;
      }

      /*
        進捗で絞り込む
      */

      if (selectedStatus) {

        /*
          進行中の場合は
          「申込」と「審査中」を表示
        */

        if (
          selectedStatus === "進行中"
        ) {
          if (
            sale.status !== "申込" &&
            sale.status !== "審査中"
          ) {
            return false;
          }
        }

        /*
          進行中以外は
          選択した進捗と完全一致
        */

        else if (
          sale.status !== selectedStatus
        ) {
          return false;
        }
      }

      return true;
    });

  renderDashboard(
    data
  );

  renderBossDashboard(
    data
  );

  renderStaffSummary(
    data
  );

  renderMonthlyPerformance();

  renderTable(
    tableData
  );

  renderAlarm();
}

/*
  案件一覧の申込月を取得
*/

function getSelectedApplyMonth() {
  const applyMonthFilter =
    document.getElementById(
      "applyMonthFilter"
    );

  if (!applyMonthFilter) {
    return "";
  }

  return applyMonthFilter.value;
}

/*
  申込月フィルターの選択肢を作る
*/

function updateApplyMonthFilter() {
  const select =
    document.getElementById(
      "applyMonthFilter"
    );

  if (!select) {
    return;
  }

  const currentValue =
    select.value;

  const months =
    [
      ...new Set(
        getSalesData()
          .map(function (sale) {
            if (!sale.applyDate) {
              return "";
            }

            return sale.applyDate.slice(
              0,
              7
            );
          })
          .filter(Boolean)
      )
    ]
      .sort()
      .reverse();

  select.innerHTML =
    '<option value="">すべて</option>';

  months.forEach(function (month) {
    const option =
      document.createElement(
        "option"
      );

    option.value =
      month;

    option.textContent =
      month;

    select.appendChild(
      option
    );
  });

  if (
    months.includes(
      currentValue
    )
  ) {
    select.value =
      currentValue;
  }
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

/*
=========================================
 案件の契約月を取得
=========================================
*/

function getCaseMonth(
  sale
) {
  /*
    契約日が決まっている場合
  */

  const contractDate =
    sale.contractDate || "";

  if (contractDate) {
    return contractDate.slice(
      0,
      7
    );
  }

  /*
    契約日が未確定の場合は
    契約予定月を使用
  */

  const contractPlan =
    sale.contractPlan || "";

  if (
    /^\d{4}-\d{2}$/.test(
      contractPlan
    )
  ) {
    return contractPlan;
  }

  return "";
}


/*
=========================================
 未定案件か判定
=========================================
*/

 function isUndecidedContract(sale) {
  const contractDate =
    sale.contractDate || "";

  const contractPlan =
    sale.contractPlan || "";

  return (
    !contractDate &&
    (
      !contractPlan ||
      contractPlan === "未定"
    )
  );
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
    ${sale.contractPlan || ""}
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


/*
=========================================
 案件を表示月・検索文字で絞り込む
=========================================
*/

function getFilteredData(showUndecided = false) {
  const keyword =
    getKeyword();

  const selectedMonth =
    getSelectedMonth();

  const data =
    getSalesData();

  return data.filter(function (sale) {
    const caseMonth =
      getCaseMonth(sale);

    /*
      月が選択されている場合
    */

    if (selectedMonth) {
      /*
        案件一覧

        契約日未定・契約予定月未入力の案件は
        すべての月に表示
      */

      if (showUndecided) {
        if (
          caseMonth !== selectedMonth &&
          !isUndecidedContract(sale)
        ) {
          return false;
        }
      } else {
        /*
          ダッシュボード・集計

          選択した契約月の案件だけを使用
        */

        if (caseMonth !== selectedMonth) {
          return false;
        }
      }
    }

    /*
      キーワード検索
    */

    return matchesKeyword(
      sale,
      keyword
    );
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
  setText("unpaidFeeCount", unpaidFeeCount + "件");
  setText("unpaidAdCount", unpaidAdCount + "件");
  setText("dashApplyCount", applyCount + "件");
  setText("dashContractCount", contractCount + "件");
  setText("dashRejectedCount", rejectedCount + "件");
  setText("dashCancelCount", cancelCount + "件");
}

function renderBossDashboard(data) {
  const selectedMonth =
    getSelectedMonth();

  /*
    契約予定売上用

    契約日未定の案件は
    どの表示月でも予定売上へ含める
  */

  const contractScheduleData =
    getFilteredData(true);

  /*
    申込日が表示月の案件
  */

  const monthlyApplicationData =
    getMonthlyApplicationData(
      selectedMonth
    );

  let applyDateSales = 0;
  let contractScheduleSales = 0;
  let paymentSales = 0;

  let unpaidFeeCount = 0;
  let unpaidFeeAmount = 0;

  let unpaidAdCount = 0;
  let unpaidAdAmount = 0;


  /*
    申込ベース売上

    申込日が表示月で、
    審査落ち・キャンセル以外を集計
  */

  monthlyApplicationData.forEach(
    function (sale) {

      if (
        isStatus(
          sale,
          "審査落ち"
        ) ||
        isStatus(
          sale,
          "キャンセル"
        )
      ) {
        return;
      }

      applyDateSales +=
        getSaleTotal(sale);
    }
  );


  /*
    契約予定売上

    契約日または契約予定月が
    表示月の案件に加えて、

    契約日未定の案件も
    売上見込みへ含める

    審査落ち・キャンセルは除外
  */

  const contractScheduleCheck = [];
const undecidedTotal = {
  count: 0,
  amount: 0
};
contractScheduleData.forEach(
  function (sale) {

    if (
      isStatus(
        sale,
        "審査落ち"
      ) ||
      isStatus(
        sale,
        "キャンセル"
      )
    ) {
      return;
    }

    const brokerageFee =
      getBrokerageFee(sale);

    const ad =
      getAd(sale);

    const total =
      getSaleTotal(sale);

    contractScheduleSales +=
      total;
if (isUndecidedContract(sale)) {
  undecidedTotal.count++;
  undecidedTotal.amount += total;
}
    contractScheduleCheck.push({
      担当: sale.staff || "",
      お客様: sale.customer || "",
      ステータス: sale.status || "申込",
      契約日: sale.contractDate || "",
      契約予定月: sale.contractPlan || "",
      仲介手数料入力額:
        Number(sale.brokerageFee) || 0,
      税区分:
        getTaxTypeText(
          sale.brokerageTaxType
        ),
      仲介手数料計算後:
        brokerageFee,
      AD:
        ad,
      合計:
        total,
      未定案件:
        isUndecidedContract(sale)
          ? "はい"
          : ""
    });
    if (!isUndecidedContract(sale)) {
  console.log(
    sale.customer,
    sale.contractDate || sale.contractPlan,
    formatYen(total)
  );
}
  }
);


console.table(
  contractScheduleCheck,
  [
    "担当",
    "お客様",
    "ステータス",
    "契約日",
    "契約予定月",
    "仲介手数料計算後",
    "AD",
    "合計",
    "未定案件"
  ]
);

copy(JSON.stringify(contractScheduleCheck, null, 2));

console.log(
  "契約予定売上：",
  contractScheduleSales
);
console.log(
  "未定案件",
  undecidedTotal.count + "件",
  formatYen(undecidedTotal.amount)
);
console.log(JSON.stringify(contractScheduleCheck, null, 2));

  /*
    入金実績・未入金

    dataは契約日・契約予定月を基準に
    表示月で絞り込まれた案件
  */

  data.forEach(function (sale) {
    const fee =
      getBrokerageFee(sale);

    const ad =
      getAd(sale);

    /*
      入金日ベースの売上実績
    */

    paymentSales +=
      getMonthlyPaymentTotal(
        sale,
        selectedMonth
      );

    /*
      仲介手数料未入金
    */

    if (
      fee > 0 &&
      !sale.feePaymentDate
    ) {
      unpaidFeeCount++;

      unpaidFeeAmount +=
        fee;
    }

    /*
      AD未入金
    */

    if (
      ad > 0 &&
      !sale.adPaymentDate
    ) {
      unpaidAdCount++;

      unpaidAdAmount +=
        ad;
    }
  });


  /*
    申込日ベースの件数集計
  */

  const applyCount =
    monthlyApplicationData.length;

  const contractCount =
    monthlyApplicationData.filter(
      function (sale) {
        return isContractStatus(
          sale
        );
      }
    ).length;

  const rejectedCount =
    monthlyApplicationData.filter(
      function (sale) {
        return isStatus(
          sale,
          "審査落ち"
        );
      }
    ).length;

  const cancelCount =
    monthlyApplicationData.filter(
      function (sale) {
        return isStatus(
          sale,
          "キャンセル"
        );
      }
    ).length;

  const contractRate =
    calculateRate(
      contractCount,
      applyCount
    );


  /*
    金額表示
  */

  setText(
    "bossApplyDateSales",
    formatYen(
      applyDateSales
    )
  );

  setText(
    "bossApplicationSales",
    formatYen(
      contractScheduleSales
    )
  );

  setText(
    "bossPaymentSales",
    formatYen(
      paymentSales
    )
  );


  /*
    件数表示
  */

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


  /*
    仲介手数料未入金表示
  */

  const bossUnpaidFee =
    document.getElementById(
      "bossUnpaidFee"
    );

  if (bossUnpaidFee) {
    bossUnpaidFee.innerHTML = `
      <div class="unpaid-count">
        ${unpaidFeeCount}件
      </div>

      <div class="unpaid-money">
        ${formatYen(
          unpaidFeeAmount
        )}
      </div>
    `;
  }


  /*
    AD未入金表示
  */

  const bossUnpaidAd =
    document.getElementById(
      "bossUnpaidAd"
    );

  if (bossUnpaidAd) {
    bossUnpaidAd.innerHTML = `
      <div class="unpaid-count">
        ${unpaidAdCount}件
      </div>

      <div class="unpaid-money">
        ${formatYen(
          unpaidAdAmount
        )}
      </div>
    `;
  }


  /*
    担当者ランキング
  */

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
  /*
  申込み人数・審査落ち・キャンセル
  → 申込日ベース
*/

applicationData.forEach(function (sale) {
  if (!staffTotals[sale.staff]) {
    return;
  }

  staffTotals[sale.staff].applyCount++;

  if (isStatus(sale, "審査落ち")) {
    staffTotals[sale.staff].rejectedCount++;
  }

  if (isStatus(sale, "キャンセル")) {
    staffTotals[sale.staff].cancelCount++;
  }
});


/*
  契約人数
  → 契約日・契約予定月ベース
*/

data.forEach(function (sale) {
  if (!staffTotals[sale.staff]) {
    return;
  }

  if (isContractStatus(sale)) {
    staffTotals[sale.staff].contractCount++;
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

      <small>売上見込み</small>
<strong>
  ${formatYen(item.applicationSales)}
</strong>

<small>売上実績</small>
<strong>
  ${formatYen(item.paymentSales)}
</strong>

<small>未回収額</small>
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
function getContractDateDisplay(sale) {

  // 契約済み
  if (sale.contractDate) {
    return sale.contractDate;
  }

  // 契約予定あり
  if (sale.contractPlan) {
    return `
      <span class="contract-plan-text">
        ${sale.contractPlan}予定
      </span>
    `;
  }

  // 契約日未定
  return `
    <span class="contract-undecided">
      未定
    </span>
  `;
}
function renderTable(
  data
) {
  const salesTableBody =
    document.getElementById(
      "salesTableBody"
    );

  const allData =
    getSalesData();

  if (!salesTableBody) {
    return;
  }

  salesTableBody.innerHTML =
    "";
    const salesListCount =
  document.getElementById(
    "salesListCount"
  );

if (salesListCount) {
  salesListCount.textContent =
    "表示件数：" +
    data.length +
    "件";
}

 data.forEach(
  function (
    sale,
    displayIndex
  ) {
      const originalIndex =
        allData.indexOf(
          sale
        );

      const brokerageFeeTaxIncluded =
        getBrokerageFee(
          sale
        );
const totalSales =
  brokerageFeeTaxIncluded +
  (Number(sale.ad) || 0);
      const adPaymentText =
        sale.adPaymentDate
          ? `
            <span class="paid">
              ${sale.adPaymentDate}
            </span>
          `
          : `
            <span class="unpaid">
              未入金
            </span>
          `;

      const feePaymentText =
        sale.feePaymentDate
          ? `
            <span class="paid">
              ${sale.feePaymentDate}
            </span>
          `
          : `
            <span class="unpaid">
              未入金
            </span>
          `;

      const status =
        sale.status ||
        "申込";

      const tr = document.createElement("tr");



      tr.className =
        `case-row status-${status}`;

         tr.innerHTML = `
  <td class="case-fixed-staff">
    <span
      class="
        staff-badge
        staff-${sale.staff || ""}
      "
    >
      ${sale.staff || ""}
    </span>
  </td>

  <td class="case-fixed-customer">
    ${sale.customer || ""}
  </td>
  <td class="case-number-cell">
  ${displayIndex + 1}
</td>

  <td>
    ${sale.applyDate || ""}
  </td>

  <td>
    <span
      class="
        status-badge
        status-${status}
      "
    >
      ${status}
    </span>
  </td>

  <td>
    ${getContractDateDisplay(sale)}
  </td>

  <td>
    ${sale.startDate || ""}
  </td>

  <td>
    ${sale.property || ""}
  </td>

  <td>
    ${sale.company || ""}
  </td>

  <td>
    ${formatYen(
      sale.rent
    )}
  </td>

  <td>
    ${formatYen(
      sale.managementFee
    )}
  </td>

  <td>
    ${formatYen(
      sale.ad
    )}
  </td>

  <td>
    ${adPaymentText}
  </td>

  <td>
    ${formatYen(
      sale.brokerageFee
    )}
  </td>

  <td>
    ${getTaxTypeText(
      sale.brokerageTaxType
    )}
  </td>

  <td>
    ${formatYen(
      brokerageFeeTaxIncluded
    )}
  </td>

  <td class="total-sales-cell">
  ${formatYen(
    totalSales
  )}
</td>

  <td>
    ${feePaymentText}
  </td>

  <td>
    ${sale.installment || "利用なし"}
  </td>

  

  <td>
    ${sale.memo || ""}
  </td>

  <td>
    <div class="case-menu-wrap">

      <button
        type="button"
        class="case-menu-button"
        aria-label="案件メニューを開く"
        onclick="
          toggleCaseMenu(
            event,
            ${originalIndex}
          )
        "
      >
        ⋮
      </button>

      <div
        class="case-action-menu"
        id="caseActionMenu-${originalIndex}"
      >

        <button
          type="button"
          onclick="
            event.stopPropagation();
            editSale(${originalIndex});
          "
        >
          ✏️ 編集
        </button>

        <button
          type="button"
          onclick="
            openBrokerageInvoice(
              ${originalIndex}
            );

            closeCaseMenus();
          "
        >
          📄 仲介手数料請求書
        </button>

        <button
          type="button"
          onclick="
            openAdInvoice(
              ${originalIndex}
            );

            closeCaseMenus();
          "
        >
          📄 AD請求書
        </button>

        <button
          type="button"
          class="danger"
          onclick="
            deleteSale(
              ${originalIndex}
            );

            closeCaseMenus();
          "
        >
          🗑 削除
        </button>

      </div>

    </div>
  </td>
`;

      salesTableBody.appendChild(
        tr
      );
    }
  );
}


/* =========================
   編集
========================= */

/* =========================
   編集
========================= */

function editSale(
  index
) {
  const sale =
    getSalesData()[index];

  if (!sale) {
    alert(
      "案件データを取得できませんでした。"
    );

    return;
  }

  /*
    入力画面へ切り替える
  */

  if (
    typeof showSystemView ===
    "function"
  ) {
    showSystemView(
      "form"
    );
  }

  /*
    入力画面が非表示に
    なっている場合の保険
  */

  const formSection =
    document.getElementById(
      "salesFormSection"
    );

  if (formSection) {
    formSection.hidden = false;

    formSection.classList.remove(
      "system-view-hidden"
    );

    formSection.style.removeProperty(
      "display"
    );
  }

  /*
    案件情報をフォームへ反映
  */

  const inputValues = {
    applyDate:
      sale.applyDate || "",

    contractDate:
      sale.contractDate || "",

    startDate:
      sale.startDate || "",

    staff:
      sale.staff || "",

    customer:
      sale.customer || "",

    property:
      sale.property || "",

    company:
      sale.company || "",

    rent:
      sale.rent || "",

    managementFee:
      sale.managementFee || "",

    ad:
      sale.ad || "",

    adPaymentDate:
      sale.adPaymentDate || "",

    brokerageFee:
      sale.brokerageFee || "",

    brokerageTaxType:
      sale.brokerageTaxType ||
      "taxExcluded",

    feePaymentDate:
      sale.feePaymentDate || "",

    installment:
      sale.installment ||
      "利用なし",

    status:
      sale.status ||
      "申込",

    memo:
      sale.memo || ""
  };

  Object.entries(
    inputValues
  ).forEach(
    function (
      [
        elementId,
        value
      ]
    ) {
      const element =
        document.getElementById(
          elementId
        );

      if (element) {
        element.value =
          value;
      }
    }
  );

  const editIndexInput =
    document.getElementById(
      "editIndex"
    );

  if (editIndexInput) {
    editIndexInput.value =
      index;
  }

  const submitButton =
    document.getElementById(
      "submitButton"
    );

  if (submitButton) {
    submitButton.textContent =
      "更新する";
  }

  if (
    typeof updateTaxPreview ===
    "function"
  ) {
    updateTaxPreview();
  }

  closeCaseMenus();

  /*
    画面切り替え後に
    入力フォームまで移動
  */

  window.setTimeout(
    function () {
      if (formSection) {
        formSection.scrollIntoView({
          behavior:
            "smooth",

          block:
            "start"
        });
      }
    },
    50
  );
}


/* =========================
   削除
========================= */

async function deleteSale(
  index
) {
  const ok =
    confirm(
      "このデータを削除しますか？"
    );

  if (!ok) {
    return;
  }

  const deleted =
    await deleteSaleData(
      index
    );

  if (!deleted) {
    return;
  }

  render();
}

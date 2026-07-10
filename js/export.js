function getExportTargetData() {
  if (typeof getFilteredData === "function") {
    return getFilteredData();
  }

  return getSalesData();
}

function getExportSelectedMonth() {
  return document.getElementById("monthFilter").value;
}

function getExportBrokerageFee(sale) {
  return calculateBrokerageFee(
    sale.brokerageFee,
    sale.brokerageTaxType
  );
}

function getExportAd(sale) {
  return Number(sale.ad) || 0;
}

function getExportMonth(date) {
  return date ? date.slice(0, 7) : "";
}

// 申込日を基準に、対象月の申込み案件を取得
function getExportApplicationData(selectedMonth) {
  const allData = getSalesData();

  if (!selectedMonth) {
    return allData;
  }

  return allData.filter(function (sale) {
    return getExportMonth(sale.applyDate) === selectedMonth;
  });
}

// 契約済み判定
function isExportContractStatus(sale) {
  const status = sale.status || "申込";

  return status === "契約済" ||
    status === "契約済み";
}

// 割合計算
function calculateExportRate(numerator, denominator) {
  if (!denominator) {
    return 0;
  }

  return Math.round(
    (numerator / denominator) * 1000
  ) / 10;
}

// 保存済みの月末実績を取得
function getExportMonthlyPerformance(selectedMonth) {
  const defaultData = {
    inquiryCount: 0,

    assignedCounts: {
      矢部: 0,
      早坂: 0,
      米山: 0,
      吉田: 0
    }
  };

  if (!selectedMonth) {
    return defaultData;
  }

  try {
    const saved = localStorage.getItem(
      "himenaviMonthlyPerformance"
    );

    const allPerformance =
      saved ? JSON.parse(saved) : {};

    const monthData =
      allPerformance[selectedMonth] || {};

    const assignedCounts =
      monthData.assignedCounts || {};

    return {
      inquiryCount:
        Number(monthData.inquiryCount) || 0,

      assignedCounts: {
        矢部:
          Number(assignedCounts.矢部) || 0,

        早坂:
          Number(assignedCounts.早坂) || 0,

        米山:
          Number(assignedCounts.米山) || 0,

        吉田:
          Number(assignedCounts.吉田) || 0
      }
    };
  } catch (error) {
    console.error(
      "月末実績データの読み込みに失敗しました。",
      error
    );

    return defaultData;
  }
}

function getExportFeePayment(sale, selectedMonth) {
  if (!sale.feePaymentDate) {
    return 0;
  }

  if (!selectedMonth || getExportMonth(sale.feePaymentDate) === selectedMonth) {
    return getExportBrokerageFee(sale);
  }

  return 0;
}

function getExportAdPayment(sale, selectedMonth) {
  if (!sale.adPaymentDate) {
    return 0;
  }

  if (!selectedMonth || getExportMonth(sale.adPaymentDate) === selectedMonth) {
    return getExportAd(sale);
  }

  return 0;
}

function makeExportRows(data) {
  const selectedMonth = getExportSelectedMonth();

  return data.map(function (sale) {
    const brokerageFee = getExportBrokerageFee(sale);
    const ad = getExportAd(sale);

    const feePaymentSales = getExportFeePayment(sale, selectedMonth);
    const adPaymentSales = getExportAdPayment(sale, selectedMonth);
    const paymentSales = feePaymentSales + adPaymentSales;

    const unpaidFee = sale.feePaymentDate ? 0 : brokerageFee;
    const unpaidAd = sale.adPaymentDate ? 0 : ad;

    return {
      "物件名": sale.property || "",
      "顧客名": sale.customer || "",
      "担当者": sale.staff || "",
      "管理会社": sale.company || "",
      "審査": sale.status || "申込",
      "分割": sale.installment || "利用なし",
      "確認証": "",
      "申込日": sale.applyDate || "",
      "契約日": sale.contractDate || "",
      "賃発日": sale.startDate || "",

      "仲介手数料": brokerageFee,
      "仲介入金日": sale.feePaymentDate || "",
      "仲介入金売上": feePaymentSales,

      "AD": ad,
      "AD入金日": sale.adPaymentDate || "",
      "AD入金売上": adPaymentSales,

      "申込売上": brokerageFee + ad,
      "入金売上": paymentSales,
      "仲介未入金": unpaidFee,
      "AD未入金": unpaidAd,
      "未入金合計": unpaidFee + unpaidAd,

      "メモ": sale.memo || ""
    };
  });
}

function makeSummaryRows(data) {
  const selectedMonth = getExportSelectedMonth();

  let applicationSales = 0;
  let feePaymentSales = 0;
  let adPaymentSales = 0;
  let unpaidFee = 0;
  let unpaidAd = 0;

  data.forEach(function (sale) {
    const brokerageFee = getExportBrokerageFee(sale);
    const ad = getExportAd(sale);

    applicationSales += brokerageFee + ad;
    feePaymentSales += getExportFeePayment(sale, selectedMonth);
    adPaymentSales += getExportAdPayment(sale, selectedMonth);

    if (!sale.feePaymentDate) {
      unpaidFee += brokerageFee;
    }

    if (!sale.adPaymentDate) {
      unpaidAd += ad;
    }
  });

  return [
    { "項目": "対象月", "内容": selectedMonth || "全期間" },
    { "項目": "案件数", "内容": data.length + "件" },
    { "項目": "申込売上", "内容": applicationSales },
    { "項目": "仲介入金売上", "内容": feePaymentSales },
    { "項目": "AD入金売上", "内容": adPaymentSales },
    { "項目": "入金売上合計", "内容": feePaymentSales + adPaymentSales },
    { "項目": "仲介未入金", "内容": unpaidFee },
    { "項目": "AD未入金", "内容": unpaidAd },
    { "項目": "未入金合計", "内容": unpaidFee + unpaidAd }
  ];
}

function makeStaffSummaryRows(data) {
  const selectedMonth =
    getExportSelectedMonth();

  const applicationData =
    getExportApplicationData(selectedMonth);

  const performance =
    getExportMonthlyPerformance(selectedMonth);

  const staffTotals = {
    矢部: {
      applicationCount: 0,
      contractCount: 0,
      applicationSales: 0,
      feePaymentSales: 0,
      adPaymentSales: 0,
      unpaid: 0
    },

    早坂: {
      applicationCount: 0,
      contractCount: 0,
      applicationSales: 0,
      feePaymentSales: 0,
      adPaymentSales: 0,
      unpaid: 0
    },

    米山: {
      applicationCount: 0,
      contractCount: 0,
      applicationSales: 0,
      feePaymentSales: 0,
      adPaymentSales: 0,
      unpaid: 0
    },

    吉田: {
      applicationCount: 0,
      contractCount: 0,
      applicationSales: 0,
      feePaymentSales: 0,
      adPaymentSales: 0,
      unpaid: 0
    }
  };

  // 申込み人数・契約人数は申込日ベース
  applicationData.forEach(function (sale) {
    if (!staffTotals[sale.staff]) {
      return;
    }

    staffTotals[sale.staff].applicationCount++;

    if (isExportContractStatus(sale)) {
      staffTotals[sale.staff].contractCount++;
    }
  });

  // 売上・未入金は表示対象案件から集計
  data.forEach(function (sale) {
    if (!staffTotals[sale.staff]) {
      return;
    }

    const brokerageFee =
      getExportBrokerageFee(sale);

    const ad =
      getExportAd(sale);

    staffTotals[sale.staff].applicationSales +=
      brokerageFee + ad;

    staffTotals[sale.staff].feePaymentSales +=
      getExportFeePayment(
        sale,
        selectedMonth
      );

    staffTotals[sale.staff].adPaymentSales +=
      getExportAdPayment(
        sale,
        selectedMonth
      );

    if (!sale.feePaymentDate) {
      staffTotals[sale.staff].unpaid +=
        brokerageFee;
    }

    if (!sale.adPaymentDate) {
      staffTotals[sale.staff].unpaid +=
        ad;
    }
  });

  return Object.keys(staffTotals).map(
    function (staff) {
      const item = staffTotals[staff];

      const contractRate =
        calculateExportRate(
          item.contractCount,
          item.applicationCount
        );

      return {
        "担当者": staff,
        "振り分け人数":
          performance.assignedCounts[staff],
        "申込み人数":
          item.applicationCount,
        "契約人数":
          item.contractCount,
        "成約率":
          contractRate + "%",
        "申込売上":
          item.applicationSales,
        "仲介入金売上":
          item.feePaymentSales,
        "AD入金売上":
          item.adPaymentSales,
        "入金売上合計":
          item.feePaymentSales +
          item.adPaymentSales,
        "未入金合計":
          item.unpaid
      };
    }
  );
}

function exportCSV() {
  const data = getExportTargetData();

  if (data.length === 0) {
    alert("出力するデータがありません");
    return;
  }

  const rows = makeExportRows(data);
  const headers = Object.keys(rows[0]);

  const csvRows = [];
  csvRows.push(headers.join(","));

  rows.forEach(function (row) {
    const values = headers.map(function (header) {
      const value = row[header] === undefined ? "" : row[header];
      return `"${String(value).replace(/"/g, '""')}"`;
    });

    csvRows.push(values.join(","));
  });

  const csvContent = "\uFEFF" + csvRows.join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const link = document.createElement("a");
  const selectedMonth = getExportSelectedMonth();

  link.href = URL.createObjectURL(blob);
  link.download = selectedMonth
    ? `売上一覧_${selectedMonth}.csv`
    : "売上一覧_全期間.csv";

  link.click();
  URL.revokeObjectURL(link.href);
}

function exportExcel() {
  if (typeof XLSX === "undefined") {
    alert("Excel出力の準備ができていません。index.htmlにxlsxライブラリが読み込まれているか確認してください。");
    return;
  }

  const data = getExportTargetData();

  if (data.length === 0) {
    alert("出力するデータがありません");
    return;
  }

  const workbook = XLSX.utils.book_new();

  const caseRows = makeExportRows(data);
  const caseSheet = XLSX.utils.json_to_sheet(caseRows);

  caseSheet["!cols"] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 12 },
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 28 }
  ];

  XLSX.utils.book_append_sheet(workbook, caseSheet, "案件一覧");

  const summaryRows = makeSummaryRows(data);
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet["!cols"] = [
    { wch: 18 },
    { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "月間集計");

  const staffRows = makeStaffSummaryRows(data);
  const staffSheet = XLSX.utils.json_to_sheet(staffRows);
  staffSheet["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(workbook, staffSheet, "担当者別集計");

  const selectedMonth = getExportSelectedMonth();

  XLSX.writeFile(
    workbook,
    selectedMonth ? `社長提出用_${selectedMonth}.xlsx` : "社長提出用_全期間.xlsx"
  );
}
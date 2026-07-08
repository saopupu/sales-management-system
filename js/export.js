function getExportTargetData() {
  if (typeof getFilteredData === "function") {
    return getFilteredData();
  }

  return getSalesData();
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

function makeExportRows(data) {
  return data.map(function (sale) {
    const brokerageFee = getExportBrokerageFee(sale);
    const ad = getExportAd(sale);

    return {
      "物件名": sale.property || "",
      "顧客名": sale.customer || "",
      "管理会社": sale.company || "",
      "審査": sale.status || "申込",
      "分割": sale.installment || "利用なし",
      "確認証": "",
      "契約日": sale.contractDate || "",
      "賃発日": sale.startDate || "",
      "仲介手数料": brokerageFee,
      "仲介入金日": sale.feePaymentDate || "",
      "AD": ad,
      "AD入金日": sale.adPaymentDate || "",
      "売上": brokerageFee + ad,
      "メモ": sale.memo || "",
      "担当者": sale.staff || ""
    };
  });
}

function exportCSV() {
  const data = getExportTargetData();

  if (data.length === 0) {
    alert("出力するデータがありません");
    return;
  }

  const rows = makeExportRows(data);

  const headers = [
    "物件名",
    "顧客名",
    "管理会社",
    "審査",
    "分割",
    "確認証",
    "契約日",
    "賃発日",
    "仲介手数料",
    "仲介入金日",
    "AD",
    "AD入金日",
    "売上",
    "メモ",
    "担当者"
  ];

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
  const selectedMonth = document.getElementById("monthFilter").value;

  link.href = URL.createObjectURL(blob);
  link.download = selectedMonth
    ? `売上一覧_${selectedMonth}.csv`
    : "売上一覧_全期間.csv";

  link.click();
  URL.revokeObjectURL(link.href);
}

function exportExcel() {
  if (typeof XLSX === "undefined") {
    alert("Excel出力の準備がまだできていません。先にCSV出力を使ってください。");
    return;
  }

  const data = getExportTargetData();

  if (data.length === 0) {
    alert("出力するデータがありません");
    return;
  }

  const rows = makeExportRows(data);
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);

  sheet["!cols"] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 28 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(workbook, sheet, "売上一覧");

  const selectedMonth = document.getElementById("monthFilter").value;

  XLSX.writeFile(
    workbook,
    selectedMonth ? `売上一覧_${selectedMonth}.xlsx` : "売上一覧_全期間.xlsx"
  );
}
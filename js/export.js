const csvButton = document.getElementById("csvButton");
const excelButton = document.getElementById("excelButton");

csvButton.addEventListener("click", function () {
  downloadCSV("sales-data.csv");
});

excelButton.addEventListener("click", function () {
  downloadCSV("sales-data-excel.csv");
});

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
    "仲介入力額",
    "税区分",
    "仲介税込",
    "仲介入金日",
    "合計売上",
    "分割",
    "状態",
    "備考"
  ];

  const rows = data.map(function (sale) {
    const brokerageTaxIncluded = calculateBrokerageFee(
      sale.brokerageFee,
      sale.brokerageTaxType
    );

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
      sale.brokerageTaxType === "taxIncluded" ? "税込入力" : "税抜入力",
      brokerageTaxIncluded,
      sale.feePaymentDate || "",
      brokerageTaxIncluded + ad,
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
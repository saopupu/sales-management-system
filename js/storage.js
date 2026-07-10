const STORAGE_KEY = "himenaviSalesData";

const GOOGLE_SCRIPT_URL ="https://script.google.com/macros/s/AKfycbwA7KYLyzSJqhE9NQB0c1JJNghGgoY6Y5SzcjeWSwXtc8udIxvH5EBvLqDvqzZxp_ox/exec";

let salesData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

function createLocalCaseId() {
  const now = new Date();
  const dateText = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");

  return "CASE-" + dateText + "-" + random;
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(salesData));
  syncToGoogleSheet();
}

function getSalesData() {
  return salesData;
}

function addSale(sale) {
  if (!sale.id) {
    sale.id = createLocalCaseId();
  }

  salesData.push(sale);
  saveData();
}

function updateSale(index, sale) {
  const oldSale = salesData[index];

  if (oldSale && oldSale.id) {
    sale.id = oldSale.id;
  } else {
    sale.id = createLocalCaseId();
  }

  salesData[index] = sale;
  saveData();
}

function deleteSaleData(index) {
  salesData.splice(index, 1);
  saveData();
}

function syncToGoogleSheet() {
  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify({
      action: "saveAll",
      data: salesData
    })
  }).catch(function (error) {
    console.error("Googleスプレッドシート同期エラー", error);
  });
}
/* =========================
   月末実績データの保存
========================= */

function saveMonthlyPerformanceData(
  month,
  inquiryCount,
  assignedCounts
) {
  if (!month) {
    alert("表示月を選択してください。");
    return false;
  }

  const storageKey =
    "himenaviMonthlyPerformance";

  let allPerformance = {};

  try {
    const savedData =
      localStorage.getItem(storageKey);

    allPerformance =
      savedData
        ? JSON.parse(savedData)
        : {};
  } catch (error) {
    console.error(
      "月末実績データの読み込みに失敗しました。",
      error
    );

    allPerformance = {};
  }

  allPerformance[month] = {
    inquiryCount:
      Number(inquiryCount) || 0,

    assignedCounts: {
      矢部:
        Number(assignedCounts.矢部) || 0,

      早坂:
        Number(assignedCounts.早坂) || 0,

      米山:
        Number(assignedCounts.米山) || 0,

      吉田:
        Number(assignedCounts.吉田) || 0
    },

    updatedAt:
      new Date().toISOString()
  };

  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify(allPerformance)
    );

    return true;
  } catch (error) {
    console.error(
      "月末実績データの保存に失敗しました。",
      error
    );

    alert(
      "月末実績を保存できませんでした。"
    );

    return false;
  }
}
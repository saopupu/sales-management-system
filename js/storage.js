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

async function addSale(sale) {
  if (!sale.id) {
    sale.id = createLocalCaseId();
  }

  // 今までどおり画面とlocalStorageへ保存
  salesData.push(sale);
  saveData();

  // Supabase用に列名を変換
  const supabaseSale = {
    apply_date: sale.applyDate || null,
    contract_date: sale.contractDate || null,
    start_date: sale.startDate || null,
    staff: sale.staff || "",
    customer: sale.customer || "",
    phone: sale.phone || "",
    property: sale.property || "",
    company: sale.company || "",
    rent: Number(sale.rent) || 0,
    management_fee:
      Number(sale.managementFee) || 0,
    brokerage_fee:
      Number(sale.brokerageFee) || 0,
    brokerage_tax_type:
      sale.brokerageTaxType || "",
    ad: Number(sale.ad) || 0,
    status: sale.status || "",
    memo: sale.memo || "",
    fee_payment_date:
      sale.feePaymentDate || null,
    ad_payment_date:
      sale.adPaymentDate || null,
    installment:
      sale.installment || ""
  };

  try {
  const { error } =
    await supabaseClient
      .from("sales_cases")
      .insert([supabaseSale]);

  if (error) {
    throw error;
  }

  console.log("Supabaseにも保存できました");

  return true;

} catch (error) {
  console.error(
    "Supabase保存エラー",
    error
  );

  alert(
    "Supabaseへの保存には失敗しましたが、このパソコンには保存されています。"
  );

  return true;
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
  // Googleスプレッドシートへ送るのは契約済み案件だけ
  const contractedSales = salesData.filter(function (sale) {
    const status = sale.status || "";

    return status === "契約済" ||
      status === "契約済み";
  });

  fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain"
    },
    body: JSON.stringify({
      action: "saveAll",
      data: contractedSales
    })
  }).catch(function (error) {
    console.error(
      "Googleスプレッドシート同期エラー",
      error
    );
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
const STORAGE_KEY = "himenaviSalesData";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwA7KYLyzSJqhE9NQB0c1JJNghGgoY6Y5SzcjeWSwXtc8udIxvH5EBvLqDvqzZxp_ox/exec";

/*
=========================================
 案件データ
=========================================
*/

let salesData = [];

/*
=========================================
 ローカル案件ID作成
=========================================
*/

function createLocalCaseId() {
  const now = new Date();

  const dateText = now
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const random = Math.floor(
    Math.random() * 1000
  )
    .toString()
    .padStart(3, "0");

  return "CASE-" + dateText + "-" + random;
}

/*
=========================================
 localStorageへ予備保存
=========================================
*/

function saveLocalBackup() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(salesData)
    );
  } catch (error) {
    console.error(
      "ローカルバックアップ保存エラー",
      error
    );
  }
}

/*
=========================================
 Supabaseから案件を読み込む
=========================================
*/

async function loadSalesDataFromSupabase() {
  try {
    if (
      typeof supabaseClient === "undefined" ||
      !supabaseClient
    ) {
      throw new Error(
        "Supabaseクライアントが見つかりません。"
      );
    }

    const { data, error } =
      await supabaseClient
        .from("sales_cases")
        .select("*");

    if (error) {
      throw error;
    }

    salesData = Array.isArray(data)
      ? data
      : [];

    saveLocalBackup();

    console.log(
      "Supabaseから案件を読み込みました。",
      salesData.length + "件"
    );

    return true;
  } catch (error) {
    console.error(
      "Supabase読み込みエラー",
      error
    );

    /*
      Supabaseから取得できなかった場合は、
      localStorageのバックアップを使用
    */

    try {
      const localData =
        localStorage.getItem(STORAGE_KEY);

      salesData = localData
        ? JSON.parse(localData)
        : [];

      console.warn(
        "ローカルバックアップを使用します。",
        salesData.length + "件"
      );
    } catch (localError) {
      console.error(
        "ローカルデータ読み込みエラー",
        localError
      );

      salesData = [];
    }

    return false;
  }
}

/*
=========================================
 アプリ起動時の初期読み込み
=========================================
*/

async function initializeSalesData() {
  await loadSalesDataFromSupabase();

  /*
    render関数が読み込まれている場合だけ実行
  */

  if (typeof render === "function") {
    render();
  }
}

/*
=========================================
 案件一覧を返す
=========================================
*/

function getSalesData() {
  return salesData;
}

/*
=========================================
 新規案件登録
=========================================
*/

async function addSale(sale) {
  if (!sale.id) {
    sale.id = createLocalCaseId();
  }

  /*
    画面へすぐ反映するため、
    先にメモリへ追加
  */

  salesData.push(sale);

  saveLocalBackup();
  syncToGoogleSheet();

  try {
    const { error } =
      await supabaseClient
        .from("sales_cases")
        .insert([sale]);

    if (error) {
      throw error;
    }

    console.log(
      "Supabaseへ案件を登録しました。",
      sale.id
    );

    return true;
  } catch (error) {
    console.error(
      "Supabase登録エラー",
      error
    );

    alert(
      "案件をSupabaseへ保存できませんでした。\n" +
      "このパソコンには予備保存されています。"
    );

    return false;
  }
}

/*
=========================================
 案件編集
=========================================
*/

async function updateSale(index, sale) {
  const oldSale = salesData[index];

  if (!oldSale) {
    alert(
      "編集する案件が見つかりませんでした。"
    );

    return false;
  }

  if (oldSale.id) {
    sale.id = oldSale.id;
  } else {
    sale.id = createLocalCaseId();
  }

  /*
    画面へすぐ反映
  */

  salesData[index] = sale;

  saveLocalBackup();
  syncToGoogleSheet();

  try {
    const { error } =
      await supabaseClient
        .from("sales_cases")
        .update(sale)
        .eq("id", sale.id);

    if (error) {
      throw error;
    }

    console.log(
      "Supabaseの案件を更新しました。",
      sale.id
    );

    return true;
  } catch (error) {
    console.error(
      "Supabase更新エラー",
      error
    );

    alert(
      "編集内容をSupabaseへ保存できませんでした。\n" +
      "このパソコンには予備保存されています。"
    );

    return false;
  }
}

/*
=========================================
 案件削除
=========================================
*/

async function deleteSaleData(index) {
  const targetSale = salesData[index];

  if (!targetSale) {
    alert(
      "削除する案件が見つかりませんでした。"
    );

    return false;
  }

  const targetId = targetSale.id;

  /*
    画面へすぐ反映
  */

  salesData.splice(index, 1);

  saveLocalBackup();
  syncToGoogleSheet();

  try {
    if (!targetId) {
      throw new Error(
        "削除対象の案件IDがありません。"
      );
    }

    const { error } =
      await supabaseClient
        .from("sales_cases")
        .delete()
        .eq("id", targetId);

    if (error) {
      throw error;
    }

    console.log(
      "Supabaseから案件を削除しました。",
      targetId
    );

    return true;
  } catch (error) {
    console.error(
      "Supabase削除エラー",
      error
    );

    alert(
      "Supabaseから案件を削除できませんでした。\n" +
      "画面を再読み込みすると案件が戻る可能性があります。"
    );

    return false;
  }
}

/*
=========================================
 互換用saveData
=========================================
*/

function saveData() {
  saveLocalBackup();
  syncToGoogleSheet();
}

/*
=========================================
 Googleスプレッドシート同期
=========================================
*/

function syncToGoogleSheet() {
  /*
    Googleスプレッドシートへ送るのは
    契約済み案件だけ
  */

  const contractedSales =
    salesData.filter(function (sale) {
      const status =
        sale.status || "";

      return (
        status === "契約済" ||
        status === "契約済み"
      );
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

/*
=========================================
 月末実績データの保存
=========================================
*/

function saveMonthlyPerformanceData(
  month,
  inquiryCount,
  assignedCounts
) {
  if (!month) {
    alert(
      "表示月を選択してください。"
    );

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
        Number(
          assignedCounts.矢部
        ) || 0,

      早坂:
        Number(
          assignedCounts.早坂
        ) || 0,

      米山:
        Number(
          assignedCounts.米山
        ) || 0,

      吉田:
        Number(
          assignedCounts.吉田
        ) || 0
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
/*
=========================================
 ページ読み込み時にSupabaseから取得
=========================================
*/

document.addEventListener(
  "DOMContentLoaded",
  async function () {
    await initializeSalesData();
  }
);
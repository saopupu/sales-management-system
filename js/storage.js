const STORAGE_KEY =
  "himenaviSalesData";

const MONTHLY_PERFORMANCE_KEY =
  "himenaviMonthlyPerformance";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwA7KYLyzSJqhE9NQB0c1JJNghGgoY6Y5SzcjeWSwXtc8udIxvH5EBvLqDvqzZxp_ox/exec";


/* =========================
   案件データ
========================= */

let salesData = [];


/* =========================
   localStorageから読み込み
========================= */

function loadLocalSalesData() {
  try {
    const savedData =
      localStorage.getItem(
        STORAGE_KEY
      );

    const parsedData =
      savedData
        ? JSON.parse(savedData)
        : [];

    return Array.isArray(parsedData)
      ? parsedData
      : [];
  } catch (error) {
    console.error(
      "案件データの読み込みに失敗しました。",
      error
    );

    return [];
  }
}


/* =========================
   案件IDの作成
========================= */

function createLocalCaseId() {
  const now =
    new Date();

  const dateText =
    now
      .toISOString()
      .replace(/[-:.TZ]/g, "")
      .slice(0, 14);

  const random =
    Math.floor(
      Math.random() * 1000
    )
      .toString()
      .padStart(3, "0");

  return (
    `CASE-${dateText}-${random}`
  );
}


/* =========================
   localStorageへ保存
========================= */

function saveLocalData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        salesData
      )
    );

    return true;
  } catch (error) {
    console.error(
      "案件データの保存に失敗しました。",
      error
    );

    alert(
      "このパソコンに案件データを保存できませんでした。"
    );

    return false;
  }
}


/* =========================
   案件データを取得
========================= */

function getSalesData() {
  return salesData;
}


/* =========================
   Supabase接続確認
========================= */

function isSupabaseAvailable() {
  return (
    typeof supabaseClient !==
      "undefined" &&
    supabaseClient
  );
}


/* =========================
   Supabase保存形式へ変換
========================= */

function convertSaleToSupabase(
  sale
) {
  return {
    apply_date:
      sale.applyDate || null,

    contract_date:
      sale.contractDate || null,

    start_date:
      sale.startDate || null,

    staff:
      sale.staff || "",

    customer:
      sale.customer || "",

    phone:
      sale.phone || "",

    property:
      sale.property || "",

    company:
      sale.company || "",

    rent:
      Number(
        sale.rent
      ) || 0,

    management_fee:
      Number(
        sale.managementFee
      ) || 0,

    brokerage_fee:
      Number(
        sale.brokerageFee
      ) || 0,

    brokerage_tax_type:
      sale.brokerageTaxType ||
      "",

    ad:
      Number(
        sale.ad
      ) || 0,

    status:
      sale.status || "",

    memo:
      sale.memo || "",

    fee_payment_date:
      sale.feePaymentDate ||
      null,

    ad_payment_date:
      sale.adPaymentDate ||
      null,

    installment:
      sale.installment || ""
  };
}


/* =========================
   Supabaseデータを
   画面表示形式へ変換
========================= */

function convertSupabaseToSale(
  row
) {
  return {
    /*
      画面側で使用するID
    */

    id:
      row.id !== undefined &&
      row.id !== null
        ? String(row.id)
        : createLocalCaseId(),

    /*
      Supabase編集・削除用ID
    */

    supabaseId:
      row.id,

    applyDate:
      row.apply_date || "",

    contractDate:
      row.contract_date || "",

    startDate:
      row.start_date || "",

    staff:
      row.staff || "",

    customer:
      row.customer || "",

    phone:
      row.phone || "",

    property:
      row.property || "",

    company:
      row.company || "",

    rent:
      Number(row.rent) || 0,

    managementFee:
      Number(
        row.management_fee
      ) || 0,

    brokerageFee:
      Number(
        row.brokerage_fee
      ) || 0,

    brokerageTaxType:
      row.brokerage_tax_type ||
      "",

    ad:
      Number(row.ad) || 0,

    status:
      row.status || "",

    memo:
      row.memo || "",

    feePaymentDate:
      row.fee_payment_date ||
      "",

    adPaymentDate:
      row.ad_payment_date ||
      "",

    installment:
      row.installment || ""
  };
}


/* =========================
   Supabaseから案件を取得
========================= */

async function loadSalesData() {
  /*
    Supabaseが読み込まれていない場合は
    localStorageを使用します。
  */

  if (!isSupabaseAvailable()) {
    console.warn(
      "Supabaseに接続できないため、ローカルデータを表示します。"
    );

    salesData =
      loadLocalSalesData();

    return salesData;
  }

  try {
    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "sales_cases"
        )
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    salesData =
      (data || []).map(
        convertSupabaseToSale
      );

    /*
      Supabaseから取得した最新版を
      このパソコンにも保存します。
    */

    saveLocalData();

    console.log(
      "Supabaseから案件を読み込みました。",
      salesData.length
    );

    return salesData;
  } catch (error) {
    console.error(
      "Supabase読み込みエラー",
      error
    );

    salesData =
      loadLocalSalesData();

    alert(
      "Supabaseから案件を読み込めなかったため、このパソコンに保存されているデータを表示します。"
    );

    return salesData;
  }
}


/* =========================
   新規案件登録
========================= */

async function addSale(sale) {
  if (
    !sale ||
    typeof sale !== "object"
  ) {
    alert(
      "登録する案件データが正しくありません。"
    );

    return false;
  }

  if (!sale.id) {
    sale.id =
      createLocalCaseId();
  }

  /*
    Supabaseへ保存
  */

  if (isSupabaseAvailable()) {
    try {
      const supabaseSale =
        convertSaleToSupabase(
          sale
        );

      const {
        data,
        error
      } =
        await supabaseClient
          .from(
            "sales_cases"
          )
          .insert([
            supabaseSale
          ])
          .select()
          .single();

      if (error) {
        throw error;
      }

      /*
        SupabaseのIDを保存
      */

      sale.supabaseId =
        data.id;

      sale.id =
        String(data.id);

      salesData.unshift(
        sale
      );

      saveLocalData();

      syncToGoogleSheet();

      console.log(
        "Supabaseへ案件を登録しました。",
        data.id
      );

      return true;
    } catch (error) {
      console.error(
        "Supabase保存エラー",
        error
      );

      /*
        Supabaseで失敗した場合は
        このパソコンへ保存します。
      */

      salesData.unshift(
        sale
      );

      const localSaved =
        saveLocalData();

      if (!localSaved) {
        salesData.shift();

        return false;
      }

      alert(
        "案件はこのパソコンに保存されましたが、Supabaseへの保存には失敗しました。"
      );

      return true;
    }
  }

  /*
    Supabaseがない場合
  */

  salesData.unshift(
    sale
  );

  return saveLocalData();
}


/* =========================
   案件編集
========================= */

async function updateSale(
  index,
  sale
) {
  const targetIndex =
    Number(index);

  if (
    !Number.isInteger(
      targetIndex
    ) ||
    targetIndex < 0 ||
    !salesData[
      targetIndex
    ]
  ) {
    alert(
      "編集する案件が見つかりませんでした。"
    );

    return false;
  }

  const oldSale =
    salesData[
      targetIndex
    ];

  sale.id =
    oldSale.id ||
    createLocalCaseId();

  sale.supabaseId =
    oldSale.supabaseId ||
    null;

  /*
    Supabaseに登録済みの案件
  */

  if (
    isSupabaseAvailable() &&
    sale.supabaseId !== null &&
    sale.supabaseId !==
      undefined
  ) {
    try {
      const supabaseSale =
        convertSaleToSupabase(
          sale
        );

      const {
        error
      } =
        await supabaseClient
          .from(
            "sales_cases"
          )
          .update(
            supabaseSale
          )
          .eq(
            "id",
            sale.supabaseId
          );

      if (error) {
        throw error;
      }

      salesData[
        targetIndex
      ] = sale;

      saveLocalData();

      syncToGoogleSheet();

      console.log(
        "Supabaseの案件を更新しました。",
        sale.supabaseId
      );

      return true;
    } catch (error) {
      console.error(
        "Supabase更新エラー",
        error
      );

      alert(
        "案件を更新できませんでした。インターネット接続をご確認ください。"
      );

      return false;
    }
  }

  /*
    localStorageにしかない古い案件は、
    Supabaseへ新規登録します。
  */

  if (
    isSupabaseAvailable()
  ) {
    try {
      const supabaseSale =
        convertSaleToSupabase(
          sale
        );

      const {
        data,
        error
      } =
        await supabaseClient
          .from(
            "sales_cases"
          )
          .insert([
            supabaseSale
          ])
          .select()
          .single();

      if (error) {
        throw error;
      }

      sale.supabaseId =
        data.id;

      sale.id =
        String(data.id);

      salesData[
        targetIndex
      ] = sale;

      saveLocalData();

      syncToGoogleSheet();

      console.log(
        "ローカル案件をSupabaseへ移行しました。",
        data.id
      );

      return true;
    } catch (error) {
      console.error(
        "Supabase移行エラー",
        error
      );

      alert(
        "案件をSupabaseへ保存できませんでした。"
      );

      return false;
    }
  }

  salesData[
    targetIndex
  ] = sale;

  return saveLocalData();
}


/* =========================
   案件削除
========================= */

async function deleteSaleData(
  index
) {
  const targetIndex =
    Number(index);

  if (
    !Number.isInteger(
      targetIndex
    ) ||
    targetIndex < 0 ||
    !salesData[
      targetIndex
    ]
  ) {
    alert(
      "削除する案件が見つかりませんでした。"
    );

    return false;
  }

  const targetSale =
    salesData[
      targetIndex
    ];

  /*
    Supabaseの案件を削除
  */

  if (
    isSupabaseAvailable() &&
    targetSale.supabaseId !==
      null &&
    targetSale.supabaseId !==
      undefined
  ) {
    try {
      const {
        error
      } =
        await supabaseClient
          .from(
            "sales_cases"
          )
          .delete()
          .eq(
            "id",
            targetSale.supabaseId
          );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(
        "Supabase削除エラー",
        error
      );

      alert(
        "Supabaseから案件を削除できませんでした。"
      );

      return false;
    }
  }

  salesData.splice(
    targetIndex,
    1
  );

  saveLocalData();

  syncToGoogleSheet();

  console.log(
    "案件を削除しました。"
  );

  return true;
}


/* =========================
   Googleスプレッドシート同期
========================= */

function syncToGoogleSheet() {
  const contractedSales =
    salesData.filter(
      function (sale) {
        const status =
          sale.status || "";

        return (
          status ===
            "契約済" ||
          status ===
            "契約済み"
        );
      }
    );

  fetch(
    GOOGLE_SCRIPT_URL,
    {
      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type":
          "text/plain"
      },

      body:
        JSON.stringify({
          action:
            "saveAll",

          data:
            contractedSales
        })
    }
  ).catch(
    function (error) {
      console.error(
        "Googleスプレッドシート同期エラー",
        error
      );
    }
  );
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
    alert(
      "表示月を選択してください。"
    );

    return false;
  }

  let allPerformance = {};

  try {
    const savedData =
      localStorage.getItem(
        MONTHLY_PERFORMANCE_KEY
      );

    allPerformance =
      savedData
        ? JSON.parse(
            savedData
          )
        : {};
  } catch (error) {
    console.error(
      "月末実績データの読み込みに失敗しました。",
      error
    );

    allPerformance = {};
  }

  const counts =
    assignedCounts || {};

  allPerformance[
    month
  ] = {
    inquiryCount:
      Number(
        inquiryCount
      ) || 0,

    assignedCounts: {
      矢部:
        Number(
          counts.矢部
        ) || 0,

      早坂:
        Number(
          counts.早坂
        ) || 0,

      米山:
        Number(
          counts.米山
        ) || 0,

      吉田:
        Number(
          counts.吉田
        ) || 0
    },

    updatedAt:
      new Date()
        .toISOString()
  };

  try {
    localStorage.setItem(
      MONTHLY_PERFORMANCE_KEY,
      JSON.stringify(
        allPerformance
      )
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
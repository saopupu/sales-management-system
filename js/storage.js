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

    if (!Array.isArray(parsedData)) return [];
    return parsedData.map(sale => {
      if (sale.supabaseId !== null && sale.supabaseId !== undefined) {
        const id = normalizeSalesCaseId(sale.supabaseId);
        return {...sale, id, supabaseId:id};
      }
      if (typeof sale.id === "number" || (typeof sale.id === "string" && /^-?\d/.test(sale.id))) {
        normalizeSalesCaseId(sale.id);
        throw Error("DB案件IDの対応情報が欠けています。再登録せず再取得してください。");
      }
      return sale;
    });
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
  return hasSalesAppPermission() ? salesData : [];
}

function hasSalesAppPermission() {
  return typeof canUseSalesApp === "function" && canUseSalesApp();
}

function requireSalesAppPermission() {
  if (hasSalesAppPermission()) return true;
  alert("ログイン済みの利用者4名だけが操作できます。");
  return false;
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
   フォームで扱う項目だけをSupabase保存形式へ変換
   phoneなど画面外の列は送信せず、DBの既存値を保持する。
========================= */

function convertSaleToSupabase(
  sale
) {
  return {
    apply_date:
      sale.applyDate || null,

    contract_plan:
     sale.contractPlan || null,

    contract_date:
      sale.contractDate || null,

    

    start_date:
      sale.startDate || null,

    rent_start_date: sale.rentStartDate || null,

    staff:
      sale.staff || "",

    customer:
      sale.customer || "",

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

function rememberSaleSnapshot(sale, row) {
  // 比較用の原値をGoogle同期やlocalStorageのJSONへ混入させない。
  Object.defineProperty(sale, "_dbOriginal", {value: {...row}, writable: true, configurable: true, enumerable: false});
  return sale;
}

function convertSupabaseToSale(
  row
) {
  const caseId = normalizeSalesCaseId(row.id);
  return rememberSaleSnapshot({
    /*
      画面側で使用するID
    */

    id: caseId,

    /*
      Supabase編集・削除用ID
    */

    supabaseId: caseId,

    applyDate:
      row.apply_date || "",

    contractDate:
      row.contract_date || "",

    contractPlan:
      row.contract_plan || "",

    startDate:
      row.start_date || "",

    rentStartDate: row.rent_start_date || "",

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
  }, row);
}


/* =========================
   Supabaseから案件を取得
========================= */

async function loadSalesData() {
  if (!hasSalesAppPermission()) {
    salesData = [];
    return [];
  }
  const loadingUser = typeof currentLoginUser !== "undefined" ? currentLoginUser : null;
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

    if (!hasSalesAppPermission() || (loadingUser && currentLoginUser !== loadingUser)) return [];
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
    if (!hasSalesAppPermission() || (loadingUser && currentLoginUser !== loadingUser)) return [];
    if (error.code === "INVALID_SALES_CASE_ID") {
      salesData = [];
      alert("案件IDの精度・形式を確認できないため読み込みを中止しました。再登録や更新を行わず確認してください。");
      return [];
    }
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
  if (!requireSalesAppPermission()) return false;
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

      if (data?.id === null || data?.id === undefined) {
        throw new Error("登録した案件を確認できませんでした。");
      }

      sale.supabaseId = normalizeSalesCaseId(data.id);

      rememberSaleSnapshot(sale, data);

      sale.id = sale.supabaseId;

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

      alert(
        "Supabaseへの保存に失敗しました。入力内容はそのまま残っています。接続状況を確認してください。"
      );

      return false;
    }
  }

  /*
    Supabaseがない場合
  */

  alert("Supabaseに接続できないため保存できません。入力内容はそのまま残っています。");
  return false;
}


/* =========================
   案件編集
========================= */

async function updateSale(
  index,
  sale
) {
  if (!requireSalesAppPermission()) return false;
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

  if (oldSale.supabaseId == null && (typeof oldSale.id === "number" || (typeof oldSale.id === "string" && /^-?\d/.test(oldSale.id)))) {
    alert("DB案件IDの対応情報がないため編集を中止しました。再登録せず再取得してください。");
    return false;
  }

  if (!isSupabaseAvailable()) {
    alert("Supabaseに接続できないため更新できません。入力内容はそのまま残っています。");
    return false;
  }

  // フォームにない項目はローカル表示でも保持する。DBへの送信は上記の項目だけ。
  sale = { ...oldSale, ...sale };

  sale.id =
    oldSale.id ||
    createLocalCaseId();

  sale.supabaseId =
    oldSale.supabaseId ??
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
      sale.supabaseId = normalizeSalesCaseId(sale.supabaseId);
      sale.id = sale.supabaseId;
      const proposed = convertSaleToSupabase(sale);
      const baseline = oldSale._dbOriginal || convertSaleToSupabase(oldSale);
      const previousForm = convertSaleToSupabase(oldSale);
      const supabaseSale = Object.fromEntries(Object.entries(proposed)
        .filter(([key, value]) => JSON.stringify(value) !== JSON.stringify(previousForm[key])));
      if (!Object.keys(supabaseSale).length) return true;
      let query = supabaseClient.from("sales_cases").update(supabaseSale);
      // 同一項目の更新をDB側の条件で検知。0件はSTEP 20と同様に失敗扱い。
      for (const key of Object.keys(supabaseSale)) {
        const previous = baseline[key] ?? null;
        query = previous === null ? query.is(key, null) : query.eq(key, previous);
      }
      const {data, error} = await query.eq("id", sale.supabaseId).select("id");

      if (error) {
        throw error;
      }

      if (!Array.isArray(data) || data.length !== 1 || normalizeSalesCaseId(data[0].id) !== sale.supabaseId) {
        throw new Error("更新対象を1件確認できませんでした。");
      }

      rememberSaleSnapshot(sale, { ...baseline, ...supabaseSale });

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
        "案件を更新できませんでした。更新競合、対象の削除、権限・通信の問題が考えられます。入力内容はそのまま残っています。"
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

      if (data?.id === null || data?.id === undefined) {
        throw new Error("登録した案件を確認できませんでした。");
      }

      sale.supabaseId = normalizeSalesCaseId(data.id);

      sale.id = sale.supabaseId;

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
  if (!requireSalesAppPermission()) return false;
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

  if (targetSale.supabaseId == null && (typeof targetSale.id === "number" || (typeof targetSale.id === "string" && /^-?\d/.test(targetSale.id)))) {
    alert("DB案件IDの対応情報がないため削除を中止しました。再取得してください。");
    return false;
  }

  if (!isSupabaseAvailable()) {
    alert("Supabaseに接続できないため削除できません。");
    return false;
  }

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
      const caseId = normalizeSalesCaseId(targetSale.supabaseId);
      const {
        data,
        error
      } =
        await supabaseClient
          .from(
            "sales_cases"
          )
          .delete()
          .eq(
            "id",
            caseId
          )
          .select("id");

      if (error) {
        throw error;
      }
      if (!Array.isArray(data) || data.length !== 1 || normalizeSalesCaseId(data[0].id) !== caseId) {
        throw new Error("削除対象を1件確認できませんでした。");
      }
    } catch (error) {
      console.error(
        "Supabase削除エラー",
        error
      );

      alert(
        "Supabaseから案件を削除できませんでした。対象の有無、権限・通信状況を確認してください。"
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
  if (!hasSalesAppPermission()) return;
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
  if (!requireSalesAppPermission()) return false;
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

document.addEventListener("sales-permissions-changed", async () => {
  salesData = [];
  if (hasSalesAppPermission()) await loadSalesData();
  if (typeof render === "function") render();
});

document.addEventListener("sales-case-saved", async () => {
  if (!hasSalesAppPermission()) return;
  await loadSalesData();
  if (typeof render === "function") render();
});

const form =
  document.getElementById("salesForm");

const clearButton =
  document.getElementById("clearButton");

const searchInput =
  document.getElementById("searchInput");

const monthFilter =
  document.getElementById("monthFilter");

const showAllButton =
  document.getElementById("showAllButton");

const csvButton =
  document.getElementById("csvButton");

const excelButton =
  document.getElementById("excelButton");

const submitButton =
  document.getElementById("submitButton");

const editIndexInput =
  document.getElementById("editIndex");

/*
=========================================
 現在の月を取得
=========================================
*/

function getCurrentMonth() {
  const today = new Date();

  return today
    .toISOString()
    .slice(0, 7);
}

monthFilter.value = getCurrentMonth();

/*
=========================================
 登録・編集
=========================================
*/

form.addEventListener(
  "submit",
  async function (event) {
    event.preventDefault();

    /*
      二重クリック防止
    */

    submitButton.disabled = true;
    submitButton.textContent = "保存中...";

    const sale = {
      applyDate:
        document.getElementById(
          "applyDate"
        ).value,

      contractDate:
        document.getElementById(
          "contractDate"
        ).value,

      startDate:
        document.getElementById(
          "startDate"
        ).value,

      staff:
        document.getElementById(
          "staff"
        ).value,

      customer:
        document.getElementById(
          "customer"
        ).value,

      property:
        document.getElementById(
          "property"
        ).value,

      company:
        document.getElementById(
          "company"
        ).value,

      rent:
        Number(
          document.getElementById(
            "rent"
          ).value
        ) || 0,

      managementFee:
        Number(
          document.getElementById(
            "managementFee"
          ).value
        ) || 0,

      ad:
        Number(
          document.getElementById(
            "ad"
          ).value
        ) || 0,

      adPaymentDate:
        document.getElementById(
          "adPaymentDate"
        ).value,

      brokerageFee:
        Number(
          document.getElementById(
            "brokerageFee"
          ).value
        ) || 0,

      brokerageTaxType:
        document.getElementById(
          "brokerageTaxType"
        ).value,

      feePaymentDate:
        document.getElementById(
          "feePaymentDate"
        ).value,

      installment:
        document.getElementById(
          "installment"
        ).value,

      status:
        document.getElementById(
          "status"
        ).value,

      memo:
        document.getElementById(
          "memo"
        ).value
    };

    const editIndexValue =
      editIndexInput.value;

    let saved = false;

    try {
      if (editIndexValue === "") {
        saved =
          await addSale(sale);
      } else {
        const editIndex =
          Number(editIndexValue);

        saved =
          await updateSale(
            editIndex,
            sale
          );
      }

      /*
        Supabase保存に成功した場合
      */

      if (saved) {
        form.reset();

        editIndexInput.value = "";

        submitButton.textContent =
          "登録する";

        updateTaxPreview();

        /*
          Supabaseの最新データを再取得
        */

        await loadSalesDataFromSupabase();

        render();
      }
    } catch (error) {
      console.error(
        "案件保存処理エラー",
        error
      );

      alert(
        "案件を保存できませんでした。"
      );
    } finally {
      submitButton.disabled = false;

      /*
        編集中でなければ登録表示へ戻す
      */

      if (editIndexInput.value === "") {
        submitButton.textContent =
          "登録する";
      } else {
        submitButton.textContent =
          "更新する";
      }
    }
  }
);

/*
=========================================
 入力内容クリア
=========================================
*/

clearButton.addEventListener(
  "click",
  function () {
    form.reset();

    editIndexInput.value = "";

    submitButton.textContent =
      "登録する";

    submitButton.disabled = false;

    updateTaxPreview();
  }
);

/*
=========================================
 検索・月フィルター
=========================================
*/

searchInput.addEventListener(
  "input",
  render
);

monthFilter.addEventListener(
  "change",
  render
);

showAllButton.addEventListener(
  "click",
  function () {
    monthFilter.value = "";

    render();
  }
);

/*
=========================================
 CSV・Excel出力
=========================================
*/

csvButton.addEventListener(
  "click",
  function () {
    exportCSV();
  }
);

excelButton.addEventListener(
  "click",
  function () {
    exportExcel();
  }
);

/*
=========================================
 仲介手数料の税込プレビュー
=========================================
*/

document
  .getElementById("brokerageFee")
  .addEventListener(
    "input",
    updateTaxPreview
  );

document
  .getElementById("brokerageTaxType")
  .addEventListener(
    "change",
    updateTaxPreview
  );

function updateTaxPreview() {
  const amount =
    document.getElementById(
      "brokerageFee"
    ).value;

  const taxType =
    document.getElementById(
      "brokerageTaxType"
    ).value;

  const taxIncludedAmount =
    calculateBrokerageFee(
      amount,
      taxType
    );

  document.getElementById(
    "brokerageTaxPreview"
  ).textContent =
    formatYen(taxIncludedAmount);
}

/*
=========================================
 月末実績の保存
=========================================
*/

function getNumberInputValue(id) {
  const element =
    document.getElementById(id);

  if (!element) {
    return 0;
  }

  return Number(element.value) || 0;
}

function saveMonthlyPerformanceFromForm() {
  const selectedMonth =
    monthFilter.value;

  if (!selectedMonth) {
    alert(
      "表示月を選択してください。"
    );

    return;
  }

  const inquiryCount =
    getNumberInputValue(
      "monthlyInquiryCount"
    );

  const assignedCounts = {
    矢部:
      getNumberInputValue(
        "assignedCountYabe"
      ),

    早坂:
      getNumberInputValue(
        "assignedCountHayasaka"
      ),

    米山:
      getNumberInputValue(
        "assignedCountYoneyama"
      ),

    吉田:
      getNumberInputValue(
        "assignedCountYoshida"
      )
  };

  const saved =
    saveMonthlyPerformanceData(
      selectedMonth,
      inquiryCount,
      assignedCounts
    );

  if (!saved) {
    return;
  }

  const message =
    document.getElementById(
      "monthlyPerformanceSaveMessage"
    );

  if (message) {
    message.textContent =
      "保存しました";

    setTimeout(function () {
      message.textContent = "";
    }, 3000);
  }

  render();
}

const saveMonthlyPerformanceButton =
  document.getElementById(
    "saveMonthlyPerformanceButton"
  );

if (saveMonthlyPerformanceButton) {
  saveMonthlyPerformanceButton
    .addEventListener(
      "click",
      saveMonthlyPerformanceFromForm
    );
}

/*
=========================================
 アプリ起動
=========================================
*/

updateTaxPreview();

if (typeof initializeSalesData === "function") {
  initializeSalesData();
} else {
  console.warn(
    "initializeSalesDataが見つからないため、通常表示します。"
  );

  render();
}
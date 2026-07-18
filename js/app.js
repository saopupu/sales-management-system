const form =
  document.getElementById(
    "salesForm"
  );

const clearButton =
  document.getElementById(
    "clearButton"
  );
const generateTestDataButton =
  document.getElementById(
    "generateTestDataButton"
  );

const deleteTestDataButton =
  document.getElementById(
    "deleteTestDataButton"
  );
const searchInput =
  document.getElementById(
    "searchInput"
  );

const monthFilter =
  document.getElementById(
    "monthFilter"
  );

const showAllButton =
  document.getElementById(
    "showAllButton"
  );

const csvButton =
  document.getElementById(
    "csvButton"
  );

const excelButton =
  document.getElementById(
    "excelButton"
  );

const submitButton =
  document.getElementById(
    "submitButton"
  );

const editIndexInput =
  document.getElementById(
    "editIndex"
  );
/*
=========================================
 契約予定月の選択肢を作成
=========================================
*/

function createContractPlanOptions() {
  const contractPlanSelect =
    document.getElementById(
      "contractPlan"
    );

  if (!contractPlanSelect) {
    return;
  }

  /*
    現在保存されている値を保持
  */

  const currentValue =
    contractPlanSelect.value;

  /*
    一度選択肢を作り直す
  */

  contractPlanSelect.innerHTML = `
    <option value="">予定なし</option>
    <option value="未定">未定</option>
  `;

  const today =
    new Date();

  /*
    前月から24か月先まで作成
  */

  for (
    let offset = -1;
    offset <= 24;
    offset++
  ) {
    const targetDate =
      new Date(
        today.getFullYear(),
        today.getMonth() + offset,
        1
      );

    const year =
      targetDate.getFullYear();

    const month =
      String(
        targetDate.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const value =
      year + "-" + month;

    const option =
      document.createElement(
        "option"
      );

    option.value =
      value;

    option.textContent =
      year +
      "年" +
      Number(month) +
      "月予定";

    contractPlanSelect.appendChild(
      option
    );
  }

  /*
    編集中の予定月が選択肢にない場合も保持
  */

  if (
    currentValue &&
    currentValue !== "未定" &&
    !Array.from(
      contractPlanSelect.options
    ).some(function (option) {
      return option.value ===
        currentValue;
    })
  ) {
    const oldOption =
      document.createElement(
        "option"
      );

    oldOption.value =
      currentValue;

    oldOption.textContent =
      formatContractPlanText(
        currentValue
      );

    contractPlanSelect.appendChild(
      oldOption
    );
  }

  contractPlanSelect.value =
    currentValue;
}


/*
=========================================
 契約予定の表示文字
=========================================
*/

function formatContractPlanText(
  contractPlan
) {
  if (!contractPlan) {
    return "";
  }

  if (contractPlan === "未定") {
    return "未定";
  }

  if (
    /^\d{4}-\d{2}$/.test(
      contractPlan
    )
  ) {
    const parts =
      contractPlan.split("-");

    return (
      Number(parts[1]) +
      "月予定"
    );
  }

  return contractPlan;
}

/* =========================
   現在の月を取得
========================= */

function getCurrentMonth() {
  const today =
    new Date();

  return today
    .toISOString()
    .slice(0, 7);
}


/* =========================
   初期表示月
========================= */

if (monthFilter) {
  monthFilter.value =
    getCurrentMonth();
}


/* =========================
   登録・編集
========================= */

if (form) {
  form.addEventListener(
    "submit",
    async function (
      event
    ) {
      event.preventDefault();

      submitButton.disabled =
        true;

      submitButton.textContent =
        "保存中...";

      const sale = {
        applyDate:
          document.getElementById(
            "applyDate"
          ).value,

        contractDate:
  document.getElementById(
    "contractDate"
  ).value,

contractPlan:
  document.getElementById(
    "contractDate"
  ).value
    ? ""
    : document.getElementById(
        "contractPlan"
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

      try {
        let saved =
          false;

        if (
          editIndexValue === ""
        ) {
          saved =
            await addSale(
              sale
            );
        } else {
          saved =
            await updateSale(
              Number(
                editIndexValue
              ),
              sale
            );
        }

        if (!saved) {
          return;
        }

        form.reset();

        editIndexInput.value =
          "";

        submitButton.textContent =
          "登録する";

        updateTaxPreview();

        render();
      } catch (error) {
        console.error(
          "案件保存処理エラー",
          error
        );

        alert(
          "案件の保存処理中にエラーが発生しました。"
        );
      } finally {
        submitButton.disabled =
          false;

        if (
          editIndexInput.value ===
          ""
        ) {
          submitButton.textContent =
            "登録する";
        } else {
          submitButton.textContent =
            "更新する";
        }
      }
    }
  );
}


/* =========================
   入力内容クリア
========================= */

if (clearButton) {
  clearButton.addEventListener(
    "click",
    function () {
      form.reset();

      editIndexInput.value =
        "";

      submitButton.textContent =
        "登録する";

      submitButton.disabled =
        false;

      updateTaxPreview();
    }
  );
}


/* =========================
   検索
========================= */

if (searchInput) {
  searchInput.addEventListener(
    "input",
    function () {
      render();
    }
  );
}


/* =========================
   月フィルター
========================= */

if (monthFilter) {
  monthFilter.addEventListener(
    "change",
    function () {
      render();
    }
  );
}


/* =========================
   全件表示
========================= */

if (showAllButton) {
  showAllButton.addEventListener(
    "click",
    function () {
      monthFilter.value =
        "";

      render();
    }
  );
}


/* =========================
   CSV出力
========================= */

if (csvButton) {
  csvButton.addEventListener(
    "click",
    function () {
      exportCSV();
    }
  );
}


/* =========================
   Excel出力
========================= */

if (excelButton) {
  excelButton.addEventListener(
    "click",
    function () {
      exportExcel();
    }
  );
}


/* =========================
   仲介手数料
   税込プレビュー
========================= */

const brokerageFeeInput =
  document.getElementById(
    "brokerageFee"
  );

const brokerageTaxTypeInput =
  document.getElementById(
    "brokerageTaxType"
  );

if (brokerageFeeInput) {
  brokerageFeeInput
    .addEventListener(
      "input",
      updateTaxPreview
    );
}

if (brokerageTaxTypeInput) {
  brokerageTaxTypeInput
    .addEventListener(
      "change",
      updateTaxPreview
    );
}


/* =========================
   仲介手数料
   プレビュー更新
========================= */

function updateTaxPreview() {
  const brokerageFeeElement =
    document.getElementById(
      "brokerageFee"
    );

  const brokerageTaxTypeElement =
    document.getElementById(
      "brokerageTaxType"
    );

  const previewElement =
    document.getElementById(
      "brokerageTaxPreview"
    );

  if (
    !brokerageFeeElement ||
    !brokerageTaxTypeElement ||
    !previewElement
  ) {
    return;
  }

  const amount =
    brokerageFeeElement.value;

  const taxType =
    brokerageTaxTypeElement.value;

  const taxIncludedAmount =
    calculateBrokerageFee(
      amount,
      taxType
    );

  previewElement.textContent =
    formatYen(
      taxIncludedAmount
    );
}


/* =========================
   数値入力を取得
========================= */

function getNumberInputValue(
  id
) {
  const element =
    document.getElementById(
      id
    );

  if (!element) {
    return 0;
  }

  return Number(
    element.value
  ) || 0;
}


/* =========================
   月末実績を保存
========================= */

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

    setTimeout(
      function () {
        message.textContent =
          "";
      },
      3000
    );
  }

  render();
}


/* =========================
   月末実績保存ボタン
========================= */

const saveMonthlyPerformanceButton =
  document.getElementById(
    "saveMonthlyPerformanceButton"
  );

if (
  saveMonthlyPerformanceButton
) {
  saveMonthlyPerformanceButton
    .addEventListener(
      "click",
      saveMonthlyPerformanceFromForm
    );
}


/* =========================
   案件編集開始
========================= */




/* =========================
   案件削除
========================= */

async function deleteSale(
  index
) {
  const confirmed =
    confirm(
      "この案件を削除しますか？"
    );

  if (!confirmed) {
    return;
  }

  try {
    const deleted =
      await deleteSaleData(
        index
      );

    if (!deleted) {
      return;
    }

    /*
      編集中の案件を削除した場合
    */

    if (
      Number(
        editIndexInput.value
      ) === Number(index)
    ) {
      form.reset();

      editIndexInput.value =
        "";

      submitButton.textContent =
        "登録する";

      updateTaxPreview();
    }

    render();
  } catch (error) {
    console.error(
      "案件削除処理エラー",
      error
    );

    alert(
      "案件の削除処理中にエラーが発生しました。"
    );
  }
}


/* =========================
   アプリ起動
========================= */

async function startApp() {
  updateTaxPreview();

  try {
    await loadSalesData();

    render();

    console.log(
      "案件データを読み込みました。"
    );
  } catch (error) {
    console.error(
      "アプリ起動エラー",
      error
    );

    render();

    alert(
      "案件データの読み込み中にエラーが発生しました。"
    );
  }
}
if (generateTestDataButton) {

  generateTestDataButton.addEventListener(
    "click",
    generateTestData
  );

}

if (deleteTestDataButton) {

  deleteTestDataButton.addEventListener(
    "click",
    deleteAllTestData
  );

}
createContractPlanOptions();
startApp();
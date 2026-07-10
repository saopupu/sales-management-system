const form = document.getElementById("salesForm");
const clearButton = document.getElementById("clearButton");
const searchInput = document.getElementById("searchInput");
const monthFilter = document.getElementById("monthFilter");
const showAllButton = document.getElementById("showAllButton");
const csvButton = document.getElementById("csvButton");
const excelButton = document.getElementById("excelButton");

function getCurrentMonth() {
  const today = new Date();
  return today.toISOString().slice(0, 7);
}

monthFilter.value = getCurrentMonth();

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const sale = {
    applyDate: document.getElementById("applyDate").value,
    contractDate: document.getElementById("contractDate").value,
    startDate: document.getElementById("startDate").value,
    staff: document.getElementById("staff").value,
    customer: document.getElementById("customer").value,
    phone: document.getElementById("phone").value,
    property: document.getElementById("property").value,
    company: document.getElementById("company").value,
    rent: Number(document.getElementById("rent").value) || 0,
    managementFee: Number(document.getElementById("managementFee").value) || 0,
    ad: Number(document.getElementById("ad").value) || 0,
    adPaymentDate: document.getElementById("adPaymentDate").value,
    brokerageFee: Number(document.getElementById("brokerageFee").value) || 0,
    brokerageTaxType: document.getElementById("brokerageTaxType").value,
    feePaymentDate: document.getElementById("feePaymentDate").value,
    installment: document.getElementById("installment").value,
    status: document.getElementById("status").value,
    memo: document.getElementById("memo").value
  };

  const editIndex = document.getElementById("editIndex").value;

  if (editIndex === "") {
    addSale(sale);
  } else {
    updateSale(editIndex, sale);
    document.getElementById("editIndex").value = "";
    document.getElementById("submitButton").textContent = "登録する";
  }

  form.reset();
  updateTaxPreview();
  render();
});

clearButton.addEventListener("click", function () {
  form.reset();
  document.getElementById("editIndex").value = "";
  document.getElementById("submitButton").textContent = "登録する";
  updateTaxPreview();
});

searchInput.addEventListener("input", render);
monthFilter.addEventListener("change", render);

showAllButton.addEventListener("click", function () {
  monthFilter.value = "";
  render();
});

csvButton.addEventListener("click", function () {
  exportCSV();
});

excelButton.addEventListener("click", function () {
  exportExcel();
});

document.getElementById("brokerageFee").addEventListener("input", updateTaxPreview);
document.getElementById("brokerageTaxType").addEventListener("change", updateTaxPreview);

function updateTaxPreview() {
  const amount = document.getElementById("brokerageFee").value;
  const taxType = document.getElementById("brokerageTaxType").value;
  const taxIncludedAmount = calculateBrokerageFee(amount, taxType);

  document.getElementById("brokerageTaxPreview").textContent =
    formatYen(taxIncludedAmount);
}

updateTaxPreview();
render();
/* =========================
   月末実績の保存ボタン
========================= */

function getNumberInputValue(id) {
  const element = document.getElementById(id);

  if (!element) {
    return 0;
  }

  return Number(element.value) || 0;
}

function saveMonthlyPerformanceFromForm() {
  const selectedMonth =
    document.getElementById("monthFilter").value;

  if (!selectedMonth) {
    alert("表示月を選択してください。");
    return;
  }

  const inquiryCount =
    getNumberInputValue("monthlyInquiryCount");

  const assignedCounts = {
    矢部:
      getNumberInputValue("assignedCountYabe"),

    早坂:
      getNumberInputValue("assignedCountHayasaka"),

    米山:
      getNumberInputValue("assignedCountYoneyama"),

    吉田:
      getNumberInputValue("assignedCountYoshida")
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
  saveMonthlyPerformanceButton.addEventListener(
    "click",
    saveMonthlyPerformanceFromForm
  );
}
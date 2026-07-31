/* =========================
   売上台帳
========================= */

function normalizeLedgerText(value) {
  return String(value || "")
    .trim()
    .replace(/^['"]+|['"]+$/g, "");
}

function formatLedgerCurrency(value) {
  const amount = Number(value) || 0;

  return (
    amount.toLocaleString("ja-JP") +
    "円"
  );
}

function formatLedgerDate(dateText) {
  const text =
    normalizeLedgerText(dateText);

  if (!text) {
    return "";
  }

  const date =
    new Date(text + "T00:00:00");

  if (
    Number.isNaN(date.getTime())
  ) {
    return text;
  }

  return (
    date.getFullYear() +
    "/" +
    String(
      date.getMonth() + 1
    ).padStart(2, "0") +
    "/" +
    String(
      date.getDate()
    ).padStart(2, "0")
  );
}

function isLedgerTargetMonth(
  dateText,
  targetMonth
) {
  const date =
    normalizeLedgerText(dateText);

  const month =
    normalizeLedgerText(targetMonth);

  if (!date || !month) {
    return false;
  }

  return (
    date.slice(0, 7) === month
  );
}

function getLedgerBrokerageIncluded(
  sale
) {
  const fee =
    Number(sale.brokerageFee) || 0;

  const taxType =
    sale.brokerageTaxType || "";

  if (
    taxType === "taxExcluded"
  ) {
    return Math.round(fee * 1.1);
  }

  return fee;
}

function getLedgerTaxExcluded(amount) {
  return Math.round(
    (Number(amount) || 0) / 1.1
  );
}

function createLedgerRows(
  targetMonth,
  targetStaff
) {
  const sales =
    typeof getSalesData ===
      "function"
      ? getSalesData()
      : [];

  const rows = [];

  sales.forEach(function (sale) {
    if (!sale) {
      return;
    }

    const saleStaff =
      normalizeLedgerText(
        sale.staff
      );

    const selectedStaff =
      normalizeLedgerText(
        targetStaff
      );

    if (
      saleStaff !== selectedStaff
    ) {
      return;
    }

    /* 仲介手数料 */

    if (
      isLedgerTargetMonth(
        sale.feePaymentDate,
        targetMonth
      )
    ) {
      const includedAmount =
        getLedgerBrokerageIncluded(
          sale
        );

      if (includedAmount > 0) {
        rows.push({
          paymentDate:
            sale.feePaymentDate,

          paymentType:
            "仲介手数料",

          paymentName:
            sale.customer || "",

          property:
            sale.property || "",

          includedAmount:
            includedAmount,

          excludedAmount:
            sale.brokerageTaxType ===
              "free"
              ? includedAmount
              : getLedgerTaxExcluded(
                  includedAmount
                )
        });
      }
    }

    /* 広告料 */

    if (
      isLedgerTargetMonth(
        sale.adPaymentDate,
        targetMonth
      )
    ) {
      const adAmount =
        Number(sale.ad) || 0;

      if (adAmount > 0) {
        rows.push({
          paymentDate:
            sale.adPaymentDate,

          paymentType:
            "広告料",

          paymentName:
            sale.customer || "",

          property:
            sale.property || "",

          includedAmount:
            adAmount,

          excludedAmount:
            getLedgerTaxExcluded(
              adAmount
            )
        });
      }
    }
  });

  rows.sort(function (a, b) {
    return String(
      a.paymentDate
    ).localeCompare(
      String(b.paymentDate)
    );
  });

  return rows;
}

function formatLedgerMonthTitle(
  monthText
) {
  if (!monthText) {
    return "-";
  }

  const parts =
    monthText.split("-");

  return (
    parts[0] +
    "年" +
    Number(parts[1]) +
    "月期"
  );
}

function renderSalesLedger() {
  const monthInput =
    document.getElementById(
      "ledgerMonth"
    );

  const staffSelect =
    document.getElementById(
      "ledgerStaff"
    );

  const tableBody =
    document.getElementById(
      "ledgerTableBody"
    );

  const periodElement =
    document.getElementById(
      "ledgerPeriod"
    );

  const staffNameElement =
    document.getElementById(
      "ledgerStaffName"
    );

  const totalIncludedElement =
    document.getElementById(
      "ledgerTotalIncluded"
    );

  const totalExcludedElement =
    document.getElementById(
      "ledgerTotalExcluded"
    );

  if (
    !monthInput ||
    !staffSelect ||
    !tableBody
  ) {
    return;
  }

  const targetMonth =
    monthInput.value;

  const targetStaff =
    staffSelect.value;

  if (!targetMonth) {
    alert(
      "入金月を選択してください。"
    );
    return;
  }

  if (!targetStaff) {
    alert(
      "担当者を選択してください。"
    );
    return;
  }

  const rows =
    createLedgerRows(
      targetMonth,
      targetStaff
    );

  if (periodElement) {
    periodElement.textContent =
      formatLedgerMonthTitle(
        targetMonth
      );
  }

  if (staffNameElement) {
    staffNameElement.textContent =
      targetStaff;
  }

  tableBody.innerHTML = "";

  if (rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4">
          該当する入金データがありません。
        </td>
      </tr>
    `;

    if (totalIncludedElement) {
      totalIncludedElement.textContent =
        "0円";
    }

    if (totalExcludedElement) {
      totalExcludedElement.textContent =
        "0円";
    }

    return;
  }

  let totalIncluded = 0;
  let totalExcluded = 0;

  rows.forEach(function (row) {
    totalIncluded +=
      Number(
        row.includedAmount
      ) || 0;

    totalExcluded +=
      Number(
        row.excludedAmount
      ) || 0;

    const badgeClass =
      row.paymentType ===
        "仲介手数料"
        ? "fee"
        : "ad";

    const tr =
      document.createElement("tr");

    tr.innerHTML = `
      <td>
        ${formatLedgerDate(
          row.paymentDate
        )}
      </td>

      <td>
        ${row.paymentName}
      </td>

      <td>
        ${row.property}
      </td>

      <td>
        <span class="ledger-badge ${badgeClass}">
          ${row.paymentType}
        </span>

        <br>

        ${formatLedgerCurrency(
          row.includedAmount
        )}
      </td>
    `;

    tableBody.appendChild(tr);
  });

  if (totalIncludedElement) {
    totalIncludedElement.textContent =
      formatLedgerCurrency(
        totalIncluded
      );
  }

  if (totalExcludedElement) {
    totalExcludedElement.textContent =
      formatLedgerCurrency(
        totalExcluded
      );
  }
}

function printSalesLedger() {
  const printArea =
    document.getElementById(
      "ledgerPrintArea"
    );

  if (!printArea) {
    alert(
      "印刷する売上台帳が見つかりません。"
    );
    return;
  }

  window.print();
}

function setInitialLedgerMonth() {
  const monthInput =
    document.getElementById(
      "ledgerMonth"
    );

  if (
    !monthInput ||
    monthInput.value
  ) {
    return;
  }

  const now = new Date();

  monthInput.value =
    now.getFullYear() +
    "-" +
    String(
      now.getMonth() + 1
    ).padStart(2, "0");
}

function initializeSalesLedger() {
  setInitialLedgerMonth();

  const showButton =
    document.getElementById(
      "showLedgerButton"
    );

  if (showButton) {
    showButton.addEventListener(
      "click",
      renderSalesLedger
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  initializeSalesLedger
);
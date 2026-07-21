/* ==================================================
   請求書機能 完成版

   ・案件一覧の3点メニュー
   ・仲介手数料請求書
   ・AD請求書
   ・電子印
   ・印刷／PDF保存
   ・請求書データは保存しない
================================================== */


/* ==================================================
   会社情報・振込先
================================================== */

const INVOICE_COMPANY = {
  name:
    "株式会社ワイエスアール",

  address1:
    "東京都豊島区池袋2-53-10",

  address2:
    "フラグメントミッブビル 3F",

  tel:
    "03-5843-3755",

  fax:
    "03-5843-3756",

  registrationNumber:
    "T2013301047855",

  bankName:
    "楽天銀行",

  branchName:
    "第四営業支店（店番254）",

  accountNumber:
    "普通　7233940",

  accountName:
    "株式会社ワイエスアール",

 
};


/* ==================================================
   3点メニューを閉じる
================================================== */

function closeCaseMenus() {
  document
    .querySelectorAll(
      ".case-action-menu.open"
    )
    .forEach(
      function (menu) {
        menu.classList.remove(
          "open"
        );

        menu.style.left = "";
        menu.style.top = "";
      }
    );
}


/* ==================================================
   3点メニューを開閉
================================================== */

function toggleCaseMenu(
  event,
  index
) {
  event.preventDefault();
  event.stopPropagation();

  const targetMenu =
    document.getElementById(
      "caseActionMenu-" +
      index
    );

  if (!targetMenu) {
    return;
  }

  const willOpen =
    !targetMenu.classList.contains(
      "open"
    );

  closeCaseMenus();

  if (!willOpen) {
    return;
  }

  const button =
    event.currentTarget;

  const buttonRect =
    button.getBoundingClientRect();

  const menuWidth = 220;
  const menuHeight = 190;

  let left =
    buttonRect.right -
    menuWidth;

  if (left < 10) {
    left = 10;
  }

  if (
    left + menuWidth >
    window.innerWidth - 10
  ) {
    left =
      window.innerWidth -
      menuWidth -
      10;
  }

  let top =
    buttonRect.bottom + 6;

  if (
    top + menuHeight >
    window.innerHeight - 10
  ) {
    top =
      buttonRect.top -
      menuHeight -
      6;
  }

  if (top < 10) {
    top = 10;
  }

  targetMenu.style.left =
    left + "px";

  targetMenu.style.top =
    top + "px";

  targetMenu.classList.add(
    "open"
  );
}


/*
  メニュー外を押したら閉じる
*/

document.addEventListener(
  "click",
  closeCaseMenus
);

window.addEventListener(
  "scroll",
  closeCaseMenus,
  true
);

window.addEventListener(
  "resize",
  closeCaseMenus
);


/* ==================================================
   HTML用文字変換
================================================== */

function invoiceEscapeHtml(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


/* ==================================================
   円表示
================================================== */

function invoiceFormatYen(
  value
) {
  const amount =
    Math.round(
      Number(value) || 0
    );

  return (
    "¥" +
    amount.toLocaleString(
      "ja-JP"
    )
  );
}


/* ==================================================
   発行日
================================================== */

function getJapaneseIssueDate() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    date.getMonth() + 1;

  const day =
    date.getDate();

  if (year >= 2019) {
    const reiwaYear =
      year - 2018;

    return (
      "令和" +
      (
        reiwaYear === 1
          ? "元"
          : reiwaYear
      ) +
      "年" +
      month +
      "月" +
      day +
      "日"
    );
  }

  return (
    year +
    "年" +
    month +
    "月" +
    day +
    "日"
  );
}


/* ==================================================
   様・御中
================================================== */

function addRecipientSuffix(
  recipient,
  suffix
) {
  const text =
    String(
      recipient || ""
    ).trim();

  if (!text) {
    return (
      "請求先未入力 " +
      suffix
    );
  }

  if (
    /(?:様|御中)$/.test(
      text
    )
  ) {
    return text;
  }

  return (
    text +
    " " +
    suffix
  );
}


/* ==================================================
   仲介手数料の税計算
================================================== */

function getBrokerageInvoiceAmounts(
  sale
) {
  const rawAmount =
    Math.round(
      Number(
        sale.brokerageFee
      ) || 0
    );

  const taxType =
    sale.brokerageTaxType ||
    "taxExcluded";

  /*
    税込入力
  */

  if (
    taxType ===
    "taxIncluded"
  ) {
    const total =
      rawAmount;

    const subtotal =
      Math.round(
        total / 1.1
      );

    return {
      subtotal:
        subtotal,

      tax:
        total - subtotal,

      total:
        total,

      taxLabel:
        "消費税（10％・内税）"
    };
  }

  /*
    自由入力
  */

  if (
    taxType ===
    "free"
  ) {
    return {
      subtotal:
        rawAmount,

      tax:
        0,

      total:
        rawAmount,

      taxLabel:
        "消費税"
    };
  }

  /*
    税抜入力
  */

  const tax =
    Math.round(
      rawAmount * 0.1
    );

  return {
    subtotal:
      rawAmount,

    tax:
      tax,

    total:
      rawAmount + tax,

    taxLabel:
      "消費税（10％）"
  };
}


/* ==================================================
   ADの税計算
   ADは内税
================================================== */

function getAdInvoiceAmounts(
  sale
) {
  const total =
    Math.round(
      Number(
        sale.ad
      ) || 0
    );

  const subtotal =
    Math.round(
      total / 1.1
    );

  return {
    subtotal:
      subtotal,

    tax:
      total - subtotal,

    total:
      total,

    taxLabel:
      "消費税（10％・内税）"
  };
}


/* ==================================================
   仲介手数料請求書
================================================== */

function openBrokerageInvoice(
  index
) {
  const sale =
    getSalesData()[index];

  if (!sale) {
    alert(
      "案件データを取得できませんでした。"
    );

    return;
  }

  const amounts =
    getBrokerageInvoiceAmounts(
      sale
    );

  if (
    amounts.total <= 0
  ) {
    alert(
      "仲介手数料が入力されていません。"
    );

    return;
  }

  openInvoicePreview({
    title:
      "仲介手数料請求書",

    recipient:
      addRecipientSuffix(
        sale.customer,
        "様"
      ),

    property:
      sale.property ||
      "物件名未入力",

    description:
      "仲介手数料として",

    amounts:
      amounts,

    taxMode:
      sale.brokerageTaxType ||
      "taxExcluded",

    inputAmount:
      Math.round(
        Number(
          sale.brokerageFee
        ) || 0
      )
  });
}


/* ==================================================
   AD請求書
================================================== */

function openAdInvoice(
  index
) {
  const sale =
    getSalesData()[index];

  if (!sale) {
    alert(
      "案件データを取得できませんでした。"
    );

    return;
  }

  const amounts =
    getAdInvoiceAmounts(
      sale
    );

  if (
    amounts.total <= 0
  ) {
    alert(
      "AD金額が入力されていません。"
    );

    return;
  }

  openInvoicePreview({
    title:
      "AD請求書",

    recipient:
      addRecipientSuffix(
        sale.company,
        "御中"
      ),

    property:
      sale.property ||
      "物件名未入力",

    description:
      "広告料（AD）として",

    amounts:
      amounts,

    taxMode:
      "taxIncluded",

    inputAmount:
      Math.round(
        Number(
          sale.ad
        ) || 0
      )
  });
}
/* ==================================================
   管理会社送付状
================================================== */

function openCoverLetter(
  index
) {
  const sale =
    getSalesData()[index];

  if (!sale) {
    alert(
      "案件データを取得できませんでした。"
    );

    return;
  }

  const previewWindow =
    window.open(
      "",
      "_blank",
      "width=1100,height=900"
    );

  if (!previewWindow) {
    alert(
      "送付状画面を開けませんでした。\nブラウザのポップアップを許可してください。"
    );

    return;
  }

  const issueDate =
    getJapaneseIssueDate();

  const company =
    invoiceEscapeHtml(
      addRecipientSuffix(
        sale.company,
        "御中"
      )
    );

  const property =
    invoiceEscapeHtml(
      sale.property ||
      "物件名未入力"
    );

  const customer =
    invoiceEscapeHtml(
      sale.customer ||
      "契約者名未入力"
    );

  const stampImageUrl =
    new URL(
      "images/stamp.png",
      window.location.href
    ).href;

  previewWindow.document.open();

  previewWindow.document.write(`
<!DOCTYPE html>

<html lang="ja">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>管理会社送付状</title>

  <style>

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #e8edf4;
      color: #172033;

      font-family:
        "Yu Mincho",
        "Hiragino Mincho ProN",
        "Noto Serif JP",
        serif;
    }

    .cover-toolbar {
      position: sticky;
      top: 0;
      z-index: 50;

      display: flex;
      justify-content: center;
      gap: 12px;

      padding: 14px;

      background:
        rgba(
          8,
          41,
          86,
          0.97
        );
    }

    .cover-toolbar button {
      min-height: 42px;

      padding:
        0
        18px;

      border:
        1px solid
        rgba(
          255,
          255,
          255,
          0.35
        );

      border-radius: 8px;

      background: #ffffff;
      color: #0b2b57;

      font-size: 14px;
      font-weight: 800;

      cursor: pointer;
    }

    .cover-toolbar button.primary {
      background: #1856a9;
      color: #ffffff;
    }

    .cover-help {
      padding: 8px 12px;

      background: #fff7dc;
      color: #715b17;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      font-size: 12px;
      text-align: center;
    }

    .cover-sheet {
      position: relative;

      width: 210mm;
      min-height: 297mm;

      margin:
        24px
        auto;

      padding:
        18mm
        17mm;

      background: #ffffff;

      box-shadow:
        0 12px 40px
        rgba(
          15,
          23,
          42,
          0.18
        );
    }

    .cover-title {
      margin:
        4mm
        0
        14mm;

      color: #0b2b57;

      font-size: 27pt;
      font-weight: 700;

      letter-spacing: 0.35em;
      text-align: center;
      text-indent: 0.35em;
    }

    .cover-date {
      margin-bottom: 8mm;

      font-size: 10.5pt;
      text-align: right;
    }

    .cover-recipient {
      margin-bottom: 12mm;

      font-size: 17pt;
      font-weight: 700;

      overflow-wrap: anywhere;
    }

    .sender-area {
      position: relative;

      width: 82mm;

      margin:
        0
        0
        12mm
        auto;

      padding-right: 22mm;

      font-size: 10pt;
      line-height: 1.7;
    }

    .sender-name {
      font-size: 14pt;
      font-weight: 700;
    }

    .company-stamp {
      position: absolute;

      top: 0;
      right: 0;

      width: 32mm;

      opacity: 0.88;

      pointer-events: none;
    }

    .cover-subject {
      margin-bottom: 10mm;

      font-size: 15pt;
      font-weight: 700;

      text-align: center;
      text-decoration: underline;
      text-underline-offset: 4px;
    }

    .cover-message {
      margin-bottom: 9mm;

      font-size: 11pt;
      line-height: 2;
    }

    .cover-case {
      margin-bottom: 9mm;

      padding:
        6mm
        7mm;

      border:
        1px solid
        #b8c8dc;

      font-size: 11pt;
      line-height: 2;
    }

    .document-box {
      width: 100%;

      border-collapse: collapse;

      font-size: 11pt;
    }

    .document-box th,
    .document-box td {
      border:
        1px solid
        #b8c8dc;

      padding:
        4mm
        5mm;
    }

    .document-box th {
      background: #edf3fa;
      color: #0b2b57;

      text-align: center;
    }

    .document-box td:first-child {
      width: 24mm;
      text-align: center;
    }

    .cover-closing {
      margin-top: 9mm;

      font-size: 11pt;
      text-align: right;
    }

    .editable {
      outline: none;
    }

    .editable:hover {
      background: #fffbed;
    }

    .editable:focus {
      background: #fff6c9;
    }

    @media print {

      @page {
        size: A4 portrait;
        margin: 7mm;
      }

      body {
        background: #ffffff;

        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .cover-toolbar,
      .cover-help {
        display: none !important;
      }

      .cover-sheet {
        width: auto;
        min-height: auto;

        margin: 0;
        padding: 0;

        box-shadow: none;
      }

      .editable:hover,
      .editable:focus {
        background: transparent;
      }

    }

  </style>

</head>

<body>

  <div class="cover-toolbar">

    <button
      type="button"
      class="primary"
      onclick="window.print()"
    >
      🖨 印刷・PDF保存
    </button>

    <button
      type="button"
      onclick="window.close()"
    >
      閉じる
    </button>

  </div>

  <div class="cover-help">
    宛名・件名・文章・物件名・契約者名・送付書類は、文字をクリックして修正できます。
  </div>

  <main class="cover-sheet">

    <div class="cover-date">
      ${invoiceEscapeHtml(issueDate)}
    </div>

    <div
      class="cover-recipient editable"
      contenteditable="true"
      spellcheck="false"
    >
      ${company}
    </div>

    <div class="sender-area">

      <div class="sender-name">
        ${invoiceEscapeHtml(INVOICE_COMPANY.name)}
      </div>

      <div>
        ${invoiceEscapeHtml(INVOICE_COMPANY.address1)}
      </div>

      <div>
        ${invoiceEscapeHtml(INVOICE_COMPANY.address2)}
      </div>

      <div>
        TEL：${invoiceEscapeHtml(INVOICE_COMPANY.tel)}
      </div>

      <div>
        FAX：${invoiceEscapeHtml(INVOICE_COMPANY.fax)}
      </div>

      <img
        src="${stampImageUrl}"
        class="company-stamp"
      >

    </div>

    <h1 class="cover-title">
      送 付 状
    </h1>

    <div
      class="cover-subject editable"
      contenteditable="true"
      spellcheck="false"
    >
      契約書類送付のご案内
    </div>

    <div
      class="cover-message editable"
      contenteditable="true"
      spellcheck="false"
    >
      平素より大変お世話になっております。<br>
      下記の契約書類を送付いたしますので、<br>
      ご査収のほどよろしくお願い申し上げます。
    </div>

    <div class="cover-case">

      <div>
        物件名：
        <span
          class="editable"
          contenteditable="true"
          spellcheck="false"
        >${property}</span>
      </div>

      <div>
        契約者名：
        <span
          class="editable"
          contenteditable="true"
          spellcheck="false"
        >${customer} 様</span>
      </div>

    </div>

    <table class="document-box">

      <thead>

        <tr>
          <th>確認</th>
          <th>送付書類</th>
          <th>部数</th>
        </tr>

      </thead>

      <tbody>

        <tr>
          <td>□</td>

          <td
            class="editable"
            contenteditable="true"
            spellcheck="false"
          >
            賃貸借契約書
          </td>

          <td
            class="editable"
            contenteditable="true"
            spellcheck="false"
          >
            1部
          </td>
        </tr>

        <tr>
          <td>□</td>

          <td
            class="editable"
            contenteditable="true"
            spellcheck="false"
          >
            重要事項説明書
          </td>

          <td
            class="editable"
            contenteditable="true"
            spellcheck="false"
          >
            1部
          </td>
        </tr>

        <tr>
          <td>□</td>

          <td
            class="editable"
            contenteditable="true"
            spellcheck="false"
          >
            その他
          </td>

          <td
            class="editable"
            contenteditable="true"
            spellcheck="false"
          >
            1部
          </td>
        </tr>

      </tbody>

    </table>

    <div class="cover-closing">
      以上
    </div>

  </main>

</body>

</html>
  `);

  previewWindow.document.close();
}

/* ==================================================
   請求書プレビュー
================================================== */

function openInvoicePreview(
  invoice
) {
  const previewWindow =
    window.open(
      "",
      "_blank",
      "width=1100,height=900"
    );

  if (!previewWindow) {
    alert(
      "請求書画面を開けませんでした。\nブラウザのポップアップを許可してください。"
    );

    return;
  }

  
      const issueDate =
    getJapaneseIssueDate();

  const recipient =
    invoiceEscapeHtml(
      invoice.recipient
    );

  const property =
    invoiceEscapeHtml(
      invoice.property
    );

  const description =
    invoiceEscapeHtml(
      invoice.description
    );

  const subtotal =
    invoiceFormatYen(
      invoice.amounts.subtotal
    );

  const tax =
    invoiceFormatYen(
      invoice.amounts.tax
    );

  const total =
    invoiceFormatYen(
      invoice.amounts.total
    );

  const taxLabel =
    invoiceEscapeHtml(
      invoice.amounts.taxLabel
    );

  const editableAmount =
    invoiceFormatYen(
      invoice.inputAmount ??
      invoice.amounts.subtotal
    );

  const taxMode =
    invoice.taxMode ||
    "taxExcluded";
const stampImageUrl =
  new URL(
    "images/stamp.png",
    window.location.href
  ).href;
  previewWindow.document.open();

  previewWindow.document.write(`
<!DOCTYPE html>

<html lang="ja">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    ${invoiceEscapeHtml(invoice.title)}
  </title>

  <style>

    :root {
      --navy: #123a70;
      --navy-dark: #0b2b57;
      --line: #b8c8dc;
      --text: #172033;
    }

    * {
      box-sizing: border-box;
    }

    html {
      margin: 0;
      padding: 0;
    }

    body {
      margin: 0;
      padding: 0;

      background: #e8edf4;
      color: var(--text);

      font-family:
        "Yu Mincho",
        "Hiragino Mincho ProN",
        "Noto Serif JP",
        serif;
    }


    /* =========================
       上部ボタン
    ========================= */

    .invoice-toolbar {
      position: sticky;
      top: 0;
      z-index: 50;

      display: flex;
      justify-content: center;
      gap: 12px;

      padding: 14px;

      background:
        rgba(
          8,
          41,
          86,
          0.97
        );

      box-shadow:
        0 4px 16px
        rgba(
          0,
          0,
          0,
          0.18
        );
    }

    .invoice-toolbar button {
      min-height: 42px;

      padding:
        0
        18px;

      border:
        1px solid
        rgba(
          255,
          255,
          255,
          0.35
        );

      border-radius: 8px;

      background: #ffffff;
      color: var(--navy-dark);

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      font-size: 14px;
      font-weight: 800;

      cursor: pointer;
    }

    .invoice-toolbar button:hover {
      opacity: 0.92;
    }

    .invoice-toolbar button.primary {
      background: #1856a9;
      color: #ffffff;
    }


    /* =========================
       編集案内
    ========================= */

    .invoice-help {
      padding: 8px 12px;

      background: #fff7dc;
      color: #715b17;

      font-family:
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      font-size: 12px;
      line-height: 1.7;
      text-align: center;
    }


    /* =========================
       A4請求書本体
    ========================= */

    .invoice-sheet {
      width: 210mm;
      min-height: 297mm;

      margin:
        24px
        auto;

      padding:
        14mm
        12mm
        10mm;

      background: #ffffff;

      box-shadow:
        0 12px 40px
        rgba(
          15,
          23,
          42,
          0.18
        );
    }


    /* =========================
       タイトル部分
    ========================= */

    .invoice-title-area {
      position: relative;

      margin-bottom: 10mm;

      text-align: center;
    }

    .invoice-title {
      margin: 0;

      color: var(--navy-dark);

      font-size: 29pt;
      font-weight: 700;

      letter-spacing: 0.25em;
      text-indent: 0.25em;
    }

    .invoice-title-line {
      width: 14mm;
      height: 1px;

      margin:
        4mm
        auto
        0;

      background: var(--navy);
    }

    .invoice-date {
      position: absolute;

      top: 3mm;
      right: 0;

      font-size: 10pt;
      white-space: nowrap;
    }


    /* =========================
       宛名・会社情報
    ========================= */

    .invoice-top {
      display: grid;

      grid-template-columns:
        minmax(0, 1fr)
        78mm;

      gap: 9mm;

      margin-bottom: 8mm;
    }

    .recipient-name {
      min-height: 14mm;

      padding:
        0
        2mm
        3mm;

      border-bottom:
        1.5px solid
        var(--navy);

      color: var(--navy-dark);

      font-size: 18pt;
      font-weight: 700;

      letter-spacing: 0.05em;
      overflow-wrap: anywhere;
    }

    .recipient-message {
      margin:
        4mm
        2mm
        0;

      font-size: 10.5pt;
    }

    .company-area {
      position: relative;

      min-height: 42mm;

      padding-right: 22mm;
    }
      .company-stamp {
  position: absolute;

  top: 1mm;      /* 少し上へ */
  right: 5mm;    /* 左へ移動 */

  width: 34mm;

  opacity: 0.88;

  pointer-events: none;
}

    .company-name {
      margin-bottom: 2mm;

      font-size: 14.5pt;
      font-weight: 700;

      white-space: nowrap;
    }

    .company-lines {
      font-size: 9.5pt;
      line-height: 1.65;
    }

    


    /* =========================
       編集可能部分
    ========================= */

    .editable {
      outline: none;
    }

    .editable:hover {
      background: #fffbed;
    }

    .editable:focus {
      background: #fff6c9;

      box-shadow:
        0 0 0 3px
        #fff6c9;
    }

    .invoice-item-amount.editable {
      cursor: text;
    }


    /* =========================
       明細表
    ========================= */

    .invoice-table {
      width: 100%;

      border-collapse: collapse;
      table-layout: fixed;
    }

    .invoice-table th,
    .invoice-table td {
      border:
        1px solid
        var(--line);
    }

    .invoice-table th {
      height: 11mm;

      background:
        linear-gradient(
          135deg,
          var(--navy-dark),
          var(--navy)
        );

      color: #ffffff;

      font-size: 11.5pt;
      text-align: center;

      letter-spacing: 0.2em;
    }

    .invoice-table th:first-child {
      width: 58%;
    }

    .invoice-item-row td {
      height: 27mm;

      padding:
        6mm
        7mm;
    }

    .invoice-item-description {
      font-size: 11.5pt;
      line-height: 1.7;
      text-align: center;

      overflow-wrap: anywhere;
    }

    .invoice-item-amount {
      font-size: 15pt;
      text-align: right;
      vertical-align: middle;

      white-space: nowrap;
    }

    .invoice-blank-row td {
      height: 8mm;
    }

    .invoice-total-row td {
      height: 10mm;

      padding:
        0
        5mm;

      font-size: 10.5pt;
    }

    .invoice-total-label {
      background: #f8fafc;

      font-weight: 700;
      text-align: center;
    }

    .invoice-total-value {
      text-align: right;
      white-space: nowrap;
    }

    .invoice-grand-row td {
      height: 13mm;

      border-top:
        1.5px solid
        #7494ba;

      background:
        linear-gradient(
          90deg,
          #edf3fa,
          #ffffff
        );

      color: var(--navy-dark);

      font-size: 15pt;
      font-weight: 700;
    }


    /* =========================
       ご請求金額
    ========================= */

    .invoice-claim {
      display: grid;

      grid-template-columns:
        43mm
        minmax(0, 1fr);

      width: 123mm;

      margin:
        7mm
        auto
        0;

      border:
        1.5px solid
        var(--navy-dark);
    }

    .invoice-claim-label {
      display: flex;

      align-items: center;
      justify-content: center;

      min-height: 16mm;

      background:
        linear-gradient(
          135deg,
          var(--navy-dark),
          var(--navy)
        );

      color: #ffffff;

      font-size: 12pt;
      font-weight: 700;
    }

    .invoice-claim-value {
      display: flex;

      align-items: center;
      justify-content: center;

      min-height: 16mm;

      color: var(--navy-dark);

      font-size: 21pt;
      font-weight: 700;

      white-space: nowrap;
    }


    /* =========================
       振込先・備考
    ========================= */

    .invoice-bottom {
      display: grid;

      grid-template-columns:
        minmax(0, 1.1fr)
        minmax(0, 0.9fr);

      gap: 8mm;

      align-items: end;

      margin-top: 8mm;
    }

    .bottom-title {
      margin-bottom: 2mm;

      color: var(--navy-dark);

      font-size: 12pt;
      font-weight: 700;
    }

    .bank-table {
      width: 100%;

      border-collapse: collapse;

      font-size: 9.5pt;
    }

    .bank-table th,
    .bank-table td {
      height: 9mm;

      border:
        1px solid
        var(--navy);
    }

    .bank-table th {
      width: 30mm;

      background:
        linear-gradient(
          135deg,
          var(--navy-dark),
          var(--navy)
        );

      color: #ffffff;

      text-align: center;
    }

    .bank-table td {
      padding:
        0
        5mm;

      overflow-wrap: anywhere;
    }

    .invoice-note {
      min-height: 42mm;

      padding: 5mm;

      border:
        1px solid
        #dde5ef;

      border-radius: 3mm;

      background:
        linear-gradient(
          135deg,
          #fafcff,
          #f4f7fb
        );
    }

    .invoice-note-title {
      margin-bottom: 3mm;

      color: var(--navy-dark);

      font-size: 11pt;
      font-weight: 700;
    }

    .invoice-note-text {
      font-size: 9pt;
      line-height: 1.7;
    }


    /* =========================
       フッター
    ========================= */

    .invoice-footer {
      display: flex;

      align-items: center;
      gap: 6mm;

      margin-top: 7mm;

      color: #839bb9;
    }

    .invoice-footer::before,
    .invoice-footer::after {
      flex: 1;

      height: 1px;

      background: #9db1ca;

      content: "";
    }


    /* =========================
       スマホ表示
    ========================= */

    @media screen and (max-width: 850px) {

      body {
        overflow-x: auto;
      }

      .invoice-toolbar {
        position: static;
      }

      .invoice-sheet {
        margin:
          12px
          auto;
      }

    }


    /* =========================
       印刷設定
    ========================= */

    @media print {

      @page {
        size: A4 portrait;
        margin: 7mm;
      }

      html,
      body {
        width: auto;
        height: auto;

        margin: 0;
        padding: 0;

        background: #ffffff;

        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .invoice-toolbar,
      .invoice-help {
        display: none !important;
      }

      .invoice-sheet {
        width: auto;
        min-height: auto;

        margin: 0;
        padding: 0;

        box-shadow: none;

        break-inside: avoid;
        page-break-inside: avoid;
      }

      .editable:hover,
      .editable:focus {
        background: transparent;
        box-shadow: none;
      }

    }

  </style>

</head>


<body>

  <div class="invoice-toolbar">

    <button
      type="button"
      class="primary"
      onclick="window.print()"
    >
      🖨 印刷・PDF保存
    </button>

    <button
      type="button"
      onclick="window.close()"
    >
      閉じる
    </button>

  </div>


  <div class="invoice-help">
    宛名・物件名・摘要・備考・金額は、文字をクリックして修正できます。<br>
    金額を変更すると、小計・消費税・合計も自動で変更されます。
  </div>


  <main class="invoice-sheet">

    <section class="invoice-title-area">

      <h1 class="invoice-title">
        請 求 書
      </h1>

      <div class="invoice-title-line"></div>

      <div class="invoice-date">
        ${invoiceEscapeHtml(issueDate)}
      </div>

    </section>


    <section class="invoice-top">

      <div>

        <div
          class="recipient-name editable"
          contenteditable="true"
          spellcheck="false"
        >
          ${recipient}
        </div>

        <p class="recipient-message">
          下記の通り、ご請求申し上げます。
        </p>

      </div>


      <div class="company-area">

        <div class="company-name">
          ${invoiceEscapeHtml(INVOICE_COMPANY.name)}
        </div>

        <div class="company-lines">

          <div>
            ${invoiceEscapeHtml(INVOICE_COMPANY.address1)}
          </div>

          <div>
            ${invoiceEscapeHtml(INVOICE_COMPANY.address2)}
          </div>

          <div>
            TEL：${invoiceEscapeHtml(INVOICE_COMPANY.tel)}
          </div>

          <div>
            FAX：${invoiceEscapeHtml(INVOICE_COMPANY.fax)}
          </div>

          <div>
            登録番号：${invoiceEscapeHtml(INVOICE_COMPANY.registrationNumber)}
          </div>

        </div>
<img
  src="${stampImageUrl}"
  class="company-stamp"
>
        

      </div>

    </section>
        <table class="invoice-table">

      <thead>

        <tr>
          <th>摘　要</th>
          <th>金　額</th>
        </tr>

      </thead>

      <tbody>

        <tr class="invoice-item-row">

          <td>

            <div
              class="invoice-item-description editable"
              contenteditable="true"
              spellcheck="false"
            >

              <div>
                ${property}
              </div>

              <div>
                ${description}
              </div>

            </div>

          </td>

          <td
            id="invoiceEditableAmount"
            class="invoice-item-amount editable"
            contenteditable="true"
            spellcheck="false"
          >
            ${editableAmount}
          </td>

        </tr>


        <tr class="invoice-blank-row">
          <td></td>
          <td></td>
        </tr>


        <tr class="invoice-blank-row">
          <td></td>
          <td></td>
        </tr>


        <tr class="invoice-total-row">

          <td class="invoice-total-label">
            小計
          </td>

          <td
            id="invoiceSubtotal"
            class="invoice-total-value"
          >
            ${subtotal}
          </td>

        </tr>


        <tr class="invoice-total-row">

          <td
            id="invoiceTaxLabel"
            class="invoice-total-label"
          >
            ${taxLabel}
          </td>

          <td
            id="invoiceTax"
            class="invoice-total-value"
          >
            ${tax}
          </td>

        </tr>


        <tr
          class="
            invoice-total-row
            invoice-grand-row
          "
        >

          <td class="invoice-total-label">
            合計
          </td>

          <td
            id="invoiceTotal"
            class="invoice-total-value"
          >
            ${total}
          </td>

        </tr>

      </tbody>

    </table>


    <section class="invoice-claim">

      <div class="invoice-claim-label">
        ご請求金額
      </div>

      <div
        id="invoiceClaimTotal"
        class="invoice-claim-value"
      >
        ${total}
      </div>

    </section>


    <section class="invoice-bottom">

      <div>

        <div class="bottom-title">
          ■ お振込先
        </div>

        <table class="bank-table">

          <tr>

            <th>
              銀行名
            </th>

            <td>
              ${invoiceEscapeHtml(
                INVOICE_COMPANY.bankName
              )}
            </td>

          </tr>


          <tr>

            <th>
              支店名
            </th>

            <td>
              ${invoiceEscapeHtml(
                INVOICE_COMPANY.branchName
              )}
            </td>

          </tr>


          <tr>

            <th>
              口座番号
            </th>

            <td>
              ${invoiceEscapeHtml(
                INVOICE_COMPANY.accountNumber
              )}
            </td>

          </tr>


          <tr>

            <th>
              名義
            </th>

            <td>
              ${invoiceEscapeHtml(
                INVOICE_COMPANY.accountName
              )}
            </td>

          </tr>

        </table>

      </div>


      <aside class="invoice-note">

        <div class="invoice-note-title">
          備考
        </div>

        <div
          class="invoice-note-text editable"
          contenteditable="true"
          spellcheck="false"
        >
          平素より格別のご高配を賜り、<br>
          誠にありがとうございます。<br>
          上記の通りご請求申し上げます。<br>
          何卒よろしくお願い申し上げます。
        </div>

      </aside>

    </section>


    <div class="invoice-footer">
      <span>❧</span>
    </div>

  </main>


  <script>

    (function () {

      const taxMode =
        ${JSON.stringify(taxMode)};


      const amountElement =
        document.getElementById(
          "invoiceEditableAmount"
        );


      const subtotalElement =
        document.getElementById(
          "invoiceSubtotal"
        );


      const taxElement =
        document.getElementById(
          "invoiceTax"
        );


      const totalElement =
        document.getElementById(
          "invoiceTotal"
        );


      const claimTotalElement =
        document.getElementById(
          "invoiceClaimTotal"
        );


      const taxLabelElement =
        document.getElementById(
          "invoiceTaxLabel"
        );


      /*
        金額文字を数字へ変換
      */

      function parseInvoiceAmount(
        value
      ) {
        const normalized =
          String(
            value || ""
          )
            .replace(
              /[０-９]/g,
              function (
                character
              ) {
                return String.fromCharCode(
                  character.charCodeAt(0) -
                  65248
                );
              }
            )
            .replace(
              /[^0-9]/g,
              ""
            );

        return Math.max(
          0,
          Math.round(
            Number(normalized) || 0
          )
        );
      }


      /*
        円表示
      */

      function formatInvoiceAmount(
        value
      ) {
        return (
          "¥" +
          Math.round(
            Number(value) || 0
          ).toLocaleString(
            "ja-JP"
          )
        );
      }


      /*
        入力金額から税計算
      */

      function calculateInvoiceAmounts(
        inputAmount
      ) {

        /*
          税込
        */

        if (
          taxMode ===
          "taxIncluded"
        ) {
          const total =
            inputAmount;

          const subtotal =
            Math.round(
              total / 1.1
            );

          return {
            subtotal:
              subtotal,

            tax:
              total - subtotal,

            total:
              total,

            taxLabel:
              "消費税（10％・内税）"
          };
        }


        /*
          自由入力
        */

        if (
          taxMode ===
          "free"
        ) {
          return {
            subtotal:
              inputAmount,

            tax:
              0,

            total:
              inputAmount,

            taxLabel:
              "消費税"
          };
        }


        /*
          税抜
        */

        const tax =
          Math.round(
            inputAmount * 0.1
          );

        return {
          subtotal:
            inputAmount,

          tax:
            tax,

          total:
            inputAmount + tax,

          taxLabel:
            "消費税（10％）"
        };
      }


      /*
        表示金額を更新
      */

      function updateInvoiceAmounts() {
        const inputAmount =
          parseInvoiceAmount(
            amountElement.textContent
          );

        const amounts =
          calculateInvoiceAmounts(
            inputAmount
          );

        subtotalElement.textContent =
          formatInvoiceAmount(
            amounts.subtotal
          );

        taxElement.textContent =
          formatInvoiceAmount(
            amounts.tax
          );

        totalElement.textContent =
          formatInvoiceAmount(
            amounts.total
          );

        claimTotalElement.textContent =
          formatInvoiceAmount(
            amounts.total
          );

        taxLabelElement.textContent =
          amounts.taxLabel;
      }


      /*
        金額入力中
      */

      amountElement.addEventListener(
        "input",
        updateInvoiceAmounts
      );


      /*
        金額欄から離れたとき
      */

      amountElement.addEventListener(
        "blur",
        function () {
          const inputAmount =
            parseInvoiceAmount(
              amountElement.textContent
            );

          amountElement.textContent =
            formatInvoiceAmount(
              inputAmount
            );

          updateInvoiceAmounts();
        }
      );


      /*
        Enterで入力確定
      */

      amountElement.addEventListener(
        "keydown",
        function (
          event
        ) {
          if (
            event.key ===
            "Enter"
          ) {
            event.preventDefault();

            amountElement.blur();
          }
        }
      );


      /*
        金額欄クリック時に全選択
      */

      amountElement.addEventListener(
        "focus",
        function () {
          const selection =
            window.getSelection();

          const range =
            document.createRange();

          range.selectNodeContents(
            amountElement
          );

          selection.removeAllRanges();

          selection.addRange(
            range
          );
        }
      );


      /*
        貼り付け時に文字装飾を除去
      */

      amountElement.addEventListener(
        "paste",
        function (
          event
        ) {
          event.preventDefault();

          const pastedText =
            (
              event.clipboardData ||
              window.clipboardData
            ).getData(
              "text"
            );

          document.execCommand(
            "insertText",
            false,
            pastedText
          );
        }
      );


      /*
        印刷前に金額表示を確定
      */

      window.addEventListener(
        "beforeprint",
        function () {
          amountElement.blur();

          updateInvoiceAmounts();
        }
      );


      /*
        初回表示時にも計算
      */

      updateInvoiceAmounts();

    })();

  <\/script>

</body>

</html>
  `);

  previewWindow.document.close();
}
/* ==================================================
   3点メニューCSS
================================================== */

function initializeInvoiceMenuStyles() {
  if (
    document.getElementById(
      "invoiceMenuStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "invoiceMenuStyles";

  style.textContent = `

    .case-menu-wrap {
      position: relative;

      display: inline-flex;

      justify-content: center;
    }


    .case-menu-button {
      display: inline-flex;

      align-items: center;
      justify-content: center;

      width: 34px;
      min-width: 34px;
      height: 34px;

      padding: 0;

      border:
        1px solid
        #cbd5e1;

      border-radius: 8px;

      background: #ffffff;
      color: #173d72;

      box-shadow: none;

      font-size: 21px;
      font-weight: 800;
      line-height: 1;

      cursor: pointer;
    }


    .case-menu-button:hover {
      border-color: #87a6cc;

      background: #edf4ff;
      color: #0b2b57;

      transform: none;
    }


    .case-action-menu {
      position: fixed;

      z-index: 999999;

      display: none;

      width: 220px;

      padding: 7px;

      border:
        1px solid
        #dbe3ed;

      border-radius: 10px;

      background: #ffffff;

      box-shadow:
        0 14px 35px
        rgba(
          15,
          23,
          42,
          0.22
        );
    }


    .case-action-menu.open {
      display: grid;
      gap: 3px;
    }


    .case-action-menu button {
      width: 100%;
      min-height: 40px;

      padding:
        0
        11px;

      border: none;
      border-radius: 7px;

      background: transparent;
      color: #334155;

      box-shadow: none;

      font-size: 12px;
      font-weight: 750;

      text-align: left;

      cursor: pointer;
    }


    .case-action-menu button:hover {
      background: #edf4ff;
      color: #123a70;

      transform: none;
    }


    .case-action-menu button.danger {
      color: #dc2626;
    }


    .case-action-menu button.danger:hover {
      background: #fef2f2;
      color: #b91c1c;
    }


    @media screen and (max-width: 600px) {

      .case-action-menu {
        width: 205px;
      }

      .case-action-menu button {
        min-height: 42px;

        font-size: 13px;
      }

    }

  `;

  document.head.appendChild(
    style
  );
}


/* ==================================================
   請求書機能を開始
================================================== */

if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeInvoiceMenuStyles
  );
} else {
  initializeInvoiceMenuStyles();
}
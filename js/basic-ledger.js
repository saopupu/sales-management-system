/* =========================
   基本台帳
========================= */

let currentBasicLedgerCaseIndex = null;


/* =========================
   基本台帳を開く
========================= */

function openBasicLedger(index) {

  const sale =
    getSalesData()[index];

  if (!sale) {
    alert(
      "案件データを取得できませんでした。"
    );
    return;
  }

  currentBasicLedgerCaseIndex =
    index;

  createBasicLedgerModal();

  /*
    案件データから自動入力
  */

  setBasicLedgerValue(
    "basicLedgerTransactionDate",
    sale.contractDate || ""
  );

  setBasicLedgerValue(
    "basicLedgerTenantName",
    sale.customer || ""
  );

  setBasicLedgerValue(
    "basicLedgerProperty",
    sale.property || ""
  );

  setBasicLedgerValue(
    "basicLedgerRent",
    sale.rent || ""
  );

  setBasicLedgerValue(
    "basicLedgerBrokerageFee",
    sale.brokerageFee || ""
  );

  setBasicLedgerValue(
    "basicLedgerOtherBroker",
    sale.company || ""
  );
}


/* =========================
   値を入れる
========================= */

function setBasicLedgerValue(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (element) {
    element.value =
      value ?? "";
  }
}


/* =========================
   モーダル作成
========================= */

function createBasicLedgerModal() {

  let modal =
    document.getElementById(
      "basicLedgerModal"
    );

  if (modal) {
    modal.style.display =
      "flex";
    return;
  }


  modal =
    document.createElement(
      "div"
    );

  modal.id =
    "basicLedgerModal";

  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,0.48);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;


  modal.innerHTML = `

    <div
      style="
        background:#ffffff;
        width:min(900px,96vw);
        max-height:90vh;
        overflow-y:auto;
        border-radius:16px;
        padding:28px;
        box-shadow:
          0 24px 70px
          rgba(0,0,0,0.25);
      "
    >

      <!-- タイトル -->

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:16px;
          margin-bottom:24px;
        "
      >

        <div>

          <h2
            style="
              margin:0;
              font-size:22px;
            "
          >
            📋 基本台帳
          </h2>

          <div
            style="
              margin-top:5px;
              color:#64748b;
              font-size:13px;
            "
          >
            貸借の媒介・代理に関する取引記録
          </div>

        </div>


        <button
          type="button"
          onclick="closeBasicLedger()"
          style="
            width:38px;
            height:38px;
            border:0;
            border-radius:50%;
            background:#f1f5f9;
            cursor:pointer;
            font-size:20px;
          "
        >
          ×
        </button>

      </div>


      <div class="basic-ledger-grid">


        <!-- 取引年月日 -->

        <div class="basic-ledger-field">

          <label>
            取引年月日
          </label>

          <input
            type="date"
            id="basicLedgerTransactionDate"
          >

        </div>


        <!-- 取引態様 -->

        <div class="basic-ledger-field">

          <label>
            取引態様
          </label>

          <select
            id="basicLedgerTransactionType"
          >

            <option
              value="貸借の媒介"
            >
              貸借の媒介
            </option>

            <option
              value="貸借の代理"
            >
              貸借の代理
            </option>

          </select>

        </div>


        <!-- 借主氏名 -->

        <div class="basic-ledger-field">

          <label>
            借主氏名
          </label>

          <input
            type="text"
            id="basicLedgerTenantName"
          >

        </div>


        <!-- 借主住所 -->

        <div class="basic-ledger-field">

          <label>
            借主住所
          </label>

          <input
            type="text"
            id="basicLedgerTenantAddress"
          >

        </div>


        <!-- 貸主氏名 -->

        <div class="basic-ledger-field">

          <label>
            貸主氏名
          </label>

          <input
            type="text"
            id="basicLedgerLandlordName"
          >

        </div>


        <!-- 貸主住所 -->

        <div class="basic-ledger-field">

          <label>
            貸主住所
          </label>

          <input
            type="text"
            id="basicLedgerLandlordAddress"
          >

        </div>


        <!-- 物件所在地 -->

        <div
          class="
            basic-ledger-field
            basic-ledger-full
          "
        >

          <label>
            物件所在地
          </label>

          <input
            type="text"
            id="basicLedgerProperty"
          >

        </div>


        <!-- 面積 -->

        <div class="basic-ledger-field">

          <label>
            面積（㎡）
          </label>

          <input
            type="number"
            step="0.01"
            id="basicLedgerArea"
          >

        </div>


        <!-- 構造 -->

        <div class="basic-ledger-field">

          <label>
            建物の構造
          </label>

          <input
            type="text"
            id="basicLedgerStructure"
            placeholder="例：鉄筋コンクリート造"
          >

        </div>


        <!-- 用途 -->

        <div class="basic-ledger-field">

          <label>
            用途
          </label>

          <input
            type="text"
            id="basicLedgerUsage"
            placeholder="例：居住用"
          >

        </div>


        <!-- 賃料 -->

        <div class="basic-ledger-field">

          <label>
            賃料
          </label>

          <input
            type="number"
            id="basicLedgerRent"
          >

        </div>


        <!-- 報酬額 -->

        <div class="basic-ledger-field">

          <label>
            報酬額
          </label>

          <input
            type="number"
            id="basicLedgerBrokerageFee"
          >

        </div>


        <!-- 他業者 -->

        <div
          class="
            basic-ledger-field
            basic-ledger-full
          "
        >

          <label>
            関与した他の宅地建物取引業者
          </label>

          <input
            type="text"
            id="basicLedgerOtherBroker"
          >

        </div>


        <!-- 特約 -->

        <div
          class="
            basic-ledger-field
            basic-ledger-full
          "
        >

          <label>
            特約その他参考事項
          </label>

          <textarea
            id="basicLedgerRemarks"
            rows="4"
          ></textarea>

        </div>

      </div>


      <!-- ボタン -->

      <div
        style="
          display:flex;
          justify-content:flex-end;
          gap:10px;
          margin-top:26px;
        "
      >

        <button
          type="button"
          onclick="closeBasicLedger()"
        >
          閉じる
        </button>


        


        <button
          type="button"
          onclick="createBasicLedgerPdf()"
          style="
            padding:10px 20px;
            background:#111827;
            color:white;
            border:0;
            border-radius:9px;
            font-weight:700;
            cursor:pointer;
          "
        >
          📄 PDF作成・保存
        </button>

      </div>

    </div>
  `;


  document.body.appendChild(
    modal
  );
}


/* =========================
   閉じる
========================= */

function closeBasicLedger() {

  const modal =
    document.getElementById(
      "basicLedgerModal"
    );

  if (modal) {
    modal.style.display =
      "none";
  }
}

/* =========================
   基本台帳PDF作成
   ＋案件書類へ自動保存
========================= */

async function createBasicLedgerPdf() {

  const sale =
    getSalesData()[
      currentBasicLedgerCaseIndex
    ];

  if (!sale) {
    alert(
      "案件データを取得できませんでした。"
    );
    return;
  }


  if (
    sale.supabaseId === null ||
    sale.supabaseId === undefined
  ) {
    alert(
      "この案件はSupabaseに登録されていません。"
    );
    return;
  }


  if (
    typeof html2pdf ===
    "undefined"
  ) {
    alert(
      "PDF作成機能を読み込めませんでした。"
    );
    return;
  }


  const getValue =
    function (id) {

      const element =
        document.getElementById(id);

      return element
        ? element.value.trim()
        : "";
    };


  const escapeHtml =
    function (value) {

      return String(
        value || ""
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
    };


  const formatMoney =
    function (value) {

      if (!value) {
        return "";
      }

      const amount =
        Number(value);

      if (
        Number.isNaN(amount)
      ) {
        return value;
      }

      return (
        amount.toLocaleString(
          "ja-JP"
        ) +
        "円"
      );
    };


  const formatDate =
    function (value) {

      if (!value) {
        return "";
      }

      const parts =
        value.split("-");

      if (
        parts.length !== 3
      ) {
        return value;
      }

      return (
        parts[0] +
        "年" +
        Number(parts[1]) +
        "月" +
        Number(parts[2]) +
        "日"
      );
    };


  /*
    入力内容
  */

  const transactionDate =
    getValue(
      "basicLedgerTransactionDate"
    );

  const transactionType =
    getValue(
      "basicLedgerTransactionType"
    );

  const tenantName =
    getValue(
      "basicLedgerTenantName"
    );

  const tenantAddress =
    getValue(
      "basicLedgerTenantAddress"
    );

  const landlordName =
    getValue(
      "basicLedgerLandlordName"
    );

  const landlordAddress =
    getValue(
      "basicLedgerLandlordAddress"
    );

  const property =
    getValue(
      "basicLedgerProperty"
    );

  const area =
    getValue(
      "basicLedgerArea"
    );

  const structure =
    getValue(
      "basicLedgerStructure"
    );

  const usage =
    getValue(
      "basicLedgerUsage"
    );

  const rent =
    getValue(
      "basicLedgerRent"
    );

  const brokerageFee =
    getValue(
      "basicLedgerBrokerageFee"
    );

  const otherBroker =
    getValue(
      "basicLedgerOtherBroker"
    );

  const remarks =
    getValue(
      "basicLedgerRemarks"
    );


  /*
    PDF用の一時HTML
  */

  const pdfArea =
    document.createElement(
      "div"
    );


  pdfArea.style.cssText = `
    width: 190mm;
    padding: 8mm;
    background: #ffffff;
    color: #111827;
    font-family:
      "Yu Gothic",
      "Meiryo",
      sans-serif;
    font-size: 11px;
  `;


  pdfArea.innerHTML = `

    <div
      style="
        text-align:center;
        font-size:22px;
        font-weight:700;
        margin-bottom:4px;
      "
    >
      宅地建物取引業者 基本台帳
    </div>

    <div
      style="
        text-align:center;
        color:#64748b;
        font-size:10px;
        margin-bottom:18px;
      "
    >
      貸借取引
    </div>


    <table
      style="
        width:100%;
        border-collapse:collapse;
        table-layout:fixed;
      "
    >

      <tr>

        <th style="${basicLedgerPdfThStyle()}">
          取引年月日
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${escapeHtml(
            formatDate(
              transactionDate
            )
          )}
        </td>

        <th style="${basicLedgerPdfThStyle()}">
          取引態様
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${escapeHtml(
            transactionType
          )}
        </td>

      </tr>


      ${basicLedgerPdfSection(
        "当事者"
      )}


      <tr>

        <th style="${basicLedgerPdfThStyle()}">
          借主氏名
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${escapeHtml(
            tenantName
          )}
        </td>

        <th style="${basicLedgerPdfThStyle()}">
          借主住所
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${escapeHtml(
            tenantAddress
          )}
        </td>

      </tr>


      <tr>

        <th style="${basicLedgerPdfThStyle()}">
          貸主氏名
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${escapeHtml(
            landlordName
          )}
        </td>

        <th style="${basicLedgerPdfThStyle()}">
          貸主住所
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${escapeHtml(
            landlordAddress
          )}
        </td>

      </tr>


      ${basicLedgerPdfSection(
        "物件"
      )}


      <tr>

        <th style="${basicLedgerPdfThStyle()}">
          物件所在地
        </th>

        <td
          colspan="3"
          style="${basicLedgerPdfTdStyle()}"
        >
          ${escapeHtml(
            property
          )}
        </td>

      </tr>


      <tr>

        <th style="${basicLedgerPdfThStyle()}">
          面積
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${
            area
              ? escapeHtml(area) +
                " ㎡"
              : ""
          }
        </td>

        <th style="${basicLedgerPdfThStyle()}">
          建物の構造
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${escapeHtml(
            structure
          )}
        </td>

      </tr>


      <tr>

        <th style="${basicLedgerPdfThStyle()}">
          用途
        </th>

        <td
          colspan="3"
          style="${basicLedgerPdfTdStyle()}"
        >
          ${escapeHtml(
            usage
          )}
        </td>

      </tr>


      ${basicLedgerPdfSection(
        "取引条件・報酬"
      )}


      <tr>

        <th style="${basicLedgerPdfThStyle()}">
          賃料
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${escapeHtml(
            formatMoney(
              rent
            )
          )}
        </td>

        <th style="${basicLedgerPdfThStyle()}">
          報酬額
        </th>

        <td style="${basicLedgerPdfTdStyle()}">
          ${escapeHtml(
            formatMoney(
              brokerageFee
            )
          )}
        </td>

      </tr>


      <tr>

        <th style="${basicLedgerPdfThStyle()}">
          関与した他の<br>
          宅地建物取引業者
        </th>

        <td
          colspan="3"
          style="${basicLedgerPdfTdStyle()}"
        >
          ${escapeHtml(
            otherBroker
          )}
        </td>

      </tr>


      <tr>

        <th style="${basicLedgerPdfThStyle()}">
          特約その他<br>
          参考事項
        </th>

        <td
          colspan="3"
          style="
            ${basicLedgerPdfTdStyle()}
            height:75px;
            vertical-align:top;
            white-space:pre-wrap;
          "
        >
          ${escapeHtml(
            remarks
          )}
        </td>

      </tr>

    </table>
  `;


  /*
    画面外に一時配置
  */

  pdfArea.style.position =
    "fixed";

  pdfArea.style.left =
    "-10000px";

  pdfArea.style.top =
    "0";

  document.body.appendChild(
    pdfArea
  );


  /*
    ファイル名
    日本語をStorageキーに
    使わないよう英数字のみ
  */

  const timestamp =
    Date.now();

  const fileName =
    `basic_ledger_${timestamp}.pdf`;

  const filePath =
    `${sale.supabaseId}/${fileName}`;


  try {

    /*
      PDF生成
  */

    const worker =
      html2pdf()
        .set({
          margin:
            5,

          image: {
            type:
              "jpeg",

            quality:
              0.98
          },

          html2canvas: {
            scale:
              2,

            useCORS:
              true
          },

          jsPDF: {
            unit:
              "mm",

            format:
              "a4",

            orientation:
              "portrait"
          }
        })
        .from(
          pdfArea
        )
        .toPdf();


    /*
      Blobとして取得
    */

    const pdfBlob =
      await worker.outputPdf(
        "blob"
      );


    /*
      Supabaseへ保存
    */

    const {
      error
    } =
      await supabaseClient
        .storage
        .from(
          CASE_DOCUMENT_BUCKET
        )
        .upload(
          filePath,
          pdfBlob,
          {
            contentType:
              "application/pdf",

            upsert:
              false
          }
        );


    if (error) {
      throw error;
    }


    alert(
      "✅ 基本台帳PDFを案件の書類に保存しました。"
    );


    /*
      書類モーダルを開く
    */

    closeBasicLedger();

    await openCaseDocuments(
      currentBasicLedgerCaseIndex
    );


  } catch (error) {

    console.error(
      "基本台帳PDF保存エラー:",
      error
    );

    alert(
      "基本台帳PDFの保存に失敗しました。"
    );


  } finally {

    pdfArea.remove();

  }
}


/* =========================
   PDFセル用CSS
========================= */

function basicLedgerPdfThStyle() {

  return `
    border:1px solid #64748b;
    padding:7px 8px;
    background:#f1f5f9;
    font-weight:700;
    text-align:left;
    vertical-align:middle;
    width:22%;
    word-break:break-word;
  `;
}


function basicLedgerPdfTdStyle() {

  return `
    border:1px solid #64748b;
    padding:7px 8px;
    vertical-align:middle;
    width:28%;
    word-break:break-word;
  `;
}


function basicLedgerPdfSection(
  title
) {

  return `
    <tr>
      <th
        colspan="4"
        style="
          border:1px solid #64748b;
          padding:6px 8px;
          background:#e2e8f0;
          font-weight:700;
          text-align:left;
        "
      >
        ${title}
      </th>
    </tr>
  `;
}
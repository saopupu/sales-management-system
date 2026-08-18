const CASE_DOCUMENT_BUCKET = "case-documents";

let currentDocumentCaseIndex = null;


/* =========================
   書類画面を開く
========================= */

async function openCaseDocuments(index) {

  const sale = getSalesData()[index];

  if (!sale) {
    alert("案件データを取得できませんでした。");
    return;
  }

  if (
    sale.supabaseId === null ||
    sale.supabaseId === undefined
  ) {
    alert(
      "この案件はまだSupabaseに登録されていないため、書類を保存できません。"
    );
    return;
  }

  currentDocumentCaseIndex = index;

  createDocumentModal();

  const title =
    document.getElementById("caseDocumentTitle");

  if (title) {
    title.textContent =
      `📎 ${sale.customer || "案件"} の書類`;
  }

  await loadCaseDocuments();

}


/* =========================
   モーダルを作る
========================= */

function createDocumentModal() {

  let modal =
    document.getElementById(
      "caseDocumentModal"
    );

  if (modal) {
    modal.style.display = "flex";
    return;
  }

  modal =
    document.createElement("div");

  modal.id =
    "caseDocumentModal";

  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  modal.innerHTML = `
    <div
      style="
        background: white;
        width: min(700px, 95vw);
        max-height: 85vh;
        overflow-y: auto;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.25);
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom:20px;
        "
      >

        <h2
          id="caseDocumentTitle"
          style="margin:0;"
        >
          📎 書類管理
        </h2>

        <button
          type="button"
          onclick="closeCaseDocuments()"
          style="
            border:none;
            background:#eee;
            width:36px;
            height:36px;
            border-radius:50%;
            cursor:pointer;
          "
        >
          ×
        </button>

      </div>


      <div
        style="
          padding:16px;
          background:#f7f7f7;
          border-radius:12px;
          margin-bottom:20px;
        "
      >

        <label
          style="
            display:block;
            font-weight:bold;
            margin-bottom:8px;
          "
        >
          書類を追加
        </label>

        <input
          type="file"
          id="caseDocumentFileInput"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
        >

        <button
          type="button"
          onclick="uploadCaseDocument()"
          style="
            margin-top:12px;
            padding:10px 18px;
            cursor:pointer;
          "
        >
          📤 アップロード
        </button>

        <p
          id="caseDocumentMessage"
          style="
            margin-bottom:0;
            font-size:13px;
          "
        ></p>

      </div>


      <div>

        <h3>
          保存済み書類
        </h3>

        <div id="caseDocumentList">
          読み込み中...
        </div>

      </div>

    </div>
  `;

  document.body.appendChild(
    modal
  );

}


/* =========================
   モーダルを閉じる
========================= */

function closeCaseDocuments() {

  const modal =
    document.getElementById(
      "caseDocumentModal"
    );

  if (modal) {
    modal.style.display =
      "none";
  }

}


/* =========================
   書類アップロード
========================= */

async function uploadCaseDocument() {

  const sale =
    getSalesData()[
      currentDocumentCaseIndex
    ];

  if (!sale) {
    alert(
      "案件データを取得できませんでした。"
    );
    return;
  }

  const input =
    document.getElementById(
      "caseDocumentFileInput"
    );

  const message =
    document.getElementById(
      "caseDocumentMessage"
    );

  if (
    !input ||
    !input.files ||
    !input.files.length
  ) {
    alert(
      "アップロードするファイルを選択してください。"
    );
    return;
  }

  const file =
    input.files[0];

  /*
    20MB制限
  */

  const maxSize =
    20 * 1024 * 1024;

  if (file.size > maxSize) {
    alert(
      "ファイルサイズは20MB以下にしてください。"
    );
    return;
  }

  /*
    ファイル名を安全な形にする
  */

  const extension =
  file.name.includes(".")
    ? file.name.split(".").pop().toLowerCase()
    : "file";

const safeFileName =
  `document_${Date.now()}.${extension}`;

const filePath =
  `${sale.supabaseId}/${safeFileName}`;

  if (message) {
    message.textContent =
      "アップロード中...";
  }

  try {

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
          file,
          {
            upsert: false,
            contentType:
              file.type ||
              undefined
          }
        );

    if (error) {
      throw error;
    }

    if (message) {
      message.textContent =
        "✅ アップロードしました。";
    }

    input.value = "";

    await loadCaseDocuments();

  } catch (error) {

    console.error(
      "書類アップロードエラー",
      error
    );

    if (message) {
      message.textContent =
        "❌ アップロードに失敗しました。";
    }

    alert(
      "書類をアップロードできませんでした。"
    );

  }

}


/* =========================
   保存済み書類一覧
========================= */

async function loadCaseDocuments() {

  const sale =
    getSalesData()[
      currentDocumentCaseIndex
    ];

  const listArea =
    document.getElementById(
      "caseDocumentList"
    );

  if (!sale || !listArea) {
    return;
  }

  listArea.innerHTML =
    "読み込み中...";

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .storage
        .from(
          CASE_DOCUMENT_BUCKET
        )
        .list(
          String(
            sale.supabaseId
          ),
          {
            limit: 100,
            sortBy: {
              column: "created_at",
              order: "desc"
            }
          }
        );

    if (error) {
      throw error;
    }

    const files =
      (data || []).filter(
        function (item) {
          return item.name;
        }
      );

    if (!files.length) {

      listArea.innerHTML = `
        <p
          style="
            color:#777;
            padding:12px;
          "
        >
          まだ書類はありません。
        </p>
      `;

      return;
    }

    listArea.innerHTML = "";

    files.forEach(
      function (file) {

        const row =
          document.createElement(
            "div"
          );

        row.style.cssText = `
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          padding:12px;
          border-bottom:1px solid #eee;
        `;

        const displayName =
          file.name.replace(
            /^\\d+_/,
            ""
          );

        row.innerHTML = `
          <div
            style="
              min-width:0;
              flex:1;
              word-break:break-all;
            "
          >
            📄 ${displayName}
          </div>

          <div
            style="
              display:flex;
              gap:8px;
            "
          >

            <button
              type="button"
              onclick='openStoredDocument(
                ${JSON.stringify(
                  file.name
                )}
              )'
            >
              開く
            </button>

            <button
              type="button"
              onclick='deleteStoredDocument(
                ${JSON.stringify(
                  file.name
                )}
              )'
              style="
                color:#c00;
              "
            >
              削除
            </button>

          </div>
        `;

        listArea.appendChild(
          row
        );

      }
    );

  } catch (error) {

    console.error(
      "書類一覧取得エラー",
      error
    );

    listArea.innerHTML =
      "書類一覧を取得できませんでした。";

  }

}


/* =========================
   書類を開く
========================= */

async function openStoredDocument(
  fileName
) {

  const sale =
    getSalesData()[
      currentDocumentCaseIndex
    ];

  if (!sale) {
    return;
  }

  const filePath =
    `${sale.supabaseId}/${fileName}`;

  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .storage
        .from(
          CASE_DOCUMENT_BUCKET
        )
        .createSignedUrl(
          filePath,
          60
        );

    if (error) {
      throw error;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer"
    );

  } catch (error) {

    console.error(
      "書類表示エラー",
      error
    );

    alert(
      "書類を開けませんでした。"
    );

  }

}


/* =========================
   書類削除
========================= */

async function deleteStoredDocument(
  fileName
) {

  const sale =
    getSalesData()[
      currentDocumentCaseIndex
    ];

  if (!sale) {
    return;
  }

  const ok =
    confirm(
      "この書類を削除しますか？"
    );

  if (!ok) {
    return;
  }

  const filePath =
    `${sale.supabaseId}/${fileName}`;

  try {

    const {
      error
    } =
      await supabaseClient
        .storage
        .from(
          CASE_DOCUMENT_BUCKET
        )
        .remove([
          filePath
        ]);

    if (error) {
      throw error;
    }

    await loadCaseDocuments();

  } catch (error) {

    console.error(
      "書類削除エラー",
      error
    );

    alert(
      "書類を削除できませんでした。"
    );

  }

}
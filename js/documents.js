const CASE_DOCUMENT_BUCKET = "case-documents";

let currentDocumentCaseIndex = null;

// SQL・権限検証後に接続する。現時点では通信・永続保存を行わない。
let caseDocumentNameAdapter = null;

async function getCaseDocumentDisplayNames(documents) {
  if (!caseDocumentNameAdapter) return new Map();
  return caseDocumentNameAdapter.getNames(documents);
}

async function saveCaseDocumentDisplayName(document, stem, expectedVersion) {
  if (!caseDocumentNameAdapter) {
    throw new Error("名前変更の保存先は未接続です。現在は保存できません。");
  }
  return caseDocumentNameAdapter.saveName(document, stem, expectedVersion);
}

function createStoredDocumentRow(file, sale, record, namesAvailable) {
  const documentRef = {
    bucket: CASE_DOCUMENT_BUCKET,
    path: `${sale.supabaseId}/${file.name}`,
    objectId: file.id
  };
  const extensionIndex = file.name.lastIndexOf(".");
  const extension = extensionIndex >= 0 ? file.name.slice(extensionIndex) : "";
  const fallbackName = file.name.startsWith("basic_ledger_")
    ? "基本台帳.pdf"
    : file.name.replace(/^\\d+_/, "");
  let currentStem = record ? record.display_stem
    : (extension ? fallbackName.slice(0, -extension.length) : fallbackName);
  let version = record ? record.version : 0;
  const canSave = Boolean(namesAvailable && caseDocumentNameAdapter && file.id &&
    /^\.(pdf|jpg|jpeg|png|webp)$/i.test(extension));

  const row = document.createElement("div");
  row.style.cssText = "display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px;padding:12px;border-bottom:1px solid #eee;";
  const label = document.createElement("div");
  label.style.cssText = "min-width:0;flex:1;word-break:break-all;";
  function updateLabel() { label.textContent = `📄 ${currentStem}${extension}`; }
  updateLabel();
  row.appendChild(label);

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;";
  function addButton(text, handler) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.addEventListener("click", handler);
    actions.appendChild(button);
    return button;
  }
  addButton("開く", () => openStoredDocument(file.name));
  const renameButton = addButton("名前変更", () => {
    editor.hidden = false;
    input.value = currentStem;
    message.textContent = canSave ? "拡張子は変更できません。"
      : "名前変更は準備中です。保存先が未接続、取得失敗、または対象情報が不足しているため保存できません。";
    input.focus();
  });
  const deleteButton = addButton("削除", () => deleteStoredDocument(file.name));
  deleteButton.style.color = "#c00";
  row.appendChild(actions);

  const editor = document.createElement("form");
  editor.hidden = true;
  editor.style.cssText = "flex-basis:100%;min-width:0;";
  const fieldLabel = document.createElement("label");
  fieldLabel.textContent = "書類名（拡張子を除く） ";
  const input = document.createElement("input");
  input.type = "text";
  input.maxLength = 120;
  input.required = true;
  input.style.cssText = "max-width:100%;box-sizing:border-box;";
  fieldLabel.appendChild(input);
  const suffix = document.createElement("span");
  suffix.textContent = extension;
  fieldLabel.appendChild(suffix);
  editor.appendChild(fieldLabel);
  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.textContent = "保存";
  saveButton.disabled = !canSave;
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.textContent = "キャンセル";
  cancelButton.addEventListener("click", () => { editor.hidden = true; });
  const message = document.createElement("p");
  message.setAttribute("role", "status");
  editor.append(saveButton, cancelButton, message);
  editor.addEventListener("submit", async event => {
    event.preventDefault();
    if (!canSave || saveButton.disabled) return;
    const stem = input.value.trim();
    if (!stem || Array.from(stem).length > 120 || stem === "." || stem === ".." ||
        /[\/\\\u0000-\u001f\u007f-\u009f]/.test(stem)) {
      message.textContent = "書類名は1～120文字で入力し、斜線・制御文字は使わないでください。";
      return;
    }
    saveButton.disabled = true;
    cancelButton.disabled = true;
    renameButton.disabled = true;
    deleteButton.disabled = true;
    message.textContent = "保存中...";
    try {
      const saved = await saveCaseDocumentDisplayName(documentRef, stem, version);
      if (!saved || saved.object_id !== documentRef.objectId ||
          saved.object_path !== documentRef.path || saved.version !== version + 1 ||
          saved.display_stem !== stem) {
        throw new Error("保存結果を確認できません。書類一覧を再取得してください。");
      }
      currentStem = saved.display_stem;
      version = saved.version;
      updateLabel();
      editor.hidden = true;
    } catch (error) {
      message.textContent = error.message || "名前を保存できませんでした。";
    } finally {
      saveButton.disabled = !canSave;
      cancelButton.disabled = false;
      renameButton.disabled = false;
      deleteButton.disabled = false;
    }
  });
  row.appendChild(editor);
  return row;
}


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

    const documents = files.map(file => ({
      bucket: CASE_DOCUMENT_BUCKET,
      path: `${sale.supabaseId}/${file.name}`,
      objectId: file.id
    }));
    let names = new Map();
    let namesAvailable = false;
    const notice = document.createElement("p");
    notice.setAttribute("role", "status");
    try {
      names = await getCaseDocumentDisplayNames(documents);
      namesAvailable = Boolean(caseDocumentNameAdapter);
      notice.textContent = namesAvailable ? ""
        : "名前変更は準備中です。表示名の共有保存先は未接続です。";
    } catch (error) {
      notice.textContent = "表示名を取得できません。従来の名前で表示します。名前変更は保存できません。";
    }
    listArea.appendChild(notice);
    files.forEach(file => {
      const record = names.get(file.id);
      const matchingRecord = record && record.object_id === file.id &&
        record.object_path === `${sale.supabaseId}/${file.name}` &&
        record.bucket_id === CASE_DOCUMENT_BUCKET ? record : null;
      listArea.appendChild(createStoredDocumentRow(file, sale, matchingRecord, namesAvailable));
    });
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

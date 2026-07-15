/* =========================
   今日のホーム機能
========================= */


/* =========================
   今日の日付を取得
========================= */

function getAlarmToday() {
  const today = new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  return today;
}


/* =========================
   今日の日付を
   YYYY-MM-DD形式で取得
========================= */

function getTodayDateText() {
  const today =
    getAlarmToday();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      "0"
    );

  return (
    year +
    "-" +
    month +
    "-" +
    day
  );
}


/* =========================
   今日の日付を
   日本語で表示
========================= */

function getTodayDisplayText() {
  const today =
    getAlarmToday();

  const weekNames = [
    "日",
    "月",
    "火",
    "水",
    "木",
    "金",
    "土"
  ];

  return (
    today.getFullYear() +
    "年" +
    (
      today.getMonth() + 1
    ) +
    "月" +
    today.getDate() +
    "日（" +
    weekNames[
      today.getDay()
    ] +
    "）"
  );
}


/* =========================
   HTMLで使う文字を
   安全に変換
========================= */

function escapeAlarmHtml(
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


/* =========================
   対象外ステータス判定
========================= */

function isTodayHomeExcludedSale(
  sale
) {
  return (
    sale.status ===
      "キャンセル" ||
    sale.status ===
      "審査落ち"
  );
}


/* =========================
   ログインユーザーが
   見られる案件か判定
========================= */

function canDisplayAlarmSale(
  sale
) {
  if (
    typeof currentLoginUser ===
      "undefined" ||
    !currentLoginUser
  ) {
    return false;
  }

  /*
    吉田さんは
    全員分を表示
  */

  if (
    currentLoginUser.name ===
    "吉田"
  ) {
    return true;
  }

  /*
    その他は
    自分の担当案件のみ
  */

  return (
    sale.staff ===
    currentLoginUser.name
  );
}


/* =========================
   今日のホーム対象案件を取得
========================= */

function getTodayHomeSales() {
  const sales =
    typeof getSalesData ===
    "function"
      ? getSalesData()
      : [];

  if (
    !Array.isArray(
      sales
    )
  ) {
    return [];
  }

  return sales.filter(
    function (sale) {
      if (!sale) {
        return false;
      }

      if (
        isTodayHomeExcludedSale(
          sale
        )
      ) {
        return false;
      }

      return canDisplayAlarmSale(
        sale
      );
    }
  );
}


/* =========================
   今日契約のお客様
========================= */

function getTodayContractSales() {
  const todayText =
    getTodayDateText();

  return getTodayHomeSales()
    .filter(
      function (sale) {
        return (
          sale.contractDate ===
          todayText
        );
      }
    )
    .sort(
      function (a, b) {
        return String(
          a.customer || ""
        ).localeCompare(
          String(
            b.customer || ""
          ),
          "ja"
        );
      }
    );
}


/* =========================
   今日入居のお客様
========================= */

function getTodayStartSales() {
  const todayText =
    getTodayDateText();

  return getTodayHomeSales()
    .filter(
      function (sale) {
        return (
          sale.startDate ===
          todayText
        );
      }
    )
    .sort(
      function (a, b) {
        return String(
          a.customer || ""
        ).localeCompare(
          String(
            b.customer || ""
          ),
          "ja"
        );
      }
    );
}


/* =========================
   本日の担当案件を取得

   今日契約または今日入居の
   案件を重複なしで数える
========================= */

function getTodayAssignedSales() {
  const contractSales =
    getTodayContractSales();

  const startSales =
    getTodayStartSales();

  const combinedSales = [
    ...contractSales,
    ...startSales
  ];

  return combinedSales.filter(
    function (
      sale,
      index,
      array
    ) {
      /*
        SupabaseのIDがある場合は
        IDで重複判定
      */

      if (sale.id) {
        return (
          array.findIndex(
            function (item) {
              return (
                item.id ===
                sale.id
              );
            }
          ) === index
        );
      }

      /*
        IDがない場合は
        お客様・物件・担当で判定
      */

      const saleKey = [
        sale.customer || "",
        sale.property || "",
        sale.staff || ""
      ].join("|");

      return (
        array.findIndex(
          function (item) {
            const itemKey = [
              item.customer || "",
              item.property || "",
              item.staff || ""
            ].join("|");

            return (
              itemKey ===
              saleKey
            );
          }
        ) === index
      );
    }
  );
}


/* =========================
   お客様一覧HTML
========================= */

function createTodayCustomerListHtml(
  sales,
  emptyMessage
) {
  if (
    sales.length === 0
  ) {
    return `
      <div class="today-customer-empty">
        ${escapeAlarmHtml(
          emptyMessage
        )}
      </div>
    `;
  }

  return sales
    .map(
      function (sale) {
        const customer =
          sale.customer ||
          "お客様名未入力";

        const property =
          sale.property ||
          "物件名未入力";

        const staff =
          sale.staff ||
          "担当未入力";

        return `
          <div class="today-customer-item">

            <div class="today-customer-main">

              <strong>
                ${escapeAlarmHtml(
                  customer
                )} 様
              </strong>

              <span>
                ${escapeAlarmHtml(
                  property
                )}
              </span>

            </div>

            <span
              class="today-staff-badge staff-${escapeAlarmHtml(
                staff
              )}"
            >
              ${escapeAlarmHtml(
                staff
              )}
            </span>

          </div>
        `;
      }
    )
    .join("");
}


/* =========================
   挨拶文を表示
========================= */

function renderTodayHomeGreeting() {
  const greeting =
    document.getElementById(
      "todayHomeGreeting"
    );

  const dateElement =
    document.getElementById(
      "todayHomeDate"
    );

  if (dateElement) {
    dateElement.textContent =
      getTodayDisplayText();
  }

  if (!greeting) {
    return;
  }

  if (
    typeof currentLoginUser ===
      "undefined" ||
    !currentLoginUser
  ) {
    greeting.textContent =
      "今日の予定を読み込んでいます...";

    return;
  }

  greeting.textContent =
    "おはようございます、" +
    currentLoginUser.name +
    "さん。今日の予定を確認しましょう。";
}


/* =========================
   今日のホームを表示
========================= */

function renderAlarm() {
  const alarmList =
    document.getElementById(
      "alarmList"
    );

  if (!alarmList) {
    return;
  }

  renderTodayHomeGreeting();

  /*
    ログイン情報の準備前
  */

  if (
    typeof currentLoginUser ===
      "undefined" ||
    !currentLoginUser
  ) {
    alarmList.innerHTML = `
      <div class="today-home-loading">
        今日の予定を読み込んでいます...
      </div>
    `;

    return;
  }

  const assignedSales =
    getTodayAssignedSales();

  const contractSales =
    getTodayContractSales();

  const startSales =
    getTodayStartSales();

  const contractListHtml =
    createTodayCustomerListHtml(
      contractSales,
      "今日契約のお客様はいません"
    );

  const startListHtml =
    createTodayCustomerListHtml(
      startSales,
      "今日入居のお客様はいません"
    );

  alarmList.innerHTML = `
    <div class="today-summary-grid">

      <div class="today-summary-card today-assigned-card">

        <div class="today-summary-icon">
          📋
        </div>

        <div class="today-summary-content">

          <span>
            本日の担当案件
          </span>

          <strong>
            ${assignedSales.length}件
          </strong>

          <small>
            今日契約・今日入居の案件
          </small>

        </div>

      </div>

      <div class="today-summary-card today-contract-card">

        <div class="today-summary-icon">
          📄
        </div>

        <div class="today-summary-content">

          <span>
            今日契約
          </span>

          <strong>
            ${contractSales.length}件
          </strong>

          <small>
            契約日が今日の案件
          </small>

        </div>

      </div>

      <div class="today-summary-card today-start-card">

        <div class="today-summary-icon">
          🔑
        </div>

        <div class="today-summary-content">

          <span>
            今日入居
          </span>

          <strong>
            ${startSales.length}件
          </strong>

          <small>
            契約開始日が今日の案件
          </small>

        </div>

      </div>

    </div>

    <div class="today-detail-grid">

      <section class="today-detail-card">

        <div class="today-detail-header">

          <h3>
            📄 今日契約のお客様
          </h3>

          <span>
            ${contractSales.length}件
          </span>

        </div>

        <div class="today-customer-list">
          ${contractListHtml}
        </div>

      </section>

      <section class="today-detail-card">

        <div class="today-detail-header">

          <h3>
            🔑 今日入居のお客様
          </h3>

          <span>
            ${startSales.length}件
          </span>

        </div>

        <div class="today-customer-list">
          ${startListHtml}
        </div>

      </section>

    </div>
  `;
}


/* =========================
   データ変更後に再表示
========================= */

function refreshAlarm() {
  renderAlarm();
}
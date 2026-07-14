/* =========================
   アラーム機能
========================= */

const ALARM_INITIAL_LIMIT = 5;

let alarmExpanded = false;


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
   日付文字列を安全に変換
========================= */

function parseAlarmDate(
  dateText
) {
  if (!dateText) {
    return null;
  }

  const parts =
    String(dateText)
      .split("-")
      .map(Number);

  if (
    parts.length !== 3 ||
    !parts[0] ||
    !parts[1] ||
    !parts[2]
  ) {
    return null;
  }

  const date =
    new Date(
      parts[0],
      parts[1] - 1,
      parts[2]
    );

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}


/* =========================
   今日から何日後か計算
========================= */

function calculateAlarmDays(
  dateText
) {
  const targetDate =
    parseAlarmDate(
      dateText
    );

  if (!targetDate) {
    return null;
  }

  const today =
    getAlarmToday();

  return Math.round(
    (
      targetDate.getTime() -
      today.getTime()
    ) /
    86400000
  );
}


/* =========================
   アラームデータを作成
========================= */

function createAlarmItem(
  type,
  sale,
  days
) {
  return {
    type:
      type,

    days:
      days,

    customer:
      sale.customer ||
      "お客様名未入力",

    property:
      sale.property ||
      "物件名未入力",

    staff:
      sale.staff ||
      "担当未入力",

    date:
      type === "contract"
        ? sale.contractDate
        : sale.startDate
  };
}


/* =========================
   ログインユーザーが
   見られる案件か判定
========================= */

function canDisplayAlarmSale(
  sale
) {
  /*
    ログイン情報がまだない場合
  */

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
    その他のスタッフは
    自分の案件だけ表示
  */

  return (
    sale.staff ===
    currentLoginUser.name
  );
}


/* =========================
   アラーム対象を取得
========================= */

function getAlarmData() {
  const sales =
    typeof getSalesData ===
    "function"
      ? getSalesData()
      : [];

  if (!Array.isArray(sales)) {
    return [];
  }

  const alarms = [];

  sales.forEach(
    function (sale) {
      if (!sale) {
        return;
      }

      /*
        ログインユーザーが
        見られる案件だけにする
      */

      if (
        !canDisplayAlarmSale(
          sale
        )
      ) {
        return;
      }

      /*
        キャンセル・審査落ちは
        アラーム対象外
      */

      if (
        sale.status ===
          "キャンセル" ||
        sale.status ===
          "審査落ち"
      ) {
        return;
      }

      /*
        契約日のアラーム
      */

      const contractDays =
        calculateAlarmDays(
          sale.contractDate
        );

      if (
        contractDays !== null &&
        contractDays >= 0 &&
        contractDays <= 3
      ) {
        alarms.push(
          createAlarmItem(
            "contract",
            sale,
            contractDays
          )
        );
      }

      /*
        契約開始日・鍵引渡しの
        アラーム
      */

      const startDays =
        calculateAlarmDays(
          sale.startDate
        );

      if (
        startDays !== null &&
        startDays >= 0 &&
        startDays <= 3
      ) {
        alarms.push(
          createAlarmItem(
            "start",
            sale,
            startDays
          )
        );
      }
    }
  );

  /*
    期限が近い順に並べる
  */

  alarms.sort(
    function (a, b) {
      if (
        a.days !== b.days
      ) {
        return (
          a.days - b.days
        );
      }

      return String(
        a.date || ""
      ).localeCompare(
        String(
          b.date || ""
        )
      );
    }
  );

  return alarms;
}


/* =========================
   アラームタイトル
========================= */

function getAlarmTitle(
  alarm
) {
  if (
    alarm.type ===
    "contract"
  ) {
    return "📄 契約";
  }

  return "🔑 鍵引渡し";
}


/* =========================
   残り日数の表示
========================= */

function getAlarmDayText(
  days
) {
  if (days === 0) {
    return "今日";
  }

  if (days === 1) {
    return "明日";
  }

  return (
    "あと" +
    days +
    "日"
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
   アラームカードHTML
========================= */

function createAlarmHtml(
  alarm
) {
  const title =
    getAlarmTitle(
      alarm
    );

  const dayText =
    getAlarmDayText(
      alarm.days
    );

  return `
    <div class="alarm-item">

      <div class="alarm-header">
        <strong>
          ${escapeAlarmHtml(title)}
          ${escapeAlarmHtml(dayText)}
        </strong>
      </div>

      <div class="alarm-body">

        <div>
          👤
          ${escapeAlarmHtml(
            alarm.customer
          )}
        </div>

        <div>
          🏢
          ${escapeAlarmHtml(
            alarm.property
          )}
        </div>

        <div>
          🙋
          ${escapeAlarmHtml(
            alarm.staff
          )}
        </div>

        <div>
          📅
          ${escapeAlarmHtml(
            alarm.date
          )}
        </div>

      </div>

    </div>
  `;
}


/* =========================
   すべて表示・折りたたみ
========================= */

function toggleAlarmDisplay() {
  alarmExpanded =
    !alarmExpanded;

  renderAlarm();
}


/* =========================
   アラーム表示
========================= */

function renderAlarm() {
  const alarmList =
    document.getElementById(
      "alarmList"
    );

  if (!alarmList) {
    return;
  }

  /*
    ログイン情報の準備前
  */

  if (
    typeof currentLoginUser ===
      "undefined" ||
    !currentLoginUser
  ) {
    alarmList.innerHTML = `
      <div class="alarm-empty">
        アラームを読み込み中...
      </div>
    `;

    return;
  }

  const alarms =
    getAlarmData();

  if (
    alarms.length === 0
  ) {
    alarmList.innerHTML = `
      <div class="alarm-empty">
        🎉 今日のアラームはありません
      </div>
    `;

    return;
  }

  const displayAlarms =
    alarmExpanded
      ? alarms
      : alarms.slice(
          0,
          ALARM_INITIAL_LIMIT
        );

  let html =
    displayAlarms
      .map(
        createAlarmHtml
      )
      .join("");

  if (
    alarms.length >
    ALARM_INITIAL_LIMIT
  ) {
    const hiddenCount =
      alarms.length -
      ALARM_INITIAL_LIMIT;

    const buttonText =
      alarmExpanded
        ? "折りたたむ"
        : `すべて見る（残り${hiddenCount}件）`;

    html += `
      <button
        type="button"
        class="alarm-toggle-button"
        onclick="toggleAlarmDisplay()"
      >
        ${escapeAlarmHtml(
          buttonText
        )}
      </button>
    `;
  }

  alarmList.innerHTML =
    html;
}


/* =========================
   アラームを再読み込み
========================= */

function refreshAlarm() {
  alarmExpanded = false;

  renderAlarm();
}
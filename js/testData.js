/* =========================
   テストデータ生成 Part①
========================= */

const TEST_CUSTOMERS = [
  "山田 太郎",
  "佐藤 花子",
  "鈴木 一郎",
  "高橋 美咲",
  "田中 健",
  "伊藤 愛",
  "渡辺 翼",
  "小林 優",
  "加藤 翔",
  "中村 美月",
  "吉田 大輔",
  "井上 真奈",
  "木村 亮",
  "清水 美穂",
  "松本 大地",
  "林 真由",
  "森 拓海",
  "池田 美咲",
  "橋本 健太",
  "山口 彩"
];

const TEST_PROPERTIES = [
  "レジデンス池袋",
  "プレミア新宿",
  "ルミエール川口",
  "グランフォート大宮",
  "パークサイド赤羽",
  "シティタワー上野",
  "エクセル中野",
  "アーバンテラス横浜",
  "スカイコート新橋",
  "ラフィネ新宿"
];

const TEST_COMPANIES = [
  "SYLA",
  "GA technologies",
  "タウンハウジング",
  "ハウスメイト",
  "大東建託",
  "東建コーポレーション",
  "レオパレス21",
  "エイブル",
  "ミニミニ",
  "ピタットハウス"
];

const TEST_STAFF = [
  "矢部",
  "吉田",
  "早坂",
  "米山"
];

const TEST_STATUS = [
  "申込",
  "審査中",
  "契約予定",
  "契約済",
  "キャンセル",
  "審査落ち"
];


/* =========================
   ランダム取得
========================= */

function randomItem(array) {

  return array[
    Math.floor(
      Math.random() *
      array.length
    )
  ];

}


/* =========================
   ランダム数値
========================= */

function randomNumber(min, max) {

  return Math.floor(
    Math.random() *
    (max - min + 1)
  ) + min;

}


/* =========================
   ランダム日付
========================= */

function randomDate(days) {

  const date =
    new Date();

  date.setDate(
    date.getDate() + days
  );

  return date
    .toISOString()
    .slice(0,10);

}


/* =========================
   テスト案件作成
========================= */

function createTestSale() {

  const rent =
    randomNumber(
      70000,
      180000
    );

  const contractOffset =
    randomNumber(
      -7,
      14
    );

  const startOffset =
    contractOffset +
    randomNumber(
      1,
      7
    );

  return {

    applyDate:
      randomDate(
        contractOffset - 3
      ),

    contractDate:
      randomDate(
        contractOffset
      ),

    startDate:
      randomDate(
        startOffset
      ),

    staff:
      randomItem(
        TEST_STAFF
      ),

    customer:
      randomItem(
        TEST_CUSTOMERS
      ),

    property:
      randomItem(
        TEST_PROPERTIES
      ),

    company:
      randomItem(
        TEST_COMPANIES
      ),

    rent:
      rent,

    managementFee:
      randomNumber(
        3000,
        15000
      ),

    ad:
      randomNumber(
        0,
        300000
      ),

    brokerageFee:
      rent,

    brokerageTaxType:
      "税抜",

    feePaymentDate:
      randomDate(
        startOffset + 3
      ),

    adPaymentDate:
      randomDate(
        startOffset + 5
      ),

    installment:
      "利用なし",

    status:
      randomItem(
        TEST_STATUS
      ),

    memo:
      "テストデータ"
  };

}
/* =========================
   テストデータ30件生成
========================= */

async function generateTestData() {

  const ok = confirm(
    "テストデータを30件作成しますか？"
  );

  if (!ok) {
    return;
  }

  let success = 0;

  for (let i = 0; i < 30; i++) {

    const sale =
      createTestSale();

    const saved =
      await addSale(sale);

    if (saved) {
      success++;
    }

  }

  render();

  alert(
    success +
      "件のテストデータを作成しました。"
  );

}


/* =========================
   テストデータ削除
========================= */

async function deleteAllTestData() {

  const ok = confirm(
    "テストデータをすべて削除しますか？"
  );

  if (!ok) {
    return;
  }

  const sales =
    getSalesData();

  const targets =
    sales.filter(function (sale) {

      return (
        sale.memo ===
        "テストデータ"
      );

    });

  for (const sale of targets) {

    const index =
      getSalesData().findIndex(
        function (item) {

          return (
            item.id === sale.id
          );

        }
      );

    if (index >= 0) {

      await deleteSaleData(
        index
      );

    }

  }

  render();

  alert(
    "テストデータを削除しました。"
  );

}
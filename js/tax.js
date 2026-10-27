// 消費税率
const TAX_RATE = 0.10;

// 仲介手数料の表示金額を計算
function calculateBrokerageFee(amount, taxType) {
  amount = Number(amount) || 0;

  // 税込入力・自由入力は登録金額をそのまま使用する
  if (taxType === "taxIncluded" || taxType === "free") {
    return amount;
  }

  // 税抜入力は10％加算して四捨五入。未設定・未知の区分の既存動作も維持する。
  return Math.round(amount * (1 + TAX_RATE));
}

// 円表示
function formatYen(amount) {
  return Number(amount || 0).toLocaleString("ja-JP") + "円";
}

// 消費税率
const TAX_RATE = 0.10;

// 仲介手数料の表示金額を計算
function calculateBrokerageFee(amount, taxType) {
  amount = Number(amount) || 0;

  // 自由入力（税金を反映しない）
  if (taxType === "free") {
    return amount;
  }

  // 税込入力・税抜入力はどちらも税込表示
  return Math.round(amount * (1 + TAX_RATE));
}

// 円表示
function formatYen(amount) {
  return Number(amount || 0).toLocaleString("ja-JP") + "円";
}
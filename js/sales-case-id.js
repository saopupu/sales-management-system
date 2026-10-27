/* DB bigintは文字列で保持。JSONで丸められた数値は復元しない。 */
function normalizeSalesCaseId(value) {
  const fail = message => { const error = new Error(message); error.code = 'INVALID_SALES_CASE_ID'; throw error; };
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) fail('案件IDの精度を確認できません。処理を中止しました。');
    value = String(value);
  }
  if (typeof value !== 'string' || value.length > 20 || !/^-?(0|[1-9][0-9]*)$/.test(value)) fail('案件IDが不正です。');
  const id = BigInt(value);
  if (id < -9223372036854775808n || id > 9223372036854775807n || id.toString() !== value) fail('案件IDがbigintの範囲または正規形式ではありません。');
  return value;
}

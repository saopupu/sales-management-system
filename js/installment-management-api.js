/* 独立した分割管理専用。既存案件・売上APIは呼び出さない。 */
(() => {
  const allowed = () => typeof canUseSalesApp === 'function' && canUseSalesApp();
  const identity = () => typeof currentLoginUser !== 'undefined' ? currentLoginUser?.id : null;
  let editor = false;
  let generation = 0;
  // outcome: 'not-sent'＝送信前に中止 / 'uncertain'＝送信後に結果不明 / 'rejected'＝サーバーが処理を拒否（code付き）
  function failure(message, outcome, code = '') {
    const error = Error(message);
    error.outcome = outcome;
    error.code = code;
    return error;
  }
  async function call(name, args = {}) {
    if (window.HimenaviInstallmentEnabled !== true || !allowed()) throw failure('分割管理は未導入、または利用権限がありません。', 'not-sent');
    const user = identity();
    let response;
    try {
      response = await supabaseClient.rpc(name, args);
    } catch (error) {
      throw failure(String(error?.message || error || '通信エラー'), 'uncertain');
    }
    if (user !== identity() || !allowed()) throw failure('ログイン状態が変更されました。', 'uncertain');
    const { data, error } = response || {};
    if (error) {
      const code = typeof error.code === 'string' ? error.code : '';
      throw failure(String(error.message || '処理できませんでした。'), code ? 'rejected' : 'uncertain', code);
    }
    return data;
  }
  window.InstallmentAPI = {
    get canEdit() { return editor && allowed() && window.HimenaviInstallmentEnabled === true && canEditSalesManagement(); },
    reset() { editor = false; generation++; },
    async read(month) {
      const request = ++generation;
      editor = false;
      const result = await call('im_read', { p_month: month + '-01' });
      if (request !== generation) throw Error('取得要求が更新されました。');
      if (result?.protocol !== 1 || !Array.isArray(result.rows)) throw Error('分割管理の応答を確認できません。');
      editor = result.can_edit === true;
      return result.rows;
    },
    async save(id, version, row) {
      if (!this.canEdit) throw failure('編集権限がありません。', 'not-sent');
      return call('im_save', { p_id: id, p_version: version, p_row: row });
    },
    async remove(id, version) {
      if (!this.canEdit) throw failure('削除権限がありません。', 'not-sent');
      return call('im_delete', { p_id: id, p_version: version });
    }
  };
})();

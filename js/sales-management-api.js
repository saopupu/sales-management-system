/* 未導入時は必ず無効。DB適用・認可検証後にだけ明示的に有効化する。 */
(() => {
  let available = false;
  let serverCanEdit = false;
  const permitted = () => typeof canUseSalesApp === 'function' && canUseSalesApp();
  async function call(name, args = {}) {
    if (!permitted()) throw Error('利用権限がありません。');
    const {data, error} = await supabaseClient.rpc(name, args);
    if (error) throw error;
    return data;
  }
  window.SalesCaseExtension = {
    get available() { return available && permitted() && window.HimenaviSalesEditingEnabled === true; },
    get canEdit() { return this.available && serverCanEdit; },
    async connect() {
      available = false;
      serverCanEdit = false;
      if (window.HimenaviSalesEditingEnabled !== true || !permitted()) return false;
      try {
        const data = await call('smx_capabilities');
        // 旧案（4名全員が編集可）のRPCとは接続しない。
        available = data?.protocol === 2 && data?.id_format === 'bigint-decimal-string' && data?.authorization === 'three-editors-one-viewer' && data?.allowed === true && typeof data?.can_edit === 'boolean';
        serverCanEdit = available && data.can_edit === true;
      } catch { available = false; }
      return available;
    },
    async read(offset, limit) {
      if (!this.available) throw Error('保存機能は未導入です。');
      return call('smx_read', {p_offset: offset, p_limit: limit});
    },
    async save(row, patch, meta = {}, action = 'save', requestId = crypto.randomUUID()) {
      if (typeof canEditSalesManagement !== 'function' || !canEditSalesManagement()) throw Error('売上管理の編集権限がありません。');
      if (!this.canEdit) throw Error('DB側の編集権限または保存機能を確認できません。');
      const id = normalizeSalesCaseId(row.id);
      const result = await call('smx_save', {p_id: id, p_expected: row.snapshot, p_version: row.meta_version,
        p_patch: patch, p_meta: meta, p_action: action, p_request_id: requestId});
      if (normalizeSalesCaseId(result?.id) !== id) throw Error('保存対象IDを確認できませんでした。');
      return {...result, id};
    },
    reset() { available = false; serverCanEdit = false; }
  };
})();


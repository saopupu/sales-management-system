/* sales_casesが正本。保存拡張は明示的な有効化とDB能力確認の両方が必要。 */
(() => {
  'use strict';
  const columns = [['staff','担当'],['property','物件名'],['customer','顧客名'],['management','管理会社'],['reviewed','審査'],['installment','分割'],['contract_date','契約日'],['rent_date','賃料発生日'],['brokerage','仲介手数料'],['brokerage_date','入金日（仲介手数料）'],['ad','AD'],['ad_date','入金日（AD）'],['total','売上合計'],['contracted','契約状況'],['memo','メモ']];
  const fields = 'id,staff,property,customer,company,installment,contract_date,contract_plan,brokerage_fee,brokerage_tax_type,ad,fee_payment_date,ad_payment_date,status,memo';
  const today = new Date();
  let month = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`;
  let rows = [], token = 0, ready = false, busy = false;
  let extensionReady = false, editing = null;
  const extension = () => window.SalesCaseExtension;
  const editPermission = () => typeof canEditSalesManagement === 'function' && canEditSalesManagement();
  const editable = () => ready && extensionReady && extension()?.canEdit && authorized() && editPermission() && !busy;
  const authorized = () => typeof canUseSalesApp === 'function' && canUseSalesApp();
  const identity = () => typeof currentLoginUser === 'undefined' ? null : currentLoginUser;
  const client = () => typeof supabaseClient === 'undefined' ? null : supabaseClient;
  const money = value => value === null ? '未設定' : value.toLocaleString('ja-JP');
  const text = value => typeof value === 'string' && value.trim() ? value : '未設定';
  function validMonth(value) { return typeof value === 'string' && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value); }
  function date(value) {
    if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return '';
    const [y,m,d] = value.split('-').map(Number), parsed = new Date(y,m-1,d);
    return parsed.getFullYear()===y && parsed.getMonth()===m-1 && parsed.getDate()===d ? value : '';
  }
  function amount(value) {
    if (typeof value !== 'number' && !(typeof value === 'string' && /^\d+(\.\d+)?$/.test(value))) return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : null;
  }
  function mapCase(row) {
    const id=normalizeSalesCaseId(row.id);
    const contract = date(row.contract_date), brokerage = amount(row.brokerage_fee), ad = amount(row.ad);
    return {id,source:{...row,id},month:contract ? contract.slice(0,7) : validMonth(row.contract_plan) ? row.contract_plan : '',
      staff:text(row.staff),property:text(row.property),customer:text(row.customer),management:text(row.company),
      reviewed:'未設定',rent_date:'未設定',installment:['利用なし','ポケットカード','スムーズ'].includes(row.installment)?row.installment:'未設定',
      contract_date:contract || '未設定',contract_plan:text(row.contract_plan),tax_type:text(row.brokerage_tax_type),brokerage,ad,total:brokerage === null || ad === null ? null : brokerage+ad,
      brokerage_date:date(row.fee_payment_date)||'未設定',ad_date:date(row.ad_payment_date)||'未設定',
      contracted:['申込','審査中','契約予定','契約済','契約済み','審査落ち','キャンセル'].includes(row.status)?row.status:'未設定',memo:text(row.memo)};
  }
  const section = document.createElement('section');
  section.id='salesManagementSection';section.className='sm system-view-hidden sm-readonly';
  section.innerHTML=`<div class="sm-toolbar"><h2>売上管理</h2><label>表示 <select class="sm-scope"><option value="month">月別</option><option value="all">全件</option><option value="unset">月未設定</option></select></label><label>年月 <input type="month" class="sm-month" value="${month}"></label><strong>登録金額合計 <span class="sm-planned">—</span> 円</strong><button type="button" class="sm-refresh">再取得</button><select class="sm-paper" aria-label="印刷用紙"><option>A4</option><option>A3</option></select><button type="button" class="sm-print" disabled>PDF印刷</button><button type="button" class="sm-history" disabled>移動履歴</button></div><p class="sm-help">読み取り専用：登録・修正は案件管理で行い、この画面で再取得してください。月は契約日、未確定の場合は契約予定から表示します。審査確認・賃料発生日は未設定です。金額は登録値で、税計算・入金確認による補正は行いません。</p><p class="sm-status" role="status" aria-live="polite"></p><div class="sm-scroll"><table><thead></thead><tbody></tbody><tfoot></tfoot></table></div><button type="button" class="sm-add" disabled>＋行追加（案件管理で登録）</button>`;
  const $ = s => section.querySelector(s);
  const count = document.createElement('p');count.className='sm-count sm-status';section.insertBefore(count,$('.sm-scroll'));
  const searchLabel=document.createElement('label');searchLabel.textContent='検索 ';
  const search=document.createElement('input');search.type='search';search.className='sm-search';search.placeholder='顧客名・物件名・担当者';searchLabel.append(search);$('.sm-toolbar').append(searchLabel);
  const dialog=document.createElement('dialog');dialog.className='sm-dialog';section.append(dialog);
  const commonFields=[['staff','担当'],['customer','顧客名'],['property','物件名'],['company','管理会社'],['brokerage_fee','仲介手数料（登録値）'],['ad','AD'],['fee_payment_date','仲介入金日'],['ad_payment_date','AD入金日'],['memo','メモ']];
  function openEditor(row,toggle=null){
    if(!editable() || editing)return;
    editing={row,user:identity(),inputs:new Map(),original:new Map(),request:null,payload:null};dialog.replaceChildren();
    const heading=document.createElement('h3');heading.textContent='売上項目の編集（新規登録は行いません）';dialog.append(heading);
    for(const [key,label] of [...commonFields,['brokerage_paid','仲介入金確認'],['ad_paid','AD入金確認']]){
      const wrapper=document.createElement('label');wrapper.style.display='block';wrapper.textContent=label;
      const input=document.createElement(key==='memo'?'textarea':'input');input.dataset.field=key;
      if(key.endsWith('_paid')){input.type='checkbox';input.checked=Boolean(row[key]);editing.original.set(key,input.checked);if(key===toggle)input.checked=!input.checked;}
      else{if(key!=='memo')input.type='text';input.value=row.source[key]??'';editing.original.set(key,input.value);}
      wrapper.append(input);dialog.append(wrapper);editing.inputs.set(key,input);
    }
    const message=document.createElement('p');message.className='sm-edit-status';message.setAttribute('role','status');dialog.append(message);
    const save=document.createElement('button');save.textContent='保存';save.className='sm-save';save.onclick=saveEditor;dialog.append(save);
    const cancel=document.createElement('button');cancel.textContent='閉じる';cancel.onclick=()=>{if(!busy){editing=null;dialog.close();render();}};dialog.append(cancel);
    dialog.oncancel=e=>{if(busy)e.preventDefault();else{editing=null;render();}};dialog.showModal();render();
  }
  async function saveEditor(){
    if(!editable() || !editing)return;
    const draft=editing,patch={},meta={},message=dialog.querySelector('.sm-edit-status');
    try{
      for(const [key,input] of draft.inputs){
        let value=key.endsWith('_paid')?input.checked:input.value;
        if(value===draft.original.get(key))continue;
        if(key.endsWith('_paid'))meta[key]=value;
        else{
          if(['brokerage_fee','ad'].includes(key)){if(!/^\d+$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)>1000000000000)throw Error('金額は0〜1兆円の整数を入力してください。');value=Number(value);}
          if(['fee_payment_date','ad_payment_date'].includes(key)){if(value!==''&&!date(value))throw Error('日付は実在するYYYY-MM-DDで入力してください。');value=value||null;}
          if(key==='staff'&&!['吉田','矢部','米山','早坂','売買'].includes(value))throw Error('担当者を確認してください。');
          patch[key]=value;
        }
      }
      if(!Object.keys(patch).length&&!Object.keys(meta).length){message.textContent='変更はありません。';return;}
      const payload=JSON.stringify({patch,meta});if(draft.payload!==payload){draft.payload=payload;draft.request=crypto.randomUUID();}
      busy=true;dialog.querySelector('.sm-save').disabled=true;for(const input of draft.inputs.values())input.disabled=true;message.textContent='保存中…';
      const user=identity(),result=await extension().save(draft.row,patch,meta,'save',draft.request);
      if(!authorized()||identity()!==user)return;
      if(normalizeSalesCaseId(result?.id)!==draft.row.id || !Number.isSafeInteger(result?.version) || result.version<=draft.row.meta_version)throw Error('保存結果を確認できませんでした。');
      if(Object.keys(patch).length)document.dispatchEvent(new Event('sales-case-saved'));
      editing=null;dialog.close();busy=false;await load();
      if(ready)status('保存しました。最新の正本を再取得しました。');
      else status('保存は完了しましたが再取得に失敗しました。再取得してください。',true);
    }catch(error){message.textContent='保存できませんでした。入力を保持しています。'+(error.message||'');}
    finally{busy=false;for(const input of draft.inputs.values())input.disabled=false;const save=dialog.querySelector('.sm-save');if(save)save.disabled=false;}
  }
  async function shift(row,action){
    if(!editable() || editing || (action==='move'&&!row.month))return;
    if(!confirm(action==='move'?'契約日・申込日・契約予定月を変更せず翌月へ移動しますか？':'最新の移動を元に戻しますか？'))return;
    busy=true;render();
    const user=identity();
    try{
      row.requests??={};row.requests[action]??=crypto.randomUUID();
      const result=await extension().save(row,{}, {},action,row.requests[action]);
      if(!authorized()||identity()!==user)return;
      if(normalizeSalesCaseId(result?.id)!==row.id || !Number.isSafeInteger(result?.version)||result.version<=row.meta_version)throw Error('保存結果を確認できませんでした。');
      busy=false;await load();status(ready?'移動内容を保存しました。':'移動内容は保存されましたが再取得に失敗しました。',!ready);
    }catch(error){status('移動を確認できませんでした。元の表示を保持しています。'+(error.message||''),true);}
    finally{busy=false;render();}
  }
  function status(message,error=false){$('.sm-status').textContent=message;$('.sm-status').classList.toggle('sm-error',error);}
  function visibleRows(){
    if(!authorized() || !ready) return [];
    const scope=$('.sm-scope').value;
    const keyword=search.value.trim().toLocaleLowerCase('ja-JP');
    return rows.filter(r=>(scope==='all' || (scope==='unset' ? !r.month : r.month===month)) &&
      (!keyword || [r.staff,r.customer,r.property,r.management,r.memo].some(value=>String(value).toLocaleLowerCase('ja-JP').includes(keyword))));
  }
  function render(){
    const shown=visibleRows();
    section.classList.toggle('sm-extension-enabled',Boolean(extensionReady));
    count.textContent=ready && authorized()?`表示 ${shown.length}件 / 取得 ${rows.length}件`:'表示データなし';
    $('thead').replaceChildren();const head=$('thead').insertRow();
    for(const [,label] of [...columns,['action','操作']]){const th=document.createElement('th');th.textContent=label;head.append(th);}
    $('tbody').replaceChildren();
    for(const row of shown){
      const tr=$('tbody').insertRow();tr.dataset.id=row.id;
      tr.classList.toggle('sm-contracted',['契約済','契約済み'].includes(row.contracted));
      for(const [key] of columns){
        const td=tr.insertCell();td.dataset.key=key;td.textContent=['brokerage','ad','total'].includes(key)?money(row[key]):row[key];
        if(key==='staff')td.dataset.staff=row.staff;
        if(key==='contract_date')td.title=`契約予定：${row.contract_plan}／表示月：${row.month || '月未設定'}（${row.month_override?'移動による表示月':'契約日を優先'}）`;
        if(key==='brokerage'){
          const labels={taxExcluded:'税抜入力',taxIncluded:'税込入力',free:'自由入力（税反映なし）'};
          const label=Object.prototype.hasOwnProperty.call(labels,row.tax_type)?labels[row.tax_type]:`未設定・未対応（登録値：${row.tax_type}）`;
          td.title=`登録金額（税計算なし）／入力区分：${label}`;td.setAttribute('aria-label',`${money(row.brokerage)}円。${td.title}`);
        }
        if(['brokerage','ad'].includes(key) && extensionReady){
          const button=document.createElement('button');button.textContent=money(row[key]);button.className='sm-money';button.classList.toggle('sm-paid',Boolean(row[key+'_paid']));button.disabled=!editable();
          button.title='入金確認・売上項目を編集';button.onclick=()=>openEditor(row,key+'_paid');td.replaceChildren(button);
        }
      }
      const td=tr.insertCell();td.className='sm-action';const b=document.createElement('button');b.className='sm-move';b.textContent='→';b.disabled=!editable()||!row.month;b.title='契約日等を変更せず翌月へ移動';b.onclick=()=>shift(row,'move');td.append(b);
      if(extensionReady){const edit=document.createElement('button');edit.className='sm-edit';edit.textContent='編集';edit.disabled=!editable();edit.onclick=()=>openEditor(row);td.append(edit);
        const back=document.createElement('button');back.className='sm-return';back.textContent='戻す';back.disabled=!editable()||!row.can_return;back.onclick=()=>shift(row,'return');td.append(back);}
    }
    $('tfoot').replaceChildren();
    if(ready && authorized()){
      const foot=$('tfoot').insertRow();
      for(const [key] of columns){const td=foot.insertCell();td.textContent=key==='staff'?'合計':['brokerage','ad','total'].includes(key)?money(shown.some(r=>r[key]===null)?null:shown.reduce((n,r)=>n+r[key],0)):'';}
      foot.insertCell();
      $('.sm-planned').textContent=money(shown.some(r=>r.total===null)?null:shown.reduce((n,r)=>n+r.total,0));
    }else $('.sm-planned').textContent='—';
    $('.sm-print').disabled=!ready || busy || !authorized();
    $('.sm-refresh').disabled=!authorized()||busy||Boolean(editing);
    $('.sm-month').disabled=$('.sm-scope').value!=='month' || !authorized()||busy||Boolean(editing);
    $('.sm-scope').disabled=!authorized()||busy||Boolean(editing);
    search.disabled=!authorized()||busy||Boolean(editing);
  }
  function clear(){token++;rows=[];ready=false;busy=false;extensionReady=false;extension()?.reset();editing=null;dialog.close();render();status('ログイン済みの利用者4名だけが閲覧できます。');}
  async function load(){
    if(!authorized()){clear();return;}
    const request=++token,user=identity();rows=[];ready=false;busy=true;render();status('取得中…');
    try{
      const c=client();if(!c)throw Error('接続を確認してください。');
      extensionReady=await extension()?.connect() || false;
      if(request!==token || !authorized() || identity()!==user)return;
      $('.sm-help').textContent=extensionReady?'保存機能接続済み：案件の新規登録は案件管理で行います。確認フラグと表示月だけを補助情報へ保存します。金額は登録値（税計算なし）です。':'読み取り専用：保存機能は未導入または無効です。登録・修正は案件管理で行ってください。月は契約日、なければ契約予定月です。金額は登録値（税計算なし）です。';
      if(extensionReady&&(!editPermission()||!extension()?.canEdit))$('.sm-help').textContent='閲覧のみ：売上管理の編集・保存・入金確認・移動・復元はできません。表示切替・検索・再取得は利用できます。金額は登録値（税計算なし）です。';
      const collected=[],pageSize=100;let expected=null;
      for(let offset=0;;offset+=pageSize){
        if(request!==token || !authorized() || identity()!==user)return;
        const result=extensionReady?await extension().read(offset,pageSize):await c.from('sales_cases').select(fields,{count:'exact'}).order('id',{ascending:true}).range(offset,offset+pageSize-1);
        if(request!==token || !authorized() || identity()!==user)return;
        if(result.error)throw result.error;
        if(!Array.isArray(result.data) || !Number.isSafeInteger(result.count) || result.count<0)throw Error('取得結果を確認できませんでした。');
        if(expected===null)expected=result.count;
        if(expected!==result.count)throw Error('取得中に件数が変わりました。再取得してください。');
        collected.push(...result.data);
        if(collected.length>expected)throw Error("取得件数が一致しません。再取得してください。");
        if(collected.length===expected)break;
        if(result.data.length!==pageSize)throw Error('全件を取得できませんでした。');
      }
      const unique=new Map();for(const source of collected){
        const row=mapCase(extensionReady?source.case:source);
        if(extensionReady){
          if(typeof source.snapshot!=='string'||!source.snapshot||!Number.isSafeInteger(source.meta?.version)||source.meta.version<0)throw Error('競合確認情報がありません。');
          Object.assign(row,{snapshot:source.snapshot,meta_version:source.meta.version,brokerage_paid:source.meta.brokerage_paid===true,ad_paid:source.meta.ad_paid===true,can_return:source.meta.can_return===true});
          if(source.meta.accounting_month!==null && source.meta.accounting_month!==undefined){if(!date(source.meta.accounting_month)||!source.meta.accounting_month.endsWith('-01'))throw Error('表示月が不正です。');row.month=source.meta.accounting_month.slice(0,7);row.month_override=true;}
        }
        if(!unique.has(row.id))unique.set(row.id,row);
      }
      // 重複除外だけでは別IDの取得漏れを隠すため、正常完了にしない。
      if(unique.size!==expected)throw Error('同一IDの重複を検出し、全件取得を確認できませんでした。再取得してください。');
      rows=[...unique.values()];ready=true;
      status(`取得完了：${rows.length}件。表示条件で絞り込みます。`);
    }catch(error){if(request!==token)return;rows=[];ready=false;status('取得に失敗しました。古い情報は表示していません。再取得してください。 '+(error.message||''),true);}
    finally{if(request===token){busy=false;render();}}
  }
  function print(){
    if(!authorized() || !ready || busy)return;
    const w=window.open('','_blank');if(!w){status('印刷画面を開けませんでした。',true);return;}
    w.document.title='売上管理（読み取り専用）';
    const style=w.document.createElement('style');style.textContent=`@page{size:${$('.sm-paper').value} landscape;margin:8mm}body{font:8pt sans-serif}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:4px;white-space:pre-wrap;overflow-wrap:anywhere}.sm-action,th:last-child,td:last-child{display:none}thead{display:table-header-group}tr{break-inside:avoid}`;w.document.head.append(style);
    const h=w.document.createElement('h2');h.textContent='売上管理（読み取り専用） '+$('.sm-scope').selectedOptions[0].textContent+($('.sm-scope').value==='month'?' '+month:'');w.document.body.append(h);
    const note=w.document.createElement('p');note.textContent=$('.sm-help').textContent;w.document.body.append(note);
    w.document.body.append($('table').cloneNode(true));w.focus();w.print();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const host=document.querySelector('.main-content .container') || (document.body.dataset.salesPreview==='true'?document.body:null);if(!host)return;
    host.append(section);render();
    $('.sm-refresh').onclick=()=>{if(!editing)return load();};$('.sm-print').onclick=print;
    $('.sm-scope').onchange=render;$('.sm-month').onchange=()=>{month=$('.sm-month').value;render();};
    search.oninput=render;
    let wasOpen=false;
    const open=()=>{const active=!section.classList.contains('system-view-hidden');if(active&&!wasOpen)load();wasOpen=active;};
    new MutationObserver(open).observe(section,{attributes:true,attributeFilter:['class']});
    document.addEventListener('sales-permissions-changed',()=>{
      if(!editPermission()||(editing&&editing.user!==identity())){editing=null;dialog.close();dialog.replaceChildren();}
      if(!authorized())clear();else if(!section.classList.contains('system-view-hidden'))load();
    });
    client()?.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')clear();});
    open();
  });
  window.addEventListener('beforeunload',event=>{if(editing||busy){event.preventDefault();event.returnValue='';}});
})();

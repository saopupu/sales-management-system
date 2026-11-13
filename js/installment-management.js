(() => {
  const categories = ['クレジットカード','ポケットカード','現金受領','スムーズ','その他'];
  // 担当者は3名のみ。早坂は閲覧専用の利用者で、担当者には選べない（SQLのCHECKと一致させる）。
  const staffs = ['吉田','矢部','米山'];
  function nextMonth(value, delta) {
    const [y,m] = value.split('-').map(Number), d = new Date(y,m-1+delta,1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  }
  function totals(rows) {
    return rows.filter(r=>!r.deleted_at).reduce((sum,r)=>{
      const n=BigInt(r.amount); sum.registered+=n;
      if(r.payment_date)sum.paid+=n;else sum.unpaid+=n;
      return sum;
    },{registered:0n,paid:0n,unpaid:0n});
  }
  const KEEP='入力内容は画面に残しています。';
  function saveErrorMessage(error,isNew){
    if(error?.outcome==='uncertain')return `通信が途切れたため、保存できたかどうかを確認できませんでした。${KEEP}このままもう一度［保存］を押しても、二重登録や上書きにはなりません（すでに保存されていた場合は、そのことをお知らせします）。`;
    if(error?.code==='23505'&&isNew)return '前回の保存で、この案件はすでに登録されていました（二重登録は防止しました）。［閉じる］→［再取得］で一覧を確認してください。';
    if(error?.code==='40001')return `他の端末で変更・削除されたか、前回の保存がすでに反映されています。${KEEP}内容を控えてから［閉じる］→［再取得］で最新の状態を確認してください。`;
    if(error?.code==='42501')return '編集権限がありません。';
    if(/^(23|22)/.test(error?.code||''))return `入力内容が保存の条件に合いません（担当者・日付・金額などを確認してください）。${KEEP}`;
    return `保存できませんでした：${error?.message||'不明なエラー'} ${KEEP}`;
  }
  function removeErrorMessage(error){
    if(error?.outcome==='uncertain')return '通信が途切れたため、削除できたかどうかを確認できませんでした。一覧を再取得しました。案件が残っている場合だけ、もう一度削除してください。';
    if(error?.code==='40001')return '他の端末で変更・削除されています。一覧を再取得しました。最新の内容を確認してください。';
    if(error?.code==='42501')return '削除権限がありません。';
    return `削除できませんでした：${error?.message||'不明なエラー'}`;
  }
  window.InstallmentMath={nextMonth,totals,staffs:[...staffs],saveErrorMessage,removeErrorMessage};
  document.addEventListener('DOMContentLoaded',()=>{
    // 機能オフのときは、メニュー・画面・画面切替の登録をすべて行わない。
    if(window.HimenaviInstallmentEnabled!==true)return;
    const host=document.querySelector('main .container');if(!host)return;
    if(typeof SYSTEM_VIEW_SECTIONS==='object'&&SYSTEM_VIEW_SECTIONS)SYSTEM_VIEW_SECTIONS.installmentManagement=['installmentManagementSection'];
    const salesLink=document.querySelector('.sidebar-link[data-view="salesManagement"]');
    if(salesLink&&!document.querySelector('.sidebar-link[data-view="installmentManagement"]')){
      const link=document.createElement('button');link.type='button';link.className='sidebar-link';link.dataset.view='installmentManagement';
      const label=document.createElement('span');label.textContent='　分割管理';link.append(label);salesLink.after(link);
    }
    const section=document.createElement('section');section.id='installmentManagementSection';section.className='im card system-view-hidden';
    section.innerHTML=`<h2>分割管理</h2><p>手入力専用。着金日が入力されている案件を着金済みとして集計します。</p><div class="im-toolbar"><button type="button" class="im-prev">前月</button><label>管理月 <input type="month" class="im-month" required min="1900-01" max="9998-12"></label><button type="button" class="im-next">翌月</button><button type="button" class="im-refresh">再取得</button></div><h3>月間集計（全5区分）</h3><div class="im-month-total"></div><div class="im-tabs" role="tablist" aria-label="管理区分"></div><h3 class="im-category-title"></h3><div class="im-category-total"></div><p class="im-status" role="status" aria-live="polite"></p><button type="button" class="im-add" disabled>案件を追加</button><div class="im-scroll"><table><thead><tr><th>物件名</th><th>お客様名</th><th>担当者</th><th>申請日</th><th>着金日</th><th>金額</th><th>備考</th><th>操作</th></tr></thead><tbody></tbody></table></div><dialog><form><h3>案件の登録・編集</h3><div class="im-fields"></div><p class="im-form-status" role="alert"></p><button type="submit">保存</button><button type="button" class="im-cancel">閉じる</button></form></dialog>`;
    host.append(section);
    const $=s=>section.querySelector(s), api=window.InstallmentAPI;
    const today=new Date();let month=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`, category=categories[0], rows=[], loaded=false, busy=false, sequence=0, draft=null;
    $('.im-month').value=month;
    function summary(target,data){
      target.replaceChildren();const sum=totals(data);
      for(const [key,label] of [['registered','登録金額合計'],['paid','着金済み合計'],['unpaid','未着金合計']]){
        const item=document.createElement('p');item.textContent=`${label}：${sum[key].toLocaleString('ja-JP')} 円`;target.append(item);
      }
    }
    function render(){
      $('.im-tabs').replaceChildren();
      for(const name of categories){const b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',String(name===category));b.textContent=name;b.disabled=busy;b.onclick=()=>{category=name;render();};$('.im-tabs').append(b);}
      $('.im-category-title').textContent=category;
      if(loaded){summary($('.im-month-total'),rows);summary($('.im-category-total'),rows.filter(r=>r.category===category));}
      else for(const target of [$('.im-month-total'),$('.im-category-total')])target.textContent='未取得';
      $('.im-add').disabled=busy||!loaded||!api.canEdit;
      for(const s of ['.im-prev','.im-next','.im-month','.im-refresh'])$(s).disabled=busy;
      $('tbody').replaceChildren();
      for(const row of rows.filter(r=>r.category===category&&!r.deleted_at)){
        const tr=document.createElement('tr');
        for(const key of ['property_name','customer_name','staff','application_date','payment_date','amount','memo']){
          const td=document.createElement('td');td.textContent=key==='amount'?BigInt(row.amount).toLocaleString('ja-JP')+' 円':row[key]??'';tr.append(td);
        }
        const td=document.createElement('td');
        for(const [label,action] of [['編集',()=>open(row)],['削除',()=>remove(row)]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=busy||!api.canEdit;b.onclick=action;td.append(b);}
        tr.append(td);$('tbody').append(tr);
      }
      if(loaded&&!$('tbody').children.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=8;td.textContent='この月・区分の案件はありません。';tr.append(td);$('tbody').append(tr);}
    }
    async function load(){
      const request=++sequence;rows=[];loaded=false;api.reset();render();$('.im-status').textContent='取得中…';
      try{const data=await api.read(month);if(request!==sequence)return;rows=data;loaded=true;$('.im-status').textContent=api.canEdit?'':'閲覧専用です。';}
      catch(e){if(request!==sequence)return;$('.im-status').textContent=e.message;}
      if(request===sequence)render();
    }
    function close(){if(busy)return;draft=null;$('dialog').close();}
    function open(row){
      if(!api.canEdit||busy)return;
      draft={id:row?.id||crypto.randomUUID(),version:row?.version||0,month,category};$('.im-fields').replaceChildren();$('.im-form-status').textContent='';
      for(const [key,label,type] of [['property_name','物件名','text'],['customer_name','お客様名','text'],['staff','担当者','select'],['application_date','申請日','date'],['payment_date','着金日（未定の場合は空欄）','date'],['amount','金額（円）','number'],['memo','備考','textarea']]){
        const wrapper=document.createElement('label');wrapper.textContent=label;
        const input=document.createElement(type==='select'?'select':type==='textarea'?'textarea':'input');input.name=key;
        if(type==='select'){
          // 一覧にない既存の担当者値は黙って書き換えず、そのまま表示する（保存時はDBが判定する）。
          const options=row?.staff&&!staffs.includes(row.staff)?[...staffs,row.staff]:staffs;
          for(const name of options){const o=document.createElement('option');o.value=name;o.textContent=name;input.append(o);}
        }
        else if(type!=='textarea')input.type=type;
        input.required=!['payment_date','memo'].includes(key);
        if(type==='text')input.maxLength=200;
        if(type==='textarea')input.maxLength=10000;
        if(type==='date'){input.min='1900-01-01';input.max='9998-12-31';}
        if(type==='number'){input.min='0';input.max='1000000000000';input.step='1';}
        input.value=row?.[key]??(key==='staff'?staffs[0]:'');wrapper.append(input);$('.im-fields').append(wrapper);
      }
      $('dialog').showModal();
    }
    $('form').onsubmit=async e=>{
      e.preventDefault();if(busy||!draft||!api.canEdit)return;
      const values=Object.fromEntries(new FormData($('form')));values.property_name=values.property_name.trim();values.customer_name=values.customer_name.trim();
      if(!values.property_name||!values.customer_name||!/^\d+$/.test(values.amount)){$('.im-form-status').textContent='物件名・お客様名と整数の金額を入力してください。';return;}
      values.amount=Number(values.amount);values.payment_date=values.payment_date||null;values.accounting_month=draft.month+'-01';values.category=draft.category;
      busy=true;render();$('form button[type="submit"]').disabled=true;
      // 同じdraft（同じIDと版）で再送するため、再保存しても二重登録・上書きにならない。
      try{await api.save(draft.id,draft.version,values);busy=false;close();await load();}
      catch(error){$('.im-form-status').textContent=saveErrorMessage(error,draft.version===0);}
      finally{busy=false;$('form button[type="submit"]').disabled=false;render();}
    };
    async function remove(row){
      if(busy||!api.canEdit||!confirm(`${row.property_name} を削除しますか？`))return;
      busy=true;render();let message='';
      try{await api.remove(row.id,row.version);}catch(e){message=removeErrorMessage(e);}
      busy=false;await load();if(message)$('.im-status').textContent=message;render();
    }
    $('.im-cancel').onclick=close;
    $('dialog').addEventListener('cancel',e=>{if(busy)e.preventDefault();else draft=null;});
    function change(value){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)||value<'1900-01'||value>'9998-12'){$('.im-month').value=month;return;}month=value;$('.im-month').value=month;load();}
    $('.im-prev').onclick=()=>change(nextMonth(month,-1));$('.im-next').onclick=()=>change(nextMonth(month,1));$('.im-month').onchange=()=>change($('.im-month').value);$('.im-refresh').onclick=load;$('.im-add').onclick=()=>open(null);
    document.addEventListener('sales-permissions-changed',()=>{sequence++;api.reset();rows=[];loaded=false;draft=null;$('dialog').close();render();if(!section.classList.contains('system-view-hidden'))load();});
    new MutationObserver(()=>{if(!section.classList.contains('system-view-hidden'))load();}).observe(section,{attributes:true,attributeFilter:['class']});
    render();
  });
})();

/* MEG PRFAF inline Claim Paid — v2026.09.22-20:00
 * Adds canonical payment status/action to existing PRFAF request rows.
 * No floating payment center. Existing approval/disbursement/reconciliation logic is untouched.
 */
(function(root){
  'use strict';
  const FORM='prfaf';
  const ROW_MARK='meg-inline-payment';
  const MAX_BATCH=100;

  function client(){
    return (typeof sb!=='undefined' && sb) ? sb : root.sb;
  }
  function rowId(row){
    const button=Array.from(row.querySelectorAll('button')).find(b=>/openReview\(['"]([0-9a-f-]{36})['"]\)/i.test(b.getAttribute('onclick')||''));
    const m=(button?.getAttribute('onclick')||'').match(/openReview\(['"]([0-9a-f-]{36})['"]\)/i);
    return m?.[1]||null;
  }
  function chunks(values,size){
    const out=[]; for(let i=0;i<values.length;i+=size) out.push(values.slice(i,i+size)); return out;
  }
  async function batchRpc(name,ids){
    const c=client(); if(!c||typeof c.rpc!=='function') throw Error('Database connection unavailable');
    const all=[];
    for(const part of chunks(ids,MAX_BATCH)){
      const {data,error}=await c.rpc(name,{p_form_code:FORM,p_submission_ids:part});
      if(error) throw error;
      all.push(...(data||[]));
    }
    return all;
  }
  async function mayMarkPaid(){
    const c=client(); if(!c||typeof c.rpc!=='function') return false;
    const {data,error}=await c.rpc('meg_forms_user_can_mark_paid',{p_form_code:FORM});
    return !error && data===true;
  }
  function paymentDate(value){
    if(!value) return 'Date unavailable';
    const d=new Date(value); if(Number.isNaN(d.getTime())) return 'Date unavailable';
    return d.toLocaleString('en-GB',{
      day:'2-digit',month:'2-digit',year:'numeric',
      hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false
    }).replace(',', ' ·');
  }
  function removeDelete(row){
    row.querySelectorAll('[data-meg-admin-delete]').forEach(el=>el.remove());
  }
  function actionCell(row){
    const open=Array.from(row.querySelectorAll('button')).find(b=>/openReview\(/.test(b.getAttribute('onclick')||''));
    return open?.closest('td')||row.lastElementChild;
  }
  async function markPaid(id,button){
    if(!/^[0-9a-f-]{36}$/i.test(String(id||''))) return;
    if(!root.confirm('Confirm this PRFAF claim has been paid? This records the actual payment timestamp in the canonical finance status.')) return;
    button.disabled=true;
    try{
      const c=client();
      const before=await batchRpc('meg_forms_claim_status_batch',[id]);
      const state=before.find(x=>String(x.submission_id)===String(id));
      if(!state) throw Error('Claim status is unavailable');
      if(state.claim_paid===true){
        await root.loadMyRequests();
        return;
      }
      if(!(await mayMarkPaid())) throw Error('Claim Paid permission required');
      if(state.can_mark_paid!==true) throw Error('This claim is not eligible for Claim Paid yet');
      const {data,error}=await c.rpc('meg_forms_set_payment_done_strict',{
        p_form_code:FORM,p_submission_id:id,p_done:true
      });
      if(error) throw error;
      const after=await batchRpc('meg_forms_claim_status_batch',[id]);
      const verified=after.find(x=>String(x.submission_id)===String(id));
      if(!verified || verified.claim_paid!==true) throw Error('Payment update could not be verified');
      await root.loadMyRequests();
    }catch(e){
      root.alert('Claim Paid rejected: '+(e?.message||String(e)));
    }finally{
      button.disabled=false;
    }
  }
  let generation=0;
  async function refresh(){
    const token=++generation;
    const tbody=root.document?.getElementById('requestsTbody');
    if(!tbody) return false;
    tbody.querySelectorAll('.'+ROW_MARK).forEach(el=>el.remove());
    const rows=Array.from(tbody.querySelectorAll('tr')).map(row=>({row,id:rowId(row)})).filter(x=>x.id);
    if(!rows.length) return true;
    let states,dates,allowed=false;
    try{
      const ids=rows.map(x=>x.id);
      [states,dates,allowed]=await Promise.all([
        batchRpc('meg_forms_claim_status_batch',ids),
        batchRpc('meg_forms_payment_dates_batch',ids),
        mayMarkPaid()
      ]);
    }catch(e){
      console.warn('PRFAF payment status unavailable',e);
      return false;
    }
    if(token!==generation) return false;
    const stateMap=new Map((states||[]).map(x=>[String(x.submission_id),x]));
    const dateMap=new Map((dates||[]).map(x=>[String(x.submission_id),x.payment_done_at]));
    for(const {row,id} of rows){
      const state=stateMap.get(String(id)); if(!state) continue;
      const cell=actionCell(row); if(!cell) continue;
      if(state.claim_paid===true){
        removeDelete(row);
        const badge=root.document.createElement('span');
        badge.className=ROW_MARK;
        badge.style.cssText='display:inline-block;margin-left:7px;color:#067647;font-weight:700;font-size:.78rem;white-space:nowrap;';
        badge.textContent='✓ Claim Paid · '+paymentDate(dateMap.get(String(id)));
        cell.appendChild(badge);
      }else if(allowed===true && state.can_mark_paid===true){
        const button=root.document.createElement('button');
        button.type='button';
        button.className='btn-sm '+ROW_MARK;
        button.style.cssText='margin-left:7px;border-color:#067647;color:#067647;';
        button.textContent='✓ Claim Paid';
        button.addEventListener('click',()=>{void markPaid(id,button);});
        cell.appendChild(button);
      }
    }
    return true;
  }
  function install(){
    if(root.MEG_PRFAF_InlineClaimPaid?.installed) return root.MEG_PRFAF_InlineClaimPaid;
    if(typeof root.loadMyRequests!=='function') return null;
    const original=root.loadMyRequests;
    root.loadMyRequests=async function(){
      const result=await original.apply(this,arguments);
      await refresh();
      return result;
    };
    const controller=Object.freeze({installed:true,uvn:'v2026.09.22-20:00',refresh,markPaid});
    root.MEG_PRFAF_InlineClaimPaid=controller;
    void refresh();
    return controller;
  }
  root.MEGInstallPRFAFInlineClaimPaid=install;
  install();
})(typeof window!=='undefined'?window:globalThis);

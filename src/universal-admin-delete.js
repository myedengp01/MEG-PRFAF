/* MEG Universal Claim Management v2026.09.17-14:30. Feature branch only.
 * Existing PRFAF ledger, approvals, and request persistence remain untouched.
 */
(function(root){
 'use strict';
 function install(){
   if(root.MEG_PRFAF_AdminDelete?.installed)return root.MEG_PRFAF_AdminDelete;
   if(typeof root.loadMyRequests!=='function')return null;
   const original=root.loadMyRequests;
   let generation=0;
   async function refresh(){
     const token=++generation;
     const tbody=root.document?.getElementById('requestsTbody');
     if(!tbody)return false;
     tbody.querySelectorAll('[data-meg-admin-delete]').forEach(button=>button.remove());
     // This UI permission is advisory; the server RPC independently verifies the user.
     if(typeof currentPerm==='undefined'||currentPerm?.is_admin!==true)return false;
     const rows=Array.from(tbody.querySelectorAll('tr'));
     for(const row of rows){
       const open=Array.from(row.querySelectorAll('button')).find(b=>/^\s*openReview\(['"]([0-9a-f-]{36})['"]\)\s*;?\s*$/.test(b.getAttribute('onclick')||''));
       if(!open)continue;
       const match=(open.getAttribute('onclick')||'').match(/openReview\(['"]([0-9a-f-]{36})['"]\)/);
       if(!match)continue;
       const cell=open.closest('td');
       if(!cell)continue;
       const button=root.document.createElement('button');
       button.type='button';button.className='btn-sm';button.textContent='Admin Delete';
       button.dataset.megAdminDelete=match[1];
       button.addEventListener('click',()=>{void removeClaim(match[1],button);});
       cell.appendChild(button);
     }
     return token===generation;
   }
   async function removeClaim(id,button){
     if(typeof currentPerm==='undefined'||currentPerm?.is_admin!==true){root.alert('PRFAF Admin permission required.');return false;}
     if(!/^[0-9a-f-]{36}$/i.test(String(id||''))){root.alert('Invalid claim ID.');return false;}
     const reason=root.prompt('Reason for deleting this claim (retained in audit history):');
     if(reason===null)return false;
     if(String(reason).trim().length<3){root.alert('Enter at least 3 characters for the audit reason.');return false;}
     if(!root.confirm('Permanently delete this PRFAF claim? Paid or ledger-linked claims are blocked. Audit history is retained.'))return false;
     if(button)button.disabled=true;
     try{
       const client=typeof sb!=='undefined'?sb:root.sb;
       if(!client||typeof client.rpc!=='function')throw Error('Database connection unavailable');
       const {data,error}=await client.rpc('meg_forms_admin_delete_claim',{p_form_code:'prfaf',p_submission_id:id,p_reason:String(reason).trim()});
       if(error)throw error;
       if(data?.deleted!==true){root.alert('Claim was not deleted; it may no longer exist.');return false;}
       root.alert('Claim deleted. Audit history retained.');
       await root.loadMyRequests();
       return true;
     }catch(e){root.alert('Delete rejected: '+(e?.message||String(e)));return false;}
     finally{if(button)button.disabled=false;}
   }
   root.loadMyRequests=async function(){const result=await original.apply(this,arguments);await refresh();return result;};
   const controller=Object.freeze({installed:true,refresh,removeClaim});
   root.MEG_PRFAF_AdminDelete=controller;
   void refresh();
   return controller;
 }
 root.MEGInstallPRFAFAdminDelete=install;
 install();
})(typeof window!=='undefined'?window:globalThis);

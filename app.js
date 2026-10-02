let currentUser=null;
const modal=document.getElementById("modal"), content=document.getElementById("modalContent");
function openModal(type){modal.classList.remove("hidden"); renderForm(type)}
function closeModal(){modal.classList.add("hidden")}
function renderForm(type){
 const register=type==="register";
 content.innerHTML=`<h2>${register?"Create Customer Account":"Login"}</h2>
 <form class="form" onsubmit="submitAuth(event,'${register?"register":"login"}')">
 ${register?'<input id="name" placeholder="Full name" required>':""}
 <input id="email" type="email" placeholder="Email" required>
 <input id="password" type="password" placeholder="Password (6+ characters)" minlength="6" required>
 <button class="primary">${register?"Create Account":"Login"}</button>
 </form>
 <p class="switch">${register?"Already have an account?":"New customer?"} <a onclick="renderForm('${register?"login":"register"}')">${register?"Login":"Create account"}</a></p>`;
}
async function submitAuth(e,type){
 e.preventDefault();
 const body={email:email.value,password:password.value}; if(type==="register") body.name=name.value;
 const r=await fetch("/api/"+type,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 const d=await r.json(); if(!r.ok)return alert(d.error);
 closeModal(); await loadMe(); await loadFeed();
}
async function loadMe(){
 const r=await fetch("/api/me"), d=await r.json(); currentUser=d.user;
 const loginNav=document.getElementById("loginNav");
 if(currentUser){
   loginNav.textContent="Logout"; loginNav.onclick=logout;
   document.getElementById("composer").classList.remove("hidden");
   if(currentUser.email==="admin@nayon007.com"){document.getElementById("admin").classList.remove("hidden"); loadUsers();}
 }else{
   loginNav.textContent="Login"; loginNav.onclick=()=>openModal("login");
   document.getElementById("composer").classList.add("hidden");
   document.getElementById("admin").classList.add("hidden");
 }
}
async function logout(){await fetch("/api/logout",{method:"POST"});await loadMe();await loadFeed()}
async function createPost(){
 const body=document.getElementById("postBody").value.trim(); if(!body)return;
 const r=await fetch("/api/posts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({body})});
 const d=await r.json(); if(!r.ok)return alert(d.error); document.getElementById("postBody").value="";loadFeed();
}
async function loadFeed(){
 const r=await fetch("/api/posts"),d=await r.json();
 document.getElementById("feed").innerHTML=d.posts.length?d.posts.map(p=>`<article class="post"><div class="post-head"><b>${esc(p.name)}</b><time>${new Date(p.created_at).toLocaleString()}</time></div><p>${esc(p.body)}</p></article>`).join(""):"<p style='color:#7f8793'>No posts yet. Create an account to start the community.</p>";
}
async function loadUsers(){
 const r=await fetch("/api/admin/users"); if(!r.ok)return;
 const d=await r.json();
 document.getElementById("users").innerHTML=`<div class="userbar"><b>Registered customers: ${d.users.length}</b><span>Admin</span></div><div style="overflow:auto"><table class="table"><tr><th>Name</th><th>Email</th><th>Joined</th></tr>${d.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${new Date(u.created_at).toLocaleString()}</td></tr>`).join("")}</table></div>`;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
document.addEventListener("DOMContentLoaded",async()=>{await loadMe();await loadFeed()});
modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});

(()=>{var s=class{constructor(){this.mount=null;this.panel=null;this.floatingButton=null;this.isVisible=!1;this.init(),this.setupListeners()}init(){this.floatingButton=document.createElement("div"),this.floatingButton.id="play-ai-fab",this.floatingButton.innerHTML=`
      <div class="fab-content">
        <img src="${chrome.runtime.getURL("icons/icon.svg")}" />
        <span class="fab-text">Play AI</span>
      </div>
    `,this.floatingButton.onclick=()=>this.togglePanel(),document.body.appendChild(this.floatingButton),this.mount=document.createElement("div"),this.mount.id="play-ai-mount",this.mount.hidden=!0,this.mount.innerHTML=`
      <div id="play-ai-panel">
        <header>
          <span class="logo">Play AI</span>
          <button id="close-panel">\xD7</button>
        </header>
        <div class="content" id="play-ai-content">
          <div class="suggestions">
            <button class="action-btn" data-action="summarize">Summarize Page</button>
            <button class="action-btn" data-action="insights">Key Insights</button>
            <button class="action-btn" data-action="rewrite" id="rewrite-btn" disabled>Rewrite Selected</button>
          </div>
          <div id="play-ai-result"></div>
          <div class="footer">
            <a href="https://play-ai.in" target="_blank">Powered by play-ai.in</a>
          </div>
        </div>
      </div>
    `,document.body.appendChild(this.mount),document.getElementById("close-panel")?.addEventListener("click",()=>this.togglePanel()),this.mount.querySelectorAll(".action-btn").forEach(e=>{e.addEventListener("click",t=>{let i=t.target.dataset.action;i&&this.handleAction(i)})})}setupListeners(){document.addEventListener("mouseup",()=>{let e=window.getSelection()?.toString().trim(),t=document.getElementById("rewrite-btn");t&&(t.disabled=!e)}),chrome.runtime.onMessage.addListener(e=>{e.type==="TOGGLE_PANEL"&&this.togglePanel()})}togglePanel(){this.isVisible=!this.isVisible,this.mount&&(this.mount.hidden=!this.isVisible,this.isVisible?this.mount.classList.add("visible"):this.mount.classList.remove("visible"))}async handleAction(e){let t=document.getElementById("play-ai-result");if(!t)return;t.innerHTML='<div class="loader">Thinking...</div>';let i=this.getPageContext(),o={summarize:`Summarize the following page content concisely: ${i.text}`,insights:`Extract 3-5 key bullet points or insights from this page: ${i.text}`,rewrite:`Rewrite the following selected text to be more clear and professional: ${i.selectedText}`},n=await chrome.runtime.sendMessage({type:"GENERATE_RESPONSE",payload:{prompt:o[e]||e,model:"gemini-1.5-flash",context:`URL: ${i.url}
Title: ${i.title}`}});n.error?t.innerHTML=`<div class="error">${n.error}</div>`:(t.innerHTML=`
        <div class="output">${n.text}</div>
        <div class="actions">
          <button id="copy-result" class="tool-btn">Copy</button>
          ${e==="rewrite"?'<button id="replace-text" class="tool-btn primary">Replace Selection</button>':""}
        </div>
      `,document.getElementById("copy-result")?.addEventListener("click",()=>{navigator.clipboard.writeText(n.text)}),document.getElementById("replace-text")?.addEventListener("click",()=>{this.replaceSelection(n.text)}))}getPageContext(){let e=window.getSelection()?.toString()||"",t=document.body.innerText.slice(0,4e3);return{title:document.title,url:window.location.href,selectedText:e,text:t}}replaceSelection(e){let t=window.getSelection();if(!t||t.rangeCount===0)return;let i=t.getRangeAt(0);i.deleteContents(),i.insertNode(document.createTextNode(e))}};new s;})();

function o(e){return new Promise(s=>{chrome.runtime.sendMessage(e,n=>s(n))})}function r(e){chrome.runtime.onMessage.addListener((s,n)=>e(s,n))}export{r as o,o as s};

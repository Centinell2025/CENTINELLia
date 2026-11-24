/* Optional install support; never cache API or user records. */
if('serviceWorker' in navigator && location.protocol==='https:' && location.hostname.endsWith('.github.io')){navigator.serviceWorker.register('./sw.js').catch(()=>{});}

import puppeteer from 'puppeteer-core';
const [url,out,clipY,clipH] = process.argv.slice(2);
const b = await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--disable-gpu','--hide-scrollbars']});
const p = await b.newPage();
await p.setViewport({width:1440,height:900});
await p.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);
await p.goto(url,{waitUntil:'networkidle2'});
// Scroll the whole page so lazy-loaded images decode before we clip.
await p.evaluate(async () => {
  await new Promise((res) => {
    let y = 0;
    const t = setInterval(() => {
      window.scrollBy(0, 600); y += 600;
      if (y >= document.body.scrollHeight) { clearInterval(t); window.scrollTo(0,0); res(); }
    }, 30);
  });
});
await new Promise(r => setTimeout(r, 600));
await p.screenshot({path:out, clip:{x:0,y:Number(clipY),width:1440,height:Number(clipH)}});
await b.close();

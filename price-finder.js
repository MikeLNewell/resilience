// Price Finder uses user-verified quotes, not invented or scraped retail prices.
// Quotes are stored on this device only until a server-side pricing integration is authorised.
export function createPriceFinder({catalogue,getNeed,getUser,safe,money}) {
  let selected = 0;
  const retailers = ['Aldi','Lidl','Tesco','Asda','Morrisons',"Sainsbury's",'Iceland','Ocado','Amazon','Argos','B&Q','Screwfix'];
  const supermarkets = new Set(retailers.slice(0,8));
  const blocked = /^(Drinking water|Carbon monoxide alarm|Smoke alarm|First aid kit|Spare batteries|Hand sanitiser|Ready-to-eat tinned food|Tinned beans|Rice|Pasta|UHT milk|Dried fruit|Wet wipes|Toilet paper)/i;
  const allowed = item => !blocked.test(item.name) && !['Food','Water','Medical','Hygiene'].includes(item.category);
  const itemSearch = item => item.name.replace(/\s*\([^)]*\)/g,'').replace(/^\s+|\s+$/g,'');
  const id = 'resilience-price-quotes-v1-';
  const storageKey = () => id + (getUser()?.uid || 'signed-out');
  const read = () => {
    try {
      const x = JSON.parse(localStorage.getItem(storageKey()) || '[]');
      return Array.isArray(x) ? x.filter(q => q && Number.isInteger(q.itemId) && typeof q.retailer === 'string' && Number.isFinite(q.total) && Number.isFinite(q.units) && q.units > 0) : [];
    } catch { return []; }
  };
  const save = quotes => localStorage.setItem(storageKey(),JSON.stringify(quotes));
  const search = (item,retailer) => {
    const term = itemSearch(item);
    if(retailer === 'eBay') return 'https://www.ebay.co.uk/sch/i.html?_nkw=' + encodeURIComponent(term) + '&LH_ItemCondition=3000';
    const sites = {'Aldi':'aldi.co.uk','Lidl':'lidl.co.uk','Tesco':'tesco.com','Asda':'asda.com','Morrisons':'morrisons.com',"Sainsbury's":'sainsburys.co.uk','Iceland':'iceland.co.uk','Ocado':'ocado.com','Amazon':'amazon.co.uk','Argos':'argos.co.uk','B&Q':'diy.com','Screwfix':'screwfix.com','Gumtree':'gumtree.com','Facebook Marketplace':'facebook.com/marketplace'};
    return 'https://www.google.com/search?q=' + encodeURIComponent('site:'+sites[retailer]+' '+term+' UK price');
  };
  const quoteUnit = q => (Number(q.total) + Number(q.delivery || 0)) / Number(q.units);
  const valid = q => Number.isFinite(q.total) && q.total >= 0 && q.total <= 100000 && Number.isFinite(q.delivery) && q.delivery >= 0 && q.delivery <= 100000 && Number.isSafeInteger(q.units) && q.units > 0 && q.units <= 100000;
  function render() {
    const quotes=read(), item=catalogue[selected] || catalogue[0], matching=quotes.filter(q=>q.itemId===item.id).sort((a,b)=>quoteUnit(a)-quoteUnit(b));
    const needed=catalogue.filter(x=>getNeed(x)>0);
    const estimates=needed.reduce((s,x)=>s+getNeed(x)*x.price,0);
    const cheapest = needed.map(x=>{const q=quotes.filter(p=>p.itemId===x.id).sort((a,b)=>quoteUnit(a)-quoteUnit(b))[0];return {item:x,quote:q};});
    const covered=cheapest.filter(x=>x.quote),knownTotal=covered.reduce((s,x)=>s+getNeed(x.item)*quoteUnit(x.quote),0);
    const stores=retailers.filter(r=>supermarkets.has(r)).map(name=>{
      const matches=needed.map(x=>({item:x,quote:quotes.filter(q=>q.itemId===x.id && q.retailer===name).sort((a,b)=>quoteUnit(a)-quoteUnit(b))[0]})).filter(x=>x.quote);
      return {name,count:matches.length,total:matches.reduce((s,x)=>s+getNeed(x.item)*quoteUnit(x.quote),0)};
    }).filter(x=>x.count).sort((a,b)=>b.count-a.count||a.total-b.total);
    const options=catalogue.map(x=>'<option value="'+x.id+'" '+(x.id===item.id?'selected':'')+'>'+safe(x.name)+(getNeed(x)?' · '+getNeed(x)+' needed':'')+'</option>').join('');
    const links=retailers.map(r=>'<a target="_blank" rel="noopener noreferrer" href="'+search(item,r)+'">'+safe(r)+'</a>').join(' · ');
    const second=allowed(item)?'<p><strong>Second-hand searches</strong> · <a target="_blank" rel="noopener noreferrer" href="'+search(item,'eBay')+'">eBay used</a> · <a target="_blank" rel="noopener noreferrer" href="'+search(item,'Gumtree')+'">Gumtree</a> · <a target="_blank" rel="noopener noreferrer" href="'+search(item,'Facebook Marketplace')+'">Facebook Marketplace</a></p><p class="muted">Inspect condition and electrical safety; compare total cost and seller reliability.</p>':'<p class="muted">Second-hand purchasing is not recommended for this item. Buy food, drinking water, medical consumables and safety-critical alarms from suitable trusted suppliers.</p>';
    return '<section class="card"><h2>Compare shopping prices</h2><p class="muted">Open retailer searches, check matching sizes and quantities, then enter genuine quoted prices below. Searches open external websites. No real-time prices are claimed.</p>'+
      '<div class="grid"><div class="metric"><small>Estimated outstanding supplies</small><div class="value">'+money(estimates)+'</div></div><div class="metric"><small>Items with recorded quotes</small><div class="value">'+covered.length+' / '+needed.length+'</div></div><div class="metric"><small>Cost of covered items at lowest recorded quotes</small><div class="value">'+money(knownTotal)+'</div></div></div></section>'+
      '<section class="card"><h2>Find prices for an item</h2><label>Supply<select id="priceItem">'+options+'</select></label><p><strong>Retailer searches</strong></p><p class="price-links">'+links+'</p>'+second+
      '<h2>Record a verified price</h2><form id="priceQuote" class="row"><label>Retailer / seller<select id="priceRetailer">'+retailers.concat(allowed(item)?['eBay','Gumtree','Facebook Marketplace']:[]).map(r=>'<option>'+safe(r)+'</option>').join('')+'</select></label>'+
      '<label>Condition<select id="priceCondition"><option>New</option>'+(allowed(item)?'<option>Used</option>':'')+'</select></label>'+
      '<label>Item price (£)<input type="number" id="priceTotal" min="0" max="100000" step=".01" required></label>'+
      '<label>Delivery (£)<input type="number" id="priceDelivery" min="0" max="100000" step=".01" value="0" required></label>'+
      '<label>Equivalent catalogue units in pack<input type="number" id="priceUnits" min="1" max="100000" step="1" value="1" required></label>'+
      '<button type="submit">Save price</button></form><p class="muted">If a 2 kg rice bag costs £3, enter 2 units. Total prices include delivery when comparing. Quote dates are stored automatically on this device.</p>'+
      '<div id="priceMessage" role="status"></div>'+
      (matching.length?'<h2>Recorded offers</h2>'+matching.map(q=>'<div class="item"><div class="item-name"><strong>'+safe(q.retailer)+' · '+safe(q.condition)+'</strong><small>'+safe(q.date)+' · '+q.units+' unit(s) · '+money(q.total)+' + '+money(q.delivery)+' delivery</small></div><strong>'+money(quoteUnit(q))+' / unit</strong><button type="button" class="secondary" data-delete-quote="'+safe(q.key)+'">Remove</button></div>').join(''):'<p>No verified offers recorded for this item.</p>')+'</section>'+
      '<section class="card"><h2>Monthly basket comparison</h2><p class="muted">Only items still required are included. Prices are manually recorded quotes and might have changed. Delivery, minimum order and loyalty restrictions must be checked at checkout. Blank items must not be treated as free.</p>'+
      (stores.length?'<table class="price-table"><thead><tr><th>Supermarket</th><th>Items covered</th><th>Subtotal for covered items</th></tr></thead><tbody>'+stores.map(x=>'<tr><td>'+safe(x.name)+'</td><td>'+x.count+' / '+needed.length+'</td><td>'+money(x.total)+'</td></tr>').join('')+'</tbody></table>':'<p>Record supermarket prices to compare the basket. Comparisons will appear here.</p>')+
      '<p><strong>Lowest recorded price per item</strong></p>'+
      (covered.length?covered.map(x=>'<div class="item"><div class="item-name">'+safe(x.item.name)+'<small>'+safe(x.quote.retailer)+' · '+getNeed(x.item)+' units needed</small></div><strong>'+money(getNeed(x.item)*quoteUnit(x.quote))+'</strong></div>').join(''):'<p>No prices recorded yet.</p>')+
      '<p class="muted">Prices saved in this browser only, for your signed-in account. They do not yet synchronise between devices.</p></section>';
  }
  function bind() {
    const el=document.getElementById('priceItem');if(!el)return;
    el.onchange=()=>{selected=Number(el.value);document.querySelector('[data-tab="prices"]').click();};
    const form=document.getElementById('priceQuote');
    form.onsubmit=e=>{
      e.preventDefault();
      const q={itemId:selected,retailer:document.getElementById('priceRetailer').value,condition:document.getElementById('priceCondition').value,total:Number(document.getElementById('priceTotal').value),delivery:Number(document.getElementById('priceDelivery').value),units:Number(document.getElementById('priceUnits').value),date:new Date().toISOString().slice(0,10),key:String(Date.now())+'-'+Math.random().toString(36).slice(2)};
      if(!valid(q)) {document.getElementById('priceMessage').textContent='Enter valid price, delivery and quantity values.';return;}
      if(q.condition==='Used'&&!allowed(catalogue[selected])){document.getElementById('priceMessage').textContent='Used condition is not suitable for this item.';return;}
      try{save([...read(),q]);document.querySelector('[data-tab="prices"]').click()}catch{document.getElementById('priceMessage').textContent='Could not save this price in browser storage.'}
    };
    document.querySelectorAll('[data-delete-quote]').forEach(button=>button.onclick=()=>{
      if(!confirm('Remove this recorded quote?'))return;
      try{save(read().filter(q=>q.key!==button.dataset.deleteQuote));document.querySelector('[data-tab="prices"]').click()}catch{document.getElementById('priceMessage').textContent='Could not remove this price.'}
    });
  }
  function show(itemId){selected=itemId;document.querySelector('[data-tab="prices"]').click();}
  return {render,bind,show};
}

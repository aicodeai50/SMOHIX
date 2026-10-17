/** Strict public observation contract; discard all upstream metadata. */
const monitored = new Set(["smohix-platform","smohix-ai","smohix-assistant","private-ai","smohix-own-api","identity"]);
export function statusSamples(value, now=Date.now()) {
  if(!Array.isArray(value))throw new Error("invalid_status");
  const rows=[];const seen=new Set();
  for(const item of value){
    if(!item||!monitored.has(item.productId)||seen.has(item.productId))continue;
    const checked=Date.parse(item.lastChecked);
    if(!['operational','degraded','unavailable','unknown'].includes(item.status)||!Number.isFinite(checked)||checked>now+300000||checked<now-120000)throw new Error("invalid_status");
    seen.add(item.productId);rows.push({product_id:item.productId,status:item.status,checked_at:new Date(checked).toISOString()});
  }
  if(rows.length!==monitored.size)throw new Error("incomplete_status");
  return rows;
}

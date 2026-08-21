# Domain operations (HQ)

Live apex: **https://smohix.run**

## www.smohix.run

Source redirects `www.smohix.run/*` → `https://smohix.run/*` (`next.config.ts`, `proxy.ts`).

**Operational requirement:** attach `www.smohix.run` in Railway and add the DNS record
Railway provides for that custom domain. Code cannot create DNS. Until DNS exists,
`www.smohix.run` will NXDOMAIN even though redirect logic is ready.

## Legacy zentro.run

Source permanently redirects `zentro.run` and `www.zentro.run` → `https://smohix.run`
(path preserved).

These only work after the legacy hosts are attached to the same Railway service with
valid TLS. Broken TLS / NXDOMAIN on the legacy domain is an external attach/DNS issue,
not a missing redirect rule in source.

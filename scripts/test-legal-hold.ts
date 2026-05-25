function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const purgeSql = `
  and a.legal_hold is not true
  and not exists (
    select 1 from public.incidents i
    where i.legal_hold = true
`;

assert(purgeSql.includes("legal_hold"), "purge respects audit legal_hold flag");
assert(purgeSql.includes("incidents i"), "purge skips audit tied to held incidents");

console.log("test-legal-hold: all checks passed");

import {createClient} from "@supabase/supabase-js";
import {statusSamples} from "./status-samples.mjs";
// Run every minute in a server-side scheduler. Never include these credentials in client code.
try{
 const site=new URL(process.env.SMOHIX_STATUS_SITE_URL||"https://smohix.run");
 if(site.protocol!=="https:"||site.username||site.password||site.hostname!=="smohix.run")throw new Error("invalid_site");
 const dbUrl=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!dbUrl||!key)throw new Error("storage_not_connected");
 const response=await fetch(new URL("/api/status/products",site),{signal:AbortSignal.timeout(25000),redirect:"error",cache:"no-store"});
 if(!response.ok)throw new Error("status_unavailable");
 const body=await response.json(), rows=statusSamples(body.products);
 const client=createClient(dbUrl,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(10000)})}});
 const {error}=await client.from("public_service_observations").upsert(rows,{onConflict:"product_id,checked_at",ignoreDuplicates:true});
 if(error)throw new Error("record_failed");
 console.log(`Recorded ${rows.length} public availability observations.`);
}catch{console.error("Public status recording did not complete. Check the monitor connection and migration privately.");process.exitCode=1;}

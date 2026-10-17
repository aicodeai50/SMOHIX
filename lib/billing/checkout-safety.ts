export const CHECKOUT_ERRORS = {
 unavailable: "Checkout is temporarily unavailable. Please try again or contact support.",
 amount: "Enter a valid top-up amount of at least $5.00.",
 plan: "This plan is not available for self-service checkout. Please contact us.",
} as const;
export type CheckoutErrorCode = keyof typeof CHECKOUT_ERRORS;
export function checkoutErrorMessage(code: unknown): string {return typeof code==="string"&&Object.hasOwn(CHECKOUT_ERRORS,code)?CHECKOUT_ERRORS[code as CheckoutErrorCode]:CHECKOUT_ERRORS.unavailable;}
export function validTopUpCents(value: unknown): value is number {return typeof value==="number"&&Number.isSafeInteger(value)&&value>=500;}
export function parseCheckoutInput(value:unknown):{tier:"pro"|"team"|"top_up";topUpAmountCents?:number}|null {
 if(!value||typeof value!=="object"||Array.isArray(value))return null;
 const input=value as Record<string,unknown>;
 if(typeof input.tier!=="string")return null;const tier=input.tier.trim();
 if(!["pro","team","top_up"].includes(tier))return null;
 if(Object.keys(input).some(key=>!['tier','topUpAmountCents'].includes(key)))return null;
 if(input.topUpAmountCents!==undefined&&(tier!=="top_up"||!validTopUpCents(input.topUpAmountCents)))return null;
 return {tier:tier as "pro"|"team"|"top_up",...(input.topUpAmountCents!==undefined?{topUpAmountCents:input.topUpAmountCents as number}:{})};
}
export function safePayPalApprovalUrl(value:unknown): value is string {try{if(typeof value!=="string")return false;const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(!url.port||url.port==='443')&&['www.paypal.com','paypal.com','www.sandbox.paypal.com','sandbox.paypal.com'].includes(url.hostname);}catch{return false;}}
export async function readCheckoutBody(request:Request):Promise<unknown>{const reader=request.body?.getReader();if(!reader)throw new Error('invalid_body');let size=0;const chunks:Uint8Array[]=[];try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>16000)throw new Error('body_too_large');chunks.push(next.value);}}finally{await reader.cancel();}const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(body));}

export function publicCheckoutFailure(value:unknown):string {return typeof value==="string"&&Object.values(CHECKOUT_ERRORS).some(message=>message===value)?value:CHECKOUT_ERRORS.unavailable;}

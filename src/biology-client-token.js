// A UUID for idempotent submissions, not an authentication credential.
// getRandomValues also works on local HTTP previews where randomUUID is absent.
export function biologyClientToken(api=globalThis.crypto){if(typeof api?.randomUUID==='function')return api.randomUUID();const b=api.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;}

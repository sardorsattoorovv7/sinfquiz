const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export const networkFailure=error=>!!error&&(!error.code||/^(?:0|FETCH_ERROR|NETWORK_ERROR|ETIMEDOUT|ECONNRESET)$/.test(error.code))&&/fetch|network|timeout|timed out|abort|connection|socket/i.test(error.message||'');

// Reads may be retried here. Writes are reconciled by their record keys in the
// store; replaying every POST could charge a budget or update a revision twice.
export function speakingFetch({fetcher=fetch,timeoutMs=6000,pause=sleep}={}){
 return async(url,options={})=>{
  const read=['GET','HEAD'].includes((options.method||'GET').toUpperCase());
  for(let attempt=0;;attempt++){
   options.signal?.throwIfAborted();
   const signal=timeoutMs>0?(options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(timeoutMs)]):AbortSignal.timeout(timeoutMs)):options.signal;
   try{
    const response=await fetcher(url,{...options,signal});
    if(!read||attempt||![502,503,504].includes(response.status))return response;
    await response.body?.cancel();
   }catch(error){if(!read||attempt||options.signal?.aborted)throw error;}
   await pause(150);
  }
 };
}

'use client';

import { useEffect } from 'react';

export default function DebugBeacon() {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7354/ingest/5d1a73b8-d670-4460-b29f-7d6b34763738',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d72cd3'},body:JSON.stringify({sessionId:'d72cd3',runId:'pre-fix',hypothesisId:'H5',location:'DebugBeacon.tsx:8',message:'Global client hydration beacon',data:{path:window.location.pathname,userAgent:window.navigator.userAgent.slice(0,80)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, []);

  return null;
}

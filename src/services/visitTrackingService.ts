const GATEWAY_BASE = import.meta.env.DEV
  ? 'http://localhost:5300'
  : 'https://cesarsobapigateway.up.railway.app'

const ID_SEG_KEY = 'zocorn_id_seg'
const HEARTBEAT_INTERVAL_MS = 60000

let heartbeatIntervalId: ReturnType<typeof setInterval> | null = null

function getIdSeg(): string {
  let idSeg = sessionStorage.getItem(ID_SEG_KEY)
  if (!idSeg) {
    idSeg = crypto.randomUUID()
    sessionStorage.setItem(ID_SEG_KEY, idSeg)
  }
  return idSeg
}

function registerVisit(): void {
  fetch(`${GATEWAY_BASE}/api/addzocorn`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idSeg: getIdSeg() })
  }).catch((error) => console.warn('No se pudo registrar la visita:', error))
}

function sendHeartbeat(): void {
  fetch(`${GATEWAY_BASE}/api/addkeepalivezocorn?idSeg=${encodeURIComponent(getIdSeg())}`, {
    method: 'POST',
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-store'
  }).catch((error) => console.warn('No se pudo enviar el keepalive de visita:', error))
}

export function startVisitTracking(): void {
  registerVisit()

  if (heartbeatIntervalId !== null) {
    return
  }

  heartbeatIntervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
}

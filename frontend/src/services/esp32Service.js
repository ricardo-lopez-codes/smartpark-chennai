// ESP32 Hardware Integration Service
// Communicates directly with ESP32 receiver Wi-Fi Gateway (e.g. http://192.168.4.1)

const STORAGE_KEY = 'smartpark_esp32_url';
export const DEFAULT_ESP32_URL = 'http://192.168.4.1';

/**
 * Normalizes input URL strings so http:// or https:// is present, trailing slashes removed.
 */
export function normalizeESP32Url(input) {
  if (!input || typeof input !== 'string') {
    return DEFAULT_ESP32_URL;
  }
  let trimmed = input.trim();
  if (!trimmed) {
    return DEFAULT_ESP32_URL;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }
  return trimmed.replace(/\/+$/, '');
}

/**
 * Retrieves the currently saved ESP32 Gateway URL from localStorage.
 */
export function getStoredESP32Url() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return normalizeESP32Url(saved || DEFAULT_ESP32_URL);
  } catch (err) {
    return DEFAULT_ESP32_URL;
  }
}

/**
 * Saves a new ESP32 Gateway URL to localStorage.
 */
export function saveStoredESP32Url(url) {
  const normalized = normalizeESP32Url(url);
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch (err) {
    console.warn('Failed to save ESP32 URL to localStorage:', err);
  }
  return normalized;
}

/**
 * Tests connection to GET {baseUrl}/health
 */
export async function fetchESP32Health(baseUrl = getStoredESP32Url(), timeoutMs = 2500) {
  const normalized = normalizeESP32Url(baseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${normalized}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!response.ok) {
      return {
        connected: false,
        statusText: `HTTP ${response.status}`,
        raw: null
      };
    }

    const data = await response.json();
    return {
      connected: true,
      statusText: 'ONLINE',
      raw: data
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      connected: false,
      statusText: err.name === 'AbortError' ? 'Connection Timeout' : 'Network Error / Offline',
      raw: null
    };
  }
}

/**
 * Fetches real-time slot telemetry from GET {baseUrl}/data
 * Normalizes status mapping:
 *  - "OCCUPIED" -> slotStatus: "OCCUPIED"
 *  - "EMPTY"    -> slotStatus: "AVAILABLE"
 *  - "WAITING"  -> slotStatus: "WAITING"
 *  - unknown    -> slotStatus: "UNKNOWN"
 */
export async function fetchESP32Data(baseUrl = getStoredESP32Url(), timeoutMs = 2500) {
  const normalized = normalizeESP32Url(baseUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${normalized}/data`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!response.ok) {
      return {
        connected: false,
        slot: 'A1',
        status: 'OFFLINE',
        slotStatus: 'UNKNOWN',
        rssi: '--',
        snr: '--',
        packetCount: '--',
        lastUpdateMs: '--',
        raw: null,
        error: `HTTP ${response.status}`
      };
    }

    const raw = await response.json();

    // Raw status parse
    const rawStatus = (raw && raw.status) ? String(raw.status).toUpperCase().trim() : 'UNKNOWN';

    // Status mapping to dashboard terms
    let slotStatus = 'UNKNOWN';
    if (rawStatus === 'OCCUPIED') {
      slotStatus = 'OCCUPIED';
    } else if (rawStatus === 'EMPTY') {
      slotStatus = 'AVAILABLE';
    } else if (rawStatus === 'WAITING') {
      slotStatus = 'WAITING';
    } else if (rawStatus === 'AVAILABLE') {
      slotStatus = 'AVAILABLE';
    }

    // Telemetry fields with safe fallbacks
    const rssi = (raw && (raw.rssi !== undefined && raw.rssi !== null)) ? `${raw.rssi} dBm` : '--';
    const snr = (raw && (raw.snr !== undefined && raw.snr !== null)) ? `${raw.snr} dB` : '--';
    
    let packetCount = '--';
    if (raw) {
      if (raw.packet_count !== undefined && raw.packet_count !== null) packetCount = raw.packet_count;
      else if (raw.packets_received !== undefined && raw.packets_received !== null) packetCount = raw.packets_received;
    }

    let lastUpdateMs = '--';
    if (raw && raw.last_update_ms !== undefined && raw.last_update_ms !== null) {
      lastUpdateMs = `${raw.last_update_ms} ms`;
    }

    return {
      connected: true,
      gatewayUrl: normalized,
      slot: 'A1',
      status: rawStatus,
      slotStatus,
      rssi,
      snr,
      packetCount,
      lastUpdateMs,
      raw,
      timestamp: Date.now()
    };
  } catch (err) {
    clearTimeout(timer);
    return {
      connected: false,
      gatewayUrl: normalized,
      slot: 'A1',
      status: 'OFFLINE',
      slotStatus: 'UNKNOWN',
      rssi: '--',
      snr: '--',
      packetCount: '--',
      lastUpdateMs: '--',
      raw: null,
      error: err.name === 'AbortError' ? 'Request Timeout' : 'ESP32 Receiver Offline'
    };
  }
}

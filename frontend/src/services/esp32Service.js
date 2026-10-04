// ESP32 Hardware Integration Service
// Supports Cloud HTTPS Mode (Render FastAPI) and Direct Local IP Mode

import api from './api';

const STORAGE_KEY = 'smartpark_esp32_url';
const MODE_KEY = 'smartpark_esp32_mode';
export const DEFAULT_ESP32_URL = 'http://192.168.4.1';

/**
 * Gets the current connection mode ('cloud' or 'local'). Defaults to 'cloud'.
 */
export function getESP32ConnectionMode() {
  try {
    return localStorage.getItem(MODE_KEY) || 'cloud';
  } catch (err) {
    return 'cloud';
  }
}

/**
 * Saves the connection mode to localStorage ('cloud' or 'local').
 */
export function saveESP32ConnectionMode(mode) {
  const validMode = mode === 'local' ? 'local' : 'cloud';
  try {
    localStorage.setItem(MODE_KEY, validMode);
  } catch (err) {
    console.warn('Failed to save ESP32 connection mode to localStorage:', err);
  }
  return validMode;
}

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
 * Queries FastAPI backend for Cloud IoT Telemetry & 90-second offline calculation
 */
export async function fetchCloudESP32Data(deviceId = 'PARK-ESP32-001') {
  try {
    const res = await api.get(`/iot/status?device_id=${encodeURIComponent(deviceId)}`);
    const data = res.data;

    const isOnline = Boolean(data.online);
    const rawStatus = (data.status || 'UNKNOWN').toUpperCase();

    let slotStatus = 'SENSOR OFFLINE';
    if (!isOnline) {
      slotStatus = 'SENSOR OFFLINE';
    } else if (rawStatus === 'OCCUPIED') {
      slotStatus = 'OCCUPIED';
    } else if (rawStatus === 'EMPTY' || rawStatus === 'AVAILABLE') {
      slotStatus = 'AVAILABLE';
    } else {
      slotStatus = rawStatus;
    }

    const rssi = data.rssi !== null && data.rssi !== undefined ? `${data.rssi} dBm` : '--';
    const snr = data.snr !== null && data.snr !== undefined ? `${data.snr} dB` : '--';
    const packetCount = data.packet_count !== null && data.packet_count !== undefined ? data.packet_count : '--';
    const lastUpdateMs = data.last_seen_seconds_ago !== undefined ? `${data.last_seen_seconds_ago}s ago` : '--';

    return {
      mode: 'cloud',
      connected: isOnline,
      online: isOnline,
      gatewayUrl: 'Cloud API (Render)',
      slot: data.slot || 'A1',
      status: isOnline ? rawStatus : 'OFFLINE',
      slotStatus: isOnline ? slotStatus : 'SENSOR OFFLINE',
      rssi,
      snr,
      packetCount,
      lastUpdateMs,
      raw: data,
      timestamp: Date.now()
    };
  } catch (err) {
    return {
      mode: 'cloud',
      connected: false,
      online: false,
      gatewayUrl: 'Cloud API (Render)',
      slot: 'A1',
      status: 'OFFLINE',
      slotStatus: 'SENSOR OFFLINE',
      rssi: '--',
      snr: '--',
      packetCount: '--',
      lastUpdateMs: '--',
      raw: null,
      error: 'Cloud API Connection Failure'
    };
  }
}

/**
 * Tests connection to GET {baseUrl}/health (Local mode)
 */
export async function fetchESP32Health(baseUrl = getStoredESP32Url(), timeoutMs = 2500) {
  const mode = getESP32ConnectionMode();
  if (mode === 'cloud') {
    try {
      const res = await api.get('/iot/status?device_id=PARK-ESP32-001');
      return {
        connected: res.data.online,
        statusText: res.data.online ? 'ONLINE (Cloud API)' : 'SENSOR OFFLINE (>90s)',
        raw: res.data
      };
    } catch (err) {
      return {
        connected: false,
        statusText: 'Cloud API Offline',
        raw: null
      };
    }
  }

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
 * Fetches real-time slot telemetry.
 * Automatically delegates to Cloud Mode or Local IP Mode based on saved configuration.
 */
export async function fetchESP32Data(baseUrl = getStoredESP32Url(), timeoutMs = 2500) {
  const mode = getESP32ConnectionMode();
  if (mode === 'cloud') {
    return await fetchCloudESP32Data();
  }

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
        mode: 'local',
        connected: false,
        slot: 'A1',
        status: 'OFFLINE',
        slotStatus: 'SENSOR OFFLINE',
        rssi: '--',
        snr: '--',
        packetCount: '--',
        lastUpdateMs: '--',
        raw: null,
        error: `HTTP ${response.status}`
      };
    }

    const raw = await response.json();
    const rawStatus = (raw && raw.status) ? String(raw.status).toUpperCase().trim() : 'UNKNOWN';

    let slotStatus = 'SENSOR OFFLINE';
    if (rawStatus === 'OCCUPIED') {
      slotStatus = 'OCCUPIED';
    } else if (rawStatus === 'EMPTY' || rawStatus === 'AVAILABLE') {
      slotStatus = 'AVAILABLE';
    } else if (rawStatus === 'WAITING') {
      slotStatus = 'WAITING';
    }

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
      mode: 'local',
      connected: true,
      online: true,
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
      mode: 'local',
      connected: false,
      online: false,
      gatewayUrl: normalized,
      slot: 'A1',
      status: 'OFFLINE',
      slotStatus: 'SENSOR OFFLINE',
      rssi: '--',
      snr: '--',
      packetCount: '--',
      lastUpdateMs: '--',
      raw: null,
      error: err.name === 'AbortError' ? 'Request Timeout' : 'ESP32 Receiver Offline'
    };
  }
}

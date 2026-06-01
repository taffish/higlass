import * as hglib from '../app/scripts/hglib.jsx';
import './style.css';

const viewerElement = document.getElementById('viewer');
const statusElement = document.getElementById('status');
const params = new URLSearchParams(window.location.search);

function setStatus(message, isError = false) {
  statusElement.hidden = false;
  statusElement.classList.toggle('error', isError);
  const title = document.createElement('strong');
  title.textContent = 'TAFFISH HiGlass';
  const detail = document.createElement('span');
  detail.textContent = message;
  statusElement.replaceChildren(title, detail);
}

function emptyViewConfig() {
  return {
    editable: true,
    viewEditable: true,
    tracksEditable: true,
    zoomFixed: false,
    trackSourceServers: ['/api/v1'],
    exportViewUrl: '/api/v1/viewconfs/',
    views: [
      {
        uid: 'taf-empty-view',
        layout: { w: 12, h: 12, x: 0, y: 0 },
        initialXDomain: [0, 3200000000],
        initialYDomain: [0, 3200000000],
        tracks: {
          top: [],
          left: [],
          center: [],
          right: [],
          bottom: [],
          whole: [],
          gallery: [],
        },
      },
    ],
    zoomLocks: { locksByViewUid: {}, locksDict: {} },
    locationLocks: { locksByViewUid: {}, locksDict: {} },
    valueScaleLocks: { locksByViewUid: {}, locksDict: {} },
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

async function resolveViewConfig() {
  if (params.has('empty')) {
    return {
      localOnly: true,
      viewConfig: emptyViewConfig(),
    };
  }

  const configUrl = params.get('config');
  if (configUrl) {
    return {
      localOnly: params.get('localOnly') === '1',
      viewConfig: await fetchJson(configUrl),
    };
  }

  const viewConfigId = params.get('d') || params.get('viewconf') || 'default';
  try {
    return {
      localOnly: true,
      viewConfig: await fetchJson(`/api/v1/viewconfs/?d=${encodeURIComponent(viewConfigId)}`),
    };
  } catch (error) {
    if (viewConfigId === 'default') {
      console.warn('Using an empty local HiGlass view config fallback.', error);
      return {
        localOnly: true,
        viewConfig: emptyViewConfig(),
      };
    }
    throw error;
  }
}

function normalizeViewConfig(viewConfig, { localOnly }) {
  const normalized = structuredClone(viewConfig);
  normalized.editable = normalized.editable ?? true;
  normalized.viewEditable = normalized.viewEditable ?? true;
  normalized.tracksEditable = normalized.tracksEditable ?? true;
  if (localOnly) {
    normalized.trackSourceServers = ['/api/v1'];
    normalized.exportViewUrl = '/api/v1/viewconfs/';
  } else {
    normalized.trackSourceServers = normalized.trackSourceServers || ['/api/v1'];
    normalized.exportViewUrl = normalized.exportViewUrl || '/api/v1/viewconfs/';
  }
  normalized.zoomLocks = normalized.zoomLocks || { locksByViewUid: {}, locksDict: {} };
  normalized.locationLocks = normalized.locationLocks || { locksByViewUid: {}, locksDict: {} };
  normalized.valueScaleLocks = normalized.valueScaleLocks || { locksByViewUid: {}, locksDict: {} };
  return normalized;
}

async function launch() {
  setStatus('Connecting to the local HiGlass server...');
  const resolved = await resolveViewConfig();
  const viewConfig = normalizeViewConfig(resolved.viewConfig, { localOnly: resolved.localOnly });
  const api = await hglib.viewer(viewerElement, viewConfig, { bounded: true });
  window.hglib = hglib;
  window.hgApi = api;
  document.documentElement.dataset.higlassReady = 'true';
  statusElement.hidden = true;
  console.info(`TAFFISH HiGlass viewer ready with hglib ${hglib.version}.`);
}

launch().catch((error) => {
  console.error(error);
  setStatus(`Failed to initialize the local HiGlass viewer: ${error.message}`, true);
});

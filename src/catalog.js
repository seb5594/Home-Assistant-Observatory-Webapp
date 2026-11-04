export const repository = 'https://github.com/seb5594/homeassistant-app-stats'
export const pageUrl = 'https://seb5594.github.io/homeassistant-app-stats/'
export const owner = 'seb5594'
export const projects = [
  { id: 'git-exporter', legacyStores: ['d46539d0'], name: 'Git Exporter', kind: 'apps', slug: 'git-exporter', repo: 'Home-Assistant-git-exporter-Addon', description: 'Deine Konfiguration. Sicher im Git-Repository.', icon: 'git', color: 'blue' },
  { id: 'rsync-local', legacyStores: ['81f86f9d'], name: 'Rsync Local', kind: 'apps', slug: 'rsync-local', repo: 'Home-Assistant-Rsync-Local-Addon', description: 'Lokale Backups auf deinem USB-Laufwerk.', icon: 'drive', color: 'teal' },
  { id: 'sony_playstation_vr_camera_loader', name: 'PlayStation VR Camera', kind: 'apps', slug: 'sony_playstation_vr_camera_loader', repo: 'Home-Assistant-Playstation-VR-Camera-Loader-App', description: 'Eine neue Aufgabe für deine PlayStation-Kamera.', icon: 'camera', color: 'violet' },
  { id: 'assist_ai_router', name: 'Assist AI Router', kind: 'apps', slug: 'assist_ai_router', repo: 'Home-Assistant-Assist-AI-Router-App', description: 'Schickt Assist-Anfragen an die passende KI.', icon: 'bot', color: 'blue' },
  { id: 'gitea_mcp_server', name: 'Gitea MCP-Server', kind: 'apps', slug: 'gitea_mcp_server', repo: 'Home-Assistant-Gitea-MCP-Server-App', description: 'KI-Agenten arbeiten direkt mit deinem Gitea.', icon: 'server', color: 'teal' },
  { id: 'gitea_mirror', name: 'Gitea Mirror', kind: 'apps', slug: 'gitea_mirror', repo: 'Home-Assistant-Gitea-Mirror-App', description: 'Spiegelt deine Repositories automatisch.', icon: 'git', color: 'violet' },
  { id: 'gitea_runner', name: 'Gitea Runner', kind: 'apps', slug: 'gitea_runner', repo: 'Home-Assistant-Gitea-Runner-App', description: 'Führt deine Gitea-Workflows im Smart Home aus.', icon: 'server', color: 'blue' },
  { id: 'tuya_breaker', name: 'Tuya Breaker', kind: 'apps', slug: 'tuya_breaker', repo: 'Home-Assistant-Tuya-Breaker-App', description: 'Holt Tuya-Geräte zurück in dein lokales Netz.', icon: 'wifi', color: 'teal' },
  { id: 'untuyaos3', name: 'UnTuyaOS3', kind: 'apps', slug: 'untuyaos3', repo: 'Home-Assistant-UnTuyaOS3-App', description: 'Befreit Geräte von der Tuya-Cloud.', icon: 'wifi', color: 'violet' },
  { id: 'wifi_helper', name: 'WiFi App Helper', kind: 'apps', slug: 'wifi_helper', repo: 'Home-Assistant-WiFi-Helper-App', description: 'Gibt dem Flash-Vorgang deinen WLAN-Adapter.', icon: 'wifi', color: 'blue' },
  { id: 'ninebot_e_scooters', name: 'Ninebot E-Scooters', kind: 'integrations', repo: 'hass-ninebot_e_scooters-integration', description: 'Dein E-Scooter wird Teil deines Smart Homes.', icon: 'bike', color: 'blue' },
  { id: 'pulseaudio_loopback', name: 'PulseAudio Loopback Extended', kind: 'integrations', repo: 'hass-pulseaudio_loopback_extended-integration', description: 'Mehr Möglichkeiten für dein Audio-Setup.', icon: 'audio', color: 'teal' },
  { id: 'vacuum_mapguard', name: 'Vacuum MapGuard', kind: 'integrations', repo: 'hass-vacuum_mapguard-integration', description: 'Die richtige Karte für deinen Saugroboter.', icon: 'map', color: 'violet' },
]
const names = {
  core_mosquitto: 'Mosquitto broker', core_configurator: 'File editor', core_samba: 'Samba share', core_matter_server: 'Matter Server', core_ssh: 'Terminal & SSH', core_zwave_js: 'Z-Wave JS', core_whisper: 'Whisper', core_piper: 'Piper', core_openwakeword: 'openWakeWord',
  a0d7b954_ssh: 'Advanced SSH & Web Terminal', a0d7b954_nodered: 'Node-RED', a0d7b954_vscode: 'Studio Code Server', a0d7b954_adguard: 'AdGuard Home', a0d7b954_nginxproxymanager: 'Nginx Proxy Manager', a0d7b954_grafana: 'Grafana', a0d7b954_influxdb: 'InfluxDB', a0d7b954_glances: 'Glances',
  hacs: 'HACS', xiaomi_home: 'Xiaomi Home', xiaomi_miot: 'Xiaomi MIoT', localtuya: 'LocalTuya', tuya_local: 'Tuya Local', browser_mod: 'Browser Mod', alarmo: 'Alarmo', powercalc: 'Powercalc', watchman: 'Watchman', adaptive_lighting: 'Adaptive Lighting', smartir: 'SmartIR',
}
export function displayName(id) {
  if (names[id]) return names[id]
  // Only name entries after a personal project when they really belong to it; other authors may reuse a slug.
  const project = projects.find(p => projectMatches({ id }, p))
  if (project) return project.name
  return id.replace(/^(?:[a-f0-9]{8}|core|local)_/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
export const myStores = ['4c7fee11']
export function projectMatches(entry, project) {
  // Supervisor hashes the lowercase store URL; never count other stores as this author's installs.
  return project.kind === 'integrations' ? entry.id === project.id
    : [...myStores, ...(project.legacyStores || [])].some(store => entry.id === `${store}_${project.slug}`)
}

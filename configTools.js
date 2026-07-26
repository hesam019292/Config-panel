// Small helpers for editing the "host" part (IP or domain) inside a proxy
// config link, without needing to understand the full protocol.
// Supports the common URI-style links (vless://, trojan://, ss://, ssr://)
// and the base64-JSON vmess:// format.

function replaceUriHost(link, newHost) {
  // scheme://userinfo@host:port?query#fragment
  const m = link.match(/^([a-z0-9]+):\/\/([^@]+)@([^:/?#]+)((?::\d+)?.*)$/is);
  if (!m) return null;
  const [, scheme, userinfo, , rest] = m;
  return `${scheme}://${userinfo}@${newHost}${rest}`;
}

function getUriHost(link) {
  const m = link.match(/^[a-z0-9]+:\/\/[^@]+@([^:/?#]+)/i);
  return m ? m[1] : null;
}

function replaceVmessHost(link, newHost) {
  const b64 = link.slice('vmess://'.length);
  let json;
  try {
    json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  } catch (e) {
    return null;
  }
  json.add = newHost;
  const out = Buffer.from(JSON.stringify(json)).toString('base64');
  return `vmess://${out}`;
}

function getVmessHost(link) {
  const b64 = link.slice('vmess://'.length);
  try {
    const json = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
    return json.add || null;
  } catch (e) {
    return null;
  }
}

function getHost(link) {
  if (!link) return null;
  if (link.startsWith('vmess://')) return getVmessHost(link);
  return getUriHost(link);
}

function replaceHost(link, newHost) {
  if (!link || !newHost) return null;
  if (link.startsWith('vmess://')) return replaceVmessHost(link, newHost);
  return replaceUriHost(link, newHost);
}

module.exports = { getHost, replaceHost };

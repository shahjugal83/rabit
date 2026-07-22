const PREFIX = {
  REQ:  '[REQ]',
  API:  '[API]',
  CFG:  '[CONFIG]',
  AUTH: '[AUTH]',
  DB:   '[DB]',
  ERR:  '[ERROR]',
  WARN: '[WARN]',
  INFO: '[INFO]',
};

function ts() {
  return new Date().toISOString().slice(11, 23);
}

function log(tag, msg, ...args) {
  console.log(`${tag} ${ts()} | ${msg}`, ...args);
}

function warn(tag, msg, ...args) {
  console.warn(`${tag} ${ts()} | ⚠ ${msg}`, ...args);
}

function err(tag, msg, ...args) {
  console.error(`${tag} ${ts()} | ❌ ${msg}`, ...args);
}

module.exports = {
  PREFIX,
  req(method, url, status, duration, ip, companyId) {
    log(PREFIX.REQ, `${status} ${method} ${url} | ${duration}ms | ${ip} | company=${companyId}`);
  },
  api(method, url, status, body) {
    const extra = body ? ` | ${JSON.stringify(body).slice(0, 120)}` : '';
    log(PREFIX.API, `${status} ${method} ${url}${extra}`);
  },
  config(label, value) {
    log(PREFIX.CFG, `${label}: ${value}`);
  },
  configOk() {
    log(PREFIX.CFG, '✅ Environment validated');
  },
  configError(msg) {
    err(PREFIX.CFG, msg);
  },
  authOk(userId) {
    log(PREFIX.AUTH, `✅ Authenticated user=${userId}`);
  },
  authFail(reason) {
    warn(PREFIX.AUTH, `❌ ${reason}`);
  },
  dbConnected() {
    log(PREFIX.DB, '✅ Database connected');
  },
  dbError(msg) {
    err(PREFIX.DB, msg);
  },
  serverStarted(port, env) {
    log(PREFIX.INFO, `🚀 Server running on port ${port} (${env})`);
  },
  error(msg, ...args) {
    err(PREFIX.ERR, msg, ...args);
  },
  warn(msg, ...args) {
    warn(PREFIX.WARN, msg, ...args);
  },
  info(msg, ...args) {
    log(PREFIX.INFO, msg, ...args);
  },
};

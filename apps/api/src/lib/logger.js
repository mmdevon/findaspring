import { config } from '../config.js';

const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const currentLevel = levels[config.logLevel] ?? levels.info;

const shouldLog = (level) => {
  const value = levels[level] ?? levels.info;
  return value >= currentLevel;
};

const emit = (level, message, meta = {}) => {
  if (!shouldLog(level)) return;
  const line = {
    level,
    message,
    service: 'find-a-spring-api',
    version: config.appVersion,
    timestamp: new Date().toISOString(),
    ...meta
  };
  console.log(JSON.stringify(line));
};

export const logger = {
  debug(message, meta) {
    emit('debug', message, meta);
  },
  info(message, meta) {
    emit('info', message, meta);
  },
  warn(message, meta) {
    emit('warn', message, meta);
  },
  error(message, meta) {
    emit('error', message, meta);
  }
};

import geoip from 'geoip-lite';
import logger from '../log/logger.js';

export default function loggerMiddleware(req, res, next) {
    const start = Date.now();
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

    const isLocal = ip === '::1' || ip === '127.0.0.1';
    const geo = isLocal ? null : geoip.lookup(ip);

    res.on('finish', () => {
        const status =  res.statusCode;

        const logData = {
          method: req.method,
          path: req.originalUrl,
          ip,
          status,
          responsTimeinMs: Date.now() - start,
          country: geo?.country || "Unknown",
          state: geo?.region || "Unknown",
            city: geo?.city || "Unknown",
          userAgent:req.headers['user-agent']
        };

        if (status >= 500) {
            logger.error('Api request failed (Server Error)', logData);
        } else if (status >= 400) {
            logger.warn('API request failed (Client Error)', logData)
        } else {
            logger.info('Api request success', logData)
        }
    })
    next()
}
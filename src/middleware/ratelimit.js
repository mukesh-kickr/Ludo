import rateLimit from "express-rate-limit";
const requestTracker = new Map();
const EXPIRE_TIME = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUEST = 2;

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestTracker.entries()) {
    if (now - value.startTime > EXPIRE_TIME) {
      requestTracker.delete(key);
      console.log(`Cleaned up expired key: ${key}`);
    }
  }
}, 60 * 1000);
export const customRateLimiter = (req, res, next) => {
    const ip = req.ip;
    const route = req.path;
    // console.log(route)
    
    const key = `${ip}-${route}`;
    const now = Date.now();
    

    if (!requestTracker.has(key)) {
        requestTracker.set(key, {startTime: now, count:1})
    }

    const userData = requestTracker.get(key);

    if (now - userData.startTime > EXPIRE_TIME) {
        requestTracker.set(key, { startTime: now, count: 1 });
        return next();
    }

    if (userData.count > MAX_REQUEST) {
        return res.status(429).json({
            error :"Too many requests. Please slow down!"
        })
    }

    userData.count++;
    next()

}

export const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 2,
    message: "Too many requests. Plese try again later",
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false
})
import winston from "winston";
import "winston-daily-rotate-file"

const transport = new winston.transports.DailyRotateFile({
    filename: `log/application-%DATE%.log`,
    zippedArchive:true,
    maxSize: "20m",
    maxFiles: "14d"
})

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    transport,
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
  ]
});

export default logger;
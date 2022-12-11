import { createLogger, transports, format } from 'winston';

export const logger = createLogger({
  transports: [new transports.Console()],
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.splat(),
    format.printf(({ timestamp, level, message }) => {
      let _message =
        typeof message === 'object'
          ? JSON.stringify(message, null, 3)
          : message;
      return `[${timestamp}] ${level}: ${_message}`;
    }),
  ),
});

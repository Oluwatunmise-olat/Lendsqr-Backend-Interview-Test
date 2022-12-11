import { logger } from './utils';
import { Env } from './utils';
import app from './main';

async function bootstrap() {
  const PORT = Env.PORT || 1109;
  app.listen(PORT);
  logger.info(`🚀 App started  on port ${PORT}`);
}

bootstrap();

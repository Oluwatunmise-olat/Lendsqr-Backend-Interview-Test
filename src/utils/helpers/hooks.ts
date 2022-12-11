import * as dayjs from 'dayjs';
import { v4 } from 'uuid';

export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const generateUUID = () => v4();

export const getCurrentTime = () => dayjs().format(DATE_TIME_FORMAT);

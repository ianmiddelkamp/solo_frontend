import { DateTime, Duration } from 'luxon';

export const today = () => DateTime.now().toISODate();

export const firstOfMonth = () => DateTime.now().startOf('month').toISODate();

export const formatDate = (str) =>
  str ? DateTime.fromISO(str).toLocal().toFormat('MMM d, yyyy') : '—';

export const formatDateTime = (str) =>
  str ? DateTime.fromISO(str).toLocal().toFormat('MMM d, yyyy HH:mm') : '—';

export const elapsedSeconds = (startedAt) =>
  Math.floor(DateTime.now().diff(DateTime.fromISO(startedAt), 'seconds').seconds);

export const formatElapsed = (seconds) =>
  Duration.fromObject({ seconds }).toFormat('hh:mm:ss');

export const hoursFromRange = (startedAt, stoppedAt) =>
  parseFloat(
    DateTime.fromISO(stoppedAt).diff(DateTime.fromISO(startedAt), 'hours').hours.toFixed(2)
  );

export const ellapsedTime = (from: Date) =>
  (Date.now() - from.getTime()) / 1000;

export const secondsToMillis = (seconds: number) => seconds * 1000;

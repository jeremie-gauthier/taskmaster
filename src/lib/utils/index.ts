export const isEmpty = (str: string | unknown[]) => str.length === 0;

export const isUndefined = <T>(value: T | undefined): value is undefined =>
  value === undefined;

export const isNull = <T>(value: T | null): value is null => value === null;

export const isNone = <T>(
  value: T | null | undefined,
): value is null | undefined => isNull(value) || isUndefined(value);

export const isEmpty = (str: string | unknown[]) => str.length === 0;

export const isUndefined = <T>(value: T) => value === undefined;

export const isNull = <T>(value: T) => value === null;

export const isNone = <T>(value: T) => isNull(value) || isUndefined(value);

export function throwError(value) {
  throw new Error({ message: value });
}

export function logError(error) {
  console.error(error);
}

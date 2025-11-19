// ES Module loader for CommonJS compatibility
export async function resolve(specifier, context, defaultResolve) {
  return defaultResolve(specifier, context);
}
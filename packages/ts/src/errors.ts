/** Typed errors raised by the @galya/reality SDK. */

export class GalyaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GalyaError";
  }
}

export class UnknownValidatorError extends GalyaError {
  constructor(public readonly validatorName: string) {
    super(`Unknown validator: '${validatorName}'`);
    this.name = "UnknownValidatorError";
  }
}

export class LanguageNotSupportedError extends GalyaError {
  constructor(
    public readonly validatorName: string,
    public readonly available: string[],
    public readonly requested: string = "ts",
  ) {
    const langs = available.length ? available.join(", ") : "(none)";
    super(
      `Validator '${validatorName}' does not support language '${requested}'. ` +
        `Available language(s): ${langs}.`,
    );
    this.name = "LanguageNotSupportedError";
  }
}

export class ChecksumMismatchError extends GalyaError {
  constructor(
    public readonly validatorName: string,
    public readonly expected: string,
    public readonly actual: string,
  ) {
    super(
      `Commit mismatch for '${validatorName}': expected ${expected}, got ${actual}`,
    );
    this.name = "ChecksumMismatchError";
  }
}

export class EntrypointError extends GalyaError {
  constructor(
    public readonly validatorName: string,
    detail: string,
  ) {
    super(`Entrypoint error for '${validatorName}': ${detail}`);
    this.name = "EntrypointError";
  }
}

export class NetworkError extends GalyaError {
  constructor(detail: string) {
    super(`Network error: ${detail}`);
    this.name = "NetworkError";
  }
}

export class InstallCancelledError extends GalyaError {
  constructor(public readonly validatorName: string) {
    super(`Install cancelled for validator '${validatorName}'`);
    this.name = "InstallCancelledError";
  }
}

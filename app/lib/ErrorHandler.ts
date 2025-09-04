// Sentry is optional; wrap usage to avoid runtime/type errors if package isn't installed
let Sentry: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Sentry = require('sentry-expo');
} catch (e) {
  Sentry = null;
}

class ErrorHandler {
  static init() {
    if (!__DEV__ && Sentry) {
      Sentry.init({
        dsn: 'YOUR_SENTRY_DSN',
        enableInExpoDevelopment: false,
        debug: __DEV__,
      });
    }
  }

  static logError(error: Error, context?: any) {
    if (__DEV__) {
      console.error('Error:', error, 'Context:', context);
    } else if (Sentry) {
      Sentry.Native.captureException(error, {
        extra: context,
      });
    }
  }

  static logWarning(message: string, context?: any) {
    if (__DEV__) {
      console.warn('Warning:', message, 'Context:', context);
    } else if (Sentry) {
      Sentry.Native.captureMessage(message, 'warning');
    }
  }

  static logInfo(message: string, context?: any) {
    if (__DEV__) {
      console.log('Info:', message, 'Context:', context);
    }
  }
}

export default ErrorHandler;



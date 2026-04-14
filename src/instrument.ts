import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://218dd9212ed272a2cf513f8253112a8c@o4511137394262016.ingest.de.sentry.io/4511137396097104",
  environment: process.env.NODE_ENV || "development",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Sample rate for performance monitoring
  tracesSampleRate: 1.0,
});

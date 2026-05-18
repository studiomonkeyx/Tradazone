// @ts-nocheck

/**
 * normalizeError
 *
 * Extensions throw in many shapes: plain strings, Error objects, plain objects,
 * null/undefined. This normalises all of them into { code, message }.
 */
export function normalizeError(err) {
  if (!err) {
    return { code: "UNKNOWN", message: "Unknown error" };
  }
  if (typeof err === "string") {
    return { code: err, message: err };
  }
  if (err instanceof Error) {
    return { code: err.name || "ERROR", message: err.message };
  }
  if (typeof err === "object") {
    return {
      code: err.code || err.error || "ERROR",
      message: err.message || err.error || JSON.stringify(err),
    };
  }
  return { code: "UNKNOWN", message: String(err) };
}

/**
 * detectLobstr
 *
 * Detects the LOBSTR Signer Extension by speaking its actual postMessage
 * protocol directly — no SDK abstraction that might silently swallow errors.
 *
 * Protocol (from @lobstrco/signer-extension-api source):
 *   Request:  { source: "LOBSTR_EXTERNAL_MSG_REQUEST", messageId, type: "REQUEST_CONNECTION_STATUS", version: 1 }
 *   Response: { source: "LOBSTR_EXTERNAL_MSG_RESPONSE", ... }
 *
 * The event listener is registered BEFORE postMessage is sent to guarantee
 * we never miss a fast response.
 *
 * A debug listener logs every incoming message so you can inspect the
 * exact payload shape in DevTools Console while diagnosing issues.
 *
 * @param {number} [timeout=4000] - How long to wait for a response (ms).
 *   4 s covers cold-start delays on Brave, Firefox, and slow machines.
 * @returns {Promise<{ installed: boolean, reason?: string, data?: object }>}
 */
export function detectLobstr(timeout = 4000) {
  return new Promise((resolve) => {
    let resolved = false;

    // Debug: log every window message so you can see exactly what arrives
    const debugHandler = (event) => {
      if (event.data && typeof event.data === "object") {
        console.log(
          "[LOBSTR DEBUG] message from",
          event.origin,
          JSON.stringify(event.data)
        );
      }
    };
    window.addEventListener("message", debugHandler);

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        window.removeEventListener("message", detectionHandler);
        window.removeEventListener("message", debugHandler);
        console.warn(
          "[LOBSTR] No response after",
          timeout,
          "ms — extension not installed or content script not running on this origin"
        );
        resolve({ installed: false, reason: "TIMEOUT" });
      }
    }, timeout);

    const messageId = Date.now() + Math.random();

    function detectionHandler(event) {
      const data = event.data;
      // The extension content script responds with source = "LOBSTR_EXTERNAL_MSG_RESPONSE".
      // We accept any response with that source (not requiring messagedId match)
      // so a typo in the library field name doesn't block detection.
      if (
        data &&
        typeof data === "object" &&
        data.source === "LOBSTR_EXTERNAL_MSG_RESPONSE"
      ) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          window.removeEventListener("message", detectionHandler);
          window.removeEventListener("message", debugHandler);
          console.log("[LOBSTR] Extension detected, response:", data);
          resolve({ installed: true, data });
        }
      }
    }

    // Register listener BEFORE sending, to avoid missing instant responses
    window.addEventListener("message", detectionHandler);

    // Use window.location.origin — some extensions ignore targetOrigin: "*"
    window.postMessage(
      {
        source: "LOBSTR_EXTERNAL_MSG_REQUEST",
        messageId,
        type: "REQUEST_CONNECTION_STATUS",
        version: 1,
      },
      window.location.origin
    );
  });
}

// Kept for any existing imports — delegates to detectLobstr
export function waitForLobstr(timeout = 4000) {
  return detectLobstr(timeout).then((r) => r.installed);
}

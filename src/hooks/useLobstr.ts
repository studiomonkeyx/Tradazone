// @ts-nocheck
/**
 * @fileoverview useLobstr — React hook for connecting to the LOBSTR
 * Signer Extension on the Stellar network.
 *
 * Wraps `@lobstrco/signer-extension-api` and `waitForLobstr` into a
 * single, stateful hook that can be consumed by any component that needs
 * to initiate a Stellar wallet connection.
 *
 * @module useLobstr
 */

import { useState, useCallback } from "react";
import { isConnected, getPublicKey } from "@lobstrco/signer-extension-api";

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} LobstrConnectSuccess
 * Returned by {@link UseLobstrHook#connect} on a successful connection.
 *
 * @property {true}   success       - Always `true` on success.
 * @property {string} address       - The Stellar public key (G‑address) of the
 * connected account, e.g. `"GABC...XYZ"`.
 * @property {'PUBLIC' | 'TESTNET'} network - The Stellar network the wallet
 * is operating on. Currently always `"PUBLIC"` because LOBSTR targets mainnet.
 */

/**
 * @typedef {Object} LobstrConnectFailure
 * Returned by {@link UseLobstrHook#connect} when the connection fails.
 *
 * @property {false}  success - Always `false` on failure.
 * @property {string} error   - Error token. Known values:
 * - `"NOT_INSTALLED"` — LOBSTR extension not detected after `timeout` ms.
 * - `"LOCKED"`        — Extension present but password-locked (thrown by
 * `getPublicKey` when the vault is sealed).
 * - `"ACCESS_DENIED"` — User dismissed or denied the connection prompt, or
 * `getPublicKey` returned an empty/invalid key.
 * - Any other string — Unexpected error from the extension API.
 */

/**
 * @typedef {LobstrConnectSuccess | LobstrConnectFailure} LobstrConnectResult
 * Union type returned by {@link UseLobstrHook#connect}.
 */

/**
 * @typedef {Object} UseLobstrHook
 * Shape of the object returned by {@link useLobstr}.
 *
 * @property {() => Promise<LobstrConnectResult | null>} connect
 * Initiates the LOBSTR connection flow:
 * 1. Waits up to 3 s for `window.lobstr` to appear (`waitForLobstr`).
 * 2. Calls `isConnected()` as a soft check.
 * 3. Calls `getPublicKey()` — this prompts the user in the extension.
 * 4. Normalises the public-key response into a plain `address` string.
 *
 * Returns `null` (not a `LobstrConnectResult`) if a connection attempt is
 * already in progress (`isConnecting === true`), acting as a no-op guard.
 *
 * @property {boolean}      isConnecting - `true` while `connect()` is awaiting
 * a response from the extension. Used to show spinners and disable buttons.
 *
 * @property {string | null} publicKey  - The connected Stellar public key after
 * a successful call to `connect()`. `null` before connection or after an error.
 *
 * @property {'PUBLIC' | 'TESTNET' | null} network - The Stellar network string
 * after a successful connection. `null` before connection.
 *
 * @property {string | null} error - The raw error token from the most recent
 * failed `connect()` call. `null` when no error has occurred or after a
 * successful connection.
 */

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useLobstr
 *
 * Provides a stateful interface for connecting to the LOBSTR Signer Extension.
 *
 * ### Usage
 * ```jsx
 * const { connect, isConnecting, publicKey, error } = useLobstr();
 *
 * const result = await connect();
 * if (result?.success) {
 * // result.address — Stellar G-address
 * // result.network — 'PUBLIC'
 * } else {
 * // result.error — 'NOT_INSTALLED' | 'LOCKED' | 'ACCESS_DENIED' | ...
 * }
 * ```
 *
 * ### Extension API response normalisation
 * `getPublicKey()` from `@lobstrco/signer-extension-api` may return:
 * - A plain G‑address string: `"GABC...XYZ"`
 * - An object with a `publicKey` field: `{ publicKey: "GABC...XYZ" }`
 * - An object with an `error` field: `{ error: "LOCKED" }`
 *
 * This hook normalises all three cases into a consistent `LobstrConnectResult`.
 *
 * @returns {UseLobstrHook}
 */
export function useLobstr() {
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
  const [isConnecting, setIsConnecting] = useState(false);

  /**
   * Raw error token from the last failed attempt.
   * @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]}
   */
  const [error, setError] = useState(null);

  /**
   * Connected Stellar public key (G‑address), or `null` if not connected.
   * @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]}
   */
  const [publicKey, setPublicKey] = useState(null);

  /**
   * Stellar network identifier after connection, or `null` if not connected.
   * @type {[('PUBLIC' | 'TESTNET') | null, React.Dispatch<React.SetStateAction<('PUBLIC' | 'TESTNET') | null>>]}
   */
  const [network, setNetwork] = useState(null);

  /**
   * Initiates the LOBSTR connection flow.
   *
   * @returns {Promise<LobstrConnectResult | null>} Resolves with a result
   * object, or `null` if a connection is already in progress.
   */
  const connect = useCallback(async () => {
    // Guard: prevent concurrent connection attempts
    if (isConnecting) return null;

    setError(null);
    setIsConnecting(true);

    try {
      // Step 1: Detect the extension via postMessage timing.
      // isConnected() sends a postMessage and waits up to 2000ms for the
      // extension content script to reply. When installed, it replies in <100ms.
      // When not installed, it always takes the full 2000ms timeout.
      // Racing against 1500ms lets us distinguish the two cases reliably.
      const detected = await Promise.race([
        isConnected().then(() => true),
        new Promise((resolve) => setTimeout(() => resolve(false), 1500)),
      ]);

      if (!detected) {
        throw new Error("NOT_INSTALLED");
      }

      // Step 2: Request the public key — this prompts the user in the extension
      const pkResult = await getPublicKey();

      // Step 3: Normalise the response into a plain address string.
      // The library returns a plain G-address string directly.
      let address = "";
      if (typeof pkResult === "string" && pkResult.startsWith("G")) {
        address = pkResult;
      } else if (pkResult && pkResult.publicKey) {
        address = pkResult.publicKey;
      } else if (pkResult && pkResult.error) {
        throw new Error(pkResult.error);
      }

      if (!address) {
        throw new Error("ACCESS_DENIED");
      }

      /** @type {'PUBLIC' | 'TESTNET'} */
      const currentNetwork = "PUBLIC";

      setPublicKey(address);
      setNetwork(currentNetwork);

      return { success: true, address, network: currentNetwork };

    } catch (err) {
      // The library throws plain strings (e.g. "LOCKED"), not Error objects.
      const message = err instanceof Error ? err.message : String(err);
      console.error("[LOBSTR] Error:", message);
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  return { connect, isConnecting, publicKey, network, error };
}
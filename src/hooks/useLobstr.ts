// @ts-nocheck

import { useState, useCallback } from "react";
import { getPublicKey } from "@lobstrco/signer-extension-api";
import { detectLobstr, normalizeError } from "../utils/detectLobstr";

export function useLobstr() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [publicKey, setPublicKey] = useState(null);
  const [network, setNetwork] = useState(null);

  const connect = useCallback(async () => {
    if (isConnecting) return null;

    setError(null);
    setIsConnecting(true);

    try {
      // Step 1: Detect extension via direct postMessage protocol.
      // 4 s timeout covers cold-start delays on Brave/Firefox/slow machines.
      const detection = await detectLobstr(4000);
      if (!detection.installed) {
        throw new Error("NOT_INSTALLED");
      }

      // Step 2: Request the public key — prompts the user inside the extension
      const pkResult = await getPublicKey();

      // Step 3: Normalise — library may return a plain string, object, or throw
      let address = "";
      if (typeof pkResult === "string" && pkResult.startsWith("G")) {
        address = pkResult;
      } else if (pkResult && pkResult.publicKey) {
        address = pkResult.publicKey;
      } else if (pkResult && pkResult.error) {
        throw pkResult.error; // library throws strings; normalizeError handles it
      }

      if (!address) {
        throw new Error("ACCESS_DENIED");
      }

      const currentNetwork = "PUBLIC";
      setPublicKey(address);
      setNetwork(currentNetwork);
      return { success: true, address, network: currentNetwork };

    } catch (err) {
      // Handles Error objects, plain strings, objects, and null/undefined
      const { code, message } = normalizeError(err);
      console.error("[LOBSTR] Connection failed:", code, message);
      setError(code);
      return { success: false, error: code };
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  return { connect, isConnecting, publicKey, network, error };
}

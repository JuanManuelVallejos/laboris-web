"use client";

import { useEffect, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

type GetToken = () => Promise<string | null>;

interface UseEventStreamOptions {
  /** Pause the connection while the tab is hidden. Default true. */
  pauseWhenHidden?: boolean;
  /** Delay before reconnecting after a drop/error. Default 3000ms. */
  retryDelayMs?: number;
}

/**
 * Subscribes to a backend SSE stream authenticated with a fresh Clerk token
 * on every (re)connect attempt — the library's own retry can't be used as-is
 * because it replays the same (possibly expired) headers forever.
 */
export function useEventStream<T>(
  url: string | null,
  getToken: GetToken,
  onEvent: (data: T) => void,
  { pauseWhenHidden = true, retryDelayMs = 3000 }: UseEventStreamOptions = {}
) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    let stopped = false;

    const waitForVisible = () =>
      new Promise<void>((resolve) => {
        if (!pauseWhenHidden || document.visibilityState === "visible") {
          resolve();
          return;
        }
        const onVis = () => {
          if (document.visibilityState === "visible") {
            document.removeEventListener("visibilitychange", onVis);
            resolve();
          }
        };
        document.addEventListener("visibilitychange", onVis);
      });

    async function run() {
      while (!stopped) {
        await waitForVisible();
        if (stopped) return;
        const token = await getToken();
        if (!token) {
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
        try {
          await fetchEventSource(url as string, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
            openWhenHidden: true, // we handle visibility pausing ourselves
            async onopen(res) {
              if (!res.ok) throw new Error(`stream open failed: ${res.status}`);
            },
            onmessage(ev) {
              if (!ev.data) return;
              try {
                onEventRef.current(JSON.parse(ev.data) as T);
              } catch {
                /* ignore malformed/ping events */
              }
            },
            onerror(err) {
              throw err; // stop the library's built-in retry; we reconnect below with a fresh token
            },
          });
        } catch {
          /* fall through to reconnect */
        }
        if (stopped) return;
        await new Promise((r) => setTimeout(r, retryDelayMs));
      }
    }

    run();
    return () => {
      stopped = true;
      controller.abort();
    };
  }, [url, getToken, pauseWhenHidden, retryDelayMs]);
}

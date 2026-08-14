import { useCallback, useEffect, useRef, useState } from "react";

import type { AsyncStatus } from "@/types/async";

type AsyncListState<Item> = {
  data: Item[];
  status: AsyncStatus;
};

function createInitialState<Item>(): AsyncListState<Item> {
  return { data: [], status: "loading" };
}

export function useAsyncList<Item>(
  fetchItems: (signal: AbortSignal) => Promise<Item[]>,
  errorMessage: string,
) {
  const [state, setState] = useState<AsyncListState<Item>>(
    createInitialState<Item>,
  );
  const requestRef = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setState(createInitialState<Item>());

    try {
      const data = await fetchItems(controller.signal);

      if (!controller.signal.aborted) {
        setState({ data, status: "success" });
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error(errorMessage, error);
        setState({ data: [], status: "error" });
      }
    }
  }, [errorMessage, fetchItems]);

  useEffect(() => {
    void reload();

    return () => requestRef.current?.abort();
  }, [reload]);

  return { ...state, reload };
}

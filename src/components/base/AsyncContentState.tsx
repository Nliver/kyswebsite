import type { ReactNode } from "react";
import { Button, Empty } from "antd";
import { RefreshCw } from "lucide-react";

import styles from "./AsyncContentState.module.css";
import type { AsyncStatus } from "@/types/async";

type AsyncContentStateProps = {
  status: AsyncStatus;
  isEmpty: boolean;
  emptyDescription: string;
  errorDescription: string;
  retryLabel: string;
  onRetry: () => void;
  icon?: ReactNode;
};

export default function AsyncContentState({
  status,
  isEmpty,
  emptyDescription,
  errorDescription,
  retryLabel,
  onRetry,
  icon,
}: AsyncContentStateProps) {
  const isError = status === "error";

  if (status === "loading" || (status === "success" && !isEmpty)) {
    return null;
  }

  return (
    <div
      className={styles.statePanel}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <Empty
        className={styles.empty}
        image={icon ? <span className={styles.icon}>{icon}</span> : undefined}
        description={isError ? errorDescription : emptyDescription}
      >
        {isError && (
          <Button icon={<RefreshCw size={16} />} onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
      </Empty>
    </div>
  );
}

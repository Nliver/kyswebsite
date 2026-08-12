import { Skeleton } from "antd";

import styles from "./ContentCardSkeleton.module.css";

type ContentCardSkeletonProps = {
  count?: number;
  label: string;
};

export default function ContentCardSkeleton({
  count = 3,
  label,
}: ContentCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={styles.card}
          role="status"
          aria-label={label}
        >
          <Skeleton active title={{ width: "70%" }} paragraph={{ rows: 4 }} />
          <Skeleton.Button active block />
        </div>
      ))}
    </>
  );
}

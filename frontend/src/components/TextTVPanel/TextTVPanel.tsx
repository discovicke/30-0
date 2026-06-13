import type { ReactNode } from 'react';
import styles from './TextTVPanel.module.scss';

interface Props {
  title: string;
  meta?: string;
  children: ReactNode;
  scrollable?: boolean;
  maxHeight?: string;
}

export default function TextTVPanel({ title, meta, children, scrollable, maxHeight }: Props) {
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      <div
        className={`${styles.body} ${scrollable ? styles.scrollable : ''}`}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>
    </div>
  );
}

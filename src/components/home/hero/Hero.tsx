import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./Hero.module.css";
import { useTranslation } from "../../../hooks/useTranslation";

export default function Hero() {
  const { t } = useTranslation();
  const highlightText = t("homepage.hero.heroHighlight");
  const highlightTerms = [
    t("homepage.hero.heroKeywordChina"),
    t("homepage.hero.heroKeywordGlobal"),
  ];
  const heroText = t("homepage.hero.heroSubtext");
  const emphasis = t("homepage.hero.heroEmphasis");
  const escapeRegExp = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const highlightPattern = new RegExp(
    `(${highlightTerms.map(escapeRegExp).join("|")})`,
    "giu",
  );
  const emphasisIndex = heroText
    .toLocaleLowerCase()
    .indexOf(emphasis.toLocaleLowerCase());
  const hasEmphasis = emphasisIndex >= 0;
  const textBeforeEmphasis = hasEmphasis
    ? heroText.slice(0, emphasisIndex)
    : heroText;
  const textAfterEmphasis = hasEmphasis
    ? heroText.slice(emphasisIndex + emphasis.length)
    : "";

  return (
    <section className={styles.hero}>
      <div className={styles.heroBackground}>
        <div className={styles.heroOrnament} aria-hidden="true">
          <span />
          <span />
        </div>
        <div className={styles.heroSubtitle}>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroLine}>
              {highlightText.split(highlightPattern).map((part, index) =>
                highlightTerms.some(
                  (term) =>
                    term.toLocaleLowerCase() === part.toLocaleLowerCase(),
                ) ? (
                  <strong
                    className={styles.heroEmphasis}
                    key={`${part}-${index}`}
                  >
                    {part}
                  </strong>
                ) : (
                  <span key={`${part}-${index}`}>{part}</span>
                ),
              )}
            </span>
            <span className={styles.heroLine}>
              {textBeforeEmphasis}
              {hasEmphasis && (
                <strong className={styles.heroEmphasis}>{emphasis}</strong>
              )}
              {textAfterEmphasis}
            </span>
          </h1>
          <p className={styles.heroMicroline}>
            {t("homepage.hero.heroMicroline")}
          </p>
          <Link href="/about" className={styles.heroPrimaryButton}>
            {t("homepage.hero.heroCta")}
            <ArrowRight className={styles.buttonIcon} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

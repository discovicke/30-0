import styles from './LandingPage.module.scss';

interface Props {
    onStart: () => void;
    onContinue: () => void;
    canContinue: boolean;
}

export default function LandingPage({onStart, onContinue, canContinue}: Props) {
    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <p className={styles.tagline}>Inofficiell supporterapp</p>
                <h1 className={styles.title}>30-0</h1>
                <span className={styles.alpha}>Alpha</span>
                <p className={styles.subtitle}>
                    Bygg det ultimata Allsvenska laget.<br/>
                    Simulera en 30-matchers säsong.
                </p>
                <p className={styles.desc}>
                    Snurra hjulet. Drafta legender och kult-ikoner. Kan du vinna alla 30 matcher?
                </p>
                <div className={styles.heroBtns}>
                    <button className={styles.primaryBtn} onClick={onStart}>
                        Starta nytt spel
                        <span className={styles.arrow}>&rarr;</span>
                    </button>
                    <button className={styles.secondaryBtn} onClick={onContinue} disabled={!canContinue}>
                        Fortsätt draft
                    </button>
                </div>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.stat}>
                    <span className={styles.statNum}>36</span>
                    <span className={styles.statLabel}>Allsvenska klubbar</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNum}>6 700+</span>
                    <span className={styles.statLabel}>Spelarsäsonger</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statNum}>2001–2025</span>
                    <span className={styles.statLabel}>Säsonger</span>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Vad är 30-0?</h2>
                <div className={styles.bodyText}>
                    <p>
                        30-0 är den allsvenska versionen av <a href="https://82-0.com" target="_blank"
                                                               rel="noopener">82-0</a> och <a href="https://38-0.app"
                                                                                              target="_blank"
                                                                                              rel="noopener">38-0</a>.
                    </p>
                    <p>
                        30-0 är ett gratis Allsvenskt draftspel där du bygger en all-star XI
                        från fler än 6 700 spelarsäsonger – från 2001 till idag.
                    </p>
                    <p>
                        Snurra hjulet för att landa på en Allsvensk klubb och säsong,
                        drafta en spelare från truppen och bygg ditt lag - en position i taget.
                        Blanda årets stjärnor med Allsvenska spelare från 00-talet, 2010-talet
                        och framåt för att skapa din ultimata XI.
                    </p>
                    <p>
                        När laget är klart kan du simulera en hel 30-matchers Allsvensk säsong
                        och se hur långt ditt lag når. Kan du vinna serien? Kan du gå obesegrad?
                        Kan du vinna alla 30 matcher?
                    </p>
                    <p>
                        30-0 gör Allsvensk historia till ett nostalgiskt
                        fotbollsspel byggt för diskussioner, tänk-om-scenarion och möjlighet att upptäcka
                        hur starkt ditt drömlag egentligen är.
                    </p>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Hur spelar man?</h2>
                <div className={styles.steps}>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>1</span>
                        <div>
                            <strong>Snurra hjulet</strong>
                            <p>Varje snurr landar på en Allsvensk förening från en specifik säsong.</p>
                        </div>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>2</span>
                        <div>
                            <strong>Drafta en spelare</strong>
                            <p>Välj en spelare från truppen och placera honom i din formation.</p>
                        </div>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>3</span>
                        <div>
                            <strong>Bygg ditt XI</strong>
                            <p>Upprepa tills alla 11 positioner är fyllda med Allsvensk talang.</p>
                        </div>
                    </div>
                    <div className={styles.step}>
                        <span className={styles.stepNum}>4</span>
                        <div>
                            <strong>Simulera säsongen</strong>
                            <p>Simulera alla 30 matcher och jaga en perfekt, obesegrad 30-0-säsong!</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Populära utmaningar</h2>
                <ul className={styles.challengeList}>
          <li>Vinn Allsvenskan</li>
          <li>Gå en säsong obesegrad</li>
          <li>Jaga en perfekt 30-0-0</li>
          <li>Bygg en modern-tids XI (2016–2025)</li>
          <li>Drafta en all-star XI från hela 2000-talet</li>
          <li>Vinn på svår nivå med dolda betyg</li>
                </ul>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Vanliga frågor</h2>
                <div className={styles.faqList}>
                    <details className={styles.faqItem}>
                        <summary className={styles.faqQuestion}>Vad är 30-0?</summary>
                        <p className={styles.faqAnswer}>
                            30-0 är den allsvenska versionen av 82-0 och 38-0: <br></br>
                            Ett gratis draftspel där du bygger en all-star XI från fler än 6 700 spelarsäsonger
                            (2001–2025).
                            Du snurrar fram klubbar och säsonger, draftar spelare position för position,
                            och simulerar sedan en 30-matchers säsong.
                        </p>
                    </details>
                    <details className={styles.faqItem}>
                        <summary className={styles.faqQuestion}>Hur spelar man 30-0?</summary>
                        <p className={styles.faqAnswer}>
                            Välj en formation, snurra hjulet för att få en klubb+säsong, drafta en spelare
                            till en ledig position, och upprepa tills din XI är full. Gå sedan till Text-TV
                            för att simulera säsongen.
                        </p>
                    </details>
                    <details className={styles.faqItem}>
                        <summary className={styles.faqQuestion}>Vilka spelare och klubbar ingår?</summary>
                        <p className={styles.faqAnswer}>
                            Alla Allsvenska klubbar från säsongerna 2001 till 2025, över 6 700
                            spelarsäsonger. Från etablerade storklubbar till klassiska lag som
                            gjort avtryck i serien.
                        </p>
                    </details>
                    <details className={styles.faqItem}>
                        <summary className={styles.faqQuestion}>Är 30-0 gratis?</summary>
                        <p className={styles.faqAnswer}>
                            Ja, 30-0 är helt gratis att spela. Inga köp, inga annonser, inga mikrotransaktioner.
                        </p>
                    </details>
                    <details className={styles.faqItem}>
                        <summary className={styles.faqQuestion}>Är 30-0 ett fantasy football-spel?</summary>
                        <p className={styles.faqAnswer}>
                            Nej. 30-0 är inte kopplat till verkliga matcher eller poängsystem.
                            Du bygger en statisk XI som sedan simulerar en säsong - som ett
                            digitalt "tänk om"-kort.
                        </p>
                    </details>
                    <details className={styles.faqItem}>
                        <summary className={styles.faqQuestion}>Är 30-0 associerat med Allsvenskan?</summary>
                        <p className={styles.faqAnswer}>
                            Nej. 30-0 är ett oberoende fan-projekt och är inte associerat med,
                            godkänt av eller kopplat till Allsvenskan, någon fotbollsklubb eller
                            styrande organ.
                        </p>
                    </details>
                    <details className={styles.faqItem}>
                        <summary className={styles.faqQuestion}>Var kommer spelarbetygen ifrån?</summary>
                        <p className={styles.faqAnswer}>
                            Betygen är baserade på offentlig statistik över varje spelares prestationer
                            under en given säsong; mål, assist, position, speltid och lagets resultat
                            vägs samman till ett betyg på skalan 1–99. <br></br><br></br>
                            Enkelt förklarat: spelare som
                            statistiskt levererade på planen får högre betyg, oavsett om de var stjärnor i topplag
                            eller nyckelspelare i bottenlag.
                        </p>
                    </details>
                    <details className={styles.faqItem}>
                        <summary className={styles.faqQuestion}>Varför heter det 30-0?</summary>
                        <p className={styles.faqAnswer}>
                            30-0 syftar på den perfekta säsongen – 30 vinster på 30 matcher.
                            En allusion till 38-0 och 82-0 som inspiration.
                        </p>
                    </details>
                </div>
            </div>

      <div className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Kan du bygga det ultimata Allsvenska laget?</h2>
        <p className={styles.ctaDesc}>
          Drafta ditt XI, simulera säsongen och se om ditt lag kan uppnå det omöjliga:
          30 vinster på 30 matcher.
        </p>
        <button className={styles.primaryBtn} onClick={onStart}>
          Spela 30-0
          <span className={styles.arrow}>&rarr;</span>
        </button>
      </div>
    </div>
  );
}

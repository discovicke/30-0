import styles from './LandingPage.module.scss';

interface Props {
  onStart: () => void;
  onContinue: () => void;
  canContinue: boolean;
}

export default function LandingPage({ onStart, onContinue, canContinue }: Props) {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <p className={styles.tagline}>Inofficiellt supportermat</p>
        <h1 className={styles.title}>30-0</h1>
        <p className={styles.subtitle}>
          Bygg det ultimata Allsvenska laget.<br />
          Simulera en 30-matchers säsong.
        </p>
        <p className={styles.desc}>
          Snurra hjulet. Drafta Allsvenska legender. Kan du vinna alla 30 matcher?
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
            30-0 är ett gratis Allsvenskt draftspel där du bygger ett all-star XI
            från fler än 6 700 spelarsäsonger – från 2001 till idag.
          </p>
          <p>
            Snurra hjulet för att landa på en verklig Allsvensk klubb och säsong,
            drafta spelare från den truppen och bygg ditt lag en position i taget.
            Blanda moderna stjärnor med Allsvenska legender från 00-talet, 2010-talet
            och framåt för att skapa ditt ultimata XI.
          </p>
          <p>
            När laget är klart kan du simulera en hel 30-matchers Allsvensk säsong
            och se hur långt ditt lag når. Kan du vinna serien? Kan du gå obesegrad?
            Kan du vinna alla 30 matcher?
          </p>
          <p>
            Inspirerat av 82-0.com – 30-0 gör Allsvensk historia till ett nostalgiskt
            fotbollsspel byggt för diskussioner, vad-om-scenarion och att upptäcka
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
              <p>Varje snurr landar på en verklig Allsvensk klubb från en specifik säsong.</p>
            </div>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <div>
              <strong>Drafta en spelare</strong>
              <p>Välj en spelare från truppen och placera hen i din formation.</p>
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
              <p>Spela ut alla 30 matcher och jaga en perfekt, obesegrad 30-0-säsong.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Populära utmaningar</h2>
        <ul className={styles.challengeList}>
          <li>&#9656; Gå en hel 30-matchers säsong obesegrad</li>
          <li>&#9656; Jaga en perfekt 30-0-0</li>
          <li>&#9656; Vinn Allsvenskan</li>
          <li>&#9656; Bygg ett modern-tids XI (2016–2025)</li>
          <li>&#9656; Drafta ett all-star XI från alla epoker</li>
          <li>&#9656; Vinn på svår nivå med dolda betyg</li>
        </ul>
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

      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <a href="#">&#9993; Feedback &amp; buggar</a>
          <a href="#">&#9749; Gillar du spelet?</a>
        </div>
        <p className={styles.footerCredit}>
          Inspirerat av <a href="https://82-0.com" target="_blank" rel="noopener">82-0.com</a> och <a href="https://38-0.app" target="_blank" rel="noopener">38-0.app</a>
        </p>
        <p className={styles.footerDisclaimer}>
          30-0 är ett oberoende, fan-skapat spel. Det är inte associerat med, godkänt av, sponsrat av
          eller kopplat till Allsvenskan, någon fotbollsklubb, tävling, liga, styrande organ eller
          organisation, eller med något spel, utgivare eller betygsleverantör. Alla klubbnamn,
          spelarnamn, betyg och säsongsdata används endast i informations- och beskrivningssyfte,
          och alla varumärken, logotyper och annan immateriell egendom tillhör respektive ägare.
        </p>
      </footer>
    </div>
  );
}

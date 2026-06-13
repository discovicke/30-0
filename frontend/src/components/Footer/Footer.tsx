import {useState} from 'react';
import {Code, Mail, Coffee, Info, X} from 'lucide-react';
import styles from './Footer.module.scss';

export default function Footer() {
    const [showPrivacy, setShowPrivacy] = useState(false);

    return (
        <>
            <footer className={styles.footer}>
              <div className={styles.actions}>
                <a href="https://github.com/discovicke/30-0" target="_blank" rel="noopener" className={`${styles.btn} ${styles.btnGray}`}>
                  <Code size={18} />
                  <span className={styles.btnLabel}>Källkod</span>
                  <span className={styles.btnDesc}>Öppen källkod på GitHub</span>
                </a>
                <a href="mailto:johanssonviktor@pm.me" className={`${styles.btn} ${styles.btnGray}`}>
                  <Mail size={18} />
                  <span className={styles.btnLabel}>Feedback</span>
                  <span className={styles.btnDesc}>Buggar eller förslag</span>
                </a>
                <a href="https://buymeacoffee.com/discovicke" target="_blank" rel="noopener" className={styles.btnPrimary}>
                  <Coffee size={18} />
                  <span className={styles.btnLabel}>Bjud på en kaffe</span>
              <span className={styles.btnDesc}>Hjälper att täcka för servrar & tid</span>
                </a>
                <button className={styles.btn} onClick={() => setShowPrivacy(true)}>
                  <Info size={18} />
                  <span className={styles.btnLabel}>Integritet</span>
                  <span className={styles.btnDesc}>Vad vi samlar in (spoiler: inget)</span>
                </button>
              </div>

                <p className={styles.credit}>
                    Inspirerat av <a href="https://82-0.com" target="_blank" rel="noopener">82-0.com</a> och{' '}
                    <a href="https://38-0.app" target="_blank" rel="noopener">38-0.app</a>
                </p>

                <p className={styles.disclaimer}>
                    30-0 är ett oberoende, fan-skapat spel. Det är inte associerat med, godkänt av, sponsrat av
                    eller kopplat till Allsvenskan, någon fotbollsklubb, tävling, liga, styrande organ eller
                    organisation, eller med något spel, utgivare eller betygsleverantör. Alla klubbnamn,
                    spelarnamn, betyg och säsongsdata används endast i informations- och beskrivningssyfte,
                    och alla varumärken, logotyper och annan immateriell egendom tillhör respektive ägare.
                </p>
            </footer>

            {showPrivacy && (
                <div className={styles.overlay} onClick={() => setShowPrivacy(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.closeBtn} onClick={() => setShowPrivacy(false)}>
                            <X size={14} /> Stäng
                        </button>
                        <PrivacyContent/>
                    </div>
                </div>
            )}
        </>
    );
}

function PrivacyContent() {
  return (
    <div className={styles.privacy}>
      <h1>Integritetspolicy</h1>
      <p className={styles.updated}>Senast uppdaterad: 8 juni 2026</p>

      <h2>Kortversionen</h2>
      <p>
        30-0 är ett gratis webbläsarspel utan konton, annonser eller spårningskakor.
        Spelet samlar in minimalt med data. Din speldata lagras enbart i din egen webbläsare
        och lämnar aldrig din enhet.
      </p>

      <h2>Vem är ansvarig för dina uppgifter?</h2>
      <p>
        Personuppgiftsansvarig är Viktor Johansson, Hudiksvall, Sverige.
        Kontakt: <a href="mailto:johanssonviktor@pm.me">johanssonviktor@pm.me</a>
      </p>

      <h2>Spelframsteg (lagras enbart på din enhet)</h2>
      <p>
        Din formation, draftade spelare och inställningar sparas i din webbläsares{' '}
        <em>localStorage</em> så att du kan återuppta en påbörjad draft. Denna data
        lämnar aldrig din enhet och är inte tillgänglig för oss. Du raderar den när
        som helst via webbläsarens inställningar under "Webbplatsdata" eller "Cookies".
      </p>

      <h2>Analys</h2>
      <p>
        Vi använder Vercel Web Analytics. Tjänsten är kakfri och samlar inte in
        personuppgifter. Den registrerar aggregerad, anonym information såsom
        sidvisningar, ungefärligt land, enhetstyp och hänvisande webbplats. Ingen
        enskild användare kan identifieras. Rättslig grund: berättigat intresse
        (GDPR art. 6.1 f) av att förstå hur spelet används i syfte att förbättra det.
        Se{' '}
        <a href="https://vercel.com/docs/analytics/privacy" target="_blank" rel="noopener">
          Vercels analysinformation
        </a>.
      </p>

      <h2>Hosting</h2>
      <p>
        Webbplatsen hostas på Vercel (Vercel Inc., 340 Pine Street, Suite 900,
        San Francisco, CA 94104, USA). Vercel kan automatiskt behandla tekniska
        förfrågningsdata såsom IP-adress och webbläsartyp för säkerhet och
        driftsäkerhet. Vercel är certifierat enligt EU–US Data Privacy Framework.
        Se{' '}
        <a href="https://vercel.com/legal/privacy" target="_blank" rel="noopener">
          Vercels integritetspolicy
        </a>.
      </p>

      <h2>Kakor (cookies)</h2>
      <p>
        30-0 använder inga spårningskakor eller marknadsföringskakor. Inga
        cookie-banner eller samtycke krävs eftersom inga kakor som kräver samtycke
        enligt lagen (2022:482) om elektronisk kommunikation används.
      </p>

      <h2>Om du kontaktar oss</h2>
      <p>
        Om du mailar{' '}
        <a href="mailto:johanssonviktor@pm.me">johanssonviktor@pm.me</a> med feedback
        eller en buggrapport behandlar vi din e-postadress och ditt meddelande för
        att kunna svara och förbättra spelet. Rättslig grund: berättigat intresse
        (GDPR art. 6.1 f). E-postkorrespondens sparas inte längre än nödvändigt
        för att hantera din förfrågan.
      </p>

      <h2>Dina rättigheter (GDPR)</h2>
      <p>
        Om du befinner dig inom EU/EES har du enligt dataskyddsförordningen (GDPR)
        och kompletterande svensk lag (SFS 2018:218) följande rättigheter:
      </p>
      <ul>
        <li>
          <strong>Tillgång (art. 15)</strong> – rätt att få veta vilka
          personuppgifter vi behandlar om dig.
        </li>
        <li>
          <strong>Rättelse (art. 16)</strong> – rätt att få felaktiga uppgifter
          korrigerade.
        </li>
        <li>
          <strong>Radering (art. 17)</strong> – rätt att begära att uppgifter
          raderas. Din lokala speldata raderar du själv via webbläsaren. Om du
          har skickat ett mail raderar vi det på begäran. Hittar du dig själv
          i spelarregistret och inte vill medverka tar vi bort dig.
        </li>
        <li>
          <strong>Begränsning (art. 18)</strong> – rätt att begära att
          behandlingen av dina uppgifter begränsas.
        </li>
        <li>
          <strong>Invändning (art. 21)</strong> – rätt att invända mot
          behandling som grundar sig på berättigat intresse.
        </li>
        <li>
          <strong>Portabilitet (art. 20)</strong> – rätt att få ut uppgifter
          du lämnat i ett maskinläsbart format.
        </li>
      </ul>
      <p>
        För att utöva dina rättigheter, kontakta{' '}
        <a href="mailto:johanssonviktor@pm.me">johanssonviktor@pm.me</a>. Vi svarar
        inom 30 dagar. Du har även rätt att lämna klagomål till{' '}
        <a href="https://www.imy.se" target="_blank" rel="noopener">
          Integritetsskyddsmyndigheten (IMY)
        </a>
        , Box 8114, 104 20 Stockholm.
      </p>

      <h2>Barn</h2>
      <p>
        30-0 riktar sig till allmän publik och samlar inte medvetet in personuppgifter
        från barn under 13 år. Om du är vårdnadshavare och tror att ditt barn har
        lämnat personuppgifter till oss, kontakta oss så raderar vi dem.
      </p>

      <h2>Överföring till tredjeland</h2>
      <p>
        Vercel är ett amerikanskt bolag. Överföringen av tekniska förfrågningsdata
        till USA sker med stöd av EU–US Data Privacy Framework (art. 45 GDPR),
        vilket Europeiska kommissionen bedömt ge en adekvat skyddsnivå.
      </p>

      <h2>Ändringar av denna policy</h2>
      <p>
        Policyn kan uppdateras i takt med att spelet utvecklas. Datumet högst upp
        anger senaste version. Väsentliga ändringar meddelas via webbplatsen.
      </p>

      <h2>En not om speldata</h2>
      <p>
        Spelarbetyg och statistik är hämtade från offentligt tillgängliga källor
        och används enbart i beskrivande syfte. 30-0 är ett oberoende, fan-skapat
        projekt utan koppling till Allsvenskan, någon fotbollsklubb, liga eller
        styrande organ. Alla varumärken och annan immateriell egendom tillhör
        respektive ägare.
      </p>
    </div>
  );
}

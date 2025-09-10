import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Polityka plików cookies - Falko Project',
  description: 'Informacje o wykorzystywaniu plików cookies przez Falko Project, celach, podstawie prawnej, okresach przechowywania oraz sposobach zarządzania zgodami.',
}

export default function PolitykaCookiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Polityka plików cookies</h1>

          <div className="text-sm text-gray-600 mb-8">Ostatnia aktualizacja: {new Date().toLocaleDateString('pl-PL')}</div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Informacje ogólne</h2>
            <p>
              Niniejsza Polityka plików cookies ("Polityka Cookies") określa zasady używania przez serwis falkoproject.com plików cookies i podobnych technologii, zgodnie z przepisami prawa, w tym rozporządzenia RODO oraz ustawy Prawo telekomunikacyjne.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Czym są pliki cookies?</h2>
            <p>
              Cookies to niewielkie pliki tekstowe zapisywane w urządzeniu końcowym Użytkownika (komputerze, smartfonie, tablecie), które mogą być odczytywane przez nasz system lub systemy podmiotów trzecich (np. dostawców narzędzi analitycznych czy marketingowych).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Rodzaje cookies, których używamy</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Niezbędne</strong> – wymagane do prawidłowego działania serwisu i świadczenia usług (np. utrzymanie sesji, bezpieczeństwo). Nie wymagają zgody.
              </li>
              <li>
                <strong>Preferencje</strong> – zapamiętują wybory Użytkownika (np. język, region). Wymagana zgoda.
              </li>
              <li>
                <strong>Statystyczne</strong> – służą do zbierania anonimowych informacji o sposobie korzystania z serwisu (analityka). Wymagana zgoda.
              </li>
              <li>
                <strong>Marketingowe</strong> – służą do personalizacji treści i reklam oraz pomiaru ich skuteczności (np. Meta Pixel). Wymagana zgoda.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Podstawa prawna</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Art. 6 ust. 1 lit. a RODO – zgoda Użytkownika (preferencje, statystyki, marketing)</li>
              <li>Art. 6 ust. 1 lit. b i f RODO – niezbędne cookies (świadczenie usług online, bezpieczeństwo, prawnie uzasadniony interes)</li>
              <li>Art. 173 Prawa telekomunikacyjnego – obowiązek uzyskania zgody na przechowywanie informacji lub uzyskiwanie do nich dostępu</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Zakres i cele użycia cookies</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Zapewnienie działania serwisu i bezpieczeństwa (niezbędne)</li>
              <li>Zapamiętywanie ustawień i preferencji (preferencje)</li>
              <li>Pomiar ruchu i wydajności serwisu (statystyczne)</li>
              <li>Personalizacja i pomiar skuteczności reklam (marketingowe)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Lista stosowanych cookies</h2>
            <p className="mb-3 text-sm text-gray-700">Poniżej przedstawiamy przykładową listę cookies używanych w serwisie. Rzeczywisty zestaw może różnić się w zależności od wyrażonych zgód i używanych funkcji.</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>consent_seen, consent_necessary, consent_preferences, consent_statistics, consent_marketing, consent_version, consent_updated</strong> – (Falko Project) – cel: zarządzanie zgodami użytkownika; kategorie: niezbędne/preferencje/statystyczne/marketingowe; czas przechowywania: do 180 dni.
              </li>
              <li>
                <strong>_fbp</strong> (Meta Platforms) – cel: identyfikator przeglądarki do pomiaru skuteczności reklam; kategoria: marketing; okres: 90 dni.
              </li>
              <li>
                <strong>_fbc</strong> (Meta Platforms) – cel: przechowuje parametry kampanii po kliknięciu reklamy; kategoria: marketing; okres: 90 dni.
              </li>
              <li>
                <strong>next-auth.session-token / __Secure-next-auth.session-token</strong> (NextAuth) – cel: utrzymanie sesji użytkownika; kategoria: niezbędne; okres: do czasu wylogowania/wygaśnięcia sesji.
              </li>
              <li>
                <strong>next-auth.csrf-token</strong> (NextAuth) – cel: zabezpieczenie przed CSRF; kategoria: niezbędne; okres: sesyjny.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Dostawcy zewnętrzni</h2>
            <p>W zależności od wyrażonych zgód, dane mogą być przetwarzane także przez podmioty trzecie (np. Meta Platforms). W takich przypadkach mają zastosowanie polityki prywatności tych podmiotów.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Okres przechowywania</h2>
            <p>Okres przechowywania zależy od typu pliku cookie i celu przetwarzania. Wskazujemy go wyżej przy poszczególnych kategoriach. Zgoda może być wycofana w dowolnym momencie.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Zarządzanie zgodami i cookies</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Możesz w dowolnym momencie zmienić swoje zgody, korzystając z przycisku „Ustawienia prywatności” dostępnego w lewym dolnym rogu strony.</li>
              <li>Możesz także zmienić ustawienia cookies w swojej przeglądarce (blokowanie/ usuwanie plików cookies).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Przekazywanie danych poza EOG</h2>
            <p>
              W przypadku użycia narzędzi dostawców mających siedzibę poza Europejskim Obszarem Gospodarczym (np. Meta Platforms), dane mogą być przekazywane do państw trzecich. Zapewniamy, że takie przekazania odbywają się zgodnie z RODO (np. w oparciu o standardowe klauzule umowne).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Kontakt</h2>
            <p>
              W sprawach związanych z cookies, zgodami i prywatnością, prosimy o kontakt: dane@falkoproject.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polityka Prywatności - Falko Project',
  description: 'Polityka prywatności sklepu internetowego Falko Project. Informacje o przetwarzaniu danych osobowych.',
};

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Polityka Prywatności</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            Ostatnia aktualizacja: 8 lipca 2025
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Informacje ogólne</h2>
            <div className="space-y-4">
              <p>
                Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych przekazanych przez Użytkowników w związku z korzystaniem przez nich z usług świadczonych drogą elektroniczną za pośrednictwem serwisu internetowego falkoproject.com.
              </p>
              <p>
                Administratorem danych osobowych jest <strong>Falko Project</strong> z siedzibą w Polsce (dalej: „Administrator").
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Podstawa prawna przetwarzania</h2>
            <div className="space-y-4">
              <p>
                Administrator przetwarza dane osobowe zgodnie z przepisami Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych (RODO).
              </p>
              <p>
                Podstawą prawną przetwarzania danych osobowych jest:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Art. 6 ust. 1 lit. a RODO - zgoda osoby, której dane dotyczą</li>
                <li>Art. 6 ust. 1 lit. b RODO - wykonanie umowy</li>
                <li>Art. 6 ust. 1 lit. c RODO - obowiązek prawny ciążący na administratorze</li>
                <li>Art. 6 ust. 1 lit. f RODO - prawnie uzasadniony interes administratora</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Rodzaje przetwarzanych danych</h2>
            <div className="space-y-4">
              <p>
                Administrator może przetwarzać następujące kategorie danych osobowych:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Dane identyfikacyjne (imię, nazwisko)</li>
                <li>Dane kontaktowe (adres email, numer telefonu)</li>
                <li>Dane adresowe (adres zamieszkania, adres dostawy)</li>
                <li>Dane dotyczące transakcji (historia zamówień, płatności)</li>
                <li>Dane techniczne (adres IP, informacje o przeglądarce)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cele przetwarzania danych</h2>
            <div className="space-y-4">
              <p>
                Dane osobowe przetwarzane są w następujących celach:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Realizacja umów sprzedaży i świadczenie usług</li>
                <li>Obsługa klienta i komunikacja</li>
                <li>Prowadzenie działań marketingowych (za zgodą)</li>
                <li>Wystawienie i przesłanie faktury</li>
                <li>Dochodzenie roszczeń lub obrona przed roszczeniami</li>
                <li>Wypełnienie obowiązków prawnych</li>
                <li>Analiza statystyczna i poprawa jakości usług</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Okres przechowywania danych</h2>
            <div className="space-y-4">
              <p>
                Dane osobowe będą przetwarzane przez okres:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Niezbędny do realizacji umowy i wykonania obowiązków prawnych</li>
                <li>Przez okres wymagany przepisami prawa (np. przepisy podatkowe - 5 lat)</li>
                <li>Do momentu wycofania zgody (w przypadku przetwarzania na podstawie zgody)</li>
                <li>Do momentu wniesienia skutecznego sprzeciwu (w przypadku przetwarzania w oparciu o prawnie uzasadniony interes)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Udostępnianie danych</h2>
            <div className="space-y-4">
              <p>
                Dane osobowe mogą być udostępniane następującym kategoriom odbiorców:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Operatorzy płatności elektronicznych</li>
                <li>Firmy kurierskie i pocztowe</li>
                <li>Firmy świadczące usługi księgowe</li>
                <li>Firmy świadczące usługi IT i hostingowe</li>
                <li>Organy państwowe uprawnione na podstawie przepisów prawa</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Prawa osób, których dane dotyczą</h2>
            <div className="space-y-4">
              <p>
                Osobom, których dane są przetwarzane, przysługują następujące prawa:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Prawo dostępu do danych osobowych</li>
                <li>Prawo do sprostowania danych osobowych</li>
                <li>Prawo do usunięcia danych osobowych</li>
                <li>Prawo do ograniczenia przetwarzania</li>
                <li>Prawo do przenoszenia danych</li>
                <li>Prawo do sprzeciwu wobec przetwarzania</li>
                <li>Prawo do cofnięcia zgody</li>
                <li>Prawo do wniesienia skargi do organu nadzorczego</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Pliki cookies</h2>
            <div className="space-y-4">
              <p>
                Serwis wykorzystuje pliki cookies (ciasteczka) w celu:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Dostosowania zawartości strony do preferencji użytkownika</li>
                <li>Optymalizacji korzystania ze strony internetowej</li>
                <li>Prowadzenia anonimowych statystyk</li>
                <li>Remarkingu i działań marketingowych</li>
              </ul>
              <p>
                Użytkownik może w każdym momencie zmienić ustawienia dotyczące plików cookies w swojej przeglądarce internetowej.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Bezpieczeństwo danych</h2>
            <div className="space-y-4">
              <p>
                Administrator stosuje odpowiednie środki techniczne i organizacyjne w celu zapewnienia bezpieczeństwa przetwarzanych danych osobowych, w szczególności zabezpiecza dane przed:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Dostępem osób nieuprawnionych</li>
                <li>Przypadkowym lub niezgodnym z prawem zniszczeniem lub utratą</li>
                <li>Nieautoryzowanym ujawnieniem, wykorzystaniem lub modyfikacją</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Zmiany w Polityce Prywatności</h2>
            <div className="space-y-4">
              <p>
                Administrator zastrzega sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności. O wszelkich zmianach użytkownicy będą informowani poprzez publikację zaktualizowanej wersji na stronie internetowej.
              </p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kontakt w sprawach ochrony danych</h3>
            <p className="text-gray-700">
              W sprawach dotyczących przetwarzania danych osobowych można kontaktować się z Administratorem:
            </p>
            <ul className="mt-2 space-y-1 text-gray-700">
              <li>Email: dane@falkoproject.com</li>
              <li>Adres korespondencyjny: [Adres siedziby firmy]</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              W przypadku naruszenia przepisów dotyczących ochrony danych osobowych, przysługuje Państwu prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

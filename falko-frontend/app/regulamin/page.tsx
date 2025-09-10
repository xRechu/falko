import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Regulamin - Falko Project',
  description: 'Regulamin sklepu internetowego Falko Project. Warunki zakupów, zwrotów i reklamacji.',
};

export default function RegulaminPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Regulamin sklepu internetowego</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            Ostatnia aktualizacja: 8 lipca 2025
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">§ 1. Postanowienia ogólne</h2>
            <div className="space-y-4">
              <p>
                <strong>1.1.</strong> Niniejszy Regulamin określa zasady funkcjonowania sklepu internetowego dostępnego pod adresem falkoproject.com (zwanego dalej „Sklepem").
              </p>
              <p>
                <strong>1.2.</strong> Właścicielem Sklepu jest Falko Project z siedzibą w Polsce.
              </p>
              <p>
                <strong>1.3.</strong> Regulamin określa warunki zawierania umów sprzedaży między Sprzedawcą a Kupującymi oraz wzajemne prawa i obowiązki stron.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">§ 2. Definicje</h2>
            <div className="space-y-4">
              <p>
                <strong>2.1. Sprzedawca</strong> – Falko Project, prowadzący sprzedaż produktów za pośrednictwem Sklepu internetowego.
              </p>
              <p>
                <strong>2.2. Kupujący</strong> – osoba fizyczna, prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, dokonująca zakupu w Sklepie.
              </p>
              <p>
                <strong>2.3. Konsument</strong> – Kupujący będący osobą fizyczną, dokonujący czynności prawnej niezwiązanej bezpośrednio z jej działalnością gospodarczą lub zawodową.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">§ 3. Składanie zamówień</h2>
            <div className="space-y-4">
              <p>
                <strong>3.1.</strong> Zamówienia można składać przez 24 godziny na dobę za pośrednictwem formularza dostępnego na stronie internetowej Sklepu.
              </p>
              <p>
                <strong>3.2.</strong> Warunkiem złożenia zamówienia jest zaakceptowanie niniejszego Regulaminu oraz Polityki prywatności.
              </p>
              <p>
                <strong>3.3.</strong> Do zawarcia umowy sprzedaży dochodzi z chwilą otrzymania przez Kupującego potwierdzenia przyjęcia zamówienia do realizacji.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">§ 4. Ceny i płatności</h2>
            <div className="space-y-4">
              <p>
                <strong>4.1.</strong> Wszystkie ceny podane w Sklepie są cenami brutto (zawierają podatek VAT).
              </p>
              <p>
                <strong>4.2.</strong> Sprzedawca zastrzega sobie prawo do zmiany cen produktów znajdujących się w ofercie Sklepu.
              </p>
              <p>
                <strong>4.3.</strong> Dostępne formy płatności:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Płatność online (karty płatnicze, BLIK, przelewy online)</li>
                <li>Przelew tradycyjny na konto bankowe</li>
                <li>Płatność za pobraniem (dodatkowa opłata zgodnie z cennikiem operatora)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">§ 5. Dostawa</h2>
            <div className="space-y-4">
              <p>
                <strong>5.1.</strong> Dostawa realizowana jest na terenie Polski.
              </p>
              <p>
                <strong>5.2.</strong> Czas realizacji zamówienia wynosi od 1 do 5 dni roboczych od momentu zaksięgowania płatności.
              </p>
              <p>
                <strong>5.3.</strong> Dostępne formy dostawy:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Kurier DPD/UPS/FedEx</li>
                <li>Paczkomaty InPost</li>
                <li>Poczta Polska</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">§ 6. Prawo odstąpienia od umowy</h2>
            <div className="space-y-4">
              <p>
                <strong>6.1.</strong> Konsument ma prawo odstąpienia od umowy zawartej na odległość w terminie 14 dni bez podania przyczyny.
              </p>
              <p>
                <strong>6.2.</strong> Termin do odstąpienia od umowy wygasa po upływie 14 dni od dnia objęcia produktu w posiadanie przez Konsumenta.
              </p>
              <p>
                <strong>6.3.</strong> Aby skorzystać z prawa odstąpienia od umowy, Konsument musi poinformować Sprzedawcę o swojej decyzji.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">§ 7. Zwroty i reklamacje</h2>
            <div className="space-y-4">
              <p>
                <strong>7.1.</strong> Sprzedawca ponosi odpowiedzialność względem Kupującego za niezgodność towaru z umową.
              </p>
              <p>
                <strong>7.2.</strong> Reklamacje można zgłaszać:
              </p>
              <ul className="list-disc ml-6 space-y-2">
                <li>Pocztą elektroniczną na adres: reklamacje@falkoproject.com</li>
                <li>Pocztą tradycyjną na adres siedziby Sprzedawcy</li>
              </ul>
              <p>
                <strong>7.3.</strong> Sprzedawca ustosunkuje się do reklamacji w terminie 14 dni od jej otrzymania.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">§ 8. Dane osobowe</h2>
            <div className="space-y-4">
              <p>
                <strong>8.1.</strong> Administratorem danych osobowych jest Falko Project.
              </p>
              <p>
                <strong>8.2.</strong> Szczegółowe informacje dotyczące przetwarzania danych osobowych zostały określone w Polityce prywatności.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">§ 9. Postanowienia końcowe</h2>
            <div className="space-y-4">
              <p>
                <strong>9.1.</strong> Niniejszy Regulamin wchodzi w życie z dniem 8 lipca 2025 roku.
              </p>
              <p>
                <strong>9.2.</strong> W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy prawa polskiego.
              </p>
              <p>
                <strong>9.3.</strong> Sprzedawca zastrzega sobie prawo do wprowadzania zmian w Regulaminie. O zmianach Kupujący zostanie poinformowany poprzez publikację nowej wersji Regulaminu na stronie internetowej Sklepu.
              </p>
            </div>
          </section>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Kontakt</h3>
            <p className="text-gray-700">
              W przypadku pytań dotyczących Regulaminu, prosimy o kontakt:
            </p>
            <ul className="mt-2 space-y-1 text-gray-700">
              <li>Email: kontakt@falkoproject.com</li>
              <li>Telefon: +48 123 456 789</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

# anamurray.de — Portfolio

Persönliche Portfolio-Website von **Ana Mercedes Murray Adames**,
Umschulung zur Fachinformatikerin für Anwendungsentwicklung am CBW Hamburg (12/2025–11/2027).

**Live:** https://anamurray.de

## Inhalt

- One-Page-Portfolio: Über mich, Werdegang, Skills, Projekte, Zertifikate, Kontakt
- Dreisprachig: Deutsch, Englisch, Spanisch (Umschaltung im Browser, ohne Neuladen)
- Kontaktformular mit PHP-Backend

## Technik

| Bereich | Umsetzung |
|---|---|
| Frontend | HTML5, CSS (Custom Properties, Mobile-First), Vanilla JavaScript |
| Animation | GSAP + ScrollTrigger, VanillaTilt (lokal eingebunden) |
| Schriften | Playfair Display, Inter, JetBrains Mono (lokal eingebunden, keine Verbindung zu Google) |
| Backend | PHP 8 (`backend/contact.php`) |
| Deployment | statisch oder als WordPress-Theme (`build.py`) |

## Datenschutz & Sicherheit

- Keine Cookies, kein Tracking, keine externen CDNs
- Content-Security-Policy (statische Version)
- Kontaktformular:
  - Herkunftsprüfung (Origin/Referer)
  - Honeypot und Mindest-Ausfüllzeit gegen Bots
  - Rate Limiting ohne Speicherung der IP-Adresse (HMAC mit täglich wechselndem Schlüssel)
  - Schutz gegen Header-Injection, Validierung aller Eingaben
  - keine Fehlerdetails an den Client

## Lokal starten

```bash
python -m http.server 8080
# → http://localhost:8080
```

Das Kontaktformular braucht einen Webserver mit PHP und Mailversand.
Im Repository stehen im Impressum Platzhalter (`{{STRASSE}}`, `{{PLZ_ORT}}`);
die echten Angaben setzt erst `build.py` ein.

## Deployment

```bash
cp private.example.json private.json   # Anschrift eintragen
# Lebenslauf als assets/cv/ana-murray-cv.pdf ablegen
python build.py
```

Ergebnis in `dist/`:

- `anamurray-web.zip` — statische Seite für jeden PHP-Webspace
- `anamurray-wordpress-theme.zip` — dasselbe als Theme (WordPress → Design → Themes → Theme hochladen)

`private.json`, der Lebenslauf und `dist/` sind in `.gitignore` und landen nie im Repository.

## Projektstruktur

```
├── index.html            Seite (alle Abschnitte)
├── style.css             Styles
├── script.js             Animationen, Sprachumschaltung, Formular
├── backend/contact.php   Mail-Handler
├── assets/               Bilder, Schriften, Bibliotheken
├── build.py              erzeugt die Deploy-Pakete
└── private.example.json  Vorlage für private Angaben
```

## Lizenz

© Ana Mercedes Murray Adames. Alle Rechte vorbehalten.

Mitgelieferte Drittsoftware unter eigener Lizenz:
- GSAP (GreenSock Standard License)
- VanillaTilt (MIT)
- Playfair Display, Inter, JetBrains Mono (SIL Open Font License 1.1)

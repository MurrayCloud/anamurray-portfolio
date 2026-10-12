<?php
/**
 * anamurray.de — Kontaktformular
 * DSGVO-konform · Rate Limiting · Spam-Schutz · Header-Injection-Schutz
 */

declare(strict_types=1);

/* ─── Fehlerbehandlung: niemals Details an den Client ─────────────── */
error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store');
header('Referrer-Policy: strict-origin-when-cross-origin');

/* ─── Konfiguration ───────────────────────────────────────────────── */
const RECIPIENT_EMAIL   = 'a.murray2630@gmail.com';
const SENDER_NAME       = 'anamurray.de Kontaktformular';
const SENDER_EMAIL      = 'noreply@anamurray.de';
const ALLOWED_HOSTS     = ['anamurray.de', 'www.anamurray.de'];
const RATE_LIMIT_IP     = 5;    // max. Anfragen pro Absender und Zeitfenster
const RATE_LIMIT_GLOBAL = 30;   // max. Anfragen insgesamt pro Zeitfenster (Schutz des Postfachs)
const RATE_WINDOW       = 3600; // Zeitfenster in Sekunden (1 Stunde)
const MIN_FILL_SECONDS  = 3;    // Bots senden schneller, als ein Mensch tippen kann

/* ─── Helfer ──────────────────────────────────────────────────────── */
function json_response(int $status, bool $success, string $message = ''): void {
    http_response_code($status);
    echo json_encode(['success' => $success, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Text für den Mail-Inhalt: Tags entfernen, Steuerzeichen außer Zeilenumbruch entfernen. */
function clean_text(string $value): string {
    $value = strip_tags(trim($value));
    return preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
}

/** Einzeiliger Wert (Name, Unternehmen): keine Zeilenumbrüche → kein Header-Injection (CWE-93). */
function clean_line(string $value): string {
    return trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', clean_text($value)) ?? '');
}

/** Host aus Origin- bzw. Referer-Header, oder '' wenn keiner vorhanden. */
function request_host(): string {
    $source = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    $host = parse_url($source, PHP_URL_HOST);
    return is_string($host) ? strtolower($host) : '';
}

/**
 * Rate Limiting ohne Cookies und ohne Speicherung der IP-Adresse:
 * Die IP wird mit einem täglich wechselnden Schlüssel gehasht (nicht umkehrbar)
 * und nur für die Dauer des Zeitfensters vorgehalten.
 */
function rate_limit_exceeded(): bool {
    $dir = sys_get_temp_dir() . '/anamurray_rl';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) {
        return false; // Fail-open: Kontakt soll nicht an einem Dateisystemproblem scheitern
    }
    $file = $dir . '/counter.json';
    $fp = @fopen($file, 'c+');
    if ($fp === false) {
        return false;
    }

    flock($fp, LOCK_EX);
    $data = json_decode((string) stream_get_contents($fp), true);
    $data = is_array($data) ? $data : [];

    $now = time();
    $key = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? '', __FILE__ . date('Y-m-d'));

    // Abgelaufene Einträge verwerfen
    foreach ($data as $k => $stamps) {
        $data[$k] = array_values(array_filter((array) $stamps, fn ($t) => $now - (int) $t < RATE_WINDOW));
        if ($data[$k] === []) {
            unset($data[$k]);
        }
    }

    $total = array_sum(array_map('count', $data));
    $mine  = count($data[$key] ?? []);
    $exceeded = $mine >= RATE_LIMIT_IP || $total >= RATE_LIMIT_GLOBAL;

    if (!$exceeded) {
        $data[$key][] = $now;
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, (string) json_encode($data));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    return $exceeded;
}

/* ─── Methode ─────────────────────────────────────────────────────── */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    json_response(405, false, 'Method not allowed.');
}

/* ─── Herkunft (CSRF-Schutz): nur Anfragen von anamurray.de ───────── */
if (!in_array(request_host(), ALLOWED_HOSTS, true)) {
    json_response(403, false, 'Forbidden.');
}

/* ─── Honeypot + Mindest-Ausfüllzeit (Bots) ───────────────────────── */
$startedAt = (int) ($_POST['started_at'] ?? 0);
if (!empty($_POST['website']) || $startedAt === 0 || (time() - intdiv($startedAt, 1000)) < MIN_FILL_SECONDS) {
    json_response(200, true); // still "erfolgreich", damit Bots nichts lernen
}

/* ─── Rate Limiting ───────────────────────────────────────────────── */
if (rate_limit_exceeded()) {
    json_response(429, false, 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
}

/* ─── Eingaben ────────────────────────────────────────────────────── */
$name    = clean_line((string) ($_POST['name'] ?? ''));
$email   = trim((string) ($_POST['email'] ?? ''));
$company = clean_line((string) ($_POST['company'] ?? ''));
$message = clean_text((string) ($_POST['message'] ?? ''));
$privacy = ($_POST['privacy'] ?? '') === 'on';

/* ─── Validierung ─────────────────────────────────────────────────── */
$errors = [];
if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
    $errors[] = 'Name ungültig.';
}
if (strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'E-Mail-Adresse ungültig.';
}
if (mb_strlen($company) > 200) {
    $errors[] = 'Unternehmensname zu lang.';
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
    $errors[] = 'Nachricht muss zwischen 10 und 5000 Zeichen lang sein.';
}
if (!$privacy) {
    $errors[] = 'Datenschutz-Zustimmung fehlt.';
}
if ($errors !== []) {
    json_response(422, false, implode(' ', $errors));
}

/* ─── E-Mail ──────────────────────────────────────────────────────── */
date_default_timezone_set('Europe/Berlin');
$timestamp    = date('d.m.Y H:i');
$company_line = $company !== '' ? "Unternehmen:  {$company}\n" : '';

$subject = mb_encode_mimeheader('Kontaktanfrage über anamurray.de von ' . $name, 'UTF-8', 'Q');

$body = <<<EOT
Neue Kontaktanfrage über anamurray.de

Name:         {$name}
E-Mail:       {$email}
{$company_line}Eingang:      {$timestamp}

Nachricht:

{$message}

--
Datenschutz-Zustimmung erteilt am {$timestamp}. IP-Adresse wurde nicht gespeichert.
EOT;

$headers = implode("\r\n", [
    'From: ' . mb_encode_mimeheader(SENDER_NAME, 'UTF-8', 'Q') . ' <' . SENDER_EMAIL . '>',
    'Reply-To: ' . mb_encode_mimeheader($name, 'UTF-8', 'Q') . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

if (!mail(RECIPIENT_EMAIL, $subject, $body, $headers, '-f' . SENDER_EMAIL)) {
    json_response(500, false, 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
}

json_response(200, true, 'Nachricht erfolgreich gesendet.');

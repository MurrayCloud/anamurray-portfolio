"""
Erzeugt die Deploy-Pakete in dist/:
  - anamurray-web.zip              statische Seite (index.html, assets/, backend/)
  - anamurray-wordpress-theme.zip  dieselbe Seite als WordPress-Theme

Private Daten stehen nicht im Repository:
  - private.json      Anschrift für Impressum/Datenschutz (Vorlage: private.example.json)
  - assets/cv/*.pdf   Lebenslauf
Beide stehen in .gitignore und werden nur beim Bauen eingesetzt.

Aufruf:  python build.py
"""
import json
import re
import shutil
import zipfile
from pathlib import Path

SRC = Path(__file__).resolve().parent
OUT = SRC / "dist"
SLUG = "anamurray-2026"
VER = "2.0.0"
THEME = OUT / SLUG
STATIC = OUT / "static"
COPY_IGNORE = shutil.ignore_patterns("*.md", ".*")

private_file = SRC / "private.json"
if not private_file.exists():
    raise SystemExit("private.json fehlt — private.example.json kopieren und ausfüllen.")
private = json.loads(private_file.read_text(encoding="utf-8"))


def fill_placeholders(text: str) -> str:
    for key, value in private.items():
        text = text.replace("{{" + key + "}}", value)
    missing = re.findall(r"\{\{[A-Z_]+\}\}", text)
    if missing:
        raise SystemExit(f"Platzhalter ohne Wert in private.json: {sorted(set(missing))}")
    return text


def zip_dir(folder: Path, target: Path, prefix: str = "") -> None:
    with zipfile.ZipFile(target, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(folder.rglob("*")):
            if f.is_file():
                z.write(f, prefix + f.relative_to(folder).as_posix())


if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()

if not list((SRC / "assets" / "cv").glob("*.pdf")):
    print("WARNUNG: kein Lebenslauf in assets/cv/ — der CV-Download liefert dann 404.")

html = fill_placeholders((SRC / "index.html").read_text(encoding="utf-8"))

# ─── Statische Seite ─────────────────────────────────────────────────
STATIC.mkdir()
(STATIC / "index.html").write_text(html, encoding="utf-8")
shutil.copy2(SRC / "style.css", STATIC / "style.css")
shutil.copy2(SRC / "script.js", STATIC / "script.js")
shutil.copytree(SRC / "assets", STATIC / "assets", ignore=COPY_IGNORE)
shutil.copytree(SRC / "backend", STATIC / "backend", ignore=COPY_IGNORE)
zip_dir(STATIC, OUT / "anamurray-web.zip")

# ─── WordPress-Theme ─────────────────────────────────────────────────
THEME.mkdir()
URI = "<?php echo esc_url( get_template_directory_uri() ); ?>"

# Pfade auf das Theme-Verzeichnis umbiegen
html = html.replace('href="style.css"', f'href="{URI}/assets/portfolio.css?ver={VER}"')
html = html.replace('src="script.js"', f'src="{URI}/assets/portfolio.js?ver={VER}"')
html = html.replace("https://anamurray.de/assets/", f"{URI}/assets/")
html = html.replace('"assets/', f'"{URI}/assets/')

# CSP-Meta entfällt: WordPress (Admin-Leiste, Plugins) braucht Inline-Skripte
html = re.sub(r'\s*<meta http-equiv="Content-Security-Policy"[^>]*>', "", html)

# Kontaktformular über admin-ajax.php
html = re.sub(
    r'(<form id="contact-form"[^>]*>)',
    r'\1\n            <input type="hidden" name="action" value="anamurray_contact">',
    html,
)
html = html.replace(
    'action="backend/contact.php" method="post"',
    """action="<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>" method="post\"""",
)
assert "admin-ajax.php" in html and 'value="anamurray_contact"' in html

head, rest = html.split("<body", 1)
rest = rest.split(">", 1)[1]  # Rest des <body ...>-Tags
main_open = '<main id="main-content">'
before_main, rest = rest.split(main_open, 1)
main_body, after_main = rest.split("</main>", 1)

head = head.replace("</head>", "  <?php wp_head(); ?>\n</head>")
header_php = (
    head
    + "<body <?php body_class( 'is-loading' ); ?>>\n<?php wp_body_open(); ?>"
    + before_main
    + main_open
    + "\n"
)
after_main = after_main.replace("</body>", "<?php wp_footer(); ?>\n</body>")
footer_php = "  </main>" + after_main

(THEME / "header.php").write_text(header_php, encoding="utf-8")
(THEME / "footer.php").write_text(footer_php, encoding="utf-8")
(THEME / "front-page.php").write_text(
    "<?php\n/** Startseite: das komplette Portfolio. */\ndefined( 'ABSPATH' ) || exit;\nget_header();\n?>"
    + main_body.rstrip()
    + "\n\n<?php get_footer(); ?>\n",
    encoding="utf-8",
)

(THEME / "index.php").write_text(
    """<?php
/**
 * Alle anderen Ansichten (Blog, Archive, Seiten, 404) gibt es nicht:
 * Das Portfolio ist eine One-Page-Website. Weiterleitung zur Startseite.
 */
defined( 'ABSPATH' ) || exit;

if ( is_front_page() ) {
    require __DIR__ . '/front-page.php';
    return;
}
wp_safe_redirect( home_url( '/' ), 301 );
exit;
""",
    encoding="utf-8",
)

(THEME / "style.css").write_text(
    f"""/*
Theme Name:  Ana Murray Portfolio 2026
Theme URI:   https://anamurray.de
Author:      Ana Mercedes Murray Adames
Author URI:  https://anamurray.de
Description: One-Page-Portfolio von Ana Mercedes Murray Adames — Umschulung zur Fachinformatikerin für Anwendungsentwicklung, CBW Hamburg.
Version:     {VER}
Requires at least: 6.0
Requires PHP: 8.0
License:     All Rights Reserved
Text Domain: anamurray
*/

/* Die eigentlichen Styles liegen in assets/portfolio.css */
""",
    encoding="utf-8",
)

(THEME / "functions.php").write_text(
    """<?php
/**
 * Ana Murray Portfolio 2026 — Theme-Funktionen
 * Styles, Skripte und Schriften werden direkt in header.php/footer.php
 * aus dem Theme geladen (keine externen CDNs, keine Google Fonts).
 */

defined( 'ABSPATH' ) || exit;

/* ─── Kontaktformular (admin-ajax.php) ─────────────────────────────── */
function anamurray_handle_contact() {
    // WordPress maskiert $_POST automatisch mit Backslashes — rückgängig machen
    $_POST = wp_unslash( $_POST );
    require __DIR__ . '/backend/contact.php';
    exit;
}
add_action( 'wp_ajax_nopriv_anamurray_contact', 'anamurray_handle_contact' );
add_action( 'wp_ajax_anamurray_contact', 'anamurray_handle_contact' );

/* ─── Unnötiges aus wp_head entfernen ──────────────────────────────── */
remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
remove_action( 'wp_print_styles', 'print_emoji_styles' );
remove_action( 'wp_head', 'wp_generator' );
remove_action( 'wp_head', 'rsd_link' );
remove_action( 'wp_head', 'wlwmanifest_link' );
remove_action( 'wp_head', 'wp_shortlink_wp_head' );
remove_action( 'wp_head', 'rest_output_link_wp_head' );
remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
remove_action( 'wp_head', 'feed_links', 2 );
remove_action( 'wp_head', 'feed_links_extra', 3 );
remove_action( 'wp_head', 'rel_canonical' ); // eigener canonical-Tag in header.php
remove_action( 'template_redirect', 'rest_output_link_header', 11 );
add_filter( 'the_generator', '__return_empty_string' );

function anamurray_dequeue_block_styles() {
    wp_dequeue_style( 'wp-block-library' );
    wp_dequeue_style( 'wp-block-library-theme' );
    wp_dequeue_style( 'classic-theme-styles' );
    wp_dequeue_style( 'global-styles' );
}
add_action( 'wp_enqueue_scripts', 'anamurray_dequeue_block_styles', 100 );

/* ─── Kommentare komplett aus ──────────────────────────────────────── */
add_filter( 'comments_open', '__return_false', 20 );
add_filter( 'pings_open', '__return_false', 20 );
add_action( 'admin_menu', function () {
    remove_menu_page( 'edit-comments.php' );
} );

/* ─── Sicherheit: XML-RPC aus, Benutzernamen nicht über ?author= / REST verraten ─ */
add_filter( 'xmlrpc_enabled', '__return_false' );

add_action( 'template_redirect', function () {
    if ( is_author() ) {
        wp_safe_redirect( home_url( '/' ), 301 );
        exit;
    }
} );

add_filter( 'rest_endpoints', function ( $endpoints ) {
    if ( ! is_user_logged_in() ) {
        unset( $endpoints['/wp/v2/users'], $endpoints['/wp/v2/users/(?P<id>[\\d]+)'] );
    }
    return $endpoints;
} );
""",
    encoding="utf-8",
)

# Assets
assets = THEME / "assets"
shutil.copytree(SRC / "assets", assets, ignore=COPY_IGNORE)
shutil.copy2(SRC / "style.css", assets / "portfolio.css")
shutil.copy2(SRC / "script.js", assets / "portfolio.js")
(THEME / "backend").mkdir()
shutil.copy2(SRC / "backend" / "contact.php", THEME / "backend" / "contact.php")
(THEME / "backend" / "index.php").write_text("<?php // Silence is golden.\n", encoding="utf-8")

zip_dir(THEME, OUT / "anamurray-wordpress-theme.zip", SLUG + "/")

print("Fertig:")
for z in sorted(OUT.glob("*.zip")):
    print(f"  {z.relative_to(SRC)}  ({z.stat().st_size // 1024} KB)")

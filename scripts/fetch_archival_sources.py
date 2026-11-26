import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = "/Users/thiagop/.gemini/antigravity/scratch/nam-y-quan"
OUT_DIR = os.path.join(ROOT, "scripts", "raw", "archival")
os.makedirs(OUT_DIR, exist_ok=True)

USER_AGENT = "NamYQuanEduBot/1.0 (https://localhost; educational traditional medicine project)"

TARGETS = [
    ("sinh_khuong.jpg", "File:Koeh-146-no text.jpg"),
    ("cam_thao.jpg", "File:Glycyrrhiza glabra - Köhler–s Medizinal-Pflanzen-207.jpg"),
    ("que_chi.jpg", "File:Cinnamomum aromaticum - Köhler–s Medizinal-Pflanzen-039 cropped.jpg"),
    ("bac_ha.jpg", "File:Corn mint (Mentha arvensis) Wellcome V0044224.jpg"),
    (
        "kim_ngan_hoa.jpg",
        "File:Naturalis Biodiversity Center - RMNH.ART.664 - Lonicera japonica (Japanese honeysuckle) - Yūshi Ishizaki - Cock Blomhoff Collection - pencil drawing - water colour.jpg",
    ),
    ("lac_tien.jpg", "File:Passiflora foetida var. ciliata.jpg"),
    ("ky_tu.jpg", "File:30 Lycium chinense par Pierre-Joseph Redouté.jpeg"),
    ("dan_sam.jpg", "File:HK sliced herbal 丹参 Salvia miltiorrhiza root October 2025 N13P 02.jpg"),
    ("hoai_son.jpg", "File:Dioscorea batatas GS288.png"),
    ("tam_sen.jpg", "File:Nelumbo nucifera Blanco1.158-cropped.jpg"),
    ("tran_bi.jpg", "File:PRC Xinhui Mandarin orange peels a.jpg"),
    ("co_xuoc.jpg", "File:Achyranthes japonica root.jpg"),
    ("clay_pot.jpg", "File:Ceramic stoneware teapot produced with Yixing clay before 1923 CE Jiangsu Province China.jpg"),
    ("ba_nam_trau.jpg", "File:TONKIN - QUANG YEN - Vieille femme annamite.jpg"),
    ("cau_minh.jpg", "File:Dương Quý Biên, Souverains et notabilités d'Indochine (cropped).png"),
    ("herbalist_shop.jpg", "File:Hong Kong Museum of Medical Sciences, The Herbalist Shop.jpg"),
    ("medicine_cabinet.jpg", "File:Antique Chinese medicine cabinet (16210218551).jpg"),
    ("ancient_meridian.jpg", "File:Acupuncture chart, dumai (Governor Vessel), Chinese Wellcome L0037827.jpg"),
    ("ming_materia.jpg", "File:Chinese Materia Dietetica, Ming; Alcoholic beverages Wellcome L0039398.jpg"),
    ("van_mieu.jpg", "File:Hanoi - Temple of Literature.jpg"),
    ("dong_ho.jpg", "File:Tranh Đông Hồ Ông Táo.jpg"),
]


def resolve_urls():
    titles_param = "|".join(title for _, title in TARGETS)
    api_url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
        {
            "action": "query",
            "titles": titles_param,
            "prop": "imageinfo",
            "iiprop": "url",
            "iiurlwidth": "960",
            "format": "json",
        }
    )
    req = urllib.request.Request(api_url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    pages = data.get("query", {}).get("pages", {})
    url_by_title = {}
    # Also normalize aliases if MediaWiki normalizes spaces/underscores
    normalized = {
        n["from"]: n["to"] for n in data.get("query", {}).get("normalized", [])
    }
    for page in pages.values():
        t = page.get("title")
        infos = page.get("imageinfo", [])
        if t and infos:
            url_by_title[t] = infos[0].get("thumburl") or infos[0].get("url")

    resolved = {}
    for filename, orig_title in TARGETS:
        canon = normalized.get(orig_title, orig_title)
        url = url_by_title.get(canon) or url_by_title.get(orig_title)
        if not url:
            print(f"MISSING URL for {filename} ({orig_title})")
        else:
            resolved[filename] = url
    return resolved


def download_file(url: str, dest: str):
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=25) as resp:
                raw = resp.read()
            if len(raw) < 1024:
                raise RuntimeError(f"Tiny payload ({len(raw)} bytes)")
            with open(dest, "wb") as f:
                f.write(raw)
            return len(raw)
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:
                wait_s = 3 * (attempt + 1)
                print(f"  429 rate-limited, backing off {wait_s}s...")
                time.sleep(wait_s)
                continue
            raise
    raise RuntimeError(f"Failed after retries: {url}")


def main():
    resolved = resolve_urls()
    print(f"Resolved {len(resolved)}/{len(TARGETS)} URLs in single API query.")
    failures = []
    for idx, (filename, _) in enumerate(TARGETS):
        dest = os.path.join(OUT_DIR, filename)
        if os.path.exists(dest) and os.path.getsize(dest) > 5000:
            print(f"[{idx+1}/{len(TARGETS)}] SKIP existing {filename} ({os.path.getsize(dest)}B)")
            continue
        url = resolved.get(filename)
        if not url:
            failures.append(filename)
            continue
        try:
            nbytes = download_file(url, dest)
            print(f"[{idx+1}/{len(TARGETS)}] OK {filename} -> {nbytes} bytes")
        except Exception as exc:
            print(f"[{idx+1}/{len(TARGETS)}] FAIL {filename}: {exc}")
            failures.append(filename)
        time.sleep(1.3)

    if failures:
        print("FAILURES:", failures)
        raise SystemExit(1)
    print("All archival assets downloaded cleanly.")


if __name__ == "__main__":
    main()

#!/usr/bin/env bash
# Notify IndexNow of canonicals of the official, OWNED DÈLGHEM website.
# Does not notify Google or guarantee inclusion in any search results.
set -euo pipefail
cd "$(dirname "$0")/.."
mode='--dry-run'
if [ "$#" -gt 0 ]; then mode="$1"; fi
if [ "$mode" != '--dry-run' ] && [ "$mode" != '--submit' ]; then
 echo 'Usage: notify-indexnow.sh --dry-run|--submit' >&2;exit 2
fi
test -s site-indexnow.key
key="$(tr -d '\r\n ' < site-indexnow.key)"
case "$key" in
 *[!a-zA-Z0-9-]*|'') echo 'Invalid public key' >&2;exit 2;;
esac
test "$key" = "$(tr -d '\r\n ' < "$key.txt")"
location="https://www.delghe.com/$key.txt"
payload="$(mktemp /tmp/delghe-indexnow-body.XXXXXX)"
response="$(mktemp /tmp/delghe-indexnow-response.XXXXXX)"
trap 'rm -f "$payload" "$response"' EXIT

node --input-type=module - "$key" "$location" > "$payload" <<'JS'
import fs from 'node:fs';
const [key,keyLocation]=process.argv.slice(2);
const xml=fs.readFileSync('sitemap.xml','utf8');
const urlList=[...xml.matchAll(/<loc>(https:\/\/www\.delghe\.com\/[^<]*)<\/loc>/g)].map(m=>m[1]);
if(urlList.length===0||urlList.length>10000||new Set(urlList).size!==urlList.length)
 throw Error('Invalid or duplicate sitemap canonical URLs');
if(urlList.some(u=>!u.startsWith('https://www.delghe.com/')))
 throw Error('Refusing URL not owned by DELGHE');
process.stdout.write(JSON.stringify({
 host:'www.delghe.com',key,keyLocation,urlList
}));
JS
count="$(node -e 'console.log(JSON.parse(require("node:fs").readFileSync(process.argv[1],"utf8")).urlList.length)' "$payload")"
if [ "$mode" = '--dry-run' ];then
 echo "INDEXNOW_DRY_RUN site=www.delghe.com urls=$count keyLocation=$location"
 echo 'Submission does not guarantee indexing or search rankings.'
 exit 0
fi
publicKey="$(curl --fail --silent --show-error --location --max-time 15 "$location" | tr -d '\r\n ')"
if [ "$publicKey" != "$key" ];then
 echo 'Public ownership key not served correctly by Pages; refusing POST' >&2;exit 1
fi
result="$(curl --silent --show-error --location --max-time 20 \
 -H 'Content-Type: application/json; charset=utf-8' -X POST \
 --data-binary "@$payload" -o "$response" -w '%{http_code}' \
 'https://api.indexnow.org/indexnow')"
case "$result" in
 200|202) echo "INDEXNOW_SUBMISSION_ACCEPTED HTTP=$result URL_COUNT=$count (not an indexing confirmation)";;
 *) echo "INDEXNOW_NOT_ACCEPTED HTTP=$result RESPONSE=$(head -c 250 "$response")" >&2;exit 1;;
esac

"""Create a portable browser preview from the exact packaged UI assets."""
from pathlib import Path
import re
import hashlib
import base64

root = Path(__file__).resolve().parents[1]
assets = root / 'app/src/main/assets'
html = (assets / 'index.html').read_text()
css = (assets / 'app.css').read_text()
scripts = [(assets / name).read_text() for name in ['core.js', 'app.js']]
digest = lambda value: base64.b64encode(hashlib.sha256(value.encode()).digest()).decode()
policy = "default-src 'none'; script-src " + ' '.join("'sha256-"+digest(s)+"'" for s in scripts)
policy += "; style-src 'sha256-"+digest(css)+"'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'"
html = re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]+>', '<meta http-equiv="Content-Security-Policy" content="'+policy+'">', html)
html = html.replace('<link rel="stylesheet" href="app.css">', '<style>'+css+'</style>')
for name, script in zip(['core.js', 'app.js'], scripts):
    html = html.replace('<script src="'+name+'" defer></script>', '')
    html = html.replace('</body>', '<script>'+script+'</script></body>')
output = root/'preview'/'CENTINELLia_Preview.html'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(html)
print(output)

import urllib.request, json, base64

base = 'http://localhost:8000'

def post(path, body):
    try:
        data = json.dumps(body).encode()
        req = urllib.request.Request(base+path, data=data, headers={'Content-Type':'application/json'})
        r = urllib.request.urlopen(req, timeout=60)
        return json.loads(r.read()), None
    except urllib.request.HTTPError as e:
        return None, f'HTTP {e.code}: {e.read().decode()[:200]}'
    except Exception as e:
        return None, str(e)

# 1-pixel red JPEG
tiny = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AVf/Z'

# IMAGE-SEARCH with tiny image
d, err = post('/image-search', {'image_base64': tiny})
if d is not None:
    print(f'IMAGE-SEARCH tiny: OK - search_type={d.get("search_type")}, results={len(d.get("results",[]))}, caption="{d.get("caption","")}"')
else:
    print(f'IMAGE-SEARCH tiny: FAIL - {err}')

# IMAGE-SEARCH with a real-ish image (solid blue 100x100)
from PIL import Image
import io as _io
img = Image.new('RGB', (100, 100), color=(30, 120, 200))
buf = _io.BytesIO()
img.save(buf, format='JPEG')
b64 = base64.b64encode(buf.getvalue()).decode()

d, err = post('/image-search', {'image_base64': b64})
if d is not None:
    print(f'IMAGE-SEARCH 100x100: OK - search_type={d.get("search_type")}, results={len(d.get("results",[]))}, caption="{d.get("caption","")}"')
else:
    print(f'IMAGE-SEARCH 100x100: FAIL - {err}')

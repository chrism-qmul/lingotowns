import urllib.parse as urlparse
from urllib.parse import urlencode

def update_url_query_string(url, **params):
    url_parts = list(urlparse.urlparse(url))
    query = dict(urlparse.parse_qsl(url_parts[4]))
    query.update({k:v for k, v in params.items() if v}) 
    for k, v in params.items(): 
        if v is None:
            del query[k]

    print(query)
    url_parts[4] = urlencode(query)
    print(url_parts)
    return urlparse.urlunparse(url_parts)

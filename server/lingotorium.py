import requests

def is_document_locked(uuid, document_id):
    try:
        url = f"https://lingotorium.com/api/document/{document_id}?user={uuid}"
        result = requests.get(url, timeout=2).json()
        available = result.get("data", {}).get("available", False)
        return not available
    except Exception:
        return True

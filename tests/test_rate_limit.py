import os
import json
import time
import requests
from dotenv import load_dotenv

# load env 
load_dotenv()

TOKEN_META = os.getenv("TOKEN_META")
ID_BUSSINESS = os.getenv("ID_BUSSINESS")
GRAPH_API_URL = os.getenv("GRAPH_API_URL", "https://graph.facebook.com").rstrip("/")
GRAPH_API_VERSION = os.getenv("GRAPH_API_VERSION", "v27.0").strip("/")

if not TOKEN_META or not ID_BUSSINESS:
    raise ValueError("Faltan TOKEN_META o ID_BUSSINESS en el archivo .env")

# Endpooint and headers
endpoint = f"{GRAPH_API_URL}/{GRAPH_API_VERSION}/{ID_BUSSINESS}/media"
headers = {
    "Authorization": f"Bearer {TOKEN_META}"
}
params = {
    "fields": "id,media_type,media_url,caption,permalink"
}

TOTAL_PETICIONES = 2000

# Use session to TCP and TLS
with requests.Session() as session:
    session.headers.update(headers)

    for i in range(1, TOTAL_PETICIONES + 1):
        try:
            response = session.get(endpoint, params=params, timeout=15)
            
            # Read headers
            buc_header = response.headers.get("x-business-use-case-usage")
            
            if buc_header:
                use_data = json.loads(buc_header)
                
                activo_id = next(iter(use_data))
                metrics = use_data[activo_id][0]
                
                call_count = metrics.get("call_count", 0)
                cpu_time = metrics.get("total_cputime", 0)
                total_time = metrics.get("total_time", 0)
                wait_mins = metrics.get("estimated_time_to_regain_access", 0)

                print(
                    f"[{i:03d}/{TOTAL_PETICIONES}] Status: {response.status_code} | "
                    f"Calls: {call_count}% | CPU: {cpu_time}% | Time: {total_time}% | Espera: {wait_mins}m"
                )

                # If we are close to the limit, wait for the suggested time
                if wait_mins > 0:
                    print(f"Límite alcanzado. Esperando {wait_mins} minuto(s) según Meta...")
                    time.sleep(wait_mins * 60 + 5)
                elif max(call_count, cpu_time, total_time) >= 95:
                    print("Uso crítico (>=95%). Pausando 30 segundos para enfriar ventana...")
                    time.sleep(30)
            else:
                print(f"[{i:03d}/{TOTAL_PETICIONES}] Status: {response.status_code} | Sin cabecera BUC")

            # If had a HTTP error
            if response.status_code != 200:
                print(f"❌ Error en petición {i}: {response.text}")
                if response.status_code == 429:
                    time.sleep(60)

        except requests.RequestException as e:
            print(f"❌ Error de red en petición {i}: {e}")
            time.sleep(5)

print("Proceso de 200 peticiones finalizado.")
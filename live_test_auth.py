import urllib.request
import urllib.error
import json
import random
import time

BASE_URL = "http://localhost:8000/api"

def make_request(url, data):
    req = urllib.request.Request(url, method='POST')
    req.add_header('Content-Type', 'application/json')
    data_bytes = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req, data=data_bytes) as response:
            body = response.read().decode('utf-8')
            try:
                return response.status, json.loads(body)
            except:
                return response.status, body
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except:
            return e.code, body
    except Exception as e:
        return 500, {"detail": str(e)}

def run_live_test():
    print("Iniciando Teste Ao Vivo do Fluxo de Autenticação...\n")
    
    uid = random.randint(1000, 9999)
    email = f"theo.live.{uid}@swift.com.br"
    password = "LivePassword123!"
    
    print(f"1. Tentando criar o perfil com o e-mail: {email}")
    register_data = {
        "name": "Theo Live Test",
        "email": email,
        "company": "Swift Analytics",
        "password": password
    }
    
    status, data = make_request(f"{BASE_URL}/auth/register", register_data)
    if status == 200:
        print(f" ✅ Sucesso! Perfil criado. (Token recebido: {data.get('access_token')[:15]}...)")
    else:
        print(f" ❌ Falha no Cadastro: {status} - {data}")
        return
        
    print("-" * 50)
    time.sleep(1)

    print(f"2. Tentando realizar o Login com o perfil recém-criado...")
    login_data = {
        "email": email,
        "password": password
    }
    
    status, data = make_request(f"{BASE_URL}/auth/login", login_data)
    if status == 200:
        print(f" ✅ Login efetuado com sucesso! Usuário autenticado: {data['user']['name']}")
        print(f" ✅ O fluxo completo de Cadastro -> Login está funcionando perfeitamente.")
    else:
        print(f" ❌ Falha no Login: {status} - {data}")

if __name__ == "__main__":
    run_live_test()

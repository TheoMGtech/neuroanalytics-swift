import httpx
import time

def test():
    # Wait for server to start
    time.sleep(2)
    
    client = httpx.Client(base_url="http://localhost:8000/api")
    
    # 1. Register
    print("Registering user...")
    resp = client.post("/auth/register", json={
        "name": "Teste User",
        "email": "teste@teste.com",
        "password": "123456",
        "company": "Swift"
    })
    
    if resp.status_code not in (200, 201) and "already registered" not in resp.text.lower():
        print("Register failed:", resp.text)
        return
        
    print("Register response:", resp.text)
    
    # 2. Login
    print("Logging in...")
    resp = client.post("/auth/login", json={
        "email": "teste@teste.com",
        "password": "123456"
    })
    
    if resp.status_code != 200:
        print("Login failed:", resp.text)
        return
        
    token = resp.json()["access_token"]
    print("Token:", token)
    
test()

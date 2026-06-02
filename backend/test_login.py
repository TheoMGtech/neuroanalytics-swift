import httpx

def test():
    client = httpx.Client(base_url="http://localhost:8000/api")
    print("Logging in...")
    resp = client.post("/auth/login", json={
        "email": "teste@teste.com",
        "password": "123456"
    })
    
    print("Status:", resp.status_code)
    print("Response:", resp.text)
    
test()

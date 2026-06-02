import httpx
import time

def test():
    client = httpx.Client(base_url="http://localhost:8000/api")
    
    # Login
    print("Logging in...")
    resp = client.post("/auth/login", json={
        "email": "teste@teste.com",
        "password": "123456"
    })
    
    token = resp.json()["access_token"]
    print("Token:", token)
    
    client.headers.update({"Authorization": f"Bearer {token}"})
    
    # Upload test CSV
    with open("test_sample.csv", "w", encoding="utf-8") as f:
        f.write("Loja;Bandeira;Nota\n")
        f.write("Morumbi;Swift;10\n")
        f.write("Pinheiros;Swift;5\n")
        f.write("Paulista;Swift;8\n")
        f.write("Ibirapuera;Swift;9\n")
        
    print("Uploading file...")
    with open("test_sample.csv", "rb") as f:
        resp = client.post("/upload", files={"file": ("test_sample.csv", f, "text/csv")}, data={"save_analysis": "true"})
        
    print("Upload response:", resp.status_code)
    try:
        print(resp.json())
    except:
        print(resp.text)
        
    # Get history
    print("Fetching history...")
    resp = client.get("/history")
    print("History length:", len(resp.json()))

test()

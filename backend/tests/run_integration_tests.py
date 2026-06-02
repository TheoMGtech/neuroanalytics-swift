import httpx
import sys

BASE_URL = "http://localhost:8000/api"

def run_tests():
    print("="*60)
    print("STARTING INTEGRATION AND SECURITY TESTS AGAINST LIVE API")
    print("="*60)
    
    passed_tests = 0
    failed_tests = 0

    def assert_test(name, condition, message=""):
        nonlocal passed_tests, failed_tests
        if condition:
            print(f"[ PASS ] {name}")
            passed_tests += 1
        else:
            print(f"[ FAIL ] {name} - {message}")
            failed_tests += 1

    # ----------------------------------------------------
    # TEST 1: Health Check Endpoint
    # ----------------------------------------------------
    try:
        r = httpx.get(f"{BASE_URL}/health")
        assert_test("Health check endpoint", r.status_code == 200 and r.json().get("status") == "ok", f"Status: {r.status_code}, Response: {r.text}")
    except Exception as e:
        assert_test("Health check endpoint", False, f"Exception: {e}")

    # ----------------------------------------------------
    # TEST 2: Successful Login (Seeded User)
    # ----------------------------------------------------
    token = None
    try:
        payload = {
            "email": "theo@swift.com.br",
            "password": "senha123"
        }
        r = httpx.post(f"{BASE_URL}/auth/login", json=payload)
        is_ok = r.status_code == 200 and "access_token" in r.json()
        if is_ok:
            token = r.json()["access_token"]
        assert_test("Seeded user login", is_ok, f"Status: {r.status_code}, Response: {r.text}")
    except Exception as e:
        assert_test("Seeded user login", False, f"Exception: {e}")

    # ----------------------------------------------------
    # TEST 3: Login with Wrong Password (Security / Auth check)
    # ----------------------------------------------------
    try:
        payload = {
            "email": "theo@swift.com.br",
            "password": "wrongpassword"
        }
        r = httpx.post(f"{BASE_URL}/auth/login", json=payload)
        assert_test("Incorrect password rejection", r.status_code == 401, f"Status: {r.status_code}, Response: {r.text}")
    except Exception as e:
        assert_test("Incorrect password rejection", False, f"Exception: {e}")

    # ----------------------------------------------------
    # TEST 4: SQL Injection Probe on Login (Security check)
    # ----------------------------------------------------
    try:
        payload = {
            "email": "theo@swift.com.br' OR '1'='1",
            "password": "senha123"
        }
        r = httpx.post(f"{BASE_URL}/auth/login", json=payload)
        # Should be rejected with 401 (Not Found/Unauthorized) and NOT crash the server or login
        assert_test("SQL Injection protection (Email)", r.status_code == 401, f"Status: {r.status_code}, Response: {r.text}")
    except Exception as e:
        assert_test("SQL Injection protection (Email)", False, f"Exception: {e}")

    # ----------------------------------------------------
    # TEST 5: SQL Injection on Password Field (Security check)
    # ----------------------------------------------------
    try:
        payload = {
            "email": "theo@swift.com.br",
            "password": "' OR 1=1 --"
        }
        r = httpx.post(f"{BASE_URL}/auth/login", json=payload)
        assert_test("SQL Injection protection (Password)", r.status_code == 401, f"Status: {r.status_code}, Response: {r.text}")
    except Exception as e:
        assert_test("SQL Injection protection (Password)", False, f"Exception: {e}")

    # ----------------------------------------------------
    # TEST 6: Fetching Protected Routes without JWT (Security check)
    # ----------------------------------------------------
    try:
        r = httpx.get(f"{BASE_URL}/history")
        # Should return 401 Unauthorized (since it needs a Bearer Token)
        assert_test("Unauthenticated history fetch rejection", r.status_code in [401, 403], f"Status: {r.status_code}, Response: {r.text}")
    except Exception as e:
        assert_test("Unauthenticated history fetch rejection", False, f"Exception: {e}")

    # ----------------------------------------------------
    # TEST 7: Fetching Protected Routes with Bad JWT (Security check)
    # ----------------------------------------------------
    try:
        headers = {"Authorization": "Bearer fake.jwt.token"}
        r = httpx.get(f"{BASE_URL}/history", headers=headers)
        assert_test("Bad token signature rejection", r.status_code in [401, 403], f"Status: {r.status_code}, Response: {r.text}")
    except Exception as e:
        assert_test("Bad token signature rejection", False, f"Exception: {e}")

    # ----------------------------------------------------
    # TEST 8: Fetching Protected Routes with Valid JWT (Seeded Data Check)
    # ----------------------------------------------------
    if token:
        try:
            headers = {"Authorization": f"Bearer {token}"}
            r = httpx.get(f"{BASE_URL}/history", headers=headers)
            is_ok = r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0
            
            # Let's verify details of the first analysis item if it exists
            if is_ok:
                analysis = r.json()[0]
                has_details = (
                    analysis.get("fileName") == "avaliacoes_maio_2026.csv" and
                    analysis.get("generalNps") == 72.0 and
                    analysis.get("totalReviews") == 5280 and
                    analysis.get("promoters") == 3500 and
                    analysis.get("neutral") == 1100 and
                    analysis.get("detractors") == 680
                )
                assert_test("History fetch with valid JWT & Seed verification", has_details, f"Analysis properties: {analysis}")
            else:
                assert_test("History fetch with valid JWT & Seed verification", False, f"Status: {r.status_code}, Response: {r.text}")
        except Exception as e:
            assert_test("History fetch with valid JWT & Seed verification", False, f"Exception: {e}")
    else:
        print("[ SKIP ] History fetch with valid JWT & Seed verification (No token acquired)")
        failed_tests += 1

    # ----------------------------------------------------
    # TEST 9: CORS Check (Security check)
    # ----------------------------------------------------
    try:
        # Check CORS preflight response
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        }
        r = httpx.options(f"{BASE_URL}/auth/login", headers=headers)
        has_cors = r.status_code == 200 and r.headers.get("access-control-allow-origin") == "http://localhost:3000"
        assert_test("CORS headers validation", has_cors, f"Status: {r.status_code}, Headers: {dict(r.headers)}")
    except Exception as e:
        assert_test("CORS headers validation", False, f"Exception: {e}")

    # ----------------------------------------------------
    # SUMMARY
    # ----------------------------------------------------
    print("="*60)
    print("TEST SUITE RUN COMPLETED")
    print(f"Total Tests Run: {passed_tests + failed_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed / Skipped: {failed_tests}")
    print("="*60)
    
    if failed_tests > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_tests()

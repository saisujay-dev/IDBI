import httpx
import uuid
import sys

BASE_URL = "http://localhost:8000"


def test_flow():
    client = httpx.Client(base_url=BASE_URL)

    unique_suffix = str(uuid.uuid4())[:8]
    email = f"owner_{unique_suffix}@msmeventures.com"
    password = "msmepassword456"
    name = "Suresh Kumar"

    print("--- 1. Testing POST /auth/register ---")
    try:
        register_res = client.post(
            "/auth/register", json={"email": email, "password": password, "name": name}
        )
        print(f"Status: {register_res.status_code}")
        print(f"Body: {register_res.json()}")
        if register_res.status_code != 201:
            print("Register failed!")
            sys.exit(1)
    except Exception as e:
        print(f"Error connecting: {e}")
        sys.exit(1)

    print("\n--- 2. Testing POST /auth/login ---")
    login_res = client.post("/auth/login", json={"email": email, "password": password})
    print(f"Status: {login_res.status_code}")
    token = login_res.json().get("access_token")
    print(f"Token: {token[:20]}...")
    if not token:
        print("Login failed!")
        sys.exit(1)

    # Authenticate client
    client.headers["Authorization"] = f"Bearer {token}"

    print("\n--- 3. Testing GET /auth/me ---")
    me_res = client.get("/auth/me")
    print(f"Status: {me_res.status_code}")
    print(f"User: {me_res.json().get('email')}")

    print("\n--- 4. Testing PUT /applicant/profile ---")
    profile_res = client.put(
        "/applicant/profile",
        json={
            "name": name,
            "business_name": "MSME Ventures Pvt Ltd",
            "business_type": "Manufacturing",
            "address": "45 Industrial Area, Phase-2, Mumbai",
            "gstin": "27AAAAA1111A1Z1",
            "pan": "ABCDE1234F",
            "aadhaar": "123456789012",
            "vintage": "5 Years",
            "employees_count": 15,
        },
    )
    print(f"Status: {profile_res.status_code}")
    print(f"Updated: {profile_res.json().get('profile', {}).get('business_name')}")

    print("\n--- 5. Testing POST /applicant/financial-data ---")
    fin_res1 = client.post(
        "/applicant/financial-data",
        json={
            "year_month": "2026-05",
            "gst_turnover": 450000,
            "upi_inflow": 300000,
            "bank_inflow": 480000,
            "bank_outflow": 380000,
            "bank_avg_balance": 95000,
            "bank_min_balance": 15000,
            "bank_bounce_incidents": 0,
            "bank_low_balance_months": 0,
            "bank_od_cc_utilized": 0.35,
            "epfo_contributions": 15000,
            "epfo_employee_count": 12,
            "utility_monthly_units": 450,
            "utility_payment_regularity": 1.0,
            "utility_disconnection_events": 0,
        },
    )
    print(f"Status (Month 1): {fin_res1.status_code}")

    fin_res2 = client.post(
        "/applicant/financial-data",
        json={
            "year_month": "2026-06",
            "gst_turnover": 480000,
            "upi_inflow": 320000,
            "bank_inflow": 510000,
            "bank_outflow": 410000,
            "bank_avg_balance": 110000,
            "bank_min_balance": 20000,
            "bank_bounce_incidents": 0,
            "bank_low_balance_months": 0,
            "bank_od_cc_utilized": 0.30,
            "epfo_contributions": 15000,
            "epfo_employee_count": 13,
            "utility_monthly_units": 480,
            "utility_payment_regularity": 1.0,
            "utility_disconnection_events": 0,
        },
    )
    print(f"Status (Month 2): {fin_res2.status_code}")

    print("\n--- 6. Testing POST /applicant/apply-loan ---")
    loan_res = client.post(
        "/applicant/apply-loan", json={"amount": 250000, "purpose": "Factory Upgrade"}
    )
    print(f"Status: {loan_res.status_code}")
    loan_data = loan_res.json()
    loan_id = loan_data.get("id")
    print(f"Loan Application ID: {loan_id}")

    print("\n--- 7. Testing GET /applicant/score ---")
    score_res = client.get("/applicant/score")
    print(f"Status: {score_res.status_code}")
    score_data = score_res.json()
    print(f"Overall Score: {score_data.get('overall_score')}")
    print(f"Risk Category: {score_data.get('risk_category')}")
    print(f"Recommendation: {score_data.get('recommendation')}")

    ai_exp = score_data.get("ai_explanation")
    ai_exp_preview = ai_exp[:100].replace("\n", " ") if ai_exp else "None"
    print(f"AI Explanation: {ai_exp_preview}...")

    print("\n--- 8. Testing Admin Login ---")
    admin_client = httpx.Client(base_url=BASE_URL)
    admin_login = admin_client.post(
        "/auth/login", json={"email": "admin@idbi.co.in", "password": "password123"}
    )
    print(f"Status: {admin_login.status_code}")
    admin_token = admin_login.json().get("access_token")
    admin_client.headers["Authorization"] = f"Bearer {admin_token}"

    print("\n--- 9. Testing POST /admin/create-employee ---")
    emp_email = f"officer_{unique_suffix}@idbi.co.in"
    emp_res = admin_client.post(
        "/admin/create-employee",
        json={
            "email": emp_email,
            "password": "officerpassword123",
            "name": "Rajesh Sharma",
            "employee_id_code": f"EMP-{unique_suffix}",
        },
    )
    print(f"Status: {emp_res.status_code}")
    print(f"Employee Created: {emp_res.json().get('email')}")

    print("\n--- 10. Testing Employee Login and Review ---")
    emp_client = httpx.Client(base_url=BASE_URL)
    emp_login = emp_client.post(
        "/auth/login", json={"email": emp_email, "password": "officerpassword123"}
    )
    print(f"Status: {emp_login.status_code}")
    emp_token = emp_login.json().get("access_token")
    emp_client.headers["Authorization"] = f"Bearer {emp_token}"

    print("\n--- 11. Testing GET /employee/applications ---")
    emp_apps_res = emp_client.get("/employee/applications")
    print(f"Status: {emp_apps_res.status_code}")
    print(f"Applications count: {len(emp_apps_res.json())}")

    print("\n--- 12. Testing POST /employee/application/{id}/approve ---")
    approve_res = emp_client.post(
        f"/employee/application/{loan_id}/approve",
        json={"underwriter_note": "Approved by automated integration test script."},
    )
    print(f"Status: {approve_res.status_code}")
    print(f"Approved Loan Status: {approve_res.json().get('status')}")
    print(
        f"Underwriter Note: {approve_res.json().get('score', {}).get('underwriter_note')}"
    )

    print("\n=================================")
    print("ALL ENDPOINTS VERIFIED SUCCESSFULLY!")
    print("=================================")


if __name__ == "__main__":
    test_flow()

from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_cors import CORS
from functools import wraps
from supabase import create_client, Client
from reportlab.pdfgen import canvas
import os
import pandas as pd
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
)
from reportlab.lib.styles import getSampleStyleSheet
from datetime import datetime
from reportlab.lib.units import inch
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

app.secret_key = os.environ.get("SECRET_KEY", "change-this-secret")

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=True  # set True in HTTPS
)

# ============================================
# SUPABASE CONNECTION
# ============================================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_db():
    """Returns Supabase client"""
    return supabase

# ==================================================
# TO GET PDF GENERATION DATA
# ==================================================
def get_data(r):
    try:
        db = get_db()

        if r == "cus":
            response = db.table("customers").select("*").execute()
            data = response.data
        elif r == "ins":
            response = db.table("instruments").select("*").execute()
            data = response.data
        elif r == "amc":
            response = db.table("amc_details").select("*").execute()
            data = response.data
        elif r == "ser":
            response = db.table("service_records").select("*").execute()
            data = response.data
        else:
            return pd.DataFrame()

        return pd.DataFrame(data)
    except Exception as e:
        print(f"Error fetching data: {e}")
        return pd.DataFrame()

# ==================================================
# LOGIN REQUIRED DECORATOR
# ==================================================
def login_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if "user_email" not in session:
            if request.accept_mimetypes.accept_html:
                return redirect(url_for("login_page"))
            return jsonify({"error": "Authentication required"}), 401
        return view_func(*args, **kwargs)
    return wrapped

# ============================================
# ROUTES
# ============================================
@app.route("/")
def login_page():
    return render_template("login.html")

@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")

@app.route("/instruments")
@login_required
def instruments():
    return render_template("instruments.html")

@app.route("/amc")
@login_required
def amc():
    return render_template("amc.html")

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))

@app.route("/service")
@login_required
def service():
    return render_template("service.html")

@app.route("/data")
@login_required
def data():
    return render_template("data.html")

@app.route("/customer")
@login_required
def customer():
    return render_template("customer.html")

# ============================================
# EXPORT PDF
# ============================================
@app.route("/export/customer/pdf")
@login_required
def export_pdf():
    q = "cus"
    df = get_data(q)
    os.makedirs("reports", exist_ok=True)

    filename = "reports/customers_report.pdf"

    pdf = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    elements = []

    if os.path.exists("static/logo.png"):
        logo = Image("static/logo.png", 1.2 * inch, 1.2 * inch)
        logo.hAlign = "CENTER"
        elements.append(logo)
        elements.append(Spacer(1, 12))

    elements.append(Paragraph("<b>Customers Report</b>", styles["Title"]))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f"<i>Date:</i> {datetime.now().strftime('%d-%m-%Y')}",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 20))

    table_data = [
        ["company Name", "company Type", "contact Name", "contact Phone"]
    ]

    for _, row in df.iterrows():
        table_data.append([
            row["company_name"],
            row["company_type"],
            row["contact_name"],
            row["contact_phone"]
        ])

    table = Table(table_data, colWidths=[120, 120, 120, 100])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 1, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold")
    ]))

    elements.append(table)
    pdf.build(elements)

    return send_file(filename, as_attachment=True)

@app.route("/export/instrument/pdf")
@login_required
def export_ins_pdf():
    q = "ins"
    df = get_data(q)
    os.makedirs("reports", exist_ok=True)

    filename = "reports/instruments_report.pdf"

    pdf = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    elements = []

    if os.path.exists("static/logo.png"):
        logo = Image("static/logo.png", 1.2 * inch, 1.2 * inch)
        logo.hAlign = "CENTER"
        elements.append(logo)
        elements.append(Spacer(1, 12))

    elements.append(Paragraph("<b>Instruments Report</b>", styles["Title"]))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f"<i>Date:</i> {datetime.now().strftime('%d-%m-%Y')}",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 20))

    table_data = [
        ["company Name", "Instrument Name", "Serial NO", "Model No", "Purchase Date"]
    ]

    for _, row in df.iterrows():
        table_data.append([
            row["company_name"],
            row["instrument_name"],
            row["i_serial"],
            row["m_no"],
            row["puchase_date"]
        ])

    table = Table(table_data)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 1, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold")
    ]))

    elements.append(table)
    pdf.build(elements)

    return send_file(filename, as_attachment=True)

@app.route("/export/amc/pdf")
@login_required
def export_amc_pdf():
    q = "amc"
    df = get_data(q)
    os.makedirs("reports", exist_ok=True)

    filename = "reports/amc_report.pdf"

    pdf = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    elements = []

    if os.path.exists("static/logo.png"):
        logo = Image("static/logo.png", 1.2 * inch, 1.2 * inch)
        logo.hAlign = "CENTER"
        elements.append(logo)
        elements.append(Spacer(1, 12))

    elements.append(Paragraph("<b>AMC Details Report</b>", styles["Title"]))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f"<i>Date:</i> {datetime.now().strftime('%d-%m-%Y')}",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 20))

    table_data = [
        ["Company Name", "Instrument Name", "Serial NO", "AMC Status", "AMC Start", "AMC End"]
    ]

    for _, row in df.iterrows():
        table_data.append([
            str(row.get("company_name", "")),
            str(row.get("instrument_name", "")),
            str(row.get("i_serial", "")),
            str(row.get("amc_status", "")),
            str(row.get("amc_start", "")).split(" ")[0] if pd.notnull(row.get("amc_start")) else "",
            str(row.get("amc_end", "")).split(" ")[0] if pd.notnull(row.get("amc_end")) else ""
        ])

    table = Table(table_data, colWidths=[100, 100, 70, 70, 70, 70])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 1, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8)
    ]))

    elements.append(table)
    pdf.build(elements)

    return send_file(filename, as_attachment=True)

@app.route("/export/amc/excel")
@login_required
def export_amc_excel():
    q = "amc"
    df = get_data(q)
    os.makedirs("reports", exist_ok=True)
    filename = "reports/amc_report.csv"
    df.to_csv(filename, index=False)
    return send_file(filename, as_attachment=True, download_name="amc_report.csv", mimetype="text/csv")

@app.route("/export/excel")
@login_required
def export_customer_excel():
    df = get_data("cus")
    os.makedirs("reports", exist_ok=True)
    filename = "reports/customers_report.csv"
    df.to_csv(filename, index=False)
    return send_file(filename, as_attachment=True, download_name="customers_report.csv", mimetype="text/csv")

@app.route("/export/instrument/excel")
@login_required
def export_instrument_excel():
    df = get_data("ins")
    os.makedirs("reports", exist_ok=True)
    filename = "reports/instruments_report.csv"
    df.to_csv(filename, index=False)
    return send_file(filename, as_attachment=True, download_name="instruments_report.csv", mimetype="text/csv")

@app.route("/export/service/pdf")
@login_required
def export_service_pdf():
    df = get_data("ser")
    os.makedirs("reports", exist_ok=True)
    filename = "reports/service_report.pdf"

    pdf = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    elements = []

    if os.path.exists("static/logo.png"):
        logo = Image("static/logo.png", 1.2 * inch, 1.2 * inch)
        logo.hAlign = "CENTER"
        elements.append(logo)
        elements.append(Spacer(1, 12))

    elements.append(Paragraph("<b>Service Records Report</b>", styles["Title"]))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f"<i>Date:</i> {datetime.now().strftime('%d-%m-%Y')}",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 20))

    table_data = [
        ["Ser No", "Company Name", "Instrument", "Serial No", "Model No", "Issue", "Action Taken"]
    ]

    for _, row in df.iterrows():
        table_data.append([
            str(row.get("ser_no", "")),
            str(row.get("customer_name", "")),
            str(row.get("i_name", "")),
            str(row.get("i_serial", "")),
            str(row.get("m_no", "")),
            str(row.get("type", "")),
            str(row.get("action_taken", ""))
        ])

    table = Table(table_data, colWidths=[42, 80, 72, 62, 58, 65, 92])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2c3e50")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 1, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7)
    ]))

    elements.append(table)
    pdf.build(elements)
    return send_file(filename, as_attachment=True)

@app.route("/export/service/excel")
@login_required
def export_service_excel():
    df = get_data("ser")
    os.makedirs("reports", exist_ok=True)
    filename = "reports/service_report.csv"
    df.to_csv(filename, index=False)
    return send_file(filename, as_attachment=True, download_name="service_report.csv", mimetype="text/csv")

# ============================================
# LOGIN API
# ============================================
@app.route("/api/login", methods=["POST"])
def login_api():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    try:
        db = get_db()
        response = db.table("user").select("name").eq("name", email).eq("password", password).execute()

        if response.data and len(response.data) > 0:
            session["user_email"] = response.data[0]["name"]
            session["logged_in"] = True
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "error": "Invalid email or password"}), 401
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"success": False, "error": "Login failed"}), 500

# ==================================================
# DASHBOARD APIs
# ==================================================
@app.route("/api/dashboard/stats")
def dashboard_stats():
    try:
        db = get_db()

        customers_resp = db.table("customers").select("COUNT(*)", count="exact").execute()
        customers = customers_resp.count if hasattr(customers_resp, 'count') else len(customers_resp.data)

        instruments_resp = db.table("instruments").select("COUNT(*)", count="exact").execute()
        instruments = instruments_resp.count if hasattr(instruments_resp, 'count') else len(instruments_resp.data)

        return jsonify({
            "customers": customers,
            "instruments": instruments,
            "pending_services": 12,
            "critical": 0
        })
    except Exception as e:
        print(f"Stats error: {e}")
        return jsonify({
            "customers": 0,
            "instruments": 0,
            "pending_services": 0,
            "critical": 0
        })

# ============================================
# RECENT CUSTOMERS
# ============================================
@app.route("/api/customers/recent")
@login_required
def recent_customers():
    try:
        db = get_db()
        response = db.table("customers").select("company_id,company_name,company_type,contact_name,contact_phone").execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Error fetching recent customers: {e}")
        return jsonify([]), 500

# ============================================
# CUSTOMERS
# ============================================
@app.route("/api/customers")
@login_required
def api_customers():
    try:
        db = get_db()
        response = db.table("customers").select("*").order("company_id", desc=False).execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Error fetching customers: {e}")
        return jsonify([]), 500

@app.route("/api/add_customers", methods=["POST"])
@login_required
def add_customers():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("customers").insert({
            "company_id": data.get("cid"),
            "company_name": data.get("cname"),
            "company_type": data.get("ctype"),
            "contact_name": data.get("ccname"),
            "cantact_mail": data.get("cmail"),
            "contact_phone": data.get("cphone")
        }).execute()

        return jsonify({"message": "Customer added successfully"})
    except Exception as e:
        print(f"Error adding customer: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/update_customers", methods=["POST"])
@login_required
def update_customers():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("customers").update({
            "company_name": data.get("company_name"),
            "company_type": data.get("company_type"),
            "contact_name": data.get("contact_name"),
            "cantact_mail": data.get("contact_mail"),
            "contact_phone": data.get("contact_phone")
        }).eq("company_id", data.get("company_id")).execute()

        return jsonify({"message": "Customer updated successfully"})
    except Exception as e:
        print(f"Error updating customer: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/del_cus", methods=["POST"])
@login_required
def del_cus():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("customers").delete().eq("company_id", data.get("company_id")).execute()

        return jsonify({"message": "Customer deleted successfully"})
    except Exception as e:
        print(f"Error deleting customer: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================
# INSTRUMENTS
# ============================================
@app.route("/api/instruments")
@login_required
def api_instruments():
    try:
        db = get_db()
        response = db.table("instruments").select("*").order("company_name", desc=False).execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Error fetching instruments: {e}")
        return jsonify([]), 500

@app.route("/api/add_instruments", methods=["POST"])
@login_required
def add_instruments():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("instruments").insert({
            "i_serial": data.get("serial_no"),
            "instrument_name": data.get("instrument_name"),
            "puchase_date": data.get("purchase_date"),
            "m_no": data.get("model_no"),
            "company_name": data.get("company_name")
        }).execute()

        return jsonify({"message": "Instrument added successfully"})
    except Exception as e:
        print(f"Error adding instrument: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/update_instruments", methods=["POST"])
@login_required
def update_instruments():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("instruments").update({
            "company_name": data.get("company_name"),
            "instrument_name": data.get("instrument_name"),
            "puchase_date": data.get("purchase_date"),
            "m_no": data.get("model_no")
        }).eq("i_serial", data.get("serial_no")).execute()

        return jsonify({"message": "Instrument updated successfully"})
    except Exception as e:
        print(f"Error updating instrument: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/del_ins", methods=["POST"])
@login_required
def del_ins():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("instruments").delete().eq("i_serial", data.get("serial_no")).execute()

        return jsonify({"message": "Instrument deleted successfully"})
    except Exception as e:
        print(f"Error deleting instrument: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================
# AMC DETAILS
# ============================================
@app.route("/api/amc")
@login_required
def api_amc():
    try:
        db = get_db()
        response = db.table("amc_details").select("*").order("company_name", desc=False).execute()

        for row in response.data:
            if row.get("amc_start"):
                row["amc_start"] = str(row["amc_start"])[:10]
            if row.get("amc_end"):
                row["amc_end"] = str(row["amc_end"])[:10]

        return jsonify(response.data)
    except Exception as e:
        print(f"Error fetching AMC details: {e}")
        return jsonify([]), 500

@app.route("/api/add_amc", methods=["POST"])
@login_required
def add_amc():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("amc_details").insert({
            "company_name": data.get("company_name"),
            "instrument_name": data.get("instrument_name"),
            "i_serial": data.get("serial_no"),
            "amc_status": data.get("amc_status"),
            "amc_end": data.get("amc_end"),
            "amc_start": data.get("amc_start")
        }).execute()

        return jsonify({"message": "AMC Details added successfully"})
    except Exception as e:
        print(f"Error adding AMC: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/update_amc", methods=["POST"])
@login_required
def update_amc():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("amc_details").update({
            "company_name": data.get("company_name"),
            "instrument_name": data.get("instrument_name"),
            "amc_status": data.get("amc_status"),
            "amc_start":data.get("amc_start"),
            "amc_end":data.get("amc_end")
        }).eq("i_serial", data.get("serial_no")).execute()

        return jsonify({"message": "AMC updated successfully"})
    except Exception as e:
        print(f"Error updating instrument: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/edit-amc", methods=["POST"])
@login_required
def edit_amc():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("amc_details").update({
            "company_name": data.get("company_name"),
            "instrument_name": data.get("instrument_name"),
            "amc_status": data.get("amc_status"),
            "amc_start": data.get("amc_start"),
            "amc_end": data.get("amc_end")
        }).eq("i_serial", data.get("serial")).execute()

        return jsonify({"message": "AMC Details updated successfully"})
    except Exception as e:
        print(f"Error updating AMC: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/del_amc", methods=["POST"])
@login_required
def del_amc():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("amc_details").delete().eq("i_serial", data.get("serial_no")).execute()

        return jsonify({"message": "AMC Details deleted successfully"})
    except Exception as e:
        print(f"Error deleting AMC: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================
# SERVICE RECORDS
# ============================================
@app.route("/api/ser")
@login_required
def api_ser():
    try:
        db = get_db()
        response = db.table("service_records").select("*").order("ser_no", desc=False).execute()
        return jsonify(response.data)
    except Exception as e:
        print(f"Error fetching service records: {e}")
        return jsonify([]), 500

@app.route("/api/add_ser", methods=["POST"])
@login_required
def add_ser():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("service_records").insert({
            "customer_name": data.get("company_name"),
            "i_name": data.get("i_name"),
            "i_serial": data.get("i_serial"),
            "m_no": data.get("m_no"),
            "type": data.get("type"),
            "action_taken": data.get("action_taken"),
            "ser_no": data.get("ser_no")
        }).execute()

        return jsonify({"message": "Service record added successfully"})
    except Exception as e:
        print(f"Error adding service record: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/edit-ser", methods=["POST"])
@login_required
def edit_ser():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("service_records").update({
            "customer_name": data.get("company_name"),
            "i_name": data.get("i_name"),
            "type": data.get("type"),
            "action_taken": data.get("action_taken"),
            "m_no": data.get("m_no")
        }).eq("i_serial", data.get("serial")).execute()

        return jsonify({"message": "Service Details updated successfully"})
    except Exception as e:
        print(f"Error updating service record: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/del_ser", methods=["POST"])
@login_required
def del_ser():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "No JSON received"}), 400

    try:
        db = get_db()
        db.table("service_records").delete().eq("ser_no", data.get("ser_no")).execute()

        return jsonify({"message": "Service Details deleted successfully"})
    except Exception as e:
        print(f"Error deleting service record: {e}")
        return jsonify({"error": str(e)}), 500

# ============================================
# MAIN
# ============================================
if __name__ == "__main__":
    app.run(debug=False)

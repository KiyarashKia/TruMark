from flask import Flask, request, render_template, redirect, url_for, flash
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
import subprocess
import sys

# ---------------------------
# MongoDB Atlas Connection
# ---------------------------
uri = "mongodb+srv://demo:vgcvugctctucftuf8ffgyuf887876@conqueror.pjqxykq.mongodb.net/?appName=Conqueror"
client = MongoClient(uri, server_api=ServerApi('1'))

try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

# Use your database and collection names
db = client["Backend"]
collection = db["Collection"]

# ---------------------------
# Flask App Setup
# ---------------------------
app = Flask(__name__)
app.secret_key = "secret_key_for_session"  # Needed for session and flashing messages

# Hardcoded user credentials
users = {
    "farmer": {"username": "farmer", "password": "farmerpass"},
    "storage": {"username": "storage", "password": "storagepass"},
    "transporter": {"username": "transporter", "password": "transporterpass"}
}

# Placeholder for blockchain deployment logic
# Replace this with your actual blockchain interaction

def deploy_to_blockchain(data):
    # Call deploy.js using subprocess and capture output
    try:
        result = subprocess.run(
            ['node', '../scripts/deploy.js'],
            capture_output=True, text=True, check=True
        )
        # Parse the contract address from the output
        for line in result.stdout.splitlines():
            if "Contract deployed to:" in line:
                return line.split("Contract deployed to:")[-1].strip()
        # If not found, raise error
        raise Exception("Contract address not found in deploy.js output")
    except Exception as e:
        print(f"Blockchain deployment failed: {e}")
        return None

# ---------------------------
# ROUTES
# ---------------------------

# Login page (renders login.html from the templates folder)
@app.route('/')
def index():
    return render_template("login.html")

# Login form processing
@app.route('/login', methods=['POST'])
def login():
    role = request.form.get("role")
    username = request.form.get("username")
    password = request.form.get("password")
    
    # Validate login using hardcoded credentials
    if role in users and username == users[role]["username"] and password == users[role]["password"]:
        if role == "farmer":
            return redirect(url_for("farmer"))
        elif role == "storage":
            return redirect(url_for("storage"))
        elif role == "transporter":
            return redirect(url_for("transporter"))
    flash("Invalid credentials. Please try again.")
    return redirect(url_for("index"))

# Farmer form page
@app.route('/farmer')
def farmer():
    return render_template("farmer.html")

# Storage form page
@app.route('/storage')
def storage():
    return render_template("storage.html")

# Transporter form page
@app.route('/transporter')
def transporter():
    return render_template("transporter.html")

# Scanner page
@app.route('/scanner')
def scanner():
    return render_template("scanner.html")

# Handle farmer form submission
@app.route('/submit_farmer', methods=['POST'])
def submit_farmer():
    upc = request.form.get("upc")
    lot = request.form.get("lot")
    date_of_production = request.form.get("date_of_production")
    category = request.form.get("category")
    signature = request.form.get("signature")
    
    # Check for duplicate based on UPC and LOT for farmer entries
    if collection.find_one({"role": "farmer", "upc": upc, "lot": lot}):
        flash("Duplicate entry found for this UPC and LOT!")
        return redirect(url_for("farmer"))
    
    # Prepare the data object (without hash)
    data = {
        "role": "farmer",
        "upc": upc,
        "lot": lot,
        "date_of_production": date_of_production,
        "category": category,
        "signature": signature
    }
    # Send to blockchain and get contract address/hash
    contract_hash = deploy_to_blockchain(data)
    # Add hash to the object
    data["hash"] = contract_hash
    # Insert into MongoDB
    collection.insert_one(data)
    flash("Farmer data submitted and stored on blockchain successfully!")
    return redirect(url_for("farmer"))

# Handle storage form submission
@app.route('/submit_storage', methods=['POST'])
def submit_storage():
    upc = request.form.get("upc")
    lot = request.form.get("lot")
    storage_standard = request.form.get("storage_standard")
    date = request.form.get("date")
    signature = request.form.get("signature")
    
    # Check for duplicate based on UPC and LOT for storage entries
    if collection.find_one({"role": "storage", "upc": upc, "lot": lot}):
        flash("Duplicate entry found for this UPC and LOT!")
        return redirect(url_for("storage"))
    
    data = {
        "role": "storage",
        "upc": upc,
        "lot": lot,
        "storage_standard": storage_standard,
        "date": date,
        "signature": signature,
        "hash": ""
    }
    collection.insert_one(data)
    flash("Storage data submitted successfully!")
    return redirect(url_for("storage"))

# Handle transporter form submission
@app.route('/submit_transporter', methods=['POST'])
def submit_transporter():
    upc = request.form.get("upc")
    lot = request.form.get("lot")
    transport_standard = request.form.get("transport_standard")
    date = request.form.get("date")
    signature = request.form.get("signature")
    
    # Check for duplicate based on UPC and LOT for transporter entries
    if collection.find_one({"role": "transporter", "upc": upc, "lot": lot}):
        flash("Duplicate entry found for this UPC and LOT!")
        return redirect(url_for("transporter"))
    
    data = {
        "role": "transporter",
        "upc": upc,
        "lot": lot,
        "transport_standard": transport_standard,
        "date": date,
        "signature": signature,
        "hash": ""
    }
    collection.insert_one(data)
    flash("Transporter data submitted successfully!")
    return redirect(url_for("transporter"))

# Handle scanner form submission
@app.route('/submit_scanner', methods=['POST'])
def submit_scanner():
    upc = request.form.get("upc")
    lot = request.form.get("lot")
    role = request.form.get("role")
    date = request.form.get("date")
    signature = request.form.get("signature")

    # Check for duplicate based on UPC and LOT for scanner entries
    if collection.find_one({"role": role, "upc": upc, "lot": lot}):
        flash("Duplicate entry found for this UPC and LOT!")
        return redirect(url_for("scanner"))

    data = {
        "role": role,
        "upc": upc,
        "lot": lot,
        "date": date,
        "signature": signature,
        "hash": ""  # blank hash field to be updated later
    }
    collection.insert_one(data)
    flash("Scanner data submitted successfully!")
    return redirect(url_for("scanner"))

# ---------------------------
# RUN THE APP
# ---------------------------
if __name__ == '__main__':
    # When running in Jupyter, set use_reloader=False
    app.run(debug=True, use_reloader=False)

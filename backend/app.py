import os
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash

from config import Config
from models import db, jwt, HRUser
from routes import api_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend Vite development server and production
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    db.init_app(app)
    jwt.init_app(app)

    # Register blueprints
    app.register_blueprint(api_bp, url_prefix="/api")

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({
            "status": "healthy",
            "service": "Employee Onboarding API",
            "database": "PostgreSQL"
        }), 200

    # Ensure upload directory exists
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Initialize tables and seed default HR Admin user
    with app.app_context():
        db.create_all()
        # Seed default HR user if none exists
        if not HRUser.query.filter_by(username="admin").first():
            admin = HRUser(
                username="admin",
                email="admin@enterprise-hr.com",
                password_hash=generate_password_hash("Admin@123"),
                full_name="HR Executive Admin",
                role="HR_ADMIN",
                is_active=True
            )
            db.session.add(admin)
            db.session.commit()
            print(">> Created default HR admin: username='admin', password='Admin@123'")

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)


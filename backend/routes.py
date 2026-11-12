import os
import uuid
from datetime import datetime, timedelta
import secrets
from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from models import (
    db, HRUser, EmployeeRegistrationLink, EmployeeSubmission,
    EmployeePersonalDetails, EmployeeEducation, EmployeeEmploymentHistory,
    EmployeeBankDetails, EmployeeStatutoryDetails, EmployeeNominee,
    EmployeeEmergencyContact, EmployeeDocument, EmployeeSubmissionHistory,
    encrypt_sensitive, decrypt_sensitive
)

api_bp = Blueprint("api", __name__)

# Allowed file extensions
ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

# ==========================================
# 1. HR AUTHENTICATION APIS
# ==========================================

@api_bp.route("/hr/login", methods=["POST"])
def hr_login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = HRUser.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid username or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is inactive. Contact Administrator."}), 403

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@api_bp.route("/hr/logout", methods=["POST"])
@jwt_required()
def hr_logout():
    # In stateless JWT, client deletes token or token expires
    return jsonify({"message": "Logout successful"}), 200


@api_bp.route("/hr/me", methods=["GET"])
@jwt_required()
def hr_me():
    user_id = int(get_jwt_identity())
    user = HRUser.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


# ==========================================
# 2. HR REGISTRATION LINK MANAGEMENT
# ==========================================

@api_bp.route("/hr/company-link", methods=["GET"])
@jwt_required()
def get_or_create_company_link():
    """Returns or creates the single shared company-wide onboarding link."""
    user_id = int(get_jwt_identity())
    link = EmployeeRegistrationLink.query.filter_by(is_company_link=True).first()
    if not link:
        token = secrets.token_urlsafe(32)
        link = EmployeeRegistrationLink(
            token=token,
            employee_name="Company-Wide Onboarding",
            employee_email="all-employees@company.internal",
            is_company_link=True,
            status="Active",
            expires_at=None,
            created_by_id=user_id
        )
        db.session.add(link)
        db.session.commit()

    return jsonify({
        "link": link.to_dict(),
        "registration_url": f"/register/{link.token}"
    }), 200


@api_bp.route("/hr/registration-links", methods=["POST"])
@jwt_required()
def create_registration_link():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    is_company = data.get("is_company_link", False)
    employee_email = data.get("employee_email", "").strip() or None
    employee_name = data.get("employee_name", "").strip() or ("Company-Wide Onboarding" if is_company else None)
    
    expiry_days = data.get("expiry_days")
    expires_at = None
    if expiry_days and int(expiry_days) > 0:
        expires_at = datetime.utcnow() + timedelta(days=int(expiry_days))

    token = secrets.token_urlsafe(32)

    link = EmployeeRegistrationLink(
        token=token,
        employee_name=employee_name,
        employee_email=employee_email or "general@company.internal",
        is_company_link=is_company,
        status="Active",
        expires_at=expires_at,
        created_by_id=user_id
    )
    db.session.add(link)
    db.session.flush()

    # Only create a pre-bound submission if it's an individual link
    if not is_company:
        ref_id = "REF-" + secrets.token_hex(4).upper()
        submission = EmployeeSubmission(
            reference_id=ref_id,
            link_id=link.id,
            status="Draft",
            current_step=1
        )
        db.session.add(submission)

        history = EmployeeSubmissionHistory(
            submission=submission,
            action="LINK_GENERATED",
            comment=f"HR generated registration link for {employee_email}",
            performed_by=f"HR-Admin-{user_id}"
        )
        db.session.add(history)

    db.session.commit()

    return jsonify({
        "message": "Registration link generated successfully",
        "link": link.to_dict(),
        "registration_url": f"/register/{token}"
    }), 201


@api_bp.route("/hr/registration-links", methods=["GET"])
@jwt_required()
def list_registration_links():
    links = EmployeeRegistrationLink.query.order_by(EmployeeRegistrationLink.created_at.desc()).all()
    # Check expiry update on fetch
    now = datetime.utcnow()
    results = []
    for l in links:
        if l.status == "Active" and l.expires_at and l.expires_at < now:
            l.status = "Expired"
        results.append(l.to_dict())
    db.session.commit()
    return jsonify({"links": results}), 200


@api_bp.route("/hr/registration-links/<int:link_id>", methods=["GET"])
@jwt_required()
def get_registration_link(link_id):
    link = EmployeeRegistrationLink.query.get_or_404(link_id)
    return jsonify({"link": link.to_dict()}), 200


@api_bp.route("/hr/registration-links/<int:link_id>/revoke", methods=["PATCH"])
@jwt_required()
def revoke_registration_link(link_id):
    link = EmployeeRegistrationLink.query.get_or_404(link_id)
    link.status = "Revoked"
    link.revoked_at = datetime.utcnow()
    db.session.commit()
    return jsonify({"message": "Link successfully revoked", "link": link.to_dict()}), 200


# ==========================================
# 3. HR DASHBOARD OVERVIEW & STATS
# ==========================================

@api_bp.route("/hr/stats", methods=["GET"])
@jwt_required()
def hr_stats():
    total_links = EmployeeRegistrationLink.query.count()
    total_registered = EmployeeSubmission.query.filter(EmployeeSubmission.status != "Draft").count()
    pending = EmployeeSubmission.query.filter(EmployeeSubmission.status.in_(["Submitted", "Under Review", "Correction Required"])).count()
    completed = EmployeeSubmission.query.filter(EmployeeSubmission.status.in_(["Approved", "Rejected"])).count()
    approved = EmployeeSubmission.query.filter_by(status="Approved").count()
    rejected = EmployeeSubmission.query.filter_by(status="Rejected").count()

    return jsonify({
        "total_links": total_links,
        "total_registered": total_registered,
        "pending_submissions": pending,
        "completed_submissions": completed,
        "approved_employees": approved,
        "rejected_submissions": rejected
    }), 200


# ==========================================
# 4. HR EMPLOYEE MANAGEMENT APIS
# ==========================================

@api_bp.route("/hr/employees", methods=["GET"])
@jwt_required()
def list_employees():
    status_filter = request.args.get("status")
    search = request.args.get("search", "").strip().lower()

    query = EmployeeSubmission.query.join(EmployeeRegistrationLink)
    if status_filter and status_filter != "All":
        query = query.filter(EmployeeSubmission.status == status_filter)

    submissions = query.order_by(EmployeeSubmission.updated_at.desc()).all()
    
    result = []
    for s in submissions:
        summary = s.to_summary_dict()
        if search:
            if search not in summary["employee_name"].lower() and search not in summary["email"].lower() and search not in summary["reference_id"].lower():
                continue
        result.append(summary)

    return jsonify({"employees": result}), 200


@api_bp.route("/hr/employees/<int:sub_id>", methods=["GET"])
@jwt_required()
def get_employee_details(sub_id):
    submission = EmployeeSubmission.query.get_or_404(sub_id)

    personal = submission.personal_details.to_dict() if submission.personal_details else {}
    bank = submission.bank_details.to_dict(mask=False) if submission.bank_details else {}
    statutory = submission.statutory_details.to_dict() if submission.statutory_details else {}
    
    education = [e.to_dict() for e in submission.education]
    employment = [emp.to_dict() for emp in submission.employment]
    nominees = [n.to_dict() for n in submission.nominees]
    emergency = [em.to_dict() for em in submission.emergency_contacts]
    documents = [d.to_dict() for d in submission.documents]
    history = [h.to_dict() for h in submission.history]

    return jsonify({
        "submission": submission.to_summary_dict(),
        "link": submission.link.to_dict(),
        "personal": personal,
        "education": education,
        "employment": employment,
        "bank": bank,
        "statutory": statutory,
        "nominees": nominees,
        "emergency_contacts": emergency,
        "documents": documents,
        "history": history
    }), 200


@api_bp.route("/hr/employees/<int:sub_id>/status", methods=["PATCH"])
@jwt_required()
def update_employee_status(sub_id):
    user_id = int(get_jwt_identity())
    hr_user = HRUser.query.get(user_id)
    submission = EmployeeSubmission.query.get_or_404(sub_id)
    
    data = request.get_json() or {}
    new_status = data.get("status")
    comment = data.get("comment", "").strip()

    valid_statuses = ["Draft", "Submitted", "Under Review", "Correction Required", "Approved", "Rejected"]
    if new_status not in valid_statuses:
        return jsonify({"error": "Invalid status"}), 400

    submission.status = new_status
    submission.reviewed_at = datetime.utcnow()
    submission.reviewed_by_id = user_id
    if new_status == "Correction Required":
        submission.hr_correction_comment = comment
        submission.correction_requested_at = datetime.utcnow()

    history = EmployeeSubmissionHistory(
        submission_id=submission.id,
        action=f"STATUS_UPDATED_TO_{new_status.upper().replace(' ', '_')}",
        comment=comment or f"HR updated status to {new_status}",
        performed_by=hr_user.full_name if hr_user else f"HR-{user_id}"
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({
        "message": f"Employee submission status updated to {new_status}",
        "submission": submission.to_summary_dict()
    }), 200


@api_bp.route("/hr/employees/<int:sub_id>/request-correction", methods=["POST"])
@jwt_required()
def request_employee_correction(sub_id):
    user_id = int(get_jwt_identity())
    hr_user = HRUser.query.get(user_id)
    submission = EmployeeSubmission.query.get_or_404(sub_id)
    
    data = request.get_json() or {}
    comment = data.get("comment", "").strip()
    if not comment:
        return jsonify({"error": "Correction remarks/comment are required"}), 400

    submission.status = "Correction Required"
    submission.hr_correction_comment = comment
    submission.correction_requested_at = datetime.utcnow()
    submission.reviewed_by_id = user_id

    # Make link active again for correction update
    if submission.link:
        submission.link.status = "Active"

    history = EmployeeSubmissionHistory(
        submission_id=submission.id,
        action="CORRECTION_REQUESTED",
        comment=comment,
        performed_by=hr_user.full_name if hr_user else f"HR-{user_id}"
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({
        "message": "Correction requested successfully",
        "submission": submission.to_summary_dict()
    }), 200


@api_bp.route("/hr/employees/<int:sub_id>/documents", methods=["GET"])
@jwt_required()
def get_employee_documents(sub_id):
    submission = EmployeeSubmission.query.get_or_404(sub_id)
    docs = [d.to_dict() for d in submission.documents]
    return jsonify({"documents": docs}), 200


@api_bp.route("/hr/documents/<int:doc_id>/download", methods=["GET"])
@jwt_required()
def download_document(doc_id):
    doc = EmployeeDocument.query.get_or_404(doc_id)
    if not os.path.exists(doc.stored_file_path):
        return jsonify({"error": "File not found on storage"}), 404
    return send_file(
        doc.stored_file_path,
        as_attachment=True,
        download_name=doc.file_name,
        mimetype=doc.mime_type
    )


@api_bp.route("/hr/employees/<int:sub_id>/export", methods=["GET"])
@jwt_required()
def export_employee(sub_id):
    submission = EmployeeSubmission.query.get_or_404(sub_id)
    p = submission.personal_details
    b = submission.bank_details
    s = submission.statutory_details

    data = {
        "Reference ID": submission.reference_id,
        "Status": submission.status,
        "Submission Date": submission.submitted_at.isoformat() if submission.submitted_at else "N/A",
        "Full Name": p.full_name if p else "N/A",
        "Email": p.personal_email if p else submission.link.employee_email,
        "Mobile": p.mobile_number if p else "N/A",
        "DOB": p.dob if p else "N/A",
        "Gender": p.gender if p else "N/A",
        "Marital Status": p.marital_status if p else "N/A",
        "Aadhaar Number": p.aadhaar_number if p else "N/A",
        "PAN Number": p.pan_number if p else "N/A",
        "Current Address": p.current_address if p else "N/A",
        "Bank Name": b.bank_name if b else "N/A",
        "Account Holder": b.account_holder_name if b else "N/A",
        "Account Number": b.get_raw_account_number() if b else "N/A",
        "IFSC Code": b.ifsc_code if b else "N/A",
        "Branch": b.branch_name if b else "N/A",
        "UAN": s.uan_number if s else "N/A",
        "PF Account": s.pf_account_number if s else "N/A",
        "ESI": s.esi_number if s else "N/A",
        "Blood Group": s.blood_group if s else "N/A"
    }
    return jsonify(data), 200


# ==========================================
# 5. PUBLIC EMPLOYEE REGISTRATION APIS (BY TOKEN)
# ==========================================

def get_valid_link_and_submission(token, session_id=None):
    link = EmployeeRegistrationLink.query.filter_by(token=token).first()
    if not link:
        return None, None, ("Invalid or unrecognized registration token", 404)

    if link.status == "Revoked":
        return None, None, ("This registration link has been revoked by HR", 403)

    if link.expires_at and link.expires_at < datetime.utcnow():
        link.status = "Expired"
        db.session.commit()
        return None, None, ("This registration link has expired", 410)

    # If it is a company-wide link, multiple employees use it!
    # Each employee gets their own submission identified by session_id/reference_id
    if link.is_company_link:
        submission = None
        if session_id:
            submission = EmployeeSubmission.query.filter_by(reference_id=session_id, link_id=link.id).first()
        
        if not submission:
            ref_id = "REF-" + secrets.token_hex(4).upper()
            submission = EmployeeSubmission(
                reference_id=ref_id,
                link_id=link.id,
                status="Draft",
                current_step=1
            )
            db.session.add(submission)
            history = EmployeeSubmissionHistory(
                submission=submission,
                action="SESSION_STARTED",
                comment="Employee started onboarding session via Company-Wide Link",
                performed_by="EMPLOYEE"
            )
            db.session.add(history)
            db.session.commit()
        return link, submission, None

    # Individual link
    submission = EmployeeSubmission.query.filter_by(link_id=link.id).first()
    if not submission:
        ref_id = "REF-" + secrets.token_hex(4).upper()
        submission = EmployeeSubmission(
            reference_id=ref_id,
            link_id=link.id,
            status="Draft",
            current_step=1
        )
        db.session.add(submission)
        db.session.commit()

    return link, submission, None


@api_bp.route("/employee/register/<token>", methods=["GET"])
def get_registration_state(token):
    session_id = request.args.get("session_id")
    link, submission, err = get_valid_link_and_submission(token, session_id=session_id)
    if err:
        return jsonify({"error": err[0]}), err[1]

    # Pre-fill data
    personal = submission.personal_details.to_dict() if submission.personal_details else {
        "full_name": "" if link.is_company_link else (link.employee_name or ""),
        "personal_email": "" if link.is_company_link else (link.employee_email or ""),
        "mobile_number": ""
    }
    bank = submission.bank_details.to_dict(mask=False) if submission.bank_details else {}
    statutory = submission.statutory_details.to_dict() if submission.statutory_details else {}
    
    education = [e.to_dict() for e in submission.education]
    employment = [emp.to_dict() for emp in submission.employment]
    nominees = [n.to_dict() for n in submission.nominees]
    emergency = [em.to_dict() for em in submission.emergency_contacts]
    documents = [d.to_dict() for d in submission.documents]

    return jsonify({
        "link": link.to_dict(),
        "submission": submission.to_summary_dict(),
        "personal": personal,
        "education": education,
        "employment": employment,
        "bank": bank,
        "statutory": statutory,
        "nominees": nominees,
        "emergency_contacts": emergency,
        "documents": documents
    }), 200


@api_bp.route("/employee/register/<token>/save", methods=["POST"])
def save_registration_step(token):
    session_id = request.args.get("session_id")
    link, submission, err = get_valid_link_and_submission(token, session_id=session_id)
    if err:
        return jsonify({"error": err[0]}), err[1]

    # If already submitted and not in correction state, reject edits
    if submission.status in ["Submitted", "Under Review", "Approved", "Rejected"]:
        return jsonify({"error": f"Submission is in '{submission.status}' status and cannot be edited."}), 400

    data = request.get_json() or {}
    step = data.get("step")

    # Step 1: Personal
    if "personal" in data:
        p_data = data["personal"]
        p = submission.personal_details or EmployeePersonalDetails(submission_id=submission.id)
        p.full_name = p_data.get("full_name", p.full_name or "")
        p.father_name = p_data.get("father_name", p.father_name)
        p.mother_name = p_data.get("mother_name", p.mother_name)
        p.dob = p_data.get("dob", p.dob)
        p.gender = p_data.get("gender", p.gender)
        p.marital_status = p_data.get("marital_status", p.marital_status)
        p.mobile_number = p_data.get("mobile_number", p.mobile_number or "")
        p.alternate_mobile = p_data.get("alternate_mobile", p.alternate_mobile)
        p.personal_email = p_data.get("personal_email", p.personal_email or "")
        p.current_address = p_data.get("current_address", p.current_address)
        p.permanent_address = p_data.get("permanent_address", p.permanent_address)
        p.aadhaar_number = p_data.get("aadhaar_number", p.aadhaar_number)
        p.pan_number = p_data.get("pan_number", p.pan_number)
        db.session.add(p)

    # Step 2: Education (list)
    if "education" in data:
        EmployeeEducation.query.filter_by(submission_id=submission.id).delete()
        for edu in data["education"]:
            if edu.get("qualification") and edu.get("institution_name"):
                e = EmployeeEducation(
                    submission_id=submission.id,
                    qualification=edu.get("qualification"),
                    course_degree=edu.get("course_degree", ""),
                    institution_name=edu.get("institution_name", ""),
                    university_name=edu.get("university_name", ""),
                    year_of_passing=str(edu.get("year_of_passing", "")),
                    percentage_cgpa=str(edu.get("percentage_cgpa", ""))
                )
                db.session.add(e)

    # Step 3: Employment (list)
    if "employment" in data:
        EmployeeEmploymentHistory.query.filter_by(submission_id=submission.id).delete()
        for emp in data["employment"]:
            if emp.get("company_name"):
                eh = EmployeeEmploymentHistory(
                    submission_id=submission.id,
                    company_name=emp.get("company_name"),
                    designation=emp.get("designation", ""),
                    start_date=emp.get("start_date", ""),
                    end_date=emp.get("end_date", ""),
                    total_experience=emp.get("total_experience", ""),
                    company_address=emp.get("company_address", ""),
                    company_contact=emp.get("company_contact", "")
                )
                db.session.add(eh)

    # Step 4: Bank Details
    if "bank" in data:
        b_data = data["bank"]
        if b_data.get("account_number"):
            b = submission.bank_details or EmployeeBankDetails(submission_id=submission.id)
            b.account_holder_name = b_data.get("account_holder_name", "")
            b.bank_name = b_data.get("bank_name", "")
            b.encrypted_account_number = encrypt_sensitive(b_data.get("account_number", ""))
            b.ifsc_code = b_data.get("ifsc_code", "")
            b.branch_name = b_data.get("branch_name", "")
            db.session.add(b)

    # Step 5: Statutory & Nominee & Emergency Contacts
    if "statutory" in data:
        s_data = data["statutory"]
        s = submission.statutory_details or EmployeeStatutoryDetails(submission_id=submission.id)
        s.pan_number = s_data.get("pan_number", s.pan_number)
        s.uan_number = s_data.get("uan_number", s.uan_number)
        s.pf_account_number = s_data.get("pf_account_number", s.pf_account_number)
        s.esi_number = s_data.get("esi_number", s.esi_number)
        s.blood_group = s_data.get("blood_group", s.blood_group)
        s.other_info = s_data.get("other_info", s.other_info)
        db.session.add(s)

    if "nominees" in data:
        EmployeeNominee.query.filter_by(submission_id=submission.id).delete()
        for nom in data["nominees"]:
            if nom.get("nominee_name"):
                n = EmployeeNominee(
                    submission_id=submission.id,
                    nominee_name=nom.get("nominee_name"),
                    relationship=nom.get("relationship", ""),
                    dob=nom.get("dob", ""),
                    share_percentage=str(nom.get("share_percentage", "100"))
                )
                db.session.add(n)

    if "emergency_contacts" in data:
        EmployeeEmergencyContact.query.filter_by(submission_id=submission.id).delete()
        for em in data["emergency_contacts"]:
            if em.get("contact_name") and em.get("phone_number"):
                c = EmployeeEmergencyContact(
                    submission_id=submission.id,
                    contact_name=em.get("contact_name"),
                    relationship=em.get("relationship", ""),
                    phone_number=em.get("phone_number"),
                    address=em.get("address", "")
                )
                db.session.add(c)

    if step:
        submission.current_step = step

    db.session.commit()
    return jsonify({
        "message": "Progress saved successfully",
        "submission": submission.to_summary_dict()
    }), 200


@api_bp.route("/employee/register/<token>/upload", methods=["POST"])
def upload_employee_document(token):
    session_id = request.args.get("session_id")
    link, submission, err = get_valid_link_and_submission(token, session_id=session_id)
    if err:
        return jsonify({"error": err[0]}), err[1]

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    document_type = request.form.get("document_type", "other").strip()

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported file format. Allowed: PDF, JPG, JPEG, PNG"}), 400

    orig_name = secure_filename(file.filename)
    ext = orig_name.rsplit(".", 1)[1].lower() if "." in orig_name else "bin"
    unique_name = f"{submission.reference_id}_{document_type}_{secrets.token_hex(4)}.{ext}"

    upload_folder = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, unique_name)

    file.save(file_path)
    file_size = os.path.getsize(file_path)

    # Check if document_type already exists and replace, or create new
    existing_doc = EmployeeDocument.query.filter_by(
        submission_id=submission.id,
        document_type=document_type
    ).first()

    if existing_doc:
        # Delete old file safely
        if os.path.exists(existing_doc.stored_file_path):
            try:
                os.remove(existing_doc.stored_file_path)
            except Exception:
                pass
        existing_doc.file_name = orig_name
        existing_doc.stored_file_path = file_path
        existing_doc.file_size = file_size
        existing_doc.mime_type = file.mimetype or "application/octet-stream"
        existing_doc.uploaded_at = datetime.utcnow()
        doc_record = existing_doc
    else:
        doc_record = EmployeeDocument(
            submission_id=submission.id,
            document_type=document_type,
            file_name=orig_name,
            stored_file_path=file_path,
            file_size=file_size,
            mime_type=file.mimetype or "application/octet-stream"
        )
        db.session.add(doc_record)

    db.session.commit()
    return jsonify({
        "message": "File uploaded successfully",
        "document": doc_record.to_dict()
    }), 201


@api_bp.route("/employee/register/<token>/submit", methods=["POST"])
def finalize_submission(token):
    session_id = request.args.get("session_id")
    link, submission, err = get_valid_link_and_submission(token, session_id=session_id)
    if err:
        return jsonify({"error": err[0]}), err[1]

    # Validate required components
    if not submission.personal_details or not submission.personal_details.full_name:
        return jsonify({"error": "Personal details are incomplete"}), 400

    is_correction = (submission.status == "Correction Required")
    submission.status = "Submitted"
    submission.submitted_at = datetime.utcnow()
    
    # Only mark link as Submitted if it's an individual one-time link!
    if not link.is_company_link:
        link.status = "Submitted"

    history = EmployeeSubmissionHistory(
        submission_id=submission.id,
        action="RESUBMITTED" if is_correction else "SUBMITTED",
        comment="Employee completed and finalized registration",
        performed_by="EMPLOYEE"
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({
        "message": "Application submitted successfully!",
        "reference_id": submission.reference_id,
        "submission": submission.to_summary_dict()
    }), 200


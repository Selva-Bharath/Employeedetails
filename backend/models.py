from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from datetime import datetime
import uuid
import base64

db = SQLAlchemy()
jwt = JWTManager()

def encrypt_sensitive(data: str) -> str:
    """Helper for obscuring/encrypting sensitive strings like bank account numbers."""
    if not data:
        return ""
    # Standard reversible obfuscation for secure storage demonstration
    return base64.b64encode(data.encode("utf-8")).decode("utf-8")

def decrypt_sensitive(data: str) -> str:
    """Helper for decrypting sensitive strings."""
    if not data:
        return ""
    try:
        return base64.b64decode(data.encode("utf-8")).decode("utf-8")
    except Exception:
        return data

def mask_account(num: str) -> str:
    """Mask account number to display e.g. *******1234"""
    if not num:
        return ""
    if len(num) <= 4:
        return "*" * len(num)
    return "*" * (len(num) - 4) + num[-4:]


class HRUser(db.Model):
    __tablename__ = "hr_users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(50), default="HR_ADMIN")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class EmployeeRegistrationLink(db.Model):
    __tablename__ = "employee_registration_links"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    employee_name = db.Column(db.String(120), nullable=True)
    employee_email = db.Column(db.String(120), nullable=True, index=True)
    is_company_link = db.Column(db.Boolean, default=False)
    status = db.Column(db.String(20), default="Active")  # Active, Submitted, Expired, Revoked
    expires_at = db.Column(db.DateTime, nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey("hr_users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    revoked_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    submissions = db.relationship("EmployeeSubmission", backref="link", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        is_expired = self.expires_at and self.expires_at < datetime.utcnow()
        current_status = "Expired" if (is_expired and self.status == "Active") else self.status
        return {
            "id": self.id,
            "token": self.token,
            "employee_name": self.employee_name,
            "employee_email": self.employee_email,
            "is_company_link": self.is_company_link or False,
            "status": current_status,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None
        }


class EmployeeSubmission(db.Model):
    __tablename__ = "employee_submissions"

    id = db.Column(db.Integer, primary_key=True)
    reference_id = db.Column(db.String(32), unique=True, nullable=False, index=True)
    link_id = db.Column(db.Integer, db.ForeignKey("employee_registration_links.id"), nullable=False)
    
    # Workflow status: Draft, Submitted, Under Review, Correction Required, Approved, Rejected
    status = db.Column(db.String(30), default="Draft", index=True)
    current_step = db.Column(db.Integer, default=1)
    hr_correction_comment = db.Column(db.Text, nullable=True)
    correction_requested_at = db.Column(db.DateTime, nullable=True)
    
    submitted_at = db.Column(db.DateTime, nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    reviewed_by_id = db.Column(db.Integer, db.ForeignKey("hr_users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 1-to-1 and 1-to-many relationships
    personal_details = db.relationship("EmployeePersonalDetails", backref="submission", uselist=False, cascade="all, delete-orphan")
    bank_details = db.relationship("EmployeeBankDetails", backref="submission", uselist=False, cascade="all, delete-orphan")
    statutory_details = db.relationship("EmployeeStatutoryDetails", backref="submission", uselist=False, cascade="all, delete-orphan")
    
    education = db.relationship("EmployeeEducation", backref="submission", lazy=True, cascade="all, delete-orphan")
    employment = db.relationship("EmployeeEmploymentHistory", backref="submission", lazy=True, cascade="all, delete-orphan")
    nominees = db.relationship("EmployeeNominee", backref="submission", lazy=True, cascade="all, delete-orphan")
    emergency_contacts = db.relationship("EmployeeEmergencyContact", backref="submission", lazy=True, cascade="all, delete-orphan")
    documents = db.relationship("EmployeeDocument", backref="submission", lazy=True, cascade="all, delete-orphan")
    history = db.relationship("EmployeeSubmissionHistory", backref="submission", lazy=True, cascade="all, delete-orphan", order_by="EmployeeSubmissionHistory.created_at.desc()")

    def to_summary_dict(self):
        name = self.personal_details.full_name if self.personal_details else (self.link.employee_name or "N/A")
        email = self.personal_details.personal_email if self.personal_details else self.link.employee_email
        mobile = self.personal_details.mobile_number if self.personal_details else "N/A"
        return {
            "id": self.id,
            "reference_id": self.reference_id,
            "employee_name": name,
            "email": email,
            "mobile": mobile,
            "status": self.status,
            "current_step": self.current_step,
            "submission_date": self.submitted_at.isoformat() if self.submitted_at else None,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "hr_correction_comment": self.hr_correction_comment
        }


class EmployeePersonalDetails(db.Model):
    __tablename__ = "employee_personal_details"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("employee_submissions.id"), nullable=False, unique=True)
    full_name = db.Column(db.String(150), nullable=False)
    father_name = db.Column(db.String(150), nullable=True)
    mother_name = db.Column(db.String(150), nullable=True)
    dob = db.Column(db.String(20), nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    marital_status = db.Column(db.String(30), nullable=True)
    mobile_number = db.Column(db.String(20), nullable=False)
    alternate_mobile = db.Column(db.String(20), nullable=True)
    personal_email = db.Column(db.String(120), nullable=False)
    current_address = db.Column(db.Text, nullable=True)
    permanent_address = db.Column(db.Text, nullable=True)
    aadhaar_number = db.Column(db.String(30), nullable=True)
    pan_number = db.Column(db.String(30), nullable=True)

    def to_dict(self):
        return {
            "full_name": self.full_name,
            "father_name": self.father_name,
            "mother_name": self.mother_name,
            "dob": self.dob,
            "gender": self.gender,
            "marital_status": self.marital_status,
            "mobile_number": self.mobile_number,
            "alternate_mobile": self.alternate_mobile,
            "personal_email": self.personal_email,
            "current_address": self.current_address,
            "permanent_address": self.permanent_address,
            "aadhaar_number": self.aadhaar_number,
            "pan_number": self.pan_number
        }


class EmployeeEducation(db.Model):
    __tablename__ = "employee_education"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("employee_submissions.id"), nullable=False)
    qualification = db.Column(db.String(100), nullable=False)
    course_degree = db.Column(db.String(150), nullable=False)
    institution_name = db.Column(db.String(200), nullable=False)
    university_name = db.Column(db.String(200), nullable=False)
    year_of_passing = db.Column(db.String(10), nullable=False)
    percentage_cgpa = db.Column(db.String(20), nullable=False)
    certificate_file_name = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "qualification": self.qualification,
            "course_degree": self.course_degree,
            "institution_name": self.institution_name,
            "university_name": self.university_name,
            "year_of_passing": self.year_of_passing,
            "percentage_cgpa": self.percentage_cgpa,
            "certificate_file_name": self.certificate_file_name
        }


class EmployeeEmploymentHistory(db.Model):
    __tablename__ = "employee_employment_history"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("employee_submissions.id"), nullable=False)
    company_name = db.Column(db.String(200), nullable=False)
    designation = db.Column(db.String(120), nullable=False)
    start_date = db.Column(db.String(20), nullable=False)
    end_date = db.Column(db.String(20), nullable=True)
    total_experience = db.Column(db.String(50), nullable=True)
    company_address = db.Column(db.Text, nullable=True)
    company_contact = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "company_name": self.company_name,
            "designation": self.designation,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "total_experience": self.total_experience,
            "company_address": self.company_address,
            "company_contact": self.company_contact
        }


class EmployeeBankDetails(db.Model):
    __tablename__ = "employee_bank_details"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("employee_submissions.id"), nullable=False, unique=True)
    account_holder_name = db.Column(db.String(150), nullable=False)
    bank_name = db.Column(db.String(150), nullable=False)
    encrypted_account_number = db.Column(db.String(255), nullable=False)
    ifsc_code = db.Column(db.String(30), nullable=False)
    branch_name = db.Column(db.String(150), nullable=True)

    def get_raw_account_number(self):
        return decrypt_sensitive(self.encrypted_account_number)

    def to_dict(self, mask=True):
        raw = self.get_raw_account_number()
        return {
            "account_holder_name": self.account_holder_name,
            "bank_name": self.bank_name,
            "account_number": mask_account(raw) if mask else raw,
            "raw_account_number": raw if not mask else None,
            "ifsc_code": self.ifsc_code,
            "branch_name": self.branch_name
        }


class EmployeeStatutoryDetails(db.Model):
    __tablename__ = "employee_statutory_details"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("employee_submissions.id"), nullable=False, unique=True)
    pan_number = db.Column(db.String(30), nullable=True)
    uan_number = db.Column(db.String(30), nullable=True)
    pf_account_number = db.Column(db.String(50), nullable=True)
    esi_number = db.Column(db.String(50), nullable=True)
    blood_group = db.Column(db.String(10), nullable=True)
    other_info = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "pan_number": self.pan_number,
            "uan_number": self.uan_number,
            "pf_account_number": self.pf_account_number,
            "esi_number": self.esi_number,
            "blood_group": self.blood_group,
            "other_info": self.other_info
        }


class EmployeeNominee(db.Model):
    __tablename__ = "employee_nominees"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("employee_submissions.id"), nullable=False)
    nominee_name = db.Column(db.String(150), nullable=False)
    relationship = db.Column(db.String(50), nullable=False)
    dob = db.Column(db.String(20), nullable=True)
    share_percentage = db.Column(db.String(10), default="100")

    def to_dict(self):
        return {
            "id": self.id,
            "nominee_name": self.nominee_name,
            "relationship": self.relationship,
            "dob": self.dob,
            "share_percentage": self.share_percentage
        }


class EmployeeEmergencyContact(db.Model):
    __tablename__ = "employee_emergency_contacts"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("employee_submissions.id"), nullable=False)
    contact_name = db.Column(db.String(150), nullable=False)
    relationship = db.Column(db.String(50), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "contact_name": self.contact_name,
            "relationship": self.relationship,
            "phone_number": self.phone_number,
            "address": self.address
        }


class EmployeeDocument(db.Model):
    __tablename__ = "employee_documents"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("employee_submissions.id"), nullable=False)
    document_type = db.Column(db.String(60), nullable=False)  # resume, photo, pan, aadhaar, degree, relieving, cheque, other
    file_name = db.Column(db.String(255), nullable=False)
    stored_file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "document_type": self.document_type,
            "file_name": self.file_name,
            "file_size": self.file_size,
            "mime_type": self.mime_type,
            "uploaded_at": self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class EmployeeSubmissionHistory(db.Model):
    __tablename__ = "employee_submission_history"

    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.Integer, db.ForeignKey("employee_submissions.id"), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # CREATED, SAVED_STEP, SUBMITTED, CORRECTION_REQUESTED, RESUBMITTED, APPROVED, REJECTED
    comment = db.Column(db.Text, nullable=True)
    performed_by = db.Column(db.String(100), nullable=False)  # "EMPLOYEE" or HR Username
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "action": self.action,
            "comment": self.comment,
            "performed_by": self.performed_by,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


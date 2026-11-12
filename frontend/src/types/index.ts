export interface HRUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface RegistrationLink {
  id: number;
  token: string;
  employee_name: string | null;
  employee_email: string;
  is_company_link?: boolean;
  status: 'Active' | 'Submitted' | 'Expired' | 'Revoked';
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface EmployeeSummary {
  id: number;
  reference_id: string;
  employee_name: string;
  email: string;
  mobile: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Correction Required' | 'Approved' | 'Rejected';
  current_step: number;
  submission_date: string | null;
  reviewed_at: string | null;
  created_at: string;
  hr_correction_comment: string | null;
}

export interface PersonalDetails {
  full_name: string;
  father_name?: string;
  mother_name?: string;
  dob?: string;
  gender?: string;
  marital_status?: string;
  mobile_number: string;
  alternate_mobile?: string;
  personal_email: string;
  current_address?: string;
  permanent_address?: string;
  aadhaar_number?: string;
  pan_number?: string;
}

export interface EducationDetail {
  id?: number;
  qualification: string;
  course_degree: string;
  institution_name: string;
  university_name: string;
  year_of_passing: string;
  percentage_cgpa: string;
  certificate_file_name?: string;
}

export interface EmploymentDetail {
  id?: number;
  company_name: string;
  designation: string;
  start_date: string;
  end_date?: string;
  total_experience?: string;
  company_address?: string;
  company_contact?: string;
}

export interface BankDetails {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  raw_account_number?: string;
  ifsc_code: string;
  branch_name?: string;
}

export interface StatutoryDetails {
  pan_number?: string;
  uan_number?: string;
  pf_account_number?: string;
  esi_number?: string;
  blood_group?: string;
  other_info?: string;
}

export interface NomineeDetail {
  id?: number;
  nominee_name: string;
  relationship: string;
  dob?: string;
  share_percentage: string;
}

export interface EmergencyContactDetail {
  id?: number;
  contact_name: string;
  relationship: string;
  phone_number: string;
  address?: string;
}

export interface DocumentItem {
  id: number;
  document_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface SubmissionHistoryItem {
  id: number;
  action: string;
  comment?: string;
  performed_by: string;
  created_at: string;
}

export interface EmployeeFullProfile {
  submission: EmployeeSummary;
  link: RegistrationLink;
  personal: PersonalDetails;
  education: EducationDetail[];
  employment: EmploymentDetail[];
  bank: BankDetails;
  statutory: StatutoryDetails;
  nominees: NomineeDetail[];
  emergency_contacts: EmergencyContactDetail[];
  documents: DocumentItem[];
  history: SubmissionHistoryItem[];
}


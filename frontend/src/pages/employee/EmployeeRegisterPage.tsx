import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, 
  GraduationCap, 
  Briefcase, 
  CreditCard, 
  Shield, 
  FileCheck2, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Upload, 
  Check, 
  AlertCircle,
  Building2,
  Lock
} from 'lucide-react';
import api from '../../services/api';

export const EmployeeRegisterPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkData, setLinkData] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [saveLoading, setSaveLoading] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  // Step 1: Personal Details
  const [personal, setPersonal] = useState({
    full_name: '',
    father_name: '',
    mother_name: '',
    dob: '',
    gender: 'Male',
    marital_status: 'Single',
    mobile_number: '',
    alternate_mobile: '',
    personal_email: '',
    current_address: '',
    permanent_address: '',
    aadhaar_number: '',
    pan_number: ''
  });

  // Step 2: Education (array)
  const [education, setEducation] = useState<any[]>([
    { qualification: 'Graduation', course_degree: 'B.Tech / B.E.', institution_name: '', university_name: '', year_of_passing: '', percentage_cgpa: '' }
  ]);

  // Step 3: Employment (array)
  const [employment, setEmployment] = useState<any[]>([
    { company_name: '', designation: '', start_date: '', end_date: '', total_experience: '', company_address: '', company_contact: '' }
  ]);

  // Step 4: Bank Details
  const [bank, setBank] = useState({
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    confirm_account_number: '',
    ifsc_code: '',
    branch_name: ''
  });

  // Step 5: Statutory & Nominees & Emergency
  const [statutory, setStatutory] = useState({
    pan_number: '',
    uan_number: '',
    pf_account_number: '',
    esi_number: '',
    blood_group: 'O+',
    other_info: ''
  });

  const [nominees, setNominees] = useState<any[]>([
    { nominee_name: '', relationship: 'Father', dob: '', share_percentage: '100' }
  ]);

  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([
    { contact_name: '', relationship: 'Family', phone_number: '', address: '' }
  ]);

  // Step 6: Documents
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);

  // Step 7: Declaration
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // Fetch initial token state
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setLoading(true);
        // If there's an existing draft in localStorage for this token, pass its session_id
        const existingSessionId = localStorage.getItem(`onboard_session_${token}`);
        const res = await api.get(`/employee/register/${token}`, {
          params: existingSessionId ? { session_id: existingSessionId } : {}
        });

        setLinkData(res.data.link);
        setSubmission(res.data.submission);

        if (res.data.submission?.reference_id) {
          localStorage.setItem(`onboard_session_${token}`, res.data.submission.reference_id);
        }

        if (res.data.submission?.status === 'Submitted' || res.data.submission?.status === 'Approved') {
          setSubmittedSuccess(true);
          setReferenceId(res.data.submission.reference_id);
          return;
        }

        if (res.data.personal && Object.keys(res.data.personal).length > 0) {
          setPersonal((prev) => ({ ...prev, ...res.data.personal }));
        }
        if (res.data.education && res.data.education.length > 0) {
          setEducation(res.data.education);
        }
        if (res.data.employment && res.data.employment.length > 0) {
          setEmployment(res.data.employment);
        }
        if (res.data.bank && res.data.bank.account_number) {
          setBank((prev) => ({
            ...prev,
            ...res.data.bank,
            confirm_account_number: res.data.bank.account_number
          }));
        }
        if (res.data.statutory && Object.keys(res.data.statutory).length > 0) {
          setStatutory((prev) => ({ ...prev, ...res.data.statutory }));
        }
        if (res.data.nominees && res.data.nominees.length > 0) {
          setNominees(res.data.nominees);
        }
        if (res.data.emergency_contacts && res.data.emergency_contacts.length > 0) {
          setEmergencyContacts(res.data.emergency_contacts);
        }
        if (res.data.documents) {
          setUploadedDocs(res.data.documents);
        }

        if (res.data.submission?.current_step) {
          setCurrentStep(res.data.submission.current_step);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Unable to access registration form. The link may be expired or invalid.');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [token]);

  // Save current step progress to backend
  const saveProgress = async (stepNum: number) => {
    setSaveLoading(true);
    try {
      const sessionId = localStorage.getItem(`onboard_session_${token}`);
      await api.post(`/employee/register/${token}/save`, {
        step: stepNum,
        personal,
        education,
        employment,
        bank,
        statutory,
        nominees,
        emergency_contacts: emergencyContacts
      }, {
        params: sessionId ? { session_id: sessionId } : {}
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleNextStep = async () => {
    // Basic validation
    if (currentStep === 1) {
      if (!personal.full_name || !personal.mobile_number || !personal.personal_email) {
        alert('Please fill in your Full Name, Mobile Number, and Email.');
        return;
      }
    } else if (currentStep === 4) {
      if (bank.account_number && bank.account_number !== bank.confirm_account_number) {
        alert('Bank Account Number and Confirmation do not match.');
        return;
      }
    }

    await saveProgress(currentStep + 1);
    setCurrentStep((prev) => Math.min(prev + 1, 7));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 16 * 1024 * 1024) {
      alert('File size exceeds 16MB maximum.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);

    setUploadingType(docType);
    try {
      const sessionId = localStorage.getItem(`onboard_session_${token}`);
      const res = await api.post(`/employee/register/${token}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: sessionId ? { session_id: sessionId } : {}
      });
      // Replace or add in uploadedDocs
      setUploadedDocs((prev) => {
        const filtered = prev.filter((d) => d.document_type !== docType);
        return [...filtered, res.data.document];
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Document upload failed.');
    } finally {
      setUploadingType(null);
    }
  };

  const handleFinalSubmit = async () => {
    if (!declarationChecked) {
      alert('Please check the confirmation declaration box before submitting.');
      return;
    }

    setSaveLoading(true);
    try {
      // First save all state
      await saveProgress(7);
      // Finalize submission
      const sessionId = localStorage.getItem(`onboard_session_${token}`);
      const res = await api.post(`/employee/register/${token}/submit`, {}, {
        params: sessionId ? { session_id: sessionId } : {}
      });
      setReferenceId(res.data.reference_id);
      setSubmittedSuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setSaveLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Personal', icon: User },
    { num: 2, label: 'Education', icon: GraduationCap },
    { num: 3, label: 'Employment', icon: Briefcase },
    { num: 4, label: 'Bank Details', icon: CreditCard },
    { num: 5, label: 'Statutory', icon: Shield },
    { num: 6, label: 'Documents', icon: FileCheck2 },
    { num: 7, label: 'Declaration', icon: CheckCircle2 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-neutral-400">Verifying security token...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Access Restrict / Invalid Link</h2>
          <p className="text-xs text-neutral-400 leading-relaxed mb-6">{error}</p>
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-500 text-[11px]">
            If you believe this is in error, please contact your HR Onboarding Coordinator.
          </div>
        </div>
      </div>
    );
  }

  // Submission Completed Confirmation Screen
  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-neutral-400 text-xs leading-relaxed mb-6">
            Thank you! Your employee onboarding profile and verification documents have been received by HR for review.
          </p>

          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 mb-6">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider block mb-1">Your Submission Reference ID</span>
            <span className="font-mono text-xl font-bold text-white">{referenceId || submission?.reference_id}</span>
          </div>

          <p className="text-xs text-neutral-500">
            For data security, this onboarding form is now locked. Should HR require any corrections, you will receive an updated notification.
          </p>
        </div>
      </div>
    );
  }

  const isCorrection = submission?.status === 'Correction Required';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Employee Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-black font-black rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-black" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Employee Onboarding Portal</h1>
              <p className="text-[10px] text-neutral-400 font-mono">Secure Token Session</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </header>

      {/* Main Form Body */}
      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex-1">
        {/* Correction Notice Banner if active */}
        {isCorrection && submission?.hr_correction_comment && (
          <div className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>HR Correction Requested:</span>
            </div>
            <p className="text-neutral-300 ml-6">{submission.hr_correction_comment}</p>
          </div>
        )}

        {/* Step Progress Bar */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex items-center justify-between min-w-[650px] relative">
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-neutral-800 -z-0" />
            {stepsList.map((st) => {
              const Icon = st.icon;
              const isPast = st.num < currentStep;
              const isCurrent = st.num === currentStep;
              return (
                <div key={st.num} className="flex flex-col items-center relative z-10">
                  <button
                    onClick={() => setCurrentStep(st.num)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                      isCurrent
                        ? 'bg-white text-black ring-4 ring-neutral-800'
                        : isPast
                        ? 'bg-neutral-700 text-white'
                        : 'bg-neutral-900 border border-neutral-700 text-neutral-500'
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4 text-emerald-400" /> : st.num}
                  </button>
                  <span className={`text-[11px] mt-1.5 font-medium ${isCurrent ? 'text-white' : 'text-neutral-400'}`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Step 1: Personal Information</h2>
                <p className="text-xs text-neutral-400 mt-1">Please provide accurate personal and contact details.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={personal.full_name}
                    onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Personal Email Address *</label>
                  <input
                    type="email"
                    required
                    value={personal.personal_email}
                    onChange={(e) => setPersonal({ ...personal, personal_email: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={personal.mobile_number}
                    onChange={(e) => setPersonal({ ...personal, mobile_number: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Alternate Mobile Number</label>
                  <input
                    type="tel"
                    value={personal.alternate_mobile}
                    onChange={(e) => setPersonal({ ...personal, alternate_mobile: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={personal.dob}
                    onChange={(e) => setPersonal({ ...personal, dob: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Gender</label>
                  <select
                    value={personal.gender}
                    onChange={(e) => setPersonal({ ...personal, gender: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Marital Status</label>
                  <select
                    value={personal.marital_status}
                    onChange={(e) => setPersonal({ ...personal, marital_status: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={personal.father_name}
                    onChange={(e) => setPersonal({ ...personal, father_name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    value={personal.mother_name}
                    onChange={(e) => setPersonal({ ...personal, mother_name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">PAN Card Number</label>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    value={personal.pan_number}
                    onChange={(e) => setPersonal({ ...personal, pan_number: e.target.value.toUpperCase() })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white uppercase focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Aadhaar Card Number</label>
                  <input
                    type="text"
                    placeholder="12-digit UID"
                    value={personal.aadhaar_number}
                    onChange={(e) => setPersonal({ ...personal, aadhaar_number: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-4 border-t border-neutral-800">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Current Residential Address</label>
                  <textarea
                    rows={3}
                    value={personal.current_address}
                    onChange={(e) => setPersonal({ ...personal, current_address: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Permanent Address</label>
                  <textarea
                    rows={3}
                    value={personal.permanent_address}
                    onChange={(e) => setPersonal({ ...personal, permanent_address: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Educational Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Step 2: Educational Details</h2>
                  <p className="text-xs text-neutral-400 mt-1">Add your degrees, certifications, or qualifications.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEducation([...education, { qualification: '', course_degree: '', institution_name: '', university_name: '', year_of_passing: '', percentage_cgpa: '' }])}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Qualification</span>
                </button>
              </div>

              <div className="space-y-4">
                {education.map((edu, idx) => (
                  <div key={idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl relative text-xs space-y-3">
                    {education.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEducation(education.filter((_, i) => i !== idx))}
                        className="absolute top-3 right-3 text-neutral-500 hover:text-red-400"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Level / Qualification</label>
                        <input
                          type="text"
                          placeholder="e.g. 10th / 12th / Bachelors / Masters"
                          value={edu.qualification}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].qualification = e.target.value;
                            setEducation(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Course / Degree</label>
                        <input
                          type="text"
                          placeholder="e.g. B.Tech Computer Science"
                          value={edu.course_degree}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].course_degree = e.target.value;
                            setEducation(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Institution / School Name</label>
                        <input
                          type="text"
                          placeholder="College name"
                          value={edu.institution_name}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].institution_name = e.target.value;
                            setEducation(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">University / Board</label>
                        <input
                          type="text"
                          placeholder="e.g. State University"
                          value={edu.university_name}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].university_name = e.target.value;
                            setEducation(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Year of Passing</label>
                        <input
                          type="text"
                          placeholder="e.g. 2023"
                          value={edu.year_of_passing}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].year_of_passing = e.target.value;
                            setEducation(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Percentage / CGPA</label>
                        <input
                          type="text"
                          placeholder="e.g. 8.5 CGPA or 85%"
                          value={edu.percentage_cgpa}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[idx].percentage_cgpa = e.target.value;
                            setEducation(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Employment Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Step 3: Employment Details</h2>
                  <p className="text-xs text-neutral-400 mt-1">Previous experience history. Leave blank if Fresher.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmployment([...employment, { company_name: '', designation: '', start_date: '', end_date: '', total_experience: '', company_address: '', company_contact: '' }])}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Company</span>
                </button>
              </div>

              <div className="space-y-4">
                {employment.map((emp, idx) => (
                  <div key={idx} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl relative text-xs space-y-3">
                    {employment.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEmployment(employment.filter((_, i) => i !== idx))}
                        className="absolute top-3 right-3 text-neutral-500 hover:text-red-400"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Company Name</label>
                        <input
                          type="text"
                          placeholder="Acme Corp"
                          value={emp.company_name}
                          onChange={(e) => {
                            const updated = [...employment];
                            updated[idx].company_name = e.target.value;
                            setEmployment(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Designation / Role</label>
                        <input
                          type="text"
                          placeholder="Software Engineer"
                          value={emp.designation}
                          onChange={(e) => {
                            const updated = [...employment];
                            updated[idx].designation = e.target.value;
                            setEmployment(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Total Experience (e.g. 2 Years)</label>
                        <input
                          type="text"
                          placeholder="2 Years 6 Months"
                          value={emp.total_experience}
                          onChange={(e) => {
                            const updated = [...employment];
                            updated[idx].total_experience = e.target.value;
                            setEmployment(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={emp.start_date}
                          onChange={(e) => {
                            const updated = [...employment];
                            updated[idx].start_date = e.target.value;
                            setEmployment(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">End Date</label>
                        <input
                          type="date"
                          value={emp.end_date}
                          onChange={(e) => {
                            const updated = [...employment];
                            updated[idx].end_date = e.target.value;
                            setEmployment(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-neutral-300 mb-1">HR / Reference Contact</label>
                        <input
                          type="text"
                          placeholder="Phone or email"
                          value={emp.company_contact}
                          onChange={(e) => {
                            const updated = [...employment];
                            updated[idx].company_contact = e.target.value;
                            setEmployment(updated);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Bank Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Step 4: Bank Details (Salary Payroll)</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Bank accounts are encrypted at rest and will be used solely for salary disbursement.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Account Holder Name *</label>
                  <input
                    type="text"
                    required
                    value={bank.account_holder_name}
                    onChange={(e) => setBank({ ...bank, account_holder_name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={bank.bank_name}
                    onChange={(e) => setBank({ ...bank, bank_name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Account Number *</label>
                  <input
                    type="password"
                    required
                    value={bank.account_number}
                    onChange={(e) => setBank({ ...bank, account_number: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Confirm Account Number *</label>
                  <input
                    type="text"
                    required
                    value={bank.confirm_account_number}
                    onChange={(e) => setBank({ ...bank, confirm_account_number: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">IFSC Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC0001234"
                    value={bank.ifsc_code}
                    onChange={(e) => setBank({ ...bank, ifsc_code: e.target.value.toUpperCase() })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white uppercase font-mono focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={bank.branch_name}
                    onChange={(e) => setBank({ ...bank, branch_name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Statutory & Nominees */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Step 5: Statutory & Compliance</h2>
                <p className="text-xs text-neutral-400 mt-1">Provident fund, insurance, nominees, and emergency contacts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">UAN Number (Universal Account No)</label>
                  <input
                    type="text"
                    value={statutory.uan_number}
                    onChange={(e) => setStatutory({ ...statutory, uan_number: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Existing PF Account Number</label>
                  <input
                    type="text"
                    value={statutory.pf_account_number}
                    onChange={(e) => setStatutory({ ...statutory, pf_account_number: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">ESI Number (if applicable)</label>
                  <input
                    type="text"
                    value={statutory.esi_number}
                    onChange={(e) => setStatutory({ ...statutory, esi_number: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-300 mb-1">Blood Group</label>
                  <select
                    value={statutory.blood_group}
                    onChange={(e) => setStatutory({ ...statutory, blood_group: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Nominee Details */}
              <div className="pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">PF / Gratuity Nominee Details</h4>
                  <button
                    type="button"
                    onClick={() => setNominees([...nominees, { nominee_name: '', relationship: '', dob: '', share_percentage: '100' }])}
                    className="text-neutral-300 hover:text-white text-xs flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Nominee
                  </button>
                </div>
                {nominees.map((nom, idx) => (
                  <div key={idx} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs mb-2">
                    <div>
                      <label className="text-neutral-400 block mb-1">Nominee Name</label>
                      <input
                        type="text"
                        value={nom.nominee_name}
                        onChange={(e) => {
                          const updated = [...nominees];
                          updated[idx].nominee_name = e.target.value;
                          setNominees(updated);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1">Relationship</label>
                      <input
                        type="text"
                        value={nom.relationship}
                        onChange={(e) => {
                          const updated = [...nominees];
                          updated[idx].relationship = e.target.value;
                          setNominees(updated);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1">DOB</label>
                      <input
                        type="date"
                        value={nom.dob}
                        onChange={(e) => {
                          const updated = [...nominees];
                          updated[idx].dob = e.target.value;
                          setNominees(updated);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1">Share %</label>
                      <input
                        type="text"
                        value={nom.share_percentage}
                        onChange={(e) => {
                          const updated = [...nominees];
                          updated[idx].share_percentage = e.target.value;
                          setNominees(updated);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Emergency Contacts */}
              <div className="pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Emergency Contact Person</h4>
                </div>
                {emergencyContacts.map((em, idx) => (
                  <div key={idx} className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-2">
                    <div>
                      <label className="text-neutral-400 block mb-1">Contact Name *</label>
                      <input
                        type="text"
                        value={em.contact_name}
                        onChange={(e) => {
                          const updated = [...emergencyContacts];
                          updated[idx].contact_name = e.target.value;
                          setEmergencyContacts(updated);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1">Relationship *</label>
                      <input
                        type="text"
                        value={em.relationship}
                        onChange={(e) => {
                          const updated = [...emergencyContacts];
                          updated[idx].relationship = e.target.value;
                          setEmergencyContacts(updated);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-neutral-400 block mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={em.phone_number}
                        onChange={(e) => {
                          const updated = [...emergencyContacts];
                          updated[idx].phone_number = e.target.value;
                          setEmergencyContacts(updated);
                        }}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Document Upload */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Step 6: Document Upload</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Supported formats: PDF, JPG, JPEG, PNG (Max 16MB per file).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { type: 'resume', title: 'Resume / CV', required: true },
                  { type: 'photo', title: 'Passport-Size Photograph', required: true },
                  { type: 'pan_card', title: 'PAN Card Copy', required: true },
                  { type: 'aadhaar_card', title: 'Aadhaar Card Copy', required: false },
                  { type: 'education_certificate', title: 'Highest Degree Certificate', required: true },
                  { type: 'experience_letter', title: 'Previous Experience / Relieving Letter', required: false },
                  { type: 'bank_proof', title: 'Cancelled Cheque / Bank Passbook', required: true },
                  { type: 'other_document', title: 'Other Supporting Document', required: false },
                ].map((item) => {
                  const uploaded = uploadedDocs.find((d) => d.document_type === item.type);
                  const isUploading = uploadingType === item.type;
                  return (
                    <div key={item.type} className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{item.title}</span>
                          {item.required && <span className="text-[10px] text-rose-400 font-mono">* Required</span>}
                        </div>
                        {uploaded ? (
                          <div className="mt-2 p-2 bg-neutral-900 rounded border border-neutral-800 flex items-center justify-between text-xs">
                            <span className="text-emerald-400 flex items-center gap-1.5 font-medium truncate max-w-[200px]">
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{uploaded.file_name}</span>
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono">
                              {(uploaded.file_size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        ) : (
                          <p className="text-[11px] text-neutral-500 mt-1">No file attached yet.</p>
                        )}
                      </div>

                      <div className="mt-3">
                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Uploading...' : uploaded ? 'Re-upload' : 'Select File'}</span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={isUploading}
                            onChange={(e) => handleFileUpload(e, item.type)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: Preview & Final Declaration */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white">Step 7: Preview & Final Submission</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Please review all entered information thoroughly before finalizing your application.
                </p>
              </div>

              {/* Review summary cards */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-2">1. Personal Profile</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-neutral-300">
                    <div>Name: <span className="text-white font-medium">{personal.full_name || 'N/A'}</span></div>
                    <div>Email: <span className="text-white font-medium">{personal.personal_email || 'N/A'}</span></div>
                    <div>Phone: <span className="text-white font-medium">{personal.mobile_number || 'N/A'}</span></div>
                    <div>PAN: <span className="text-white font-medium">{personal.pan_number || 'N/A'}</span></div>
                    <div>Aadhaar: <span className="text-white font-medium">{personal.aadhaar_number || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800">
                  <h4 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-2">2. Bank & Payroll</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-neutral-300">
                    <div>Bank: <span className="text-white font-medium">{bank.bank_name || 'N/A'}</span></div>
                    <div>Account: <span className="text-white font-mono font-medium">{bank.account_number ? '••••' + bank.account_number.slice(-4) : 'N/A'}</span></div>
                    <div>IFSC: <span className="text-white font-mono font-medium">{bank.ifsc_code || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800">
                  <h4 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-2">3. Uploaded Documents</h4>
                  <div className="flex flex-wrap gap-2">
                    {uploadedDocs.length === 0 ? (
                      <span className="text-neutral-500">No documents attached.</span>
                    ) : (
                      uploadedDocs.map((d) => (
                        <span key={d.id} className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-300 text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{d.document_type.replace(/_/g, ' ')}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Declaration Checkbox */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declarationChecked}
                    onChange={(e) => setDeclarationChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-white focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-300 leading-relaxed">
                    I hereby declare that all the information furnished by me in this onboarding application and all uploaded documents are true, complete, and authentic to the best of my knowledge. I understand that any false statement or misrepresentation will disqualify my employment.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-neutral-800">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={saveLoading}
                onClick={() => saveProgress(currentStep)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg transition"
              >
                {saveLoading ? 'Saving...' : 'Save Draft'}
              </button>

              {currentStep < 7 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-5 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 flex items-center gap-1.5 transition active:scale-[0.98]"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saveLoading || !declarationChecked}
                  onClick={handleFinalSubmit}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow-lg shadow-emerald-950 disabled:opacity-50"
                >
                  {saveLoading ? (
                    'Submitting...'
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

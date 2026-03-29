import { Link } from 'react-router-dom';

const sectionHeadingClass = 'text-2xl font-bold text-stone-900 mt-10 mb-4';
const itemHeadingClass = 'text-lg font-semibold text-stone-800 mt-6 mb-2';

export default function TermsAndPrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Brain Ink Terms & Privacy</h1>
            <p className="text-stone-600 mt-2">
              Please review this page before creating your account.
            </p>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 text-sm font-medium transition-colors"
          >
            Back to Sign Up
          </Link>
        </div>

        <div id="privacy-policy" className="rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 shadow-sm">
          <h2 className={sectionHeadingClass}>Brain Ink Privacy Policy</h2>

          <h3 className={itemHeadingClass}>1. Introduction</h3>
          <p className="text-stone-700 leading-7">
            Welcome to Brain Ink. We are committed to protecting the privacy and security of the educational
            data processed through our platform. This Privacy Policy details how we collect, use, store, and
            protect data when you use the Brain Ink web or mobile application. Our practices are designed to
            comply with Rwandan data protection laws and prioritize the privacy of both educators and students.
          </p>

          <h3 className={itemHeadingClass}>2. Information We Collect</h3>
          <p className="text-stone-700 leading-7">
            To operate the Brain Ink assessment platform, we collect the following categories of information:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-stone-700 leading-7">
            <li>
              Account &amp; Profile Data: For teachers, we collect credential information, names, and email
              addresses required to provision secure dashboard access.
            </li>
            <li>
              Educational Input Data: This includes digital images of handwritten student assignments captured
              via mobile device or uploaded via the web portal.
            </li>
            <li>
              Assessment Metadata: Teacher-authored grading rubrics, assignment parameters, subject metadata
              (e.g., Mathematics, Chemistry), and class lists.
            </li>
            <li>
              Generated Output Data: Transcribed text (OCR outputs), AI-generated feedback, confidence scores,
              and calculated final grades.
            </li>
          </ul>

          <h3 className={itemHeadingClass}>3. How Your Data is Processed (The AI Pipeline)</h3>
          <p className="text-stone-700 leading-7">
            Brain Ink does not use user data to train generic foundational models. Data is processed exclusively
            to provide immediate educational feedback through a localized, two-stage architecture:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-stone-700 leading-7">
            <li>
              Stage 1 (Extraction): Uploaded images are routed to a fine-tuned Optical Character Recognition
              (OCR) model (Branis333/hand_writing_ocr) hosted on Hugging Face Spaces. This model&apos;s sole
              function is to convert handwritten strokes into digital text.
            </li>
            <li>
              Stage 2 (Evaluation): The extracted text, stripped of non-essential metadata, is securely passed
              via API to our reasoning engine (Qwen/Qwen2.5-7B-Instruct) hosted on our backend. This model
              evaluates the text strictly against the provided rubric.
            </li>
          </ul>

          <h3 className={itemHeadingClass}>4. Data Security and Anonymization</h3>
          <p className="text-stone-700 leading-7">
            We implement rigorous security measures tailored to the realities of digital education:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-stone-700 leading-7">
            <li>
              PII-Blind Processing: Brain Ink employs prompt engineering safeguards designed to mask or ignore
              Personally Identifiable Information (PII) such as student names found on exam papers. The AI
              models process the academic content, not the student&apos;s identity.
            </li>
            <li>
              Encryption and Storage: All data is encrypted in transit and at rest. We utilize secure PostgreSQL
              databases for relational data (grades, rubrics) and secure object storage for raw and annotated
              images.
            </li>
            <li>
              Role-Based Access Control (RBAC): Strict access controls ensure that teachers can only view,
              manage, and export data pertaining to their explicitly assigned classes and students.
            </li>
          </ul>

          <h3 className={itemHeadingClass}>5. Data Sharing and Third-Party Integration</h3>
          <p className="text-stone-700 leading-7">
            Brain Ink does not sell, rent, or broker student or teacher data to third-party advertisers.
          </p>
          <p className="text-stone-700 leading-7">
            Authorized Exports: The platform includes an export service that formats finalized grades into CSV
            files specifically designed for integration with the Rwandan Ministry of Education&apos;s School Data
            Management System (SDMS). This data transfer is initiated solely by the authorized teacher.
          </p>
        </div>

        <div id="eula" className="rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 shadow-sm mt-8">
          <h2 className={sectionHeadingClass}>Brain Ink End-User License Agreement (EULA)</h2>

          <h3 className={itemHeadingClass}>1. Acceptance of Terms</h3>
          <p className="text-stone-700 leading-7">
            By registering for, accessing, or using the Brain Ink platform, you (the &quot;Educator&quot; or &quot;User&quot;)
            agree to be bound by the terms of this End-User License Agreement. If you are using Brain Ink on
            behalf of an educational institution, you represent that you have the authority to bind that
            institution to these terms.
          </p>

          <h3 className={itemHeadingClass}>2. Permitted Use and Scope of Service</h3>
          <p className="text-stone-700 leading-7">
            Brain Ink grants you a revocable, non-exclusive, non-transferable license to use the application to
            assist in the grading and assessment of student coursework. The platform is designed to support the
            Competence-Based Curriculum (CBC) by automating repetitive grading tasks and generating personalized
            feedback.
          </p>

          <h3 className={itemHeadingClass}>3. Human-in-the-Loop Requirement (Crucial)</h3>
          <p className="text-stone-700 leading-7">
            Brain Ink is an administrative assistant, not an autonomous evaluator. The pedagogical responsibility
            for grading remains entirely with the User.
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-stone-700 leading-7">
            <li>
              Mandatory Review: Users agree that AI-generated grades and feedback are suggestions. The User is
              strictly required to review, validate, and approve all AI outputs before finalizing them or
              distributing them to students.
            </li>
            <li>
              Override Authority: The Brain Ink interface provides the tools necessary to override, edit, or
              discard any AI-generated grade or feedback prior to finalization.
            </li>
          </ul>

          <h3 className={itemHeadingClass}>4. System Accuracy, Fallbacks, and Limitations</h3>
          <p className="text-stone-700 leading-7">
            Users acknowledge and agree to the following operational realities of the Brain Ink system:
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2 text-stone-700 leading-7">
            <li>
              Confidence Thresholds: The AI engine automatically assigns a confidence score to every processed
              assignment. Any submission receiving a confidence score below 75% will be flagged and automatically
              returned to the User for manual review.
            </li>
            <li>
              Image Quality Limitations: Assignments captured with excessively low lighting, heavy blur, or
              unreadable handwriting may fail processing (historically ~1.4% of submissions) and will require
              manual grading.
            </li>
            <li>
              Subject Matter Constraints: While highly optimized for STEM subjects (Mathematics, Physics,
              Chemistry), the system currently possesses known limitations in accurately evaluating freeform essays
              (e.g., Kinyarwanda) and highly complex visual diagrams (e.g., advanced Biology drawings).
            </li>
            <li>
              Service Latency: To maintain cost-effective infrastructure, Brain Ink utilizes cloud services that may
              enter a &quot;sleep&quot; state after 15 minutes of inactivity. Users accept that initial startup times
              following inactivity may cause short delays.
            </li>
          </ul>

          <h3 className={itemHeadingClass}>5. Disclaimer of Warranties</h3>
          <p className="text-stone-700 leading-7">
            The Brain Ink platform is provided &quot;as is&quot; and &quot;as available.&quot; We disclaim all warranties,
            express or implied, including but not limited to the accuracy of AI-generated transcriptions or the
            pedagogical correctness of generated feedback. We do not warrant that the service will be entirely
            free of errors or &quot;hallucinated&quot; text resulting from complex multimodal processing.
          </p>

          <h3 className={itemHeadingClass}>6. Limitation of Liability</h3>
          <p className="text-stone-700 leading-7">
            To the maximum extent permitted by applicable law, Brain Ink, its developers, and its affiliates shall
            not be liable for any indirect, incidental, special, or consequential damages, including but not limited
            to academic penalties, institutional disputes, or data entry errors in national databases (e.g., SDMS),
            arising from the User&apos;s failure to adequately review and validate AI-generated assessments before
            finalization.
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

interface Props {
  readonly onTryExample?: () => void;
  readonly onSelectSample?: (text: string, role?: string) => void;
}

export const SAMPLE_DOCS = {
  rent: {
    label: 'Rent agreement',
    icon: '🏠',
    sub: 'Residential tenancy / lease',
    role: 'Tenant',
    text: `RENTAL AND LEASE AGREEMENT
This Residential Rental Agreement is made at Bengaluru, Karnataka on this 1st day of October 2026.
BETWEEN: Shri R. K. Sharma (Landlord) AND Sri Ananya Roy (Tenant).

TERMS AND CONDITIONS:
1. SECURITY DEPOSIT: The Tenant shall deposit an interest-free refundable security deposit of Rs. 2,50,000 (equivalent to 10 months rent). The Landlord shall inspect the premises upon vacation and deduct painting, wear-and-tear, and refurbishing expenses at his sole discretion.
2. LOCK-IN PERIOD: A mandatory lock-in period of 11 months applies. If the Tenant vacates before 11 months, the entire security deposit shall stand forfeited as liquidated damages.
3. TERMINATION: The Landlord may terminate this agreement at any time with seven (7) days notice without assigning any reason. The Tenant must provide sixty (60) days advance notice in writing.
4. RIGHT OF ENTRY: The Landlord reserves the absolute right to enter and inspect the premises at any hour without prior notice to the Tenant.
5. JURISDICTION: Any dispute arising out of this agreement shall be subject to the exclusive jurisdiction of the civil courts in Bengaluru.`,
  },
  employment: {
    label: 'Employment offer',
    icon: '💼',
    sub: 'Offer letter / joining terms',
    role: 'Employee',
    text: `EMPLOYMENT AND NON-COMPETE AGREEMENT
This Employment Agreement is entered into between TechVenture Solutions Pvt. Ltd. (Company) and Vikram Malhotra (Employee).

1. APPOINTMENT AND PROBATION: The Employee is appointed as Senior Software Engineer subject to a 6-month probation period during which the Company may terminate employment immediately without notice or cause.
2. NOTICE PERIOD: Post confirmation, the Employee must serve a mandatory three (3) months notice period. In the event of resignation, the Company reserves the sole discretion to reject payment in lieu of notice and withhold relieving letters and experience certificates until all handover is deemed satisfactory.
3. NON-COMPETE RESTRICTION: The Employee expressly agrees that during the term of employment and for a period of twenty-four (24) months following termination of employment for any reason, the Employee shall not directly or indirectly accept employment with, consult for, or establish any entity operating in the same industry across India.
4. INTELLECTUAL PROPERTY: All inventions, code, designs, and notes conceived by the Employee, whether during business hours or on personal time, shall be the sole property of the Company.`,
  },
  freelance: {
    label: 'Freelance contract',
    icon: '🤝',
    sub: 'Service / project agreement',
    role: 'Freelancer / Contractor',
    text: `MASTER SERVICES AGREEMENT FOR INDEPENDENT CONTRACTOR
BETWEEN: Apex Digital Media (Client) AND Priya Nair (Independent Contractor).

1. SCOPE AND REVISIONS: Contractor agrees to deliver UI/UX design deliverables as specified in Statement of Work. Client may demand unlimited revisions until satisfied.
2. PAYMENT AND WITHHOLDING: Client shall pay invoices on Net-60 day terms. Client reserves the right to withhold up to 40% of project fees for subjective dissatisfaction or delays, without requirement of arbitration.
3. CANCELLATION FOR CONVENIENCE: Client may terminate this agreement at any milestone without payment for unapproved work in progress.
4. IP ASSIGNMENT: Contractor assigns all worldwide copyright, patents, and moral rights in the work product to the Client immediately upon creation, irrespective of whether final milestone payment has been disbursed.
5. INDEMNIFICATION: Contractor agrees to indemnify, defend, and hold harmless the Client against any third-party claims, legal fees, or damages without monetary limitation.`,
  },
  nda: {
    label: 'NDA',
    icon: '📋',
    sub: 'Non-disclosure agreement',
    role: 'Receiving Party',
    text: `UNILATERAL NON-DISCLOSURE AGREEMENT
This Confidentiality Agreement is executed by and between Innovate Global Corp (Disclosing Party) and Aakash Verma (Recipient).

1. CONFIDENTIAL INFORMATION: Includes all technical, financial, customer, and marketing data disclosed orally, visually, or in writing, without requirement to mark as proprietary.
2. PERPETUAL OBLIGATION: The Recipient shall hold all Confidential Information in strict confidence indefinitely, surviving any termination of the business discussions.
3. LIQUIDATED DAMAGES: In the event of any alleged breach of this Agreement, the Recipient agrees to pay liquidated damages of INR 50,00,000 (Fifty Lakh Rupees) upon first demand, without requiring the Disclosing Party to prove actual commercial injury.
4. DISPUTE RESOLUTION: Any dispute shall be referred to sole arbitration seated in Singapore under SIAC Rules, and Recipient waives all rights to contest jurisdiction under the Indian Arbitration and Conciliation Act 1996.`,
  },
};

export function EmptyState({ onTryExample, onSelectSample }: Props) {
  return (
    <div className="empty-state" role="region" aria-label="Tool workspace — ready for input">
      <div className="empty-icon" aria-hidden="true">⚖️</div>
      <h3 className="empty-title">Your document is waiting.</h3>
      <p className="empty-body">
        Paste any contract, agreement, notice, or clause above and let LawJourney
        explain what matters — grounded in real Indian law.
      </p>

      <div className="empty-examples">
        <p className="empty-examples-label">Select a sample document to test:</p>
        <div className="empty-examples-grid">
          {Object.entries(SAMPLE_DOCS).map(([key, ex]) => (
            <button
              key={key}
              type="button"
              className="empty-example-chip empty-example-btn"
              onClick={() => {
                if (onSelectSample) {
                  onSelectSample(ex.text, ex.role);
                } else if (onTryExample) {
                  onTryExample();
                }
              }}
              title={`Load sample ${ex.label}`}
              aria-label={`Load sample ${ex.label}: ${ex.sub}`}
            >
              <span className="empty-ex-icon" aria-hidden="true">{ex.icon}</span>
              <div>
                <p className="empty-ex-label">{ex.label} <span className="empty-chip-arrow">→</span></p>
                <p className="empty-ex-sub">{ex.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="empty-trust">
        <span>🇮🇳 Indian Law</span>
        <span aria-hidden="true">·</span>
        <span>No data stored</span>
        <span aria-hidden="true">·</span>
        <span>Free forever</span>
      </div>

      {onTryExample && (
        <button
          type="button"
          className="btn-ghost"
          onClick={onTryExample}
          style={{ marginTop: '1.5rem' }}
        >
          ✦ Try a sample clause
        </button>
      )}
    </div>
  );
}

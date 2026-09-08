/**
 * Persisted shape of a Child Support Application.
 *
 * `ApplicationFormData` is exactly what is stored in `applications.form_data`
 * (jsonb) and frozen into `application_snapshots.form_data` on submit.
 *
 * The ApplyWizard component currently keeps this split across two local state
 * objects (`form` + `details`); the API layer maps that to the single shape
 * below before persisting.
 */

export type TriState = 'yes' | 'no' | 'unknown' | '';
export type YesNo = 'yes' | 'no' | '';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'more_info_needed'
  | 'approved'
  | 'denied'
  | 'withdrawn'
  | 'closed';

export type UserRole = 'parent' | 'provider' | 'admin';

// ── shared blocks ───────────────────────────────────────────────────────────
export interface PersonName {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  ssn: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  birthCity: string;
  birthState: string;
  maritalStatus: string;
  maidenName: string;
  spouseName: string;
  dateMarried: string;
}

export interface AddressBlock {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PersonAddress {
  knowsAddress: YesNo;
  residential: AddressBlock;
  mailing: AddressBlock;
  homePhone: string;
  cellPhone: string;
  emergencyPhone: string;
  email: string;
}

export interface Employment {
  currentlyEmployed: TriState;
  employerName: string;
  workPhone: string;
}

export interface Household {
  size: string;
  monthlyIncome: string;
}

export interface ChildEntry {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  ssn: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  birthCity: string;
  birthState: string;
  relationship: string;
  state: string;
  paternityEstablished: TriState;
  paternityDate: string;
}

export interface PhysicalDescription {
  hair: string;
  eyes: string;
  heightFt: string;
  heightIn: string;
  weight: string;
  race: string;
  nickname: string;
  otherFeatures: string;
}

export interface IncomeItem {
  has: TriState;
  amount: string;
}

export interface Income {
  workersComp: IncomeItem;
  ssdi: IncomeItem;
  ssi: IncomeItem;
  publicAssistance: IncomeItem;
  unemployment: IncomeItem;
  childSupport: IncomeItem;
  spousalSupport: IncomeItem;
  other: IncomeItem;
}

export interface Relative {
  firstName: string;
  middleName: string;
  lastName: string;
  maidenName: string;
  deceased: YesNo;
  birthCity: string;
  birthState: string;
}

export interface Military {
  status: string;
  branch: string;
  serviceNumber: string;
  servedFrom: string;
  servedTo: string;
}

export interface CriminalHistory {
  hasCriminalRecord: TriState;
  incarcerated: TriState;
  institutionName: string;
  institutionCity: string;
  institutionState: string;
  onParole: TriState;
  paroleOfficer: string;
  paroleOfficerPhone: string;
}

export interface FinancialAccount {
  id: string;
  institutionName: string;
  accountType: string;
  accountNumber: string;
  accountValue: string;
}

export interface FinancialAccounts {
  inBankruptcy: TriState;
  accounts: FinancialAccount[];
}

export interface License {
  driversLicenseNumber: string;
  driversLicenseState: string;
  professionalLicenseHeld: YesNo;
  licenseType: string;
  licenseNumber: string;
  issuingState: string;
}

export interface Vehicle {
  id: string;
  type: string; // BOAT | CAR | MOTORCYCLE | SNOWMOBILE | TRUCK | OTHER
  year: string;
  make: string;
  model: string;
  licenseNumber: string;
  state: string;
}

export interface Property {
  description: string;
  estimatedValue: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  lienHolder: string;
}

export interface Contact {
  id: string;
  relationship: 'relative' | 'friend' | '';
  firstName: string;
  middleName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface SupportOrder {
  id: string;
  orderType: string; // child_support | spousal_support | medical_support
  orderNumber: string;
  stateFiled: string;
  dateFiled: string;
  amount: string;
  frequency: string; // monthly | weekly | bi_weekly | semi_monthly
  startDate: string;
  endDate: string;
  childrenCovered: string[]; // ChildEntry.id values
}

export interface OtherChild {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthDate: string;
}

// ── wizard sections ─────────────────────────────────────────────────────────
export interface CustodialParty {
  name: PersonName;
  address: PersonAddress;
  employment: Employment;
  household: Household;
}

export interface NoncustodialParty {
  name: PersonName;
  description: PhysicalDescription;
  address: PersonAddress;
  employment: Employment;
  income: Income;
  mother: Relative;
  father: Relative;
  military: Military;
  criminalHistory: CriminalHistory;
  financialAccounts: FinancialAccounts;
  license: License;
  vehicles: Vehicle[];
  property: Property;
  contacts: Contact[];
}

// ── root: applications.form_data ────────────────────────────────────────────
export interface ApplicationFormData {
  schemaVersion: number;
  resumeStep: string;

  apply: { applicantType: 'custodian' | 'non-custodian' | '' };
  agreement: { checks: boolean[]; withholdOtherPartyInfo: boolean };
  rights: { checks: boolean[]; redeterminationAck: boolean };
  serviceType: { type: 'full_service' | 'search_only' | ''; searchProviderName: string };
  publicAssistance: { receives: boolean | null };

  custodial: CustodialParty;
  children: ChildEntry[];
  noncustodial: NoncustodialParty;
  other: {
    supportOrders: SupportOrder[];
    otherChildren: OtherChild[];
    otherInformationText: string;
  };
  review: { certified: boolean; signature: string };
}

// ── table rows ──────────────────────────────────────────────────────────────
export interface UserRow {
  id: string;
  cognitoSub: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationRow {
  id: string;
  userId: string;
  referenceNumber: string | null;
  status: ApplicationStatus;
  applicantType: 'custodian' | 'non-custodian' | null;
  serviceType: 'full_service' | 'search_only' | null;
  resumeStep: string | null;
  formData: ApplicationFormData;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export interface ConsentRow {
  id: number;
  applicationId: string;
  consentCode: string;
  category: 'agreement' | 'rights' | 'acknowledgement';
  accepted: boolean;
  bodySnapshot: string;
  locale: string;
  acceptedAt: string;
}

export interface ApplicationSnapshotRow {
  id: string;
  applicationId: string;
  versionNo: number;
  referenceNumber: string;
  formData: ApplicationFormData;
  signedName: string;
  signedAt: string;
  signerIp: string | null;
}

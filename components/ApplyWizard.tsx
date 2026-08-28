'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type LucideIcon,
  FileText,
  Handshake,
  ShieldCheck,
  ClipboardList,
  Users,
  Landmark,
  Send,
  Check,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Info,
  Save,
  ExternalLink,
  HandCoins,
  Search,
  ChevronRight,
  ChevronDown,
  X,
  Plus,
  MessageSquare,
  PenTool,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { TranslationKey } from '@/lib/i18n/en';

interface StoredUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface ChildEntry {
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
  paternityEstablished: 'yes' | 'no' | 'unknown' | '';
  paternityDate: string;
}

interface SupportOrderEntry {
  id: string;
  orderType: string;
  orderNumber: string;
  stateFiled: string;
  dateFiled: string;
  amount: string;
  frequency: string;
  startDate: string;
  endDate: string;
  childrenCovered: string[];
}

const EMPTY_SUPPORT_ORDER: SupportOrderEntry = {
  id: '',
  orderType: '',
  orderNumber: '',
  stateFiled: '',
  dateFiled: '',
  amount: '',
  frequency: '',
  startDate: '',
  endDate: '',
  childrenCovered: [],
};

interface OtherChildEntry {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthDate: string;
}

const EMPTY_OTHER_CHILD: OtherChildEntry = {
  id: '',
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  birthDate: '',
};

const EMPTY_CHILD: ChildEntry = {
  id: '', firstName: '', middleName: '', lastName: '', suffix: '', ssn: '', gender: '',
  birthDate: '', birthCity: '', birthState: '', relationship: '', state: '',
  paternityEstablished: '', paternityDate: '',
};

const RELATIONSHIP_OPTIONS = ['Son', 'Daughter', 'Stepson', 'Stepdaughter', 'Grandchild', 'Niece', 'Nephew', 'Foster Child', 'Other Relative'];

interface ApplyFormData {
  applicationMode: 'new' | 'saved' | '';
  applicantType: 'parent_guardian' | 'relative_caregiver' | '';
  agreementChecks: boolean[];
  withholdConsent: 'yes' | 'no' | '';
  redeterminationAck: boolean;
  rightsChecks: boolean[];
  assistanceType: 'full' | 'search_only' | '';
  receivesPublicAssistance: 'yes' | 'no' | '';
  fullName: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  householdSize: string;
  monthlyIncome: string;
  children: ChildEntry[];
  supportOrders: SupportOrderEntry[];
  otherChildren: OtherChildEntry[];
  otherInformationText: string;
  providerName: string;
  certify: boolean;
}

const AGREEMENT_ITEM_KEYS: TranslationKey[] = [
  'apply.step2.item1', 'apply.step2.item2', 'apply.step2.item3',
  'apply.step2.item4', 'apply.step2.item5', 'apply.step2.item6',
];

const RIGHTS_ITEM_KEYS: TranslationKey[] = [
  'apply.step3.item1', 'apply.step3.item2', 'apply.step3.item3',
  'apply.step3.item4', 'apply.step3.item5', 'apply.step3.item6',
];

const STEPS = [
  { key: 'apply', icon: FileText },
  { key: 'agreement', icon: Handshake },
  { key: 'rights', icon: ShieldCheck },
  { key: 'assistance', icon: Users },
  { key: 'publicAssistance', icon: Landmark },
  { key: 'household', icon: ClipboardList },
  { key: 'review', icon: Send },
] as const;

const STEP_LABEL_KEYS: Record<typeof STEPS[number]['key'], { label: TranslationKey; sub: TranslationKey }> = {
  apply: { label: 'apply.step.apply.label', sub: 'apply.step.apply.sub' },
  agreement: { label: 'apply.step.agreement.label', sub: 'apply.step.agreement.sub' },
  rights: { label: 'apply.step.rights.label', sub: 'apply.step.rights.sub' },
  assistance: { label: 'apply.step.assistance.label', sub: 'apply.step.assistance.sub' },
  publicAssistance: { label: 'apply.step.publicAssistance.label', sub: 'apply.step.publicAssistance.sub' },
  household: { label: 'apply.step.household.label', sub: 'apply.step.household.sub' },
  review: { label: 'apply.step.review.label', sub: 'apply.step.review.sub' },
};

const SIDEBAR_STEPS = [
  { key: 'apply', labelKey: 'apply.step.apply.label', subKey: 'apply.step.apply.sub', icon: FileText, startIndex: 0, endIndex: 0 },
  { key: 'consents', labelKey: 'apply.step.consents.label', subKey: 'apply.step.consents.sub', icon: ShieldCheck, startIndex: 1, endIndex: 4 },
  { key: 'household', labelKey: 'apply.step.household.label', subKey: 'apply.step.household.sub', icon: ClipboardList, startIndex: 5, endIndex: 5 },
  { key: 'review', labelKey: 'apply.step.review.label', subKey: 'apply.step.review.sub', icon: Send, startIndex: 6, endIndex: 6 },
] as const;

function StepHeading({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="step-heading">
      <div className="step-heading-icon">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <div>
        <h2 className="apply-step-title">{title}</h2>
        {subtitle && (
          <p className={`apply-step-subtitle ${subtitle.includes('Select the checkbox') || subtitle.includes('Review the available services') ? 'apply-step-subtitle-blink' : ''}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="info-banner">
      <div className="info-banner-icon">
        <Info size={18} strokeWidth={2} />
      </div>
      <div className="info-banner-text">{children}</div>
    </div>
  );
}

function ServiceOption({
  name,
  checked,
  onChange,
  title,
  description,
  icon: Icon,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <label className={`service-option ${checked ? 'selected' : ''}`}>
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span className="service-option-text">
        <strong>{title}</strong>
        <span>{description}</span>
      </span>
      <span className="service-option-icon">
        <Icon size={22} strokeWidth={1.8} />
      </span>
    </label>
  );
}

function TriRadio({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="withhold-radio-row">
      {options.map((opt) => (
        <label key={opt.value} className="radio-row radio-row-inline">
          <input type="radio" name={name} checked={value === opt.value} onChange={() => onChange(opt.value)} />
          <span className="radio-row-text"><strong>{opt.label}</strong></span>
        </label>
      ))}
    </div>
  );
}

function ChoiceBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="choice-box">
      <div className="choice-box-label">
        <span className="req">*</span> {label}
      </div>
      <div className="choice-box-options">{children}</div>
    </div>
  );
}

function RadioRow({
  name,
  checked,
  onChange,
  title,
  description,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description?: string;
}) {
  return (
    <label className="radio-row">
      <input type="radio" name={name} checked={checked} onChange={onChange} />
      <span className="radio-row-text">
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </span>
    </label>
  );
}

interface AddressBlock {
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const EMPTY_ADDRESS_BLOCK: AddressBlock = { line1: '', line2: '', city: '', state: '', zip: '', country: 'United States of America' };

interface PersonNameInfo {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  ssn: string;
  gender: 'female' | 'male' | '';
  birthDate: string;
  birthCity: string;
  birthState: string;
  maritalStatus: string;
  maidenName: string;
  spouseName: string;
  dateMarried: string;
}

const EMPTY_NAME_INFO: PersonNameInfo = {
  firstName: '', middleName: '', lastName: '', suffix: '', ssn: '', gender: '', birthDate: '',
  birthCity: '', birthState: '', maritalStatus: '', maidenName: '', spouseName: '', dateMarried: '',
};

interface PersonAddressInfo {
  knowsAddress: 'yes' | 'no' | '';
  residential: AddressBlock;
  mailing: AddressBlock;
  homePhone: string;
  cellPhone: string;
  emergencyPhone: string;
  email: string;
}

function emptyPersonAddress(): PersonAddressInfo {
  return {
    knowsAddress: '',
    residential: { ...EMPTY_ADDRESS_BLOCK },
    mailing: { ...EMPTY_ADDRESS_BLOCK },
    homePhone: '', cellPhone: '', emergencyPhone: '', email: '',
  };
}

interface EmploymentInfo {
  currentlyEmployed: 'yes' | 'no' | 'unknown' | '';
  employerName: string;
  workPhone: string;
}

const EMPTY_EMPLOYMENT: EmploymentInfo = { currentlyEmployed: '', employerName: '', workPhone: '' };

interface PhysicalDescriptionInfo {
  hair: string; eyes: string; heightFt: string; heightIn: string; weight: string; race: string; nickname: string; otherFeatures: string;
}

const EMPTY_DESCRIPTION: PhysicalDescriptionInfo = {
  hair: '', eyes: '', heightFt: '', heightIn: '', weight: '', race: '', nickname: '', otherFeatures: '',
};

interface IncomeItem { has: 'yes' | 'no' | 'unknown' | ''; amount: string; }
const EMPTY_INCOME_ITEM: IncomeItem = { has: '', amount: '' };

interface IncomeInfo {
  workersComp: IncomeItem; ssdi: IncomeItem; ssi: IncomeItem; publicAssistanceIncome: IncomeItem;
  unemployment: IncomeItem; childSupport: IncomeItem; spousalSupport: IncomeItem; other: IncomeItem;
}

const EMPTY_INCOME: IncomeInfo = {
  workersComp: { ...EMPTY_INCOME_ITEM }, ssdi: { ...EMPTY_INCOME_ITEM }, ssi: { ...EMPTY_INCOME_ITEM },
  publicAssistanceIncome: { ...EMPTY_INCOME_ITEM }, unemployment: { ...EMPTY_INCOME_ITEM },
  childSupport: { ...EMPTY_INCOME_ITEM }, spousalSupport: { ...EMPTY_INCOME_ITEM }, other: { ...EMPTY_INCOME_ITEM },
};

const INCOME_ITEM_KEYS: { key: keyof IncomeInfo; labelKey: TranslationKey }[] = [
  { key: 'workersComp', labelKey: 'income.workersComp' },
  { key: 'ssdi', labelKey: 'income.ssdi' },
  { key: 'ssi', labelKey: 'income.ssi' },
  { key: 'publicAssistanceIncome', labelKey: 'income.publicAssistance' },
  { key: 'unemployment', labelKey: 'income.unemployment' },
  { key: 'childSupport', labelKey: 'income.childSupport' },
  { key: 'spousalSupport', labelKey: 'income.spousalSupport' },
  { key: 'other', labelKey: 'income.other' },
];

interface RelativeInfo {
  firstName: string; middleName: string; lastName: string; maidenName: string;
  deceased: 'yes' | 'no' | ''; birthCity: string; birthState: string;
}

const EMPTY_RELATIVE: RelativeInfo = { firstName: '', middleName: '', lastName: '', maidenName: '', deceased: '', birthCity: '', birthState: '' };

interface ApplicationDetails {
  custodialName: PersonNameInfo;
  custodialAddress: PersonAddressInfo;
  custodialEmployment: EmploymentInfo;
  noncustodialName: PersonNameInfo;
  noncustodialDescription: PhysicalDescriptionInfo;
  noncustodialAddress: PersonAddressInfo;
  noncustodialEmployment: EmploymentInfo;
  noncustodialIncome: IncomeInfo;
  noncustodialMother: RelativeInfo;
  noncustodialFather: RelativeInfo;
}

function emptyDetails(): ApplicationDetails {
  return {
    custodialName: { ...EMPTY_NAME_INFO },
    custodialAddress: emptyPersonAddress(),
    custodialEmployment: { ...EMPTY_EMPLOYMENT },
    noncustodialName: { ...EMPTY_NAME_INFO },
    noncustodialDescription: { ...EMPTY_DESCRIPTION },
    noncustodialAddress: emptyPersonAddress(),
    noncustodialEmployment: { ...EMPTY_EMPLOYMENT },
    noncustodialIncome: { ...EMPTY_INCOME },
    noncustodialMother: { ...EMPTY_RELATIVE },
    noncustodialFather: { ...EMPTY_RELATIVE },
  };
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
];

const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Separated'];
const HAIR_OPTIONS = ['Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Bald', 'Other'];
const EYE_OPTIONS = ['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Other'];
const RACE_OPTIONS = ['White', 'Black or African American', 'American Indian or Alaska Native', 'Asian', 'Native Hawaiian or Other Pacific Islander', 'Two or More Races', 'Other'];
const HEIGHT_FEET_OPTIONS = ['3', '4', '5', '6', '7'];
const HEIGHT_INCH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i));

type SubSectionKey =
  | 'custodial-name' | 'custodial-address' | 'custodial-employment' | 'custodial-household' | 'custodial-children'
  | 'noncustodial-name' | 'noncustodial-description' | 'noncustodial-address'
  | 'noncustodial-employment' | 'noncustodial-income' | 'noncustodial-mother' | 'noncustodial-father'
  | 'other-support-orders' | 'other-children' | 'other-information';

const SUB_SECTIONS: { key: SubSectionKey; groupKey: TranslationKey; labelKey: TranslationKey }[] = [
  { key: 'custodial-name', groupKey: 'apply.hub.colCustodial', labelKey: 'apply.hub.myName' },
  { key: 'custodial-address', groupKey: 'apply.hub.colCustodial', labelKey: 'apply.hub.myAddress' },
  { key: 'custodial-employment', groupKey: 'apply.hub.colCustodial', labelKey: 'apply.hub.myEmployment' },
  { key: 'custodial-household', groupKey: 'apply.hub.colCustodial', labelKey: 'field.household' },
  { key: 'custodial-children', groupKey: 'apply.hub.colChildren', labelKey: 'apply.hub.children' },
  { key: 'noncustodial-name', groupKey: 'apply.hub.colNoncustodial', labelKey: 'apply.hub.name' },
  { key: 'noncustodial-description', groupKey: 'apply.hub.colNoncustodial', labelKey: 'field.physicalDescription' },
  { key: 'noncustodial-address', groupKey: 'apply.hub.colNoncustodial', labelKey: 'apply.hub.address' },
  { key: 'noncustodial-employment', groupKey: 'apply.hub.colNoncustodial', labelKey: 'apply.hub.employment' },
  { key: 'noncustodial-income', groupKey: 'apply.hub.colNoncustodial', labelKey: 'apply.hub.income' },
  { key: 'noncustodial-mother', groupKey: 'apply.hub.colNoncustodial', labelKey: 'apply.hub.mother' },
  { key: 'noncustodial-father', groupKey: 'apply.hub.colNoncustodial', labelKey: 'apply.hub.father' },
  { key: 'other-support-orders', groupKey: 'apply.hub.colOther', labelKey: 'apply.hub.supportOrders' },
  { key: 'other-children', groupKey: 'apply.hub.colOther', labelKey: 'apply.hub.otherChildren' },
  { key: 'other-information', groupKey: 'apply.hub.colOther', labelKey: 'apply.hub.otherInformation' },
];

function FormBar({ title }: { title: string }) {
  return <div className="form-section-bar">{title}</div>;
}

function FieldRow({
  label,
  required,
  hint,
  wide,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="field-row-legacy">
      <div className="field-label-legacy">
        {required && <span className="req">*</span>}
        {label}:
      </div>
      <div className={`field-input-legacy ${wide ? 'wide' : ''}`}>
        {children}
        {hint && <div className="field-hint-legacy">{hint}</div>}
      </div>
    </div>
  );
}

const EMPTY_FORM: ApplyFormData = {
  applicationMode: '',
  applicantType: '',
  agreementChecks: AGREEMENT_ITEM_KEYS.map(() => false),
  withholdConsent: '',
  redeterminationAck: false,
  rightsChecks: RIGHTS_ITEM_KEYS.map(() => false),
  assistanceType: '',
  receivesPublicAssistance: '',
  fullName: '',
  dob: '',
  phone: '',
  email: '',
  address: '',
  householdSize: '',
  monthlyIncome: '',
  children: [],
  supportOrders: [],
  otherChildren: [],
  otherInformationText: '',
  providerName: '',
  certify: false,
};

const MY_APPLICATION_GROUPS: {
  key: string;
  label: string;
  firstSubKey: SubSectionKey;
  subkeys: SubSectionKey[];
}[] = [
    {
      key: 'custodial',
      label: 'Custodial Parent',
      firstSubKey: 'custodial-name',
      subkeys: ['custodial-name', 'custodial-address', 'custodial-employment', 'custodial-household']
    },
    {
      key: 'noncustodial',
      label: 'Non-Custodial Parent',
      firstSubKey: 'noncustodial-name',
      subkeys: ['noncustodial-name', 'noncustodial-address', 'noncustodial-employment', 'noncustodial-income', 'noncustodial-mother', 'noncustodial-father']
    },
    {
      key: 'children',
      label: 'Children',
      firstSubKey: 'custodial-children',
      subkeys: ['custodial-children']
    },
    {
      key: 'other',
      label: 'Other Information',
      firstSubKey: 'other-support-orders',
      subkeys: ['other-support-orders', 'other-children', 'other-information']
    }
  ];

export default function ApplyWizard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const [stepIndex, setStepIndex] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [form, setForm] = useState<ApplyFormData>(EMPTY_FORM);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  const [details, setDetails] = useState<ApplicationDetails>(emptyDetails());
  const [activeSubSection, setActiveSubSection] = useState<SubSectionKey | null>(null);
  const [visitedSubSections, setVisitedSubSections] = useState<Set<SubSectionKey>>(new Set());
  const [childDraft, setChildDraft] = useState<ChildEntry>(EMPTY_CHILD);
  const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set());
  const [selectedChildForView, setSelectedChildForView] = useState<ChildEntry | null>(null);
  const [showChildForm, setShowChildForm] = useState(false);
  const [showSupportOrderForm, setShowSupportOrderForm] = useState(false);
  const [supportOrderDraft, setSupportOrderDraft] = useState<SupportOrderEntry>(EMPTY_SUPPORT_ORDER);
  const [showOtherChildForm, setShowOtherChildForm] = useState(false);
  const [otherChildDraft, setOtherChildDraft] = useState<OtherChildEntry>(EMPTY_OTHER_CHILD);
  const [showSignaturePage, setShowSignaturePage] = useState(false);
  const [soSworn, setSoSworn] = useState(false);

  // Review inline editing states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [rollbackForm, setRollbackForm] = useState<ApplyFormData | null>(null);
  const [rollbackDetails, setRollbackDetails] = useState<ApplicationDetails | null>(null);

  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editingSupportOrderId, setEditingSupportOrderId] = useState<string | null>(null);
  const [editingOtherChildId, setEditingOtherChildId] = useState<string | null>(null);

  const startEditingSection = (section: string) => {
    setRollbackForm(JSON.parse(JSON.stringify(form)));
    setRollbackDetails(JSON.parse(JSON.stringify(details)));
    setEditingSection(section);
  };

  const cancelEditingSection = () => {
    if (rollbackForm) setForm(rollbackForm);
    if (rollbackDetails) setDetails(rollbackDetails);
    setEditingSection(null);
    setRollbackForm(null);
    setRollbackDetails(null);
    setError('');
    
    // Reset any sub-item editing state
    setEditingChildId(null);
    setEditingSupportOrderId(null);
    setEditingOtherChildId(null);
    setChildDraft(EMPTY_CHILD);
    setSupportOrderDraft(EMPTY_SUPPORT_ORDER);
    setOtherChildDraft(EMPTY_OTHER_CHILD);
    setShowChildForm(false);
    setShowSupportOrderForm(false);
    setShowOtherChildForm(false);
  };

  const saveEditingSection = () => {
    // Basic verification on save
    if (editingSection === 'household-info') {
      if (!form.fullName.trim() || !form.dob.trim() || !form.phone.trim() || !form.email.trim() || !form.address.trim()) {
        setError('Please fill in all applicant details.');
        return;
      }
    }
    setEditingSection(null);
    setRollbackForm(null);
    setRollbackDetails(null);
    setError('');
    
    // Save draft to localStorage so updates are saved
    saveDraft(form, stepIndex);
  };

  const startEditingChild = (child: ChildEntry) => {
    setChildDraft({ ...child });
    setEditingChildId(child.id);
    setShowChildForm(true);
  };

  const handleUpdateChild = () => {
    if (
      !childDraft.firstName.trim() ||
      !childDraft.lastName.trim() ||
      !childDraft.gender ||
      !childDraft.birthDate ||
      !childDraft.birthCity ||
      !childDraft.birthState ||
      !childDraft.relationship ||
      !childDraft.paternityEstablished ||
      !childDraft.state
    ) {
      setError(t('apply.step.childValidationMsg') || 'Please fill in all required fields for the child.');
      return;
    }
    setError('');

    setForm((prev) => ({
      ...prev,
      children: prev.children.map((c) => (c.id === editingChildId ? { ...childDraft } : c)),
    }));
    setChildDraft(EMPTY_CHILD);
    setEditingChildId(null);
    setShowChildForm(false);
  };

  const startEditingSupportOrder = (order: SupportOrderEntry) => {
    setSupportOrderDraft({ ...order });
    setEditingSupportOrderId(order.id);
    setShowSupportOrderForm(true);
  };

  const handleUpdateSupportOrder = () => {
    if (
      !supportOrderDraft.orderType ||
      !supportOrderDraft.orderNumber.trim() ||
      !supportOrderDraft.stateFiled ||
      !supportOrderDraft.dateFiled ||
      !supportOrderDraft.amount.trim() ||
      !supportOrderDraft.frequency ||
      !supportOrderDraft.startDate
    ) {
      setError('Please fill in all required fields for the support order.');
      return;
    }
    setError('');

    setForm((prev) => ({
      ...prev,
      supportOrders: (prev.supportOrders || []).map((o) => (o.id === editingSupportOrderId ? { ...supportOrderDraft } : o)),
    }));
    setSupportOrderDraft(EMPTY_SUPPORT_ORDER);
    setEditingSupportOrderId(null);
    setShowSupportOrderForm(false);
  };

  const startEditingOtherChild = (child: OtherChildEntry) => {
    setOtherChildDraft({ ...child });
    setEditingOtherChildId(child.id);
    setShowOtherChildForm(true);
  };

  const handleUpdateOtherChild = () => {
    if (
      !otherChildDraft.firstName.trim() ||
      !otherChildDraft.lastName.trim() ||
      !otherChildDraft.birthDate
    ) {
      setError('Please fill in all required fields for the child.');
      return;
    }
    setError('');

    setForm((prev) => ({
      ...prev,
      otherChildren: (prev.otherChildren || []).map((c) => (c.id === editingOtherChildId ? { ...otherChildDraft } : c)),
    }));
    setOtherChildDraft(EMPTY_OTHER_CHILD);
    setEditingOtherChildId(null);
    setShowOtherChildForm(false);
  };

  const cardBodyRef = React.useRef<HTMLDivElement>(null);

  const scrollCardToTop = () => {
    cardBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const draftKey = user ? `ccap_draft_${user.id}` : null;
  const applicationsKey = user ? `ccap_applications_${user.id}` : null;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!storedUser || !token) {
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setForm((prev) => ({
        ...prev,
        fullName: `${parsed.first_name ?? ''} ${parsed.last_name ?? ''}`.trim(),
        email: parsed.email ?? '',
      }));
      if (localStorage.getItem(`ccap_draft_${parsed.id}`)) {
        setHasSavedDraft(true);
      }
    } catch (e) {
      console.error('Error parsing user data', e);
      router.push('/login');
      return;
    }

    setCheckedAuth(true);
  }, [router]);

  // Keep the top-level applicant fields (used by validation & the review step)
  // in sync with the detailed Custodial Parent Applicant sub-forms.
  const syncFormFromCustodialName = (name: PersonNameInfo) => {
    const fullName = [name.firstName, name.lastName].filter(Boolean).join(' ').trim();
    setForm((prev) => ({
      ...prev,
      fullName: fullName || prev.fullName,
      dob: name.birthDate || prev.dob,
    }));
  };

  const syncFormFromCustodialAddress = (addr: PersonAddressInfo) => {
    const block = addr.mailing.line1 ? addr.mailing : addr.residential;
    const addressStr = [block.line1, block.city, block.state, block.zip].filter(Boolean).join(', ');
    const phone = addr.cellPhone || addr.homePhone;
    setForm((prev) => ({
      ...prev,
      address: addressStr || prev.address,
      phone: phone || prev.phone,
      email: addr.email || prev.email,
    }));
  };

  const updateCustodialName = (patch: Partial<PersonNameInfo>) => {
    const next = { ...details.custodialName, ...patch };
    setDetails((prev) => ({ ...prev, custodialName: next }));
    syncFormFromCustodialName(next);
  };

  const updateCustodialAddressField = (patch: Partial<PersonAddressInfo>) => {
    const next = { ...details.custodialAddress, ...patch };
    setDetails((prev) => ({ ...prev, custodialAddress: next }));
    syncFormFromCustodialAddress(next);
  };

  const updateCustodialAddressBlock = (which: 'residential' | 'mailing', patch: Partial<AddressBlock>) => {
    const next = { ...details.custodialAddress, [which]: { ...details.custodialAddress[which], ...patch } };
    setDetails((prev) => ({ ...prev, custodialAddress: next }));
    syncFormFromCustodialAddress(next);
  };

  const updateCustodialEmployment = (patch: Partial<EmploymentInfo>) => {
    setDetails((prev) => ({ ...prev, custodialEmployment: { ...prev.custodialEmployment, ...patch } }));
  };

  const updateNoncustodialName = (patch: Partial<PersonNameInfo>) => {
    setDetails((prev) => ({ ...prev, noncustodialName: { ...prev.noncustodialName, ...patch } }));
  };

  const updateNoncustodialDescription = (patch: Partial<PhysicalDescriptionInfo>) => {
    setDetails((prev) => ({ ...prev, noncustodialDescription: { ...prev.noncustodialDescription, ...patch } }));
  };

  const updateNoncustodialAddressField = (patch: Partial<PersonAddressInfo>) => {
    setDetails((prev) => ({ ...prev, noncustodialAddress: { ...prev.noncustodialAddress, ...patch } }));
  };

  const updateNoncustodialAddressBlock = (which: 'residential' | 'mailing', patch: Partial<AddressBlock>) => {
    setDetails((prev) => ({
      ...prev,
      noncustodialAddress: { ...prev.noncustodialAddress, [which]: { ...prev.noncustodialAddress[which], ...patch } },
    }));
  };

  const updateNoncustodialEmployment = (patch: Partial<EmploymentInfo>) => {
    setDetails((prev) => ({ ...prev, noncustodialEmployment: { ...prev.noncustodialEmployment, ...patch } }));
  };

  const updateIncomeItem = (field: keyof IncomeInfo, patch: Partial<IncomeItem>) => {
    setDetails((prev) => ({
      ...prev,
      noncustodialIncome: { ...prev.noncustodialIncome, [field]: { ...prev.noncustodialIncome[field], ...patch } },
    }));
  };

  const updateMother = (patch: Partial<RelativeInfo>) => {
    setDetails((prev) => ({ ...prev, noncustodialMother: { ...prev.noncustodialMother, ...patch } }));
  };

  const updateFather = (patch: Partial<RelativeInfo>) => {
    setDetails((prev) => ({ ...prev, noncustodialFather: { ...prev.noncustodialFather, ...patch } }));
  };

  const incomeTotal = useMemo(() => {
    return Object.values(details.noncustodialIncome).reduce((sum, item) => {
      const n = parseFloat(item.amount);
      return sum + (item.has === 'yes' && !Number.isNaN(n) ? n : 0);
    }, 0);
  }, [details.noncustodialIncome]);

  const openSubSection = (key: SubSectionKey) => {
    setActiveSubSection(key);
    scrollCardToTop();
  };

  const closeSubSection = () => {
    if (activeSubSection) {
      setVisitedSubSections((prev) => new Set(prev).add(activeSubSection));
    }
    setActiveSubSection(null);
    scrollCardToTop();
  };

  const handleSubSectionNext = () => {
    if (!activeSubSection) return;

    if (activeSubSection === 'custodial-children' && form.assistanceType === 'full' && form.children.length === 0) {
      setError('A minimum of one child is required to submit your application.');
      return;
    }
    setError('');

    setVisitedSubSections((prev) => new Set(prev).add(activeSubSection));
    const idx = SUB_SECTIONS.findIndex((s) => s.key === activeSubSection);
    const next = SUB_SECTIONS[idx + 1];
    setActiveSubSection(next ? next.key : null);
    scrollCardToTop();
  };

  const handleSubSectionPrevious = () => {
    if (!activeSubSection) return;
    const idx = SUB_SECTIONS.findIndex((s) => s.key === activeSubSection);
    const prev = SUB_SECTIONS[idx - 1];
    setActiveSubSection(prev ? prev.key : null);
    scrollCardToTop();
  };

  const renderHubLink = (label: string, subKey?: SubSectionKey) => {
    if (!subKey) {
      return (
        <a key={label} href="#" className="hub-link" onClick={(e) => e.preventDefault()}>
          {label} <ChevronRight size={16} strokeWidth={2} />
        </a>
      );
    }
    const visited = visitedSubSections.has(subKey);
    return (
      <a
        key={label}
        href="#"
        className={`hub-link ${visited ? 'visited' : ''}`}
        onClick={(e) => { e.preventDefault(); openSubSection(subKey); }}
      >
        <span className="hub-link-label">
          {visited && <Check size={14} strokeWidth={2.5} />}
          {label}
        </span>
        <ChevronRight size={16} strokeWidth={2} />
      </a>
    );
  };

  const currentStep = STEPS[stepIndex];

  const saveDraft = (data: ApplyFormData, atStepIndex: number) => {
    if (!draftKey) return;
    localStorage.setItem(draftKey, JSON.stringify({ data, stepIndex: atStepIndex, details }));
    setHasSavedDraft(true);
  };

  const loadDraft = () => {
    if (!draftKey) return false;
    const raw = localStorage.getItem(draftKey);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      setForm(parsed.data);
      setFurthestStep(parsed.stepIndex ?? 0);
      setStepIndex(parsed.stepIndex ?? 0);
      if (parsed.details) {
        setDetails(parsed.details);
      }
      return true;
    } catch {
      return false;
    }
  };

  const validateStep = (index: number): string => {
    switch (STEPS[index].key) {
      case 'apply':
        if (form.applicationMode === 'saved') {
          if (!hasSavedDraft) return t('apply.step1.noSavedNote');
          return '';
        }
        if (form.applicationMode !== 'new') return t('apply.step1.iWantTo');
        if (!form.applicantType) return t('apply.step1.iAmThe');
        return '';
      case 'agreement':
        if (form.agreementChecks.some((c) => !c)) return t('apply.step2.subtitle');
        if (!form.withholdConsent) return t('apply.step2.withholdQuestion');
        if (!form.redeterminationAck) return t('apply.step2.redetermination');
        return '';
      case 'rights':
        if (form.rightsChecks.some((c) => !c)) return t('apply.step3.infoBanner');
        return '';
      case 'assistance':
        if (!form.assistanceType) return t('apply.step4.infoBanner');
        return '';
      case 'publicAssistance':
        if (!form.receivesPublicAssistance) return t('apply.step5.question');
        return '';
      case 'household':
        if (!form.fullName.trim() || !form.dob.trim() || !form.phone.trim() || !form.email.trim() || !form.address.trim()) {
          return t('field.notApplicableProviderSearch') && '';
        }
        if (!form.householdSize.trim() || !form.monthlyIncome.trim()) {
          return '';
        }
        return '';
      case 'review':
        if (!form.certify) return t('review.certify');
        return '';
      default:
        return '';
    }
  };

  const goToStep = (index: number) => {
    if (index > furthestStep) return;
    setError('');
    setStepIndex(index);
    if (STEPS[index].key === 'household') {
      setActiveSubSection(null);
    }
    scrollCardToTop();
  };

  const handleNext = () => {
    if (currentStep.key === 'apply' && form.applicationMode === 'saved') {
      const err = validateStep(stepIndex);
      if (err) {
        setError(err);
        return;
      }
      if (loadDraft()) {
        setError('');
        return;
      }
    }

    const err = validateStep(stepIndex);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    const next = Math.min(stepIndex + 1, STEPS.length - 1);
    setStepIndex(next);
    if (STEPS[next].key === 'household') {
      setActiveSubSection(null);
    }
    setFurthestStep((prev) => Math.max(prev, next));
    saveDraft(form, next);
    scrollCardToTop();
  };

  const handleBack = () => {
    setError('');
    if (currentStep.key === 'review' && showSignaturePage) {
      setShowSignaturePage(false);
      scrollCardToTop();
      return;
    }
    const prev = Math.max(stepIndex - 1, 0);
    setStepIndex(prev);
    if (STEPS[prev].key === 'household') {
      setActiveSubSection(null);
    }
    scrollCardToTop();
  };

  const handleSaveAndExit = () => {
    saveDraft(form, stepIndex);
    router.push('/parent/dashboard');
  };

  const handleSubmit = () => {
    const err = validateStep(stepIndex);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setSubmitting(true);

    setTimeout(() => {
      const ref = `NDCS-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      if (applicationsKey) {
        const existingRaw = localStorage.getItem(applicationsKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        existing.push({ referenceNumber: ref, submittedAt: new Date().toISOString(), data: form });
        localStorage.setItem(applicationsKey, JSON.stringify(existing));
      }
      if (draftKey) {
        localStorage.removeItem(draftKey);
      }
      setReferenceNumber(ref);
      setSubmitting(false);
      setSubmitted(true);
      scrollCardToTop();
    }, 900);
  };

  const toggleAgreementCheck = (idx: number) => {
    setForm((prev) => {
      const next = [...prev.agreementChecks];
      next[idx] = !next[idx];
      return { ...prev, agreementChecks: next };
    });
  };

  const toggleRightsCheck = (idx: number) => {
    setForm((prev) => {
      const next = [...prev.rightsChecks];
      next[idx] = !next[idx];
      return { ...prev, rightsChecks: next };
    });
  };

  const updateChildDraft = (patch: Partial<ChildEntry>) => {
    setChildDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleAddChild = () => {
    if (
      !childDraft.firstName.trim() ||
      !childDraft.lastName.trim() ||
      !childDraft.gender ||
      !childDraft.birthDate ||
      !childDraft.birthCity ||
      !childDraft.birthState ||
      !childDraft.relationship ||
      !childDraft.paternityEstablished ||
      !childDraft.state
    ) {
      setError(t('apply.step.childValidationMsg') || 'Please fill in all required fields for the child.');
      return;
    }
    setError('');

    const newChild: ChildEntry = { ...childDraft, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    setForm((prev) => ({ ...prev, children: [...prev.children, newChild] }));
    setChildDraft(EMPTY_CHILD);
    setShowChildForm(false);
    scrollCardToTop();
  };

  const handleCancelChild = () => {
    setChildDraft(EMPTY_CHILD);
    setShowChildForm(false);
    setError('');
  };

  const removeChild = (id: string) => {
    setForm((prev) => ({ ...prev, children: prev.children.filter((c) => c.id !== id) }));
    setExpandedChildren((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSaveSupportOrder = () => {
    if (
      !supportOrderDraft.orderType ||
      !supportOrderDraft.orderNumber.trim() ||
      !supportOrderDraft.stateFiled ||
      !supportOrderDraft.dateFiled ||
      !supportOrderDraft.amount.trim() ||
      !supportOrderDraft.frequency ||
      !supportOrderDraft.startDate
    ) {
      setError('Please fill in all required fields for the support order.');
      return;
    }
    setError('');

    const newOrder: SupportOrderEntry = {
      ...supportOrderDraft,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    setForm((prev) => ({
      ...prev,
      supportOrders: [...(prev.supportOrders || []), newOrder],
    }));
    setSupportOrderDraft(EMPTY_SUPPORT_ORDER);
    setShowSupportOrderForm(false);
    scrollCardToTop();
  };

  const removeSupportOrder = (id: string) => {
    setForm((prev) => ({
      ...prev,
      supportOrders: (prev.supportOrders || []).filter((o) => o.id !== id),
    }));
  };

  const handleSaveOtherChild = () => {
    if (
      !otherChildDraft.firstName.trim() ||
      !otherChildDraft.lastName.trim() ||
      !otherChildDraft.birthDate
    ) {
      setError('Please fill in all required fields for the child.');
      return;
    }
    setError('');

    const newChild: OtherChildEntry = {
      ...otherChildDraft,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    setForm((prev) => ({
      ...prev,
      otherChildren: [...(prev.otherChildren || []), newChild],
    }));
    setOtherChildDraft(EMPTY_OTHER_CHILD);
    setShowOtherChildForm(false);
    scrollCardToTop();
  };

  const removeOtherChild = (id: string) => {
    setForm((prev) => ({
      ...prev,
      otherChildren: (prev.otherChildren || []).filter((c) => c.id !== id),
    }));
  };

  const toggleChildExpanded = (id: string) => {
    setExpandedChildren((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const displayStepNum = useMemo(() => {
    if (stepIndex === 0) return 1;
    if (stepIndex >= 1 && stepIndex <= 4) return 2;
    if (stepIndex === 5) return 3;
    return 4;
  }, [stepIndex]);

  const stepProgressLabel = useMemo(
    () => t('apply.stepOf', { n: displayStepNum, total: 4 }),
    [displayStepNum, t]
  );

  const renderSubSectionProgressBar = () => {
    if (!activeSubSection) return null;

    const group = MY_APPLICATION_GROUPS.find((g) => g.subkeys.includes(activeSubSection as any));
    if (!group) return null;

    const totalSubSteps = group.subkeys.length;
    const activeIdx = group.subkeys.indexOf(activeSubSection as any);

    return (
      <div
        className="sub-section-progress-container animate-fade-in"
        style={{
          position: 'sticky',
          top: '-24px',
          zIndex: 10,
          background: 'var(--white)',
          marginLeft: '-32px',
          marginRight: '-32px',
          padding: '8px 32px 32px 32px',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: 16
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {group.label}
          </h3>
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', background: 'rgba(224, 90, 28, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
            {t('apply.stepOf', { n: activeIdx + 1, total: totalSubSteps })}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%', padding: '0 4px' }}>
          {group.subkeys.map((key, idx) => {
            const subSec = SUB_SECTIONS.find((s) => s.key === key);
            if (!subSec) return null;

            const label = t(subSec.labelKey);
            const isActive = activeSubSection === key;
            const isCompleted = activeIdx > idx;

            // Define node style
            let nodeBg = 'var(--white)';
            let nodeBorder = '2px solid var(--border-color)';
            let nodeColor = 'var(--text-secondary)';
            let nodeShadow = 'none';

            if (isActive) {
              nodeBg = 'var(--white)';
              nodeBorder = '2px solid var(--accent)';
              nodeColor = 'var(--accent)';
              nodeShadow = '0 0 0 3px rgba(224, 90, 28, 0.12)';
            } else if (isCompleted) {
              nodeBg = 'var(--success)';
              nodeBorder = '2px solid var(--success)';
              nodeColor = 'var(--white)';
            }

            return (
              <React.Fragment key={key}>
                {/* Connector Line (except for the first item) */}
                {idx > 0 && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      background: activeIdx >= idx ? 'var(--success)' : '#e2e8f0',
                      margin: '0 4px',
                      borderRadius: '1px',
                      transition: 'all 0.3s ease'
                    }}
                  />
                )}

                {/* Step Node & Label */}
                <div
                  onClick={() => {
                    setError('');
                    setActiveSubSection(key);
                    scrollCardToTop();
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    zIndex: 2,
                    position: 'relative',
                    width: '50px',
                    textAlign: 'center'
                  }}
                >
                  {/* Circle Node */}
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: nodeBg,
                      border: nodeBorder,
                      color: nodeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 700,
                      boxShadow: nodeShadow,
                      transition: 'all 0.3s ease',
                      marginBottom: '4px'
                    }}
                  >
                    {isCompleted ? (
                      <Check size={10} strokeWidth={3.5} />
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive
                        ? 'var(--accent)'
                        : isCompleted
                          ? 'var(--success)'
                          : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      transition: 'all 0.3s ease',
                      position: 'absolute',
                      top: '24px'
                    }}
                    title={label}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  if (!checkedAuth || !user) {
    return null;
  }



  return (
    <div className="apply-shell">
      {/* Floating Toast Notification */}
      {error && (
        <div
          className="toast-alert"
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(224, 90, 28, 0.15)',
            borderLeft: '4px solid var(--accent)',
            boxShadow: '0 20px 25px -5px rgba(224, 90, 28, 0.08), 0 8px 10px -6px rgba(224, 90, 28, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
            borderRadius: '12px',
            padding: '14px 20px',
            maxWidth: '90%',
            width: '440px',
            pointerEvents: 'auto',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          role="alert"
        >
          <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <AlertTriangle size={20} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1, fontSize: '13.5px', fontWeight: 600, color: 'var(--primary)', lineHeight: 1.4, textAlign: 'left' }}>
            {error}
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(224, 90, 28, 0.08)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="apply-container">
        <div className="apply-header">
          <div>
            <h1>{t('apply.pageTitle')}</h1>
            <p>{stepProgressLabel} &bull; {t(STEP_LABEL_KEYS[currentStep.key].label)}</p>
          </div>
          <button type="button" className="apply-btn apply-btn-outline" onClick={handleSaveAndExit}>
            <Save size={16} strokeWidth={2} />
            {t('apply.saveExit')}
          </button>
        </div>

        <div className="apply-layout">
          <nav className="apply-sidebar" aria-label="Application steps">
            {SIDEBAR_STEPS.map((sidebarStep, idx) => {
              const isActive = stepIndex >= sidebarStep.startIndex && stepIndex <= sidebarStep.endIndex;
              const isCompleted = stepIndex > sidebarStep.endIndex;
              const state = isCompleted ? 'completed' : isActive ? 'active' : 'upcoming';

              let stepLabel = t(sidebarStep.labelKey);
              let StepIcon = sidebarStep.icon;

              if (sidebarStep.key === 'review' && showSignaturePage && !submitted) {
                stepLabel = 'Signature';
                StepIcon = PenTool;
              }

              return (
                <React.Fragment key={sidebarStep.key}>
                  <button
                    type="button"
                    className={`side-step ${state}`}
                    onClick={() => goToStep(sidebarStep.startIndex)}
                    disabled={sidebarStep.startIndex > furthestStep}
                  >
                    <span className="side-step-icon">
                      {state === 'completed' ? <Check size={18} strokeWidth={2.5} /> : <StepIcon size={18} strokeWidth={1.8} />}
                    </span>
                    <span className="side-step-body">
                      <span className="side-step-num">{idx + 1}</span>
                      <span className="side-step-title">{stepLabel}</span>
                      <span className="side-step-sub">{t(sidebarStep.subKey)}</span>
                    </span>
                  </button>
                  {sidebarStep.key === 'household' && stepIndex === 5 && (
                    <div className="side-substeps-container" style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 12, margin: '4px 0 8px 0' }}>
                      {MY_APPLICATION_GROUPS.map((group) => {
                        const isGroupActive = activeSubSection ? group.subkeys.includes(activeSubSection) : false;
                        return (
                          <button
                            key={group.key}
                            type="button"
                            className={`side-substep ${isGroupActive ? 'active' : ''}`}
                            onClick={() => {
                              setError('');
                              setActiveSubSection(group.firstSubKey);
                              scrollCardToTop();
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 12px',
                              fontSize: '13px',
                              fontWeight: 600,
                              color: isGroupActive ? 'var(--accent)' : 'var(--text-secondary)',
                              background: isGroupActive ? 'rgba(224, 90, 28, 0.08)' : 'transparent',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              textAlign: 'left',
                              marginLeft: '36px',
                              marginRight: '12px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {group.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          <div className="apply-card">
            <div className="apply-card-body" ref={cardBodyRef}>


              {currentStep.key === 'apply' && (
                <div className="animate-fade-in">
                  <InfoBanner>
                    {t('apply.step1.infoBanner')}
                  </InfoBanner>

                  <ChoiceBox label={t('apply.step1.iWantTo')}>
                    <RadioRow
                      name="applicationMode"
                      checked={form.applicationMode === 'new'}
                      onChange={() => setForm((p) => ({ ...p, applicationMode: 'new' }))}
                      title={t('apply.step1.startNewTitle')}
                      description={t('apply.step1.startNewDesc')}
                    />
                    <RadioRow
                      name="applicationMode"
                      checked={form.applicationMode === 'saved'}
                      onChange={() => setForm((p) => ({ ...p, applicationMode: 'saved' }))}
                      title={t('apply.step1.openSavedTitle')}
                      description={t('apply.step1.openSavedDesc')}
                    />
                    {form.applicationMode === 'saved' && !hasSavedDraft && (
                      <div className="choice-inline-note">{t('apply.step1.noSavedNote')}</div>
                    )}
                  </ChoiceBox>

                  {form.applicationMode === 'new' && (
                    <ChoiceBox label={t('apply.step1.iAmThe')}>
                      <RadioRow
                        name="applicantType"
                        checked={form.applicantType === 'parent_guardian'}
                        onChange={() => setForm((p) => ({ ...p, applicantType: 'parent_guardian' }))}
                        title={t('apply.step1.parentTitle')}
                        description={t('apply.step1.parentDesc')}
                      />
                      <RadioRow
                        name="applicantType"
                        checked={form.applicantType === 'relative_caregiver'}
                        onChange={() => setForm((p) => ({ ...p, applicantType: 'relative_caregiver' }))}
                        title={t('apply.step1.relativeTitle')}
                        description={t('apply.step1.relativeDesc')}
                      />
                    </ChoiceBox>
                  )}

                  <p className="required-note"><span className="req">*</span> {t('apply.required')}</p>
                </div>
              )}

              {currentStep.key === 'agreement' && (
                <div className="animate-fade-in">
                  <StepHeading
                    icon={Handshake}
                    title={t('apply.step2.title')}
                    subtitle={t('apply.step2.subtitle')}
                  />

                  <div className="ack-list">
                    {AGREEMENT_ITEM_KEYS.map((textKey, idx) => (
                      <label key={idx} className={`ack-item ${form.agreementChecks[idx] ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={form.agreementChecks[idx]}
                          onChange={() => toggleAgreementCheck(idx)}
                        />
                        <span className="ack-text">
                          {t(textKey)}
                          {idx === AGREEMENT_ITEM_KEYS.length - 1 && (
                            <a href="#program-notice" className="ack-link" onClick={(e) => e.preventDefault()}>
                              <ExternalLink size={13} strokeWidth={2} />
                              {t('apply.step2.programNoticeLink')}
                            </a>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="withhold-box">
                    <div className="withhold-icon"><Info size={16} strokeWidth={2} /></div>
                    <div className="withhold-body">
                      <div className="withhold-title">{t('apply.step2.withholdTitle')}</div>
                      <div className="withhold-row">
                        <p className="withhold-question">
                          {t('apply.step2.withholdQuestion')}
                        </p>
                        <div className="withhold-radio-row">
                          <label className="radio-row radio-row-inline">
                            <input
                              type="radio"
                              name="withhold"
                              checked={form.withholdConsent === 'yes'}
                              onChange={() => setForm((p) => ({ ...p, withholdConsent: 'yes' }))}
                            />
                            <span className="radio-row-text"><strong>{t('apply.common.yes')}</strong></span>
                          </label>
                          <label className="radio-row radio-row-inline">
                            <input
                              type="radio"
                              name="withhold"
                              checked={form.withholdConsent === 'no'}
                              onChange={() => setForm((p) => ({ ...p, withholdConsent: 'no' }))}
                            />
                            <span className="radio-row-text"><strong>{t('apply.common.no')}</strong></span>
                          </label>
                        </div>
                      </div>
                      <ul className="withhold-note-list">
                        <li>{t('apply.step2.withholdNote1')}</li>
                        <li>{t('apply.step2.withholdNote2')}</li>
                        <li>{t('apply.step2.withholdNote3')}</li>
                      </ul>
                    </div>
                  </div>

                  <label className={`ack-item ${form.redeterminationAck ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={form.redeterminationAck}
                      onChange={() => setForm((p) => ({ ...p, redeterminationAck: !p.redeterminationAck }))}
                    />
                    <span className="ack-text">
                      {t('apply.step2.redetermination')}
                    </span>
                  </label>

                  <p className="required-note"><span className="req">*</span> {t('apply.required')}</p>
                </div>
              )}

              {currentStep.key === 'rights' && (
                <div className="animate-fade-in">
                  <StepHeading
                    icon={ShieldCheck}
                    title={t('apply.step3.title')}
                    subtitle={t('apply.step3.infoBanner')}
                  />

                  <p className="ack-intro">{t('apply.step3.intro')}</p>

                  <div className="ack-list">
                    {RIGHTS_ITEM_KEYS.map((textKey, idx) => (
                      <label key={idx} className={`ack-item ${form.rightsChecks[idx] ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          checked={form.rightsChecks[idx]}
                          onChange={() => toggleRightsCheck(idx)}
                        />
                        <span className="ack-text">{t(textKey)}</span>
                      </label>
                    ))}
                  </div>

                  <p className="ack-footnote">
                    {t('apply.step3.footnote')}
                  </p>

                  <p className="required-note"><span className="req">*</span> {t('apply.required')}</p>
                </div>
              )}

              {currentStep.key === 'assistance' && (
                <div className="animate-fade-in">
                  <StepHeading
                    icon={Users}
                    title={t('apply.step4.title')}
                    subtitle={t('apply.step4.infoBanner')}
                  />

                  <div className="service-option-group">
                    <ServiceOption
                      name="assistanceType"
                      checked={form.assistanceType === 'full'}
                      onChange={() => setForm((p) => ({ ...p, assistanceType: 'full' }))}
                      title={t('apply.step4.fullTitle')}
                      description={t('apply.step4.fullDesc')}
                      icon={HandCoins}
                    />
                    <ServiceOption
                      name="assistanceType"
                      checked={form.assistanceType === 'search_only'}
                      onChange={() => setForm((p) => ({ ...p, assistanceType: 'search_only' }))}
                      title={t('apply.step4.searchTitle')}
                      description={t('apply.step4.searchDesc')}
                      icon={Search}
                    />
                  </div>

                  <p className="required-note"><span className="req">*</span> {t('apply.required')}</p>
                </div>
              )}

              {currentStep.key === 'publicAssistance' && (
                <div className="animate-fade-in">
                  <p className="apply-step-subtitle">{t('apply.step5.question')}</p>

                  <div className="withhold-radio-row">
                    <label className="radio-row radio-row-inline">
                      <input
                        type="radio"
                        name="publicAssistance"
                        checked={form.receivesPublicAssistance === 'yes'}
                        onChange={() => setForm((p) => ({ ...p, receivesPublicAssistance: 'yes' }))}
                      />
                      <span className="radio-row-text"><strong>{t('apply.common.yes')}</strong></span>
                    </label>
                    <label className="radio-row radio-row-inline">
                      <input
                        type="radio"
                        name="publicAssistance"
                        checked={form.receivesPublicAssistance === 'no'}
                        onChange={() => setForm((p) => ({ ...p, receivesPublicAssistance: 'no' }))}
                      />
                      <span className="radio-row-text"><strong>{t('apply.common.no')}</strong></span>
                    </label>
                  </div>

                  {form.receivesPublicAssistance === 'yes' && (
                    <div className="choice-inline-note" style={{ marginTop: 18 }}>
                      {t('apply.step5.note')}
                    </div>
                  )}
                </div>
              )}

              {currentStep.key === 'household' && !activeSubSection && (
                <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100%' }}>
                  <div className="hub-header-row">
                    <StepHeading icon={ClipboardList} title={t('apply.hub.title')} />
                    <button
                      type="button"
                      className="apply-btn apply-btn-primary"
                      onClick={() => openSubSection(SUB_SECTIONS[0].key)}
                    >
                      {t('apply.hub.startBtn')}
                      <ArrowRight size={16} strokeWidth={2} />
                    </button>
                  </div>

                  {/*
                  <div className="hub-grid">
                    <div className="hub-col">
                      <div className="hub-col-header">{t('apply.hub.colCustodial')}</div>
                      {renderHubLink(t('apply.hub.myName'), 'custodial-name')}
                      {renderHubLink(t('apply.hub.myAddress'), 'custodial-address')}
                      {renderHubLink(t('apply.hub.myEmployment'), 'custodial-employment')}
                      {renderHubLink(t('apply.hub.myHousehold'), 'custodial-household')}
                    </div>
                    <div className="hub-col">
                      <div className="hub-col-header">{t('apply.hub.colNoncustodial')}</div>
                      {renderHubLink(t('apply.hub.name'), 'noncustodial-name')}
                      {renderHubLink(t('apply.hub.contactInfo'), 'noncustodial-address')}
                      {renderHubLink(t('apply.hub.address'), 'noncustodial-address')}
                      {renderHubLink(t('apply.hub.employment'), 'noncustodial-employment')}
                      {renderHubLink(t('apply.hub.income'), 'noncustodial-income')}
                      {renderHubLink(t('apply.hub.mother'), 'noncustodial-mother')}
                      {renderHubLink(t('apply.hub.father'), 'noncustodial-father')}
                      {renderHubLink(t('apply.hub.siblings'))}
                      {renderHubLink(t('apply.hub.military'))}
                      {renderHubLink(t('apply.hub.criminalHistory'))}
                      {renderHubLink(t('apply.hub.financialAccounts'))}
                      {renderHubLink(t('apply.hub.license'))}
                      {renderHubLink(t('apply.hub.vehicles'))}
                      {renderHubLink(t('apply.hub.property'))}
                    </div>
                    <div className="hub-col">
                      <div className="hub-col-header">{t('apply.hub.colChildren')}</div>
                      {renderHubLink(t('apply.hub.children'), 'custodial-children')}
                    </div>
                    <div className="hub-col">
                      <div className="hub-col-header">{t('apply.hub.colOther')}</div>
                      {renderHubLink(t('apply.hub.supportOrders'), 'other-support-orders')}
                      {renderHubLink(t('apply.hub.otherChildren'), 'other-children')}
                      {renderHubLink(t('apply.hub.otherInformation'), 'other-information')}
                    </div>
                  </div>
                  */}

                  <div className="instructions-container" style={{
                    marginTop: '24px',
                    padding: '24px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 'var(--radius-lg)',
                    lineHeight: '1.6',
                    flex: 1
                  }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px' }}>
                      Instructions for Completing Your Application
                    </h4>
                    <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      To complete Step 3 (My Application), you must fill out the four main sections of the form. You can start by clicking the <strong>Start Application</strong> button above, or click directly on any of the sections listed in the sidebar menu.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                      <div>
                        <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>1. Custodial Parent</h5>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Enter your name, address, employment information, and household details.
                        </p>
                      </div>
                      <div>
                        <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>2. Non-Custodial Parent</h5>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Provide details about the other parent, including name, contact details, address, and employment.
                        </p>
                      </div>
                      <div>
                        <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>3. Children</h5>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Add details for all the children associated with this support request.
                        </p>
                      </div>
                      <div>
                        <h5 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--accent)', marginBottom: '6px' }}>4. Other Information</h5>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Submit details about existing support orders, other children, and optional notes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep.key === 'household' && activeSubSection && (
                <div className="animate-fade-in">
                  {renderSubSectionProgressBar()}

                  {activeSubSection === 'custodial-name' && (
                    <>
                      <FormBar title={t('field.name')} />
                      <div className="field-table" style={{ marginBottom: 8 }}>
                        <FieldRow label={t('field.firstName')} required>
                          <input type="text" value={details.custodialName.firstName} onChange={(e) => updateCustodialName({ firstName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.middleName')}>
                          <input type="text" value={details.custodialName.middleName} onChange={(e) => updateCustodialName({ middleName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.lastName')} required>
                          <input type="text" value={details.custodialName.lastName} onChange={(e) => updateCustodialName({ lastName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.suffix')}>
                          <input type="text" value={details.custodialName.suffix} onChange={(e) => updateCustodialName({ suffix: e.target.value })} placeholder="Jr., Sr., III" />
                        </FieldRow>
                        <FieldRow label={t('field.ssn')} required hint="(Don't include dashes or spaces, e.g., 123456789)">
                          <input type="text" value={details.custodialName.ssn} onChange={(e) => updateCustodialName({ ssn: e.target.value.replace(/[^\d]/g, '') })} maxLength={9} />
                        </FieldRow>
                        <FieldRow label={t('field.gender')} required>
                          <TriRadio
                            name="custodial-gender"
                            value={details.custodialName.gender}
                            onChange={(v) => updateCustodialName({ gender: v as PersonNameInfo['gender'] })}
                            options={[{ value: 'female', label: t('field.female') }, { value: 'male', label: t('field.male') }]}
                          />
                        </FieldRow>
                      </div>

                      <FormBar title={t('field.birth')} />
                      <div className="field-table" style={{ marginBottom: 8 }}>
                        <FieldRow label={t('field.birthDate')} required hint="mm / dd / yyyy">
                          <input type="date" value={details.custodialName.birthDate} onChange={(e) => updateCustodialName({ birthDate: e.target.value })} />
                        </FieldRow>
                      </div>

                      <FormBar title={t('field.maritalStatus')} />
                      <div className="field-table">
                        <FieldRow label={t('field.maritalStatus')} required>
                          <select value={details.custodialName.maritalStatus} onChange={(e) => updateCustodialName({ maritalStatus: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {MARITAL_STATUS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </FieldRow>
                        <FieldRow label={t('field.maidenName')}>
                          <input type="text" value={details.custodialName.maidenName} onChange={(e) => updateCustodialName({ maidenName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.spouseName')}>
                          <input type="text" value={details.custodialName.spouseName} onChange={(e) => updateCustodialName({ spouseName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.dateMarried')}>
                          <input type="date" value={details.custodialName.dateMarried} onChange={(e) => updateCustodialName({ dateMarried: e.target.value })} />
                        </FieldRow>
                      </div>
                    </>
                  )}

                  {activeSubSection === 'custodial-address' && (
                    <>
                      <FormBar title={t('field.residentialAddress')} />
                      <div className="field-table" style={{ marginBottom: 8 }}>
                        <FieldRow label={t('field.addressLine1')} required>
                          <input type="text" value={details.custodialAddress.residential.line1} onChange={(e) => updateCustodialAddressBlock('residential', { line1: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.addressLine2')}>
                          <input type="text" value={details.custodialAddress.residential.line2} onChange={(e) => updateCustodialAddressBlock('residential', { line2: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.city')} required>
                          <input type="text" value={details.custodialAddress.residential.city} onChange={(e) => updateCustodialAddressBlock('residential', { city: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.state')} required>
                          <select value={details.custodialAddress.residential.state} onChange={(e) => updateCustodialAddressBlock('residential', { state: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </FieldRow>
                        <FieldRow label={t('field.zip')} required>
                          <input type="text" value={details.custodialAddress.residential.zip} onChange={(e) => updateCustodialAddressBlock('residential', { zip: e.target.value })} maxLength={10} />
                        </FieldRow>
                      </div>

                      <FormBar title={t('field.mailingAddress')} />
                      <div className="field-table" style={{ marginBottom: 8 }}>
                        <FieldRow label={t('field.addressLine1')}>
                          <input type="text" value={details.custodialAddress.mailing.line1} onChange={(e) => updateCustodialAddressBlock('mailing', { line1: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.addressLine2')}>
                          <input type="text" value={details.custodialAddress.mailing.line2} onChange={(e) => updateCustodialAddressBlock('mailing', { line2: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.city')}>
                          <input type="text" value={details.custodialAddress.mailing.city} onChange={(e) => updateCustodialAddressBlock('mailing', { city: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.state')}>
                          <select value={details.custodialAddress.mailing.state} onChange={(e) => updateCustodialAddressBlock('mailing', { state: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </FieldRow>
                        <FieldRow label={t('field.zip')}>
                          <input type="text" value={details.custodialAddress.mailing.zip} onChange={(e) => updateCustodialAddressBlock('mailing', { zip: e.target.value })} maxLength={10} />
                        </FieldRow>
                      </div>

                      <FormBar title={t('field.phoneEmail')} />
                      <div className="field-table">
                        <FieldRow label={t('field.homePhone')}>
                          <input type="tel" value={details.custodialAddress.homePhone} onChange={(e) => updateCustodialAddressField({ homePhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                        </FieldRow>
                        <FieldRow label={t('field.cellPhone')} required>
                          <input type="tel" value={details.custodialAddress.cellPhone} onChange={(e) => updateCustodialAddressField({ cellPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                        </FieldRow>
                        <FieldRow label={t('field.emergencyPhone')}>
                          <input type="tel" value={details.custodialAddress.emergencyPhone} onChange={(e) => updateCustodialAddressField({ emergencyPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                        </FieldRow>
                        <FieldRow label={t('field.email')} required>
                          <input type="email" value={details.custodialAddress.email} onChange={(e) => updateCustodialAddressField({ email: e.target.value })} />
                        </FieldRow>
                      </div>
                    </>
                  )}

                  {activeSubSection === 'custodial-employment' && (
                    <>
                      <FormBar title={t('field.employer')} />
                      <div className="field-table">
                        <FieldRow label={t('field.currentlyEmployed')} required>
                          <TriRadio
                            name="custodial-employed"
                            value={details.custodialEmployment.currentlyEmployed}
                            onChange={(v) => updateCustodialEmployment({ currentlyEmployed: v as EmploymentInfo['currentlyEmployed'] })}
                            options={[{ value: 'yes', label: t('apply.common.yes') }, { value: 'no', label: t('apply.common.no') }]}
                          />
                        </FieldRow>
                        {details.custodialEmployment.currentlyEmployed === 'yes' && (
                          <>
                            <FieldRow label={t('field.employerName')}>
                              <input type="text" value={details.custodialEmployment.employerName} onChange={(e) => updateCustodialEmployment({ employerName: e.target.value })} />
                            </FieldRow>
                            <FieldRow label={t('field.workPhone')}>
                              <input type="tel" value={details.custodialEmployment.workPhone} onChange={(e) => updateCustodialEmployment({ workPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                            </FieldRow>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {activeSubSection === 'custodial-household' && (
                    <>
                      <FormBar title={t('field.household')} />
                      <div className="field-table">
                        <FieldRow label={t('field.householdSize')} required>
                          <input type="number" min={1} value={form.householdSize} onChange={(e) => setForm((p) => ({ ...p, householdSize: e.target.value }))} placeholder="e.g. 3" />
                        </FieldRow>
                        <FieldRow label={t('field.monthlyIncome')} required>
                          <input type="number" min={0} value={form.monthlyIncome} onChange={(e) => setForm((p) => ({ ...p, monthlyIncome: e.target.value }))} placeholder="e.g. 2400" />
                        </FieldRow>
                        <FieldRow label={t('field.preferredProvider')}>
                          <input type="text" value={form.providerName} onChange={(e) => setForm((p) => ({ ...p, providerName: e.target.value }))} placeholder="Facility or provider name, if known" />
                        </FieldRow>
                      </div>
                    </>
                  )}

                  {activeSubSection === 'custodial-children' && (
                    <>
                      {form.assistanceType === 'full' ? (
                        <>
                          <div className="hub-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <StepHeading
                              icon={Users}
                              title="Children"
                              subtitle={showChildForm ? "Enter your child's information." : "Click the button below to enter your children's information."}
                            />
                            {!showChildForm && (
                              <button
                                type="button"
                                className="apply-btn apply-btn-primary"
                                onClick={() => {
                                  setError('');
                                  setShowChildForm(true);
                                  setChildDraft(EMPTY_CHILD);
                                }}
                                disabled={form.children.length >= 5}
                              >
                                <Plus size={16} strokeWidth={2} />
                                Add Child
                              </button>
                            )}
                          </div>

                          {!showChildForm && (
                            <div className="info-banner" style={{ marginBottom: 24 }}>
                              <div className="info-banner-icon">
                                <Info size={16} strokeWidth={2.5} />
                              </div>
                              <div className="info-banner-text">
                                A minimum of one child is required to submit your application.
                              </div>
                            </div>
                          )}

                          {showChildForm && (
                            <div className="sof-section-container animate-fade-in">
                              <div className="sof-section-body" style={{ padding: 0 }}>
                                <FormBar title="Name" />
                                <div className="ocf-three-col-grid">
                                  <div className="modern-field-group">
                                    <label><span className="req">*</span> First Name:</label>
                                    <input
                                      type="text"
                                      value={childDraft.firstName}
                                      onChange={(e) => updateChildDraft({ firstName: e.target.value })}
                                      className="modern-input"
                                    />
                                  </div>
                                  <div className="modern-field-group">
                                    <label>Middle Name:</label>
                                    <input
                                      type="text"
                                      value={childDraft.middleName}
                                      onChange={(e) => updateChildDraft({ middleName: e.target.value })}
                                      className="modern-input"
                                    />
                                  </div>
                                  <div className="modern-field-group">
                                    <label><span className="req">*</span> Last Name:</label>
                                    <input
                                      type="text"
                                      value={childDraft.lastName}
                                      onChange={(e) => updateChildDraft({ lastName: e.target.value })}
                                      className="modern-input"
                                    />
                                  </div>

                                  <div className="modern-field-group">
                                    <label>Suffix:</label>
                                    <input
                                      type="text"
                                      value={childDraft.suffix}
                                      onChange={(e) => updateChildDraft({ suffix: e.target.value })}
                                      className="modern-input"
                                    />
                                  </div>
                                  <div className="modern-field-group">
                                    <label>Social Security Number:</label>
                                    <input
                                      type="text"
                                      value={childDraft.ssn}
                                      onChange={(e) => updateChildDraft({ ssn: e.target.value.replace(/[^\d]/g, '') })}
                                      maxLength={9}
                                      className="modern-input"
                                    />
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                                      (Don&apos;t include dashes or spaces, e.g., 123456789)
                                    </span>
                                  </div>
                                  <div className="modern-field-group">
                                    <label><span className="req">*</span> Gender:</label>
                                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '13.5px', color: 'var(--foreground)', cursor: 'pointer' }}>
                                        <input
                                          type="radio"
                                          name="child-gender"
                                          checked={childDraft.gender === 'male'}
                                          onChange={() => updateChildDraft({ gender: 'male' })}
                                        />
                                        Male
                                      </label>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '13.5px', color: 'var(--foreground)', cursor: 'pointer' }}>
                                        <input
                                          type="radio"
                                          name="child-gender"
                                          checked={childDraft.gender === 'female'}
                                          onChange={() => updateChildDraft({ gender: 'female' })}
                                        />
                                        Female
                                      </label>
                                    </div>
                                  </div>
                                </div>

                                <FormBar title="Birth" />
                                <div className="ocf-three-col-grid">
                                  <div className="modern-field-group">
                                    <label><span className="req">*</span> Birth Date:</label>
                                    <input
                                      type="date"
                                      value={childDraft.birthDate}
                                      onChange={(e) => updateChildDraft({ birthDate: e.target.value })}
                                      className="modern-input"
                                    />
                                  </div>
                                  <div className="modern-field-group">
                                    <label><span className="req">*</span> Birth City:</label>
                                    <input
                                      type="text"
                                      value={childDraft.birthCity}
                                      onChange={(e) => updateChildDraft({ birthCity: e.target.value })}
                                      className="modern-input"
                                    />
                                  </div>
                                  <div className="modern-field-group">
                                    <label><span className="req">*</span> Birth State:</label>
                                    <select
                                      value={childDraft.birthState}
                                      onChange={(e) => updateChildDraft({ birthState: e.target.value })}
                                      className="modern-input"
                                    >
                                      <option value="">PLEASE SELECT</option>
                                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </div>
                                </div>

                                <FormBar title="Description" />
                                <div className="ocf-three-col-grid">
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> Relationship to Custodian:</label>
                                      <select
                                        value={childDraft.relationship}
                                        onChange={(e) => updateChildDraft({ relationship: e.target.value })}
                                        className="modern-input"
                                      >
                                        <option value="">PLEASE SELECT</option>
                                        {RELATIONSHIP_OPTIONS.map((r) => <option key={r} value={r.toUpperCase()}>{r.toUpperCase()}</option>)}
                                      </select>
                                    </div>
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> State:</label>
                                      <select
                                        value={childDraft.state}
                                        onChange={(e) => updateChildDraft({ state: e.target.value })}
                                        className="modern-input"
                                      >
                                        <option value="">PLEASE SELECT</option>
                                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                  </div>

                                  <div className="modern-field-group">
                                    <label><span className="req">*</span> Paternity Established:</label>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '13.5px', color: 'var(--foreground)', cursor: 'pointer' }}>
                                        <input
                                          type="radio"
                                          name="child-paternity"
                                          checked={childDraft.paternityEstablished === 'yes'}
                                          onChange={() => updateChildDraft({ paternityEstablished: 'yes' })}
                                        />
                                        Yes
                                      </label>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '13.5px', color: 'var(--foreground)', cursor: 'pointer' }}>
                                        <input
                                          type="radio"
                                          name="child-paternity"
                                          checked={childDraft.paternityEstablished === 'no'}
                                          onChange={() => updateChildDraft({ paternityEstablished: 'no' })}
                                        />
                                        No
                                      </label>
                                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '13.5px', color: 'var(--foreground)', cursor: 'pointer' }}>
                                        <input
                                          type="radio"
                                          name="child-paternity"
                                          checked={childDraft.paternityEstablished === 'unknown'}
                                          onChange={() => updateChildDraft({ paternityEstablished: 'unknown' })}
                                        />
                                        Unknown
                                      </label>
                                    </div>
                                  </div>

                                  <div className="modern-field-group">
                                    <label>Paternity Date:</label>
                                    <input
                                      type="date"
                                      value={childDraft.paternityDate}
                                      onChange={(e) => updateChildDraft({ paternityDate: e.target.value })}
                                      className="modern-input"
                                    />
                                  </div>
                                </div>

                                <div className="ocf-actions-row" style={{ borderTop: '1px solid var(--border-color)', justifyContent: 'space-between' }}>
                                  <button
                                    type="button"
                                    className="apply-btn apply-btn-outline"
                                    onClick={handleCancelChild}
                                  >
                                    <X size={16} strokeWidth={2} />
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="apply-btn apply-btn-primary"
                                    onClick={handleAddChild}
                                  >
                                    <Plus size={16} strokeWidth={2} />
                                    Add Child
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {!showChildForm && form.children.length === 0 && (
                            <div className="empty-state-box">
                              <div className="empty-state-icon">
                                <Users size={32} strokeWidth={1.8} />
                              </div>
                              <h4>There are no children at this time.</h4>
                              <p>Please click &ldquo;Add Child&rdquo; to continue.</p>
                            </div>
                          )}

                          {!showChildForm && form.children.length > 0 && (
                            <div className="sof-table-container">
                              <table className="sof-minimal-table">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th>Birth Date</th>
                                    <th>Gender</th>
                                    <th>Relationship</th>
                                    <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {form.children.map((child) => {
                                    const fullName = [child.firstName, child.lastName].filter(Boolean).join(' ');
                                    return (
                                      <tr key={child.id}>
                                        <td style={{ fontWeight: 600 }}>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedChildForView(child)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              padding: 0,
                                              font: 'inherit',
                                              cursor: 'pointer',
                                              color: 'var(--primary)',
                                              textDecoration: 'underline',
                                              textAlign: 'left'
                                            }}
                                          >
                                            {fullName || 'Unnamed Child'}
                                          </button>
                                        </td>
                                        <td>{child.birthDate}</td>
                                        <td>{child.gender === 'male' ? 'Male' : child.gender === 'female' ? 'Female' : '—'}</td>
                                        <td>{child.relationship}</td>
                                        <td>
                                          <button
                                            type="button"
                                            className="sof-table-remove-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeChild(child.id);
                                            }}
                                            title={t('field.removeChild')}
                                          >
                                            <X size={16} strokeWidth={2} />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}

                          <p className="empty-state-footer-text" style={{ marginTop: 16 }}>(Maximum number of children 5)</p>
                          <div style={{ color: 'var(--danger)', fontSize: '13.5px', fontWeight: 600, marginTop: 8 }}>* Required</div>
                        </>
                      ) : (
                        <p className="apply-plain-note" style={{ marginTop: 12 }}>
                          {t('field.notApplicableProviderSearch')}
                        </p>
                      )}
                    </>
                  )}

                  {activeSubSection === 'noncustodial-name' && (
                    <>
                      <FormBar title={t('field.name')} />
                      <div className="field-table" style={{ marginBottom: 8 }}>
                        <FieldRow label={t('field.firstName')} required>
                          <input type="text" value={details.noncustodialName.firstName} onChange={(e) => updateNoncustodialName({ firstName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.middleName')}>
                          <input type="text" value={details.noncustodialName.middleName} onChange={(e) => updateNoncustodialName({ middleName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.lastName')} required>
                          <input type="text" value={details.noncustodialName.lastName} onChange={(e) => updateNoncustodialName({ lastName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.suffix')}>
                          <input type="text" value={details.noncustodialName.suffix} onChange={(e) => updateNoncustodialName({ suffix: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.ssn')} hint="If known">
                          <input type="text" value={details.noncustodialName.ssn} onChange={(e) => updateNoncustodialName({ ssn: e.target.value.replace(/[^\d]/g, '') })} maxLength={9} />
                        </FieldRow>
                        <FieldRow label={t('field.gender')} required>
                          <TriRadio
                            name="noncustodial-gender"
                            value={details.noncustodialName.gender}
                            onChange={(v) => updateNoncustodialName({ gender: v as PersonNameInfo['gender'] })}
                            options={[{ value: 'female', label: t('field.female') }, { value: 'male', label: t('field.male') }]}
                          />
                        </FieldRow>
                      </div>

                      <FormBar title={t('field.birth')} />
                      <div className="field-table" style={{ marginBottom: 8 }}>
                        <FieldRow label={t('field.birthDate')} hint="mm / dd / yyyy">
                          <input type="date" value={details.noncustodialName.birthDate} onChange={(e) => updateNoncustodialName({ birthDate: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.birthCity')}>
                          <input type="text" value={details.noncustodialName.birthCity} onChange={(e) => updateNoncustodialName({ birthCity: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.birthState')}>
                          <select value={details.noncustodialName.birthState} onChange={(e) => updateNoncustodialName({ birthState: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </FieldRow>
                      </div>

                      <FormBar title={t('field.maritalStatus')} />
                      <div className="field-table">
                        <FieldRow label={t('field.maritalStatus')}>
                          <select value={details.noncustodialName.maritalStatus} onChange={(e) => updateNoncustodialName({ maritalStatus: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {MARITAL_STATUS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </FieldRow>
                      </div>
                    </>
                  )}

                  {activeSubSection === 'noncustodial-description' && (
                    <>
                      <FormBar title={t('field.physicalDescription')} />
                      <div className="field-table" style={{ marginBottom: 8 }}>
                        <FieldRow label={t('field.hair')}>
                          <select value={details.noncustodialDescription.hair} onChange={(e) => updateNoncustodialDescription({ hair: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {HAIR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </FieldRow>
                        <FieldRow label={t('field.eyes')}>
                          <select value={details.noncustodialDescription.eyes} onChange={(e) => updateNoncustodialDescription({ eyes: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {EYE_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </FieldRow>
                        <FieldRow label={t('field.weight')}>
                          <input type="number" min={0} value={details.noncustodialDescription.weight} onChange={(e) => updateNoncustodialDescription({ weight: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.heightFeet')}>
                          <select value={details.noncustodialDescription.heightFt} onChange={(e) => updateNoncustodialDescription({ heightFt: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {HEIGHT_FEET_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </FieldRow>
                        <FieldRow label={t('field.heightInches')}>
                          <select value={details.noncustodialDescription.heightIn} onChange={(e) => updateNoncustodialDescription({ heightIn: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {HEIGHT_INCH_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </FieldRow>
                        <FieldRow label={t('field.race')}>
                          <select value={details.noncustodialDescription.race} onChange={(e) => updateNoncustodialDescription({ race: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {RACE_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                        </FieldRow>
                        <FieldRow label={t('field.nickname')}>
                          <input type="text" value={details.noncustodialDescription.nickname} onChange={(e) => updateNoncustodialDescription({ nickname: e.target.value })} />
                        </FieldRow>
                      </div>

                      <FormBar title={t('field.otherFeatures')} />
                      <div className="field-table">
                        <FieldRow label={t('field.otherFeatures')} wide>
                          <textarea
                            rows={4}
                            maxLength={500}
                            value={details.noncustodialDescription.otherFeatures}
                            onChange={(e) => updateNoncustodialDescription({ otherFeatures: e.target.value })}
                          />
                          <span className="char-count">{details.noncustodialDescription.otherFeatures.length}/500 {t('field.charCount')}</span>
                        </FieldRow>
                      </div>
                    </>
                  )}

                  {activeSubSection === 'noncustodial-address' && (
                    <>
                      <FormBar title={t('field.residentialAddress')} />
                      <div className="field-table" style={{ marginBottom: 8 }}>
                        <FieldRow label={t('field.knowsAddressQuestion')}>
                          <TriRadio
                            name="noncustodial-knows-address"
                            value={details.noncustodialAddress.knowsAddress}
                            onChange={(v) => updateNoncustodialAddressField({ knowsAddress: v as PersonAddressInfo['knowsAddress'] })}
                            options={[{ value: 'yes', label: t('apply.common.yes') }, { value: 'no', label: t('apply.common.no') }]}
                          />
                        </FieldRow>
                        {details.noncustodialAddress.knowsAddress === 'yes' && (
                          <>
                            <FieldRow label={t('field.addressLine1')}>
                              <input type="text" value={details.noncustodialAddress.residential.line1} onChange={(e) => updateNoncustodialAddressBlock('residential', { line1: e.target.value })} />
                            </FieldRow>
                            <FieldRow label={t('field.addressLine2')}>
                              <input type="text" value={details.noncustodialAddress.residential.line2} onChange={(e) => updateNoncustodialAddressBlock('residential', { line2: e.target.value })} />
                            </FieldRow>
                            <FieldRow label={t('field.city')}>
                              <input type="text" value={details.noncustodialAddress.residential.city} onChange={(e) => updateNoncustodialAddressBlock('residential', { city: e.target.value })} />
                            </FieldRow>
                            <FieldRow label={t('field.state')}>
                              <select value={details.noncustodialAddress.residential.state} onChange={(e) => updateNoncustodialAddressBlock('residential', { state: e.target.value })}>
                                <option value="">{t('field.pleaseSelect')}</option>
                                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </FieldRow>
                            <FieldRow label={t('field.zip')}>
                              <input type="text" value={details.noncustodialAddress.residential.zip} onChange={(e) => updateNoncustodialAddressBlock('residential', { zip: e.target.value })} maxLength={10} />
                            </FieldRow>
                          </>
                        )}
                      </div>

                      <FormBar title={t('field.mailingAddress')} />
                      <div className="field-table" style={{ marginBottom: 8 }}>
                        <FieldRow label={t('field.addressLine1')}>
                          <input type="text" value={details.noncustodialAddress.mailing.line1} onChange={(e) => updateNoncustodialAddressBlock('mailing', { line1: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.addressLine2')}>
                          <input type="text" value={details.noncustodialAddress.mailing.line2} onChange={(e) => updateNoncustodialAddressBlock('mailing', { line2: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.city')}>
                          <input type="text" value={details.noncustodialAddress.mailing.city} onChange={(e) => updateNoncustodialAddressBlock('mailing', { city: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.state')}>
                          <select value={details.noncustodialAddress.mailing.state} onChange={(e) => updateNoncustodialAddressBlock('mailing', { state: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </FieldRow>
                        <FieldRow label={t('field.zip')}>
                          <input type="text" value={details.noncustodialAddress.mailing.zip} onChange={(e) => updateNoncustodialAddressBlock('mailing', { zip: e.target.value })} maxLength={10} />
                        </FieldRow>
                      </div>

                      <FormBar title={t('field.phoneEmail')} />
                      <div className="field-table">
                        <FieldRow label={t('field.homePhone')}>
                          <input type="tel" value={details.noncustodialAddress.homePhone} onChange={(e) => updateNoncustodialAddressField({ homePhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                        </FieldRow>
                        <FieldRow label={t('field.cellPhone')}>
                          <input type="tel" value={details.noncustodialAddress.cellPhone} onChange={(e) => updateNoncustodialAddressField({ cellPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                        </FieldRow>
                        <FieldRow label={t('field.emergencyPhone')}>
                          <input type="tel" value={details.noncustodialAddress.emergencyPhone} onChange={(e) => updateNoncustodialAddressField({ emergencyPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                        </FieldRow>
                        <FieldRow label={t('field.email')}>
                          <input type="email" value={details.noncustodialAddress.email} onChange={(e) => updateNoncustodialAddressField({ email: e.target.value })} />
                        </FieldRow>
                      </div>
                    </>
                  )}

                  {activeSubSection === 'noncustodial-employment' && (
                    <>
                      <FormBar title={t('field.employer')} />
                      <div className="field-table">
                        <FieldRow label={t('field.currentlyEmployedNoncustodial')}>
                          <TriRadio
                            name="noncustodial-employed"
                            value={details.noncustodialEmployment.currentlyEmployed}
                            onChange={(v) => updateNoncustodialEmployment({ currentlyEmployed: v as EmploymentInfo['currentlyEmployed'] })}
                            options={[{ value: 'yes', label: t('apply.common.yes') }, { value: 'no', label: t('apply.common.no') }, { value: 'unknown', label: t('apply.common.unknown') }]}
                          />
                        </FieldRow>
                        {details.noncustodialEmployment.currentlyEmployed === 'yes' && (
                          <>
                            <FieldRow label={t('field.employerName')}>
                              <input type="text" value={details.noncustodialEmployment.employerName} onChange={(e) => updateNoncustodialEmployment({ employerName: e.target.value })} />
                            </FieldRow>
                            <FieldRow label={t('field.workPhone')}>
                              <input type="tel" value={details.noncustodialEmployment.workPhone} onChange={(e) => updateNoncustodialEmployment({ workPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                            </FieldRow>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {activeSubSection === 'noncustodial-income' && (
                    <>
                      <FormBar title={t('income.title')} />
                      <p className="apply-plain-note" style={{ margin: '12px 0 16px' }}>
                        {t('income.intro')}
                      </p>
                      <div className="income-list">
                        {INCOME_ITEM_KEYS.map(({ key, labelKey }) => {
                          const item = details.noncustodialIncome[key];
                          return (
                            <div className="income-row" key={key}>
                              <div className="income-row-question">{t(labelKey)}</div>
                              <TriRadio
                                name={`income-${key}`}
                                value={item.has}
                                onChange={(v) => updateIncomeItem(key, { has: v as IncomeItem['has'] })}
                                options={[{ value: 'yes', label: t('apply.common.yes') }, { value: 'no', label: t('apply.common.no') }, { value: 'unknown', label: t('apply.common.unknown') }]}
                              />
                              {item.has === 'yes' && (
                                <div className="income-row-amount">
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.amount}
                                    onChange={(e) => updateIncomeItem(key, { amount: e.target.value })}
                                    placeholder="0.00"
                                  />
                                  <span>{t('income.perMonth')}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="income-total-row">
                        <span>{t('income.total')}</span>
                        <strong>${incomeTotal.toFixed(2)}</strong>
                      </div>
                    </>
                  )}

                  {activeSubSection === 'noncustodial-mother' && (
                    <>
                      <FormBar title={t('apply.hub.mother')} />
                      <div className="field-table">
                        <FieldRow label={t('field.firstName')}>
                          <input type="text" value={details.noncustodialMother.firstName} onChange={(e) => updateMother({ firstName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.middleName')}>
                          <input type="text" value={details.noncustodialMother.middleName} onChange={(e) => updateMother({ middleName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.lastName')}>
                          <input type="text" value={details.noncustodialMother.lastName} onChange={(e) => updateMother({ lastName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.maidenNameOnly')}>
                          <input type="text" value={details.noncustodialMother.maidenName} onChange={(e) => updateMother({ maidenName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.deceased')}>
                          <TriRadio name="mother-deceased" value={details.noncustodialMother.deceased} onChange={(v) => updateMother({ deceased: v as RelativeInfo['deceased'] })} options={[{ value: 'yes', label: t('apply.common.yes') }, { value: 'no', label: t('apply.common.no') }]} />
                        </FieldRow>
                        <FieldRow label={t('field.birthCity')}>
                          <input type="text" value={details.noncustodialMother.birthCity} onChange={(e) => updateMother({ birthCity: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.birthState')}>
                          <select value={details.noncustodialMother.birthState} onChange={(e) => updateMother({ birthState: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </FieldRow>
                      </div>
                    </>
                  )}

                  {activeSubSection === 'noncustodial-father' && (
                    <>
                      <FormBar title={t('apply.hub.father')} />
                      <div className="field-table">
                        <FieldRow label={t('field.firstName')}>
                          <input type="text" value={details.noncustodialFather.firstName} onChange={(e) => updateFather({ firstName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.middleName')}>
                          <input type="text" value={details.noncustodialFather.middleName} onChange={(e) => updateFather({ middleName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.lastName')}>
                          <input type="text" value={details.noncustodialFather.lastName} onChange={(e) => updateFather({ lastName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.maidenNameOnly')}>
                          <input type="text" value={details.noncustodialFather.maidenName} onChange={(e) => updateFather({ maidenName: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.deceased')}>
                          <TriRadio name="father-deceased" value={details.noncustodialFather.deceased} onChange={(v) => updateFather({ deceased: v as RelativeInfo['deceased'] })} options={[{ value: 'yes', label: t('apply.common.yes') }, { value: 'no', label: t('apply.common.no') }]} />
                        </FieldRow>
                        <FieldRow label={t('field.birthCity')}>
                          <input type="text" value={details.noncustodialFather.birthCity} onChange={(e) => updateFather({ birthCity: e.target.value })} />
                        </FieldRow>
                        <FieldRow label={t('field.birthState')}>
                          <select value={details.noncustodialFather.birthState} onChange={(e) => updateFather({ birthState: e.target.value })}>
                            <option value="">{t('field.pleaseSelect')}</option>
                            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </FieldRow>
                      </div>
                    </>
                  )}

                  {activeSubSection === 'other-support-orders' && (
                    <>
                      <div className="hub-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <StepHeading icon={FileText} title="Other Information - Support Orders" subtitle="If you have any support orders, click the Add Support Order button below." />
                        {!showSupportOrderForm && (
                          <button
                            type="button"
                            className="apply-btn apply-btn-primary"
                            onClick={() => {
                              setError('');
                              setShowSupportOrderForm(true);
                              setSupportOrderDraft(EMPTY_SUPPORT_ORDER);
                            }}
                            disabled={(form.supportOrders || []).length >= 5}
                          >
                            <Plus size={16} strokeWidth={2} />
                            Add Support Order
                          </button>
                        )}
                      </div>

                      <InfoBanner>
                        You can add up to 5 support orders.
                      </InfoBanner>

                      {showSupportOrderForm && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                          {/* Order Information Section */}
                          <div className="sof-section-container">
                            <div className="sof-section-header">Order Information</div>
                            <div className="sof-section-body">
                              <div className="sof-field-row">
                                <div className="sof-label">Order Type <span className="req">*</span></div>
                                <div className="sof-input-wrapper">
                                  <select
                                    value={supportOrderDraft.orderType}
                                    onChange={(e) => setSupportOrderDraft(p => ({ ...p, orderType: e.target.value }))}
                                  >
                                    <option value="">PLEASE SELECT</option>
                                    <option value="child_support">Child Support</option>
                                    <option value="spousal_support">Spousal Support</option>
                                    <option value="medical_support">Medical Support</option>
                                  </select>
                                </div>
                              </div>
                              <div className="sof-field-row">
                                <div className="sof-label">Order Number <span className="req">*</span></div>
                                <div className="sof-input-wrapper">
                                  <input
                                    type="text"
                                    value={supportOrderDraft.orderNumber}
                                    onChange={(e) => setSupportOrderDraft(p => ({ ...p, orderNumber: e.target.value }))}
                                    placeholder="Order number"
                                    className="modern-input"
                                  />
                                </div>
                              </div>
                              <div className="sof-field-row">
                                <div className="sof-label">State Filed <span className="req">*</span></div>
                                <div className="sof-input-wrapper">
                                  <select
                                    value={supportOrderDraft.stateFiled}
                                    onChange={(e) => setSupportOrderDraft(p => ({ ...p, stateFiled: e.target.value }))}
                                  >
                                    <option value="">PLEASE SELECT</option>
                                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>
                              </div>
                              <div className="sof-field-row">
                                <div className="sof-label">Date Filed <span className="req">*</span></div>
                                <div className="sof-input-wrapper">
                                  <input
                                    type="date"
                                    value={supportOrderDraft.dateFiled}
                                    onChange={(e) => setSupportOrderDraft(p => ({ ...p, dateFiled: e.target.value }))}
                                    className="modern-input"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Support Information Section */}
                          <div className="sof-section-container">
                            <div className="sof-section-header">Support Information</div>
                            <div className="sof-section-body">
                              <div className="sof-grid-2">
                                <div>
                                  <div className="sof-field-row">
                                    <div className="sof-label">Amount <span className="req">*</span></div>
                                    <div className="sof-input-wrapper">
                                      <div className="sof-amount-input-group">
                                        <span className="sof-amount-symbol">$</span>
                                        <input
                                          type="number"
                                          min={0}
                                          value={supportOrderDraft.amount}
                                          onChange={(e) => setSupportOrderDraft(p => ({ ...p, amount: e.target.value }))}
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="sof-field-row">
                                    <div className="sof-label">Frequency <span className="req">*</span></div>
                                    <div className="sof-input-wrapper">
                                      <select
                                        value={supportOrderDraft.frequency}
                                        onChange={(e) => setSupportOrderDraft(p => ({ ...p, frequency: e.target.value }))}
                                      >
                                        <option value="">PLEASE SELECT</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="bi_weekly">Bi-Weekly</option>
                                        <option value="semi_monthly">Semi-Monthly</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                                <div className="sof-divider-col">
                                  <div className="sof-field-row">
                                    <div className="sof-label">Start Date <span className="req">*</span></div>
                                    <div className="sof-input-wrapper">
                                      <input
                                        type="date"
                                        value={supportOrderDraft.startDate}
                                        onChange={(e) => setSupportOrderDraft(p => ({ ...p, startDate: e.target.value }))}
                                        className="modern-input"
                                      />
                                    </div>
                                  </div>
                                  <div className="sof-field-row">
                                    <div className="sof-label">End Date</div>
                                    <div className="sof-input-wrapper">
                                      <input
                                        type="date"
                                        value={supportOrderDraft.endDate}
                                        onChange={(e) => setSupportOrderDraft(p => ({ ...p, endDate: e.target.value }))}
                                        className="modern-input"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Children Section */}
                          <div className="sof-section-container">
                            <div className="sof-section-header">Children</div>
                            <div className="sof-section-body">
                              <div className="sof-field-row">
                                <div className="sof-label">Children Covered</div>
                                <div className="sof-input-wrapper">
                                  {form.children.length === 0 ? (
                                    <div className="sof-checkbox-group">
                                      <label>
                                        <input type="checkbox" disabled checked />
                                        <span>PLEASE SELECT</span>
                                      </label>
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                      {form.children.map((child) => {
                                        const fullName = [child.firstName, child.lastName].filter(Boolean).join(' ');
                                        const isChecked = supportOrderDraft.childrenCovered.includes(child.id);
                                        return (
                                          <div className="sof-checkbox-group" key={child.id}>
                                            <label>
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                  const next = e.target.checked
                                                    ? [...supportOrderDraft.childrenCovered, child.id]
                                                    : supportOrderDraft.childrenCovered.filter(id => id !== child.id);
                                                  setSupportOrderDraft(p => ({ ...p, childrenCovered: next }));
                                                }}
                                              />
                                              <span>{fullName || 'Unnamed Child'}</span>
                                            </label>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                      {!showSupportOrderForm && (!form.supportOrders || form.supportOrders.length === 0) && (
                        <div className="empty-state-box">
                          <div className="empty-state-icon">
                            <FileText size={32} strokeWidth={1.8} />
                          </div>
                          <h4>There are no support orders.</h4>
                          <p>Click &ldquo;Add Support Order&rdquo; to add a support order.</p>
                        </div>
                      )}

                      {!showSupportOrderForm && form.supportOrders && form.supportOrders.length > 0 && (
                        <div className="sof-table-container">
                          <table className="sof-minimal-table">
                            <thead>
                              <tr>
                                <th>Order Number</th>
                                <th>Order Type</th>
                                <th>State Filed</th>
                                <th>Amount</th>
                                <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {form.supportOrders.map((order) => (
                                <tr key={order.id}>
                                  <td style={{ fontWeight: 600 }}>{order.orderNumber}</td>
                                  <td>
                                    {order.orderType === 'child_support' ? 'Child Support' : order.orderType === 'spousal_support' ? 'Spousal Support' : 'Medical Support'}
                                  </td>
                                  <td>{order.stateFiled}</td>
                                  <td>${order.amount} ({order.frequency})</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="sof-table-remove-btn"
                                      onClick={() => removeSupportOrder(order.id)}
                                      title="Remove Support Order"
                                      style={{ margin: '0 auto' }}
                                    >
                                      <X size={16} strokeWidth={2} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <p className="empty-state-footer-text">(Maximum number of support orders 5)</p>
                    </>
                  )}

                  {activeSubSection === 'other-children' && (
                    <>
                      <div className="hub-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <StepHeading icon={Users} title="Other Information - Other Children" subtitle="If you know of any other children for whom the noncustodial parent is legally responsible, click the Add Other Child button." />
                        {!showOtherChildForm && (
                          <button
                            type="button"
                            className="apply-btn apply-btn-primary"
                            onClick={() => {
                              setError('');
                              setShowOtherChildForm(true);
                              setOtherChildDraft(EMPTY_OTHER_CHILD);
                            }}
                            disabled={(form.otherChildren || []).length >= 8}
                          >
                            <Plus size={16} strokeWidth={2} />
                            Add Other Child
                          </button>
                        )}
                      </div>

                      <div className="info-banner">
                        <div className="info-banner-icon">
                          <Info size={16} strokeWidth={2.5} />
                        </div>
                        <div className="info-banner-text">
                          You can add up to 8 other children.
                        </div>
                      </div>

                      {showOtherChildForm && (
                        <div className="sof-section-container animate-fade-in">
                          <div className="sof-section-header" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Other Child</div>
                          <div className="sof-section-body" style={{ padding: 0 }}>
                            <div className="other-child-form-grid">
                              <div className="ocf-label-col">
                                <div className="ocf-label-row"><span className="req">*</span> First Name:</div>
                                <div className="ocf-label-row">Middle Name:</div>
                                <div className="ocf-label-row"><span className="req">*</span> Last Name:</div>
                                <div className="ocf-label-row">Suffix:</div>
                                <div className="ocf-label-row"><span className="req">*</span> Birth Date:</div>
                              </div>
                              <div className="ocf-input-col">
                                <div className="ocf-input-row">
                                  <input
                                    type="text"
                                    value={otherChildDraft.firstName}
                                    onChange={(e) => setOtherChildDraft(p => ({ ...p, firstName: e.target.value }))}
                                    placeholder="Enter first name"
                                  />
                                </div>
                                <div className="ocf-input-row">
                                  <input
                                    type="text"
                                    value={otherChildDraft.middleName}
                                    onChange={(e) => setOtherChildDraft(p => ({ ...p, middleName: e.target.value }))}
                                    placeholder="Enter middle name (optional)"
                                  />
                                </div>
                                <div className="ocf-input-row">
                                  <input
                                    type="text"
                                    value={otherChildDraft.lastName}
                                    onChange={(e) => setOtherChildDraft(p => ({ ...p, lastName: e.target.value }))}
                                    placeholder="Enter last name"
                                  />
                                </div>
                                <div className="ocf-input-row">
                                  <input
                                    type="text"
                                    value={otherChildDraft.suffix}
                                    onChange={(e) => setOtherChildDraft(p => ({ ...p, suffix: e.target.value }))}
                                    placeholder="Enter suffix (optional)"
                                  />
                                </div>
                                <div className="ocf-input-row">
                                  <input
                                    type="date"
                                    value={otherChildDraft.birthDate}
                                    onChange={(e) => setOtherChildDraft(p => ({ ...p, birthDate: e.target.value }))}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="ocf-actions-row">
                              <button
                                type="button"
                                className="apply-btn apply-btn-outline"
                                onClick={() => {
                                  setError('');
                                  setShowOtherChildForm(false);
                                  setOtherChildDraft(EMPTY_OTHER_CHILD);
                                }}
                              >
                                <X size={16} strokeWidth={2} />
                                Cancel
                              </button>
                              <button
                                type="button"
                                className="apply-btn apply-btn-primary"
                                onClick={handleSaveOtherChild}
                              >
                                <Plus size={16} strokeWidth={2} />
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {!showOtherChildForm && (!form.otherChildren || form.otherChildren.length === 0) && (
                        <div className="empty-state-box">
                          <div className="empty-state-icon">
                            <Users size={32} strokeWidth={1.8} />
                          </div>
                          <h4>There are no other children at this time.</h4>
                          <p>Click &ldquo;Add Other Child&rdquo; to add a child.</p>
                        </div>
                      )}

                      {!showOtherChildForm && form.otherChildren && form.otherChildren.length > 0 && (
                        <div className="sof-table-container">
                          <table className="sof-minimal-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Birth Date</th>
                                <th style={{ width: 80, textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {form.otherChildren.map((child) => (
                                <tr key={child.id}>
                                  <td style={{ fontWeight: 600 }}>
                                    {[child.firstName, child.lastName].filter(Boolean).join(' ')}
                                  </td>
                                  <td>{child.birthDate}</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="sof-table-remove-btn"
                                      onClick={() => removeOtherChild(child.id)}
                                      title="Remove Child"
                                      style={{ margin: '0 auto' }}
                                    >
                                      <X size={16} strokeWidth={2} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      <p className="empty-state-footer-text">(Maximum number of children 8)</p>
                    </>
                  )}

                  {activeSubSection === 'other-information' && (
                    <>
                      <div className="hub-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <StepHeading icon={MessageSquare} title="Other Information" subtitle="Provide us with any other information that may be helpful." />
                      </div>

                      <div className="sof-section-container animate-fade-in" style={{ marginTop: 16 }}>
                        <div className="sof-section-header" style={{ textTransform: 'none', letterSpacing: 'normal' }}>Other Information</div>
                        <div className="sof-section-body" style={{ padding: '24px' }}>
                          <textarea
                            value={form.otherInformationText || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.length <= 4000) {
                                setForm(p => ({ ...p, otherInformationText: val }));
                              }
                            }}
                            className="ocf-textarea"
                            placeholder="Enter any other details here..."
                            rows={12}
                            style={{
                              width: '100%',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '12px',
                              outline: 'none',
                              fontSize: '14px',
                              resize: 'vertical',
                              minHeight: '240px'
                            }}
                          />
                          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 8 }}>
                            {4000 - (form.otherInformationText || '').length} characters left
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {currentStep.key === 'review' && (
                <div className="animate-fade-in">
                  {submitted ? (
                    <div className="animate-fade-in" style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
                        <div style={{
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#22c55e',
                          flexShrink: 0
                        }}>
                          <Check size={28} strokeWidth={3} />
                        </div>
                        <div>
                          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>Application Complete</h2>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 6, lineHeight: 1.5 }}>
                            Your Child Support application has been submitted successfully. Thank you for providing the information needed to process your request.
                            <br />
                            You will be contacted if we need additional information.
                          </p>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

                      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(15, 42, 74, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--primary)',
                          flexShrink: 0
                        }}>
                          <MessageSquare size={18} strokeWidth={2} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                            A confirmation email has been sent to <strong>{form.email || user?.email || 'demo.parent@email.com'}</strong>.
                          </p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Please save the reference number below for your records.
                          </p>
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '20px',
                        textAlign: 'center',
                        marginBottom: 24
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Your Reference Number
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)', marginTop: 8, letterSpacing: '0.02em' }}>
                          {referenceNumber}
                        </div>
                      </div>

                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '16px 0 8px 0' }}>
                        You can check the status of your application anytime from your dashboard.
                      </p>
                      <div style={{ marginBottom: 24 }}>
                        <Link href="/parent/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--primary)', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                          Go to My Applications <ArrowRight size={14} strokeWidth={2} />
                        </Link>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 32,
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: 24
                      }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <Link href="/parent/dashboard" className="apply-btn apply-btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Save size={16} strokeWidth={2} />
                            Go to Dashboard
                          </Link>
                          <button type="button" className="apply-btn apply-btn-outline" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <FileText size={16} strokeWidth={2} />
                            Print Application
                          </button>
                        </div>
                        <Link href="/parent/dashboard" className="apply-btn apply-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          Close
                          <ArrowRight size={16} strokeWidth={2} />
                        </Link>
                      </div>
                    </div>
                  ) : showSignaturePage ? (
                    <div className="animate-fade-in">
                      <div className="hub-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <StepHeading icon={PenTool} title="Signature" subtitle="" />
                      </div>

                      <p style={{ fontSize: '14.5px', color: 'var(--foreground)', lineHeight: 1.5, marginBottom: 16 }}>
                        I certify that all of the information supplied by me is true and correct to the best of my knowledge and belief.
                        <br />
                        My signature on this document constitutes a contract and authorizes Child Support to provide necessary and appropriate services on my behalf.
                      </p>

                      <div className="info-banner" style={{ marginBottom: 24 }}>
                        <div className="info-banner-icon">
                          <Info size={16} strokeWidth={2.5} />
                        </div>
                        <div className="info-banner-text">
                          By checking the box below, you are signing this application electronically and agreeing to the above statement.
                        </div>
                      </div>

                      <div className="sof-section-container">
                        <div className="sof-section-body" style={{ padding: '32px 24px', textAlign: 'center' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: '15px', fontWeight: 600, color: 'var(--foreground)', cursor: 'pointer', marginBottom: 24 }}>
                            <input
                              type="checkbox"
                              checked={soSworn}
                              onChange={(e) => setSoSworn(e.target.checked)}
                              style={{ width: 18, height: 18 }}
                            />
                            <span>So sworn and affirmed</span>
                          </label>

                          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '16px 0 24px 0' }} />

                          <div>
                            <button
                              type="button"
                              className="apply-btn apply-btn-primary"
                              disabled={!soSworn || submitting}
                              onClick={handleSubmit}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px' }}
                            >
                              {submitting ? 'Submitting...' : 'I AGREE'}
                              <ArrowRight size={16} strokeWidth={2} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="apply-step-subtitle">{t('review.subtitle')}</p>

                      {/* SECTION 1: APPLICATION PREFERENCES */}
                      <div className="review-section">
                        <div className="review-section-header">
                          <h3>Application Type & Service Preferences</h3>
                          {editingSection === 'pref' ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={cancelEditingSection}>Cancel</button>
                              <button type="button" className="apply-btn apply-btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={saveEditingSection}>Save</button>
                            </div>
                          ) : (
                            <button type="button" className="review-edit-link" onClick={() => startEditingSection('pref')}>{t('review.edit')}</button>
                          )}
                        </div>
                        {editingSection === 'pref' ? (
                          <div className="review-edit-form-container">
                            <ChoiceBox label="I want to:">
                              <RadioRow name="app-mode" checked={form.applicationMode === 'new'} onChange={() => setForm(p => ({ ...p, applicationMode: 'new' }))} title="Start a New Application" />
                              <RadioRow name="app-mode" checked={form.applicationMode === 'saved'} onChange={() => setForm(p => ({ ...p, applicationMode: 'saved' }))} title="Resume a Saved Application" />
                            </ChoiceBox>
                            <ChoiceBox label="I am the:">
                              <RadioRow name="app-type" checked={form.applicantType === 'parent_guardian'} onChange={() => setForm(p => ({ ...p, applicantType: 'parent_guardian' }))} title="Parent or Guardian" description="I am applying for child support services for a child in my custody." />
                              <RadioRow name="app-type" checked={form.applicantType === 'relative_caregiver'} onChange={() => setForm(p => ({ ...p, applicantType: 'relative_caregiver' }))} title="Relative or Caregiver" description="I am caring for a child who is not my biological child." />
                            </ChoiceBox>
                            <ChoiceBox label="Service requested:">
                              <RadioRow name="assistance-type" checked={form.assistanceType === 'full'} onChange={() => setForm(p => ({ ...p, assistanceType: 'full' }))} title="Full Services" description="Locating parents, establishing paternity, establishing/modifying/enforcing support orders." />
                              <RadioRow name="assistance-type" checked={form.assistanceType === 'search_only'} onChange={() => setForm(p => ({ ...p, assistanceType: 'search_only' }))} title="Locate / Search Only" description="Locate services only, without enforcement or paternity establishment." />
                            </ChoiceBox>
                            <ChoiceBox label="Receiving Public Assistance:">
                              <RadioRow name="public-assist" checked={form.receivesPublicAssistance === 'yes'} onChange={() => setForm(p => ({ ...p, receivesPublicAssistance: 'yes' }))} title="Yes" description="Receiving TANF, Medicaid, SNAP, etc." />
                              <RadioRow name="public-assist" checked={form.receivesPublicAssistance === 'no'} onChange={() => setForm(p => ({ ...p, receivesPublicAssistance: 'no' }))} title="No" />
                            </ChoiceBox>
                          </div>
                        ) : (
                          <div className="review-section-body review-data-grid">
                            <div className="review-data-item">
                              <span className="review-item-label">Applicant Type</span>
                              <span className="review-item-value">{form.applicantType === 'parent_guardian' ? 'Parent or Guardian' : form.applicantType === 'relative_caregiver' ? 'Relative or Caregiver' : '—'}</span>
                            </div>
                            <div className="review-data-item">
                              <span className="review-item-label">Application Mode</span>
                              <span className="review-item-value">{form.applicationMode === 'new' ? 'Start a New Application' : form.applicationMode === 'saved' ? 'Resume a Saved Application' : '—'}</span>
                            </div>
                            <div className="review-data-item">
                              <span className="review-item-label">Service Type</span>
                              <span className="review-item-value">{form.assistanceType === 'full' ? 'Full Services' : form.assistanceType === 'search_only' ? 'Locate / Search Only' : '—'}</span>
                            </div>
                            <div className="review-data-item">
                              <span className="review-item-label">Receives Public Assistance</span>
                              <span className="review-item-value">{form.receivesPublicAssistance === 'yes' ? 'Yes' : form.receivesPublicAssistance === 'no' ? 'No' : '—'}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* SECTION 2: CUSTODIAL PARENT PROFILE */}
                      <div className="review-section">
                        <div className="review-section-header">
                          <h3>Custodial Parent Profile</h3>
                          {editingSection === 'custodial-profile' ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={cancelEditingSection}>Cancel</button>
                              <button type="button" className="apply-btn apply-btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={saveEditingSection}>Save</button>
                            </div>
                          ) : (
                            <button type="button" className="review-edit-link" onClick={() => startEditingSection('custodial-profile')}>{t('review.edit')}</button>
                          )}
                        </div>
                        {editingSection === 'custodial-profile' ? (
                          <div className="review-edit-form-container">
                            <FormBar title="Personal Details" />
                            <div className="field-table" style={{ marginBottom: 16 }}>
                              <FieldRow label="First Name" required>
                                <input type="text" value={details.custodialName.firstName} onChange={(e) => updateCustodialName({ firstName: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="Middle Name">
                                <input type="text" value={details.custodialName.middleName} onChange={(e) => updateCustodialName({ middleName: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="Last Name" required>
                                <input type="text" value={details.custodialName.lastName} onChange={(e) => updateCustodialName({ lastName: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="Suffix">
                                <input type="text" value={details.custodialName.suffix} onChange={(e) => updateCustodialName({ suffix: e.target.value })} placeholder="Jr., Sr., III" />
                              </FieldRow>
                              <FieldRow label="SSN" required hint="(9 digits, numbers only)">
                                <input type="text" value={details.custodialName.ssn} onChange={(e) => updateCustodialName({ ssn: e.target.value.replace(/[^\d]/g, '') })} maxLength={9} />
                              </FieldRow>
                              <FieldRow label="Gender" required>
                                <TriRadio
                                  name="custodial-gender-edit"
                                  value={details.custodialName.gender}
                                  onChange={(v) => updateCustodialName({ gender: v as PersonNameInfo['gender'] })}
                                  options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]}
                                />
                              </FieldRow>
                              <FieldRow label="Birth Date" required>
                                <input type="date" value={details.custodialName.birthDate} onChange={(e) => updateCustodialName({ birthDate: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="Marital Status" required>
                                <select value={details.custodialName.maritalStatus} onChange={(e) => updateCustodialName({ maritalStatus: e.target.value })}>
                                  <option value="">Please Select</option>
                                  {MARITAL_STATUS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </FieldRow>
                              <FieldRow label="Maiden Name">
                                <input type="text" value={details.custodialName.maidenName} onChange={(e) => updateCustodialName({ maidenName: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="Spouse Name">
                                <input type="text" value={details.custodialName.spouseName} onChange={(e) => updateCustodialName({ spouseName: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="Date Married">
                                <input type="date" value={details.custodialName.dateMarried} onChange={(e) => updateCustodialName({ dateMarried: e.target.value })} />
                              </FieldRow>
                            </div>

                            <FormBar title="Residential Address" />
                            <div className="field-table" style={{ marginBottom: 16 }}>
                              <FieldRow label="Address Line 1" required>
                                <input type="text" value={details.custodialAddress.residential.line1} onChange={(e) => updateCustodialAddressBlock('residential', { line1: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="Address Line 2">
                                <input type="text" value={details.custodialAddress.residential.line2} onChange={(e) => updateCustodialAddressBlock('residential', { line2: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="City" required>
                                <input type="text" value={details.custodialAddress.residential.city} onChange={(e) => updateCustodialAddressBlock('residential', { city: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="State" required>
                                <select value={details.custodialAddress.residential.state} onChange={(e) => updateCustodialAddressBlock('residential', { state: e.target.value })}>
                                  <option value="">Please Select</option>
                                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </FieldRow>
                              <FieldRow label="Zip Code" required>
                                <input type="text" value={details.custodialAddress.residential.zip} onChange={(e) => updateCustodialAddressBlock('residential', { zip: e.target.value })} maxLength={10} />
                              </FieldRow>
                            </div>

                            <FormBar title="Mailing Address" />
                            <div className="field-table" style={{ marginBottom: 16 }}>
                              <FieldRow label="Address Line 1">
                                <input type="text" value={details.custodialAddress.mailing.line1} onChange={(e) => updateCustodialAddressBlock('mailing', { line1: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="Address Line 2">
                                <input type="text" value={details.custodialAddress.mailing.line2} onChange={(e) => updateCustodialAddressBlock('mailing', { line2: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="City">
                                <input type="text" value={details.custodialAddress.mailing.city} onChange={(e) => updateCustodialAddressBlock('mailing', { city: e.target.value })} />
                              </FieldRow>
                              <FieldRow label="State">
                                <select value={details.custodialAddress.mailing.state} onChange={(e) => updateCustodialAddressBlock('mailing', { state: e.target.value })}>
                                  <option value="">Please Select</option>
                                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </FieldRow>
                              <FieldRow label="Zip Code">
                                <input type="text" value={details.custodialAddress.mailing.zip} onChange={(e) => updateCustodialAddressBlock('mailing', { zip: e.target.value })} maxLength={10} />
                              </FieldRow>
                            </div>

                            <FormBar title="Contact Details" />
                            <div className="field-table" style={{ marginBottom: 16 }}>
                              <FieldRow label="Home Phone">
                                <input type="tel" value={details.custodialAddress.homePhone} onChange={(e) => updateCustodialAddressField({ homePhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                              </FieldRow>
                              <FieldRow label="Cell Phone" required>
                                <input type="tel" value={details.custodialAddress.cellPhone} onChange={(e) => updateCustodialAddressField({ cellPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                              </FieldRow>
                              <FieldRow label="Emergency Phone">
                                <input type="tel" value={details.custodialAddress.emergencyPhone} onChange={(e) => updateCustodialAddressField({ emergencyPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                              </FieldRow>
                              <FieldRow label="Email" required>
                                <input type="email" value={details.custodialAddress.email} onChange={(e) => updateCustodialAddressField({ email: e.target.value })} />
                              </FieldRow>
                            </div>

                            <FormBar title="Employment" />
                            <div className="field-table">
                              <FieldRow label="Currently Employed" required>
                                <TriRadio
                                  name="custodial-employed-edit"
                                  value={details.custodialEmployment.currentlyEmployed}
                                  onChange={(v) => updateCustodialEmployment({ currentlyEmployed: v as EmploymentInfo['currentlyEmployed'] })}
                                  options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                                />
                              </FieldRow>
                              {details.custodialEmployment.currentlyEmployed === 'yes' && (
                                <>
                                  <FieldRow label="Employer Name">
                                    <input type="text" value={details.custodialEmployment.employerName} onChange={(e) => updateCustodialEmployment({ employerName: e.target.value })} />
                                  </FieldRow>
                                  <FieldRow label="Work Phone">
                                    <input type="tel" value={details.custodialEmployment.workPhone} onChange={(e) => updateCustodialEmployment({ workPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                                  </FieldRow>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="review-section-body review-data-grid">
                            <div className="review-data-item"><span className="review-item-label">Full Name</span><span className="review-item-value">{[details.custodialName.firstName, details.custodialName.middleName, details.custodialName.lastName, details.custodialName.suffix].filter(Boolean).join(' ') || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Gender</span><span className="review-item-value">{details.custodialName.gender ? details.custodialName.gender.toUpperCase() : '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">SSN</span><span className="review-item-value">{details.custodialName.ssn || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Birth Date</span><span className="review-item-value">{details.custodialName.birthDate || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Marital Status</span><span className="review-item-value">{details.custodialName.maritalStatus || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Maiden Name</span><span className="review-item-value">{details.custodialName.maidenName || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Spouse Name</span><span className="review-item-value">{details.custodialName.spouseName || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Residential Address</span><span className="review-item-value">{[details.custodialAddress.residential.line1, details.custodialAddress.residential.line2, details.custodialAddress.residential.city, details.custodialAddress.residential.state, details.custodialAddress.residential.zip].filter(Boolean).join(', ') || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Mailing Address</span><span className="review-item-value">{[details.custodialAddress.mailing.line1, details.custodialAddress.mailing.line2, details.custodialAddress.mailing.city, details.custodialAddress.mailing.state, details.custodialAddress.mailing.zip].filter(Boolean).join(', ') || 'Same as residential'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Cell Phone</span><span className="review-item-value">{details.custodialAddress.cellPhone || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Home Phone</span><span className="review-item-value">{details.custodialAddress.homePhone || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Email</span><span className="review-item-value">{details.custodialAddress.email || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Employment Status</span><span className="review-item-value">{details.custodialEmployment.currentlyEmployed === 'yes' ? `Employed at ${details.custodialEmployment.employerName || '—'}` : 'Not Employed'}</span></div>
                          </div>
                        )}
                      </div>

                      {/* SECTION 3: HOUSEHOLD INFORMATION */}
                      <div className="review-section">
                        <div className="review-section-header">
                          <h3>Household Information</h3>
                          {editingSection === 'household-info' ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={cancelEditingSection}>Cancel</button>
                              <button type="button" className="apply-btn apply-btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={saveEditingSection}>Save</button>
                            </div>
                          ) : (
                            <button type="button" className="review-edit-link" onClick={() => startEditingSection('household-info')}>{t('review.edit')}</button>
                          )}
                        </div>
                        {editingSection === 'household-info' ? (
                          <div className="review-edit-form-container">
                            <div className="field-table">
                              <FieldRow label="Household Size" required>
                                <input type="number" min={1} value={form.householdSize} onChange={(e) => setForm((p) => ({ ...p, householdSize: e.target.value }))} placeholder="e.g. 3" />
                              </FieldRow>
                              <FieldRow label="Monthly Income" required>
                                <input type="number" min={0} value={form.monthlyIncome} onChange={(e) => setForm((p) => ({ ...p, monthlyIncome: e.target.value }))} placeholder="e.g. 2400" />
                              </FieldRow>
                              <FieldRow label="Preferred Provider">
                                <input type="text" value={form.providerName} onChange={(e) => setForm((p) => ({ ...p, providerName: e.target.value }))} placeholder="Facility or provider name, if known" />
                              </FieldRow>
                            </div>
                          </div>
                        ) : (
                          <div className="review-section-body review-data-grid">
                            <div className="review-data-item"><span className="review-item-label">Household Size</span><span className="review-item-value">{form.householdSize || '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Monthly Income</span><span className="review-item-value">{form.monthlyIncome ? `$${form.monthlyIncome}` : '—'}</span></div>
                            <div className="review-data-item"><span className="review-item-label">Preferred Provider</span><span className="review-item-value">{form.providerName || '—'}</span></div>
                          </div>
                        )}
                      </div>

                      {/* SECTION 4: CHILDREN DETAILS */}
                      {form.assistanceType === 'full' && (
                        <div className="review-section">
                          <div className="review-section-header">
                            <h3>Children Associated with Request</h3>
                            {editingSection === 'children-info' ? (
                              <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={cancelEditingSection}>Done</button>
                            ) : (
                              <button type="button" className="review-edit-link" onClick={() => startEditingSection('children-info')}>{t('review.edit')}</button>
                            )}
                          </div>
                          {editingSection === 'children-info' ? (
                            <div className="review-edit-form-container">
                              {showChildForm ? (
                                <div className="sof-section-container animate-fade-in" style={{ padding: '16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)' }}>
                                    {editingChildId ? 'Edit Child Details' : 'Add New Child'}
                                  </h4>
                                  
                                  <FormBar title="Name" />
                                  <div className="ocf-three-col-grid">
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> First Name:</label>
                                      <input type="text" value={childDraft.firstName} onChange={(e) => updateChildDraft({ firstName: e.target.value })} className="modern-input" />
                                    </div>
                                    <div className="modern-field-group">
                                      <label>Middle Name:</label>
                                      <input type="text" value={childDraft.middleName} onChange={(e) => updateChildDraft({ middleName: e.target.value })} className="modern-input" />
                                    </div>
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> Last Name:</label>
                                      <input type="text" value={childDraft.lastName} onChange={(e) => updateChildDraft({ lastName: e.target.value })} className="modern-input" />
                                    </div>
                                    <div className="modern-field-group">
                                      <label>Suffix:</label>
                                      <input type="text" value={childDraft.suffix} onChange={(e) => updateChildDraft({ suffix: e.target.value })} className="modern-input" />
                                    </div>
                                    <div className="modern-field-group">
                                      <label>Social Security Number:</label>
                                      <input type="text" value={childDraft.ssn} onChange={(e) => updateChildDraft({ ssn: e.target.value.replace(/[^\d]/g, '') })} maxLength={9} className="modern-input" />
                                    </div>
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> Gender:</label>
                                      <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                                        <label style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                          <input type="radio" name="child-gender-edit" checked={childDraft.gender === 'male'} onChange={() => updateChildDraft({ gender: 'male' })} /> Male
                                        </label>
                                        <label style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                          <input type="radio" name="child-gender-edit" checked={childDraft.gender === 'female'} onChange={() => updateChildDraft({ gender: 'female' })} /> Female
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  <FormBar title="Birth" />
                                  <div className="ocf-three-col-grid">
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> Birth Date:</label>
                                      <input type="date" value={childDraft.birthDate} onChange={(e) => updateChildDraft({ birthDate: e.target.value })} className="modern-input" />
                                    </div>
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> Birth City:</label>
                                      <input type="text" value={childDraft.birthCity} onChange={(e) => updateChildDraft({ birthCity: e.target.value })} className="modern-input" />
                                    </div>
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> Birth State:</label>
                                      <select value={childDraft.birthState} onChange={(e) => updateChildDraft({ birthState: e.target.value })} className="modern-input">
                                        <option value="">PLEASE SELECT</option>
                                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                  </div>

                                  <FormBar title="Relationship & Paternity" />
                                  <div className="ocf-three-col-grid">
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> Relationship to Custodian:</label>
                                      <select value={childDraft.relationship} onChange={(e) => updateChildDraft({ relationship: e.target.value })} className="modern-input">
                                        <option value="">PLEASE SELECT</option>
                                        {RELATIONSHIP_OPTIONS.map((r) => <option key={r} value={r.toUpperCase()}>{r.toUpperCase()}</option>)}
                                      </select>
                                    </div>
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> State of Residence:</label>
                                      <select value={childDraft.state} onChange={(e) => updateChildDraft({ state: e.target.value })} className="modern-input">
                                        <option value="">PLEASE SELECT</option>
                                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </div>
                                    <div className="modern-field-group">
                                      <label><span className="req">*</span> Paternity Established:</label>
                                      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                        <label style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                          <input type="radio" name="child-paternity-edit" checked={childDraft.paternityEstablished === 'yes'} onChange={() => updateChildDraft({ paternityEstablished: 'yes' })} /> Yes
                                        </label>
                                        <label style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                          <input type="radio" name="child-paternity-edit" checked={childDraft.paternityEstablished === 'no'} onChange={() => updateChildDraft({ paternityEstablished: 'no' })} /> No
                                        </label>
                                        <label style={{ cursor: 'pointer', fontSize: '13.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                          <input type="radio" name="child-paternity-edit" checked={childDraft.paternityEstablished === 'unknown'} onChange={() => updateChildDraft({ paternityEstablished: 'unknown' })} /> Unknown
                                        </label>
                                      </div>
                                    </div>
                                    <div className="modern-field-group">
                                      <label>Paternity Date:</label>
                                      <input type="date" value={childDraft.paternityDate} onChange={(e) => updateChildDraft({ paternityDate: e.target.value })} className="modern-input" />
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                                    <button type="button" className="apply-btn apply-btn-outline" onClick={() => { setShowChildForm(false); setEditingChildId(null); setChildDraft(EMPTY_CHILD); }}>Cancel</button>
                                    <button type="button" className="apply-btn apply-btn-primary" onClick={editingChildId ? handleUpdateChild : handleAddChild}>{editingChildId ? 'Update Child' : 'Add Child'}</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                                    <button type="button" className="apply-btn apply-btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => { setChildDraft(EMPTY_CHILD); setEditingChildId(null); setShowChildForm(true); }}>
                                      <Plus size={14} strokeWidth={2.5} /> Add Child
                                    </button>
                                  </div>
                                  
                                  {form.children.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>No children added yet.</div>
                                  ) : (
                                    <div className="sof-table-container">
                                      <table className="sof-minimal-table">
                                        <thead>
                                          <tr>
                                            <th>Name</th>
                                            <th>DOB</th>
                                            <th>Gender</th>
                                            <th>Relationship</th>
                                            <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {form.children.map((child) => (
                                            <tr key={child.id}>
                                              <td style={{ fontWeight: 600 }}>{[child.firstName, child.lastName].filter(Boolean).join(' ')}</td>
                                              <td>{child.birthDate}</td>
                                              <td>{child.gender ? child.gender.toUpperCase() : '—'}</td>
                                              <td>{child.relationship}</td>
                                              <td>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                  <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }} onClick={() => startEditingChild(child)}>Edit</button>
                                                  <button type="button" className="sof-table-remove-btn" onClick={() => removeChild(child.id)}><X size={14} /></button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="review-section-body" style={{ display: 'block', padding: '14px 18px' }}>
                              {form.children.length === 0 ? (
                                <span style={{ color: 'var(--text-secondary)' }}>No children added.</span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                  {form.children.map((child, idx) => (
                                    <div key={child.id} style={{ borderBottom: idx < form.children.length - 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: idx < form.children.length - 1 ? 16 : 0 }}>
                                      <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)', fontSize: '14.5px', fontWeight: 700 }}>
                                        Child #{idx + 1}: {[child.firstName, child.lastName].filter(Boolean).join(' ')}
                                      </h4>
                                      <div className="review-data-grid">
                                        <div className="review-data-item"><span className="review-item-label">Gender</span><span className="review-item-value">{child.gender ? child.gender.toUpperCase() : '—'}</span></div>
                                        <div className="review-data-item"><span className="review-item-label">Birth Date / Place</span><span className="review-item-value">{child.birthDate} ({child.birthCity || '—'}, {child.birthState || '—'})</span></div>
                                        <div className="review-data-item"><span className="review-item-label">SSN</span><span className="review-item-value">{child.ssn || '—'}</span></div>
                                        <div className="review-data-item"><span className="review-item-label">Relationship</span><span className="review-item-value">{child.relationship || '—'}</span></div>
                                        <div className="review-data-item"><span className="review-item-label">State</span><span className="review-item-value">{child.state || '—'}</span></div>
                                        <div className="review-data-item"><span className="review-item-label">Paternity Established</span><span className="review-item-value">{child.paternityEstablished ? child.paternityEstablished.toUpperCase() : '—'} {child.paternityDate ? `on ${child.paternityDate}` : ''}</span></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 5: NONCUSTODIAL PARENT PROFILE */}
                      {form.assistanceType === 'full' && (
                        <div className="review-section">
                          <div className="review-section-header">
                            <h3>Non-Custodial Parent Profile</h3>
                            {editingSection === 'noncustodial-profile' ? (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={cancelEditingSection}>Cancel</button>
                                <button type="button" className="apply-btn apply-btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={saveEditingSection}>Save</button>
                              </div>
                            ) : (
                              <button type="button" className="review-edit-link" onClick={() => startEditingSection('noncustodial-profile')}>{t('review.edit')}</button>
                            )}
                          </div>
                          {editingSection === 'noncustodial-profile' ? (
                            <div className="review-edit-form-container">
                              <FormBar title="Name & Birth" />
                              <div className="field-table" style={{ marginBottom: 16 }}>
                                <FieldRow label="First Name" required>
                                  <input type="text" value={details.noncustodialName.firstName} onChange={(e) => updateNoncustodialName({ firstName: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Middle Name">
                                  <input type="text" value={details.noncustodialName.middleName} onChange={(e) => updateNoncustodialName({ middleName: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Last Name" required>
                                  <input type="text" value={details.noncustodialName.lastName} onChange={(e) => updateNoncustodialName({ lastName: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Suffix">
                                  <input type="text" value={details.noncustodialName.suffix} onChange={(e) => updateNoncustodialName({ suffix: e.target.value })} placeholder="Jr., Sr., III" />
                                </FieldRow>
                                <FieldRow label="SSN">
                                  <input type="text" value={details.noncustodialName.ssn} onChange={(e) => updateNoncustodialName({ ssn: e.target.value.replace(/[^\d]/g, '') })} maxLength={9} />
                                </FieldRow>
                                <FieldRow label="Gender">
                                  <TriRadio
                                    name="noncustodial-gender-edit"
                                    value={details.noncustodialName.gender}
                                    onChange={(v) => updateNoncustodialName({ gender: v as PersonNameInfo['gender'] })}
                                    options={[{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }]}
                                  />
                                </FieldRow>
                                <FieldRow label="Birth Date">
                                  <input type="date" value={details.noncustodialName.birthDate} onChange={(e) => updateNoncustodialName({ birthDate: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Birth City">
                                  <input type="text" value={details.noncustodialName.birthCity} onChange={(e) => updateNoncustodialName({ birthCity: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Birth State">
                                  <select value={details.noncustodialName.birthState} onChange={(e) => updateNoncustodialName({ birthState: e.target.value })}>
                                    <option value="">PLEASE SELECT</option>
                                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </FieldRow>
                                <FieldRow label="Marital Status">
                                  <select value={details.noncustodialName.maritalStatus} onChange={(e) => updateNoncustodialName({ maritalStatus: e.target.value })}>
                                    <option value="">Please Select</option>
                                    {MARITAL_STATUS_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                </FieldRow>
                                <FieldRow label="Maiden Name">
                                  <input type="text" value={details.noncustodialName.maidenName} onChange={(e) => updateNoncustodialName({ maidenName: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Spouse Name">
                                  <input type="text" value={details.noncustodialName.spouseName} onChange={(e) => updateNoncustodialName({ spouseName: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Date Married">
                                  <input type="date" value={details.noncustodialName.dateMarried} onChange={(e) => updateNoncustodialName({ dateMarried: e.target.value })} />
                                </FieldRow>
                              </div>

                              <FormBar title="Physical Description" />
                              <div className="field-table" style={{ marginBottom: 16 }}>
                                <FieldRow label="Hair Color">
                                  <select value={details.noncustodialDescription.hair} onChange={(e) => updateNoncustodialDescription({ hair: e.target.value })}>
                                    <option value="">Please Select</option>
                                    {HAIR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </FieldRow>
                                <FieldRow label="Eye Color">
                                  <select value={details.noncustodialDescription.eyes} onChange={(e) => updateNoncustodialDescription({ eyes: e.target.value })}>
                                    <option value="">Please Select</option>
                                    {EYE_OPTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                                  </select>
                                </FieldRow>
                                <FieldRow label="Height">
                                  <div style={{ display: 'flex', gap: 12 }}>
                                    <select value={details.noncustodialDescription.heightFt} onChange={(e) => updateNoncustodialDescription({ heightFt: e.target.value })} style={{ flex: 1 }}>
                                      <option value="">Ft</option>
                                      {HEIGHT_FEET_OPTIONS.map((f) => <option key={f} value={f}>{f} ft</option>)}
                                    </select>
                                    <select value={details.noncustodialDescription.heightIn} onChange={(e) => updateNoncustodialDescription({ heightIn: e.target.value })} style={{ flex: 1 }}>
                                      <option value="">In</option>
                                      {HEIGHT_INCH_OPTIONS.map((i) => <option key={i} value={i}>{i} in</option>)}
                                    </select>
                                  </div>
                                </FieldRow>
                                <FieldRow label="Weight (lbs)">
                                  <input type="number" value={details.noncustodialDescription.weight} onChange={(e) => updateNoncustodialDescription({ weight: e.target.value })} placeholder="lbs" />
                                </FieldRow>
                                <FieldRow label="Race">
                                  <select value={details.noncustodialDescription.race} onChange={(e) => updateNoncustodialDescription({ race: e.target.value })}>
                                    <option value="">Please Select</option>
                                    {RACE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                </FieldRow>
                                <FieldRow label="Nickname / Aliases">
                                  <input type="text" value={details.noncustodialDescription.nickname} onChange={(e) => updateNoncustodialDescription({ nickname: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Other Features">
                                  <input type="text" value={details.noncustodialDescription.otherFeatures} onChange={(e) => updateNoncustodialDescription({ otherFeatures: e.target.value })} placeholder="Scars, tattoos, glasses, etc." />
                                </FieldRow>
                              </div>

                              <FormBar title="Residential Address" />
                              <div className="field-table" style={{ marginBottom: 16 }}>
                                <FieldRow label="Address Line 1">
                                  <input type="text" value={details.noncustodialAddress.residential.line1} onChange={(e) => updateNoncustodialAddressBlock('residential', { line1: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Address Line 2">
                                  <input type="text" value={details.noncustodialAddress.residential.line2} onChange={(e) => updateNoncustodialAddressBlock('residential', { line2: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="City">
                                  <input type="text" value={details.noncustodialAddress.residential.city} onChange={(e) => updateNoncustodialAddressBlock('residential', { city: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="State">
                                  <select value={details.noncustodialAddress.residential.state} onChange={(e) => updateNoncustodialAddressBlock('residential', { state: e.target.value })}>
                                    <option value="">Please Select</option>
                                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </FieldRow>
                                <FieldRow label="Zip Code">
                                  <input type="text" value={details.noncustodialAddress.residential.zip} onChange={(e) => updateNoncustodialAddressBlock('residential', { zip: e.target.value })} maxLength={10} />
                                </FieldRow>
                              </div>

                              <FormBar title="Mailing Address" />
                              <div className="field-table" style={{ marginBottom: 16 }}>
                                <FieldRow label="Address Line 1">
                                  <input type="text" value={details.noncustodialAddress.mailing.line1} onChange={(e) => updateNoncustodialAddressBlock('mailing', { line1: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Address Line 2">
                                  <input type="text" value={details.noncustodialAddress.mailing.line2} onChange={(e) => updateNoncustodialAddressBlock('mailing', { line2: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="City">
                                  <input type="text" value={details.noncustodialAddress.mailing.city} onChange={(e) => updateNoncustodialAddressBlock('mailing', { city: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="State">
                                  <select value={details.noncustodialAddress.mailing.state} onChange={(e) => updateNoncustodialAddressBlock('mailing', { state: e.target.value })}>
                                    <option value="">Please Select</option>
                                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </FieldRow>
                                <FieldRow label="Zip Code">
                                  <input type="text" value={details.noncustodialAddress.mailing.zip} onChange={(e) => updateNoncustodialAddressBlock('mailing', { zip: e.target.value })} maxLength={10} />
                                </FieldRow>
                              </div>

                              <FormBar title="Contact Details & Employment" />
                              <div className="field-table" style={{ marginBottom: 16 }}>
                                <FieldRow label="Home Phone">
                                  <input type="tel" value={details.noncustodialAddress.homePhone} onChange={(e) => updateNoncustodialAddressField({ homePhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                                </FieldRow>
                                <FieldRow label="Cell Phone">
                                  <input type="tel" value={details.noncustodialAddress.cellPhone} onChange={(e) => updateNoncustodialAddressField({ cellPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                                </FieldRow>
                                <FieldRow label="Email">
                                  <input type="email" value={details.noncustodialAddress.email} onChange={(e) => updateNoncustodialAddressField({ email: e.target.value })} />
                                </FieldRow>
                                <FieldRow label="Currently Employed">
                                  <TriRadio
                                    name="noncustodial-employed-edit"
                                    value={details.noncustodialEmployment.currentlyEmployed}
                                    onChange={(v) => updateNoncustodialEmployment({ currentlyEmployed: v as EmploymentInfo['currentlyEmployed'] })}
                                    options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Unknown' }]}
                                  />
                                </FieldRow>
                                {details.noncustodialEmployment.currentlyEmployed === 'yes' && (
                                  <>
                                    <FieldRow label="Employer Name">
                                      <input type="text" value={details.noncustodialEmployment.employerName} onChange={(e) => updateNoncustodialEmployment({ employerName: e.target.value })} />
                                    </FieldRow>
                                    <FieldRow label="Work Phone">
                                      <input type="tel" value={details.noncustodialEmployment.workPhone} onChange={(e) => updateNoncustodialEmployment({ workPhone: e.target.value.replace(/[^\d]/g, '') })} maxLength={10} />
                                    </FieldRow>
                                  </>
                                )}
                              </div>

                              <FormBar title="Income Details" />
                              <div className="income-list" style={{ marginBottom: 16 }}>
                                {INCOME_ITEM_KEYS.map(({ key, labelKey }) => {
                                  const item = details.noncustodialIncome[key];
                                  return (
                                    <div className="income-row" key={key} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                                      <div className="income-row-question" style={{ fontSize: '13.5px', fontWeight: 600 }}>{t(labelKey)}</div>
                                      <TriRadio
                                        name={`income-${key}-edit`}
                                        value={item.has}
                                        onChange={(v) => updateIncomeItem(key, { has: v as IncomeItem['has'] })}
                                        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }, { value: 'unknown', label: 'Unknown' }]}
                                      />
                                      {item.has === 'yes' && (
                                        <div className="income-row-amount" style={{ marginTop: 8 }}>
                                          <input
                                            type="number"
                                            min={0}
                                            value={item.amount}
                                            onChange={(e) => updateIncomeItem(key, { amount: e.target.value })}
                                            placeholder="0.00"
                                            style={{ width: '100px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                          />
                                          <span style={{ marginLeft: 8, fontSize: '13px', color: 'var(--text-secondary)' }}>/ month</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="income-total-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: 700, borderTop: '2px solid #e2e8f0', marginBottom: 16 }}>
                                <span>Total Estimated Income:</span>
                                <span>${incomeTotal.toFixed(2)}/mo</span>
                              </div>

                              <FormBar title="Relatives (Mother & Father)" />
                              <div className="ocf-two-col-grid" style={{ gap: 20 }}>
                                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6 }}>
                                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--primary)' }}>Mother&apos;s Info</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <input type="text" placeholder="First Name" value={details.noncustodialMother.firstName} onChange={(e) => updateMother({ firstName: e.target.value })} className="modern-input" />
                                    <input type="text" placeholder="Middle Name" value={details.noncustodialMother.middleName} onChange={(e) => updateMother({ middleName: e.target.value })} className="modern-input" />
                                    <input type="text" placeholder="Last Name" value={details.noncustodialMother.lastName} onChange={(e) => updateMother({ lastName: e.target.value })} className="modern-input" />
                                    <input type="text" placeholder="Maiden Name" value={details.noncustodialMother.maidenName} onChange={(e) => updateMother({ maidenName: e.target.value })} className="modern-input" />
                                    <input type="text" placeholder="Birth City" value={details.noncustodialMother.birthCity} onChange={(e) => updateMother({ birthCity: e.target.value })} className="modern-input" />
                                    <select value={details.noncustodialMother.birthState} onChange={(e) => updateMother({ birthState: e.target.value })} className="modern-input">
                                      <option value="">Birth State</option>
                                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Deceased?</span>
                                      <TriRadio
                                        name="mother-deceased-edit"
                                        value={details.noncustodialMother.deceased}
                                        onChange={(v) => updateMother({ deceased: v as RelativeInfo['deceased'] })}
                                        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6 }}>
                                  <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--primary)' }}>Father&apos;s Info</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <input type="text" placeholder="First Name" value={details.noncustodialFather.firstName} onChange={(e) => updateFather({ firstName: e.target.value })} className="modern-input" />
                                    <input type="text" placeholder="Middle Name" value={details.noncustodialFather.middleName} onChange={(e) => updateFather({ middleName: e.target.value })} className="modern-input" />
                                    <input type="text" placeholder="Last Name" value={details.noncustodialFather.lastName} onChange={(e) => updateFather({ lastName: e.target.value })} className="modern-input" />
                                    <input type="text" placeholder="Birth City" value={details.noncustodialFather.birthCity} onChange={(e) => updateFather({ birthCity: e.target.value })} className="modern-input" />
                                    <select value={details.noncustodialFather.birthState} onChange={(e) => updateFather({ birthState: e.target.value })} className="modern-input">
                                      <option value="">Birth State</option>
                                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Deceased?</span>
                                      <TriRadio
                                        name="father-deceased-edit"
                                        value={details.noncustodialFather.deceased}
                                        onChange={(v) => updateFather({ deceased: v as RelativeInfo['deceased'] })}
                                        options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="review-section-body review-data-grid">
                              <div className="review-data-item"><span className="review-item-label">Full Name</span><span className="review-item-value">{[details.noncustodialName.firstName, details.noncustodialName.middleName, details.noncustodialName.lastName, details.noncustodialName.suffix].filter(Boolean).join(' ') || '—'}</span></div>
                              <div className="review-data-item"><span className="review-item-label">SSN</span><span className="review-item-value">{details.noncustodialName.ssn || '—'}</span></div>
                              <div className="review-data-item"><span className="review-item-label">Birth details</span><span className="review-item-value">{details.noncustodialName.birthDate || '—'} ({[details.noncustodialName.birthCity, details.noncustodialName.birthState].filter(Boolean).join(', ') || '—'})</span></div>
                              <div className="review-data-item"><span className="review-item-label">Marital Status</span><span className="review-item-value">{details.noncustodialName.maritalStatus || '—'}</span></div>
                              <div className="review-data-item"><span className="review-item-label">Physical Description</span><span className="review-item-value">
                                {[
                                  details.noncustodialDescription.hair ? `Hair: ${details.noncustodialDescription.hair}` : '',
                                  details.noncustodialDescription.eyes ? `Eyes: ${details.noncustodialDescription.eyes}` : '',
                                  details.noncustodialDescription.heightFt ? `Height: ${details.noncustodialDescription.heightFt}ft ${details.noncustodialDescription.heightIn || 0}in` : '',
                                  details.noncustodialDescription.weight ? `Weight: ${details.noncustodialDescription.weight} lbs` : '',
                                  details.noncustodialDescription.race ? `Race: ${details.noncustodialDescription.race}` : ''
                                ].filter(Boolean).join(', ') || '—'}
                              </span></div>
                              <div className="review-data-item"><span className="review-item-label">Residential Address</span><span className="review-item-value">{[details.noncustodialAddress.residential.line1, details.noncustodialAddress.residential.line2, details.noncustodialAddress.residential.city, details.noncustodialAddress.residential.state, details.noncustodialAddress.residential.zip].filter(Boolean).join(', ') || '—'}</span></div>
                              <div className="review-data-item"><span className="review-item-label">Contact Details</span><span className="review-item-value">{[details.noncustodialAddress.cellPhone ? `Cell: ${details.noncustodialAddress.cellPhone}` : '', details.noncustodialAddress.homePhone ? `Home: ${details.noncustodialAddress.homePhone}` : '', details.noncustodialAddress.email ? `Email: ${details.noncustodialAddress.email}` : ''].filter(Boolean).join(', ') || '—'}</span></div>
                              <div className="review-data-item"><span className="review-item-label">Employment</span><span className="review-item-value">{details.noncustodialEmployment.currentlyEmployed === 'yes' ? `Employed at ${details.noncustodialEmployment.employerName || '—'}` : details.noncustodialEmployment.currentlyEmployed === 'no' ? 'Not Employed' : '—'}</span></div>
                              <div className="review-data-item"><span className="review-item-label">Income Sources</span><span className="review-item-value">
                                {Object.entries(details.noncustodialIncome).filter(([_, item]) => item.has === 'yes').map(([key, item]) => `${key.replace(/([A-Z])/g, ' $1')}: $${item.amount}/mo`).join(', ') || 'None reported'}
                              </span></div>
                              <div className="review-data-item"><span className="review-item-label">Estimated Monthly Income</span><span className="review-item-value">${incomeTotal.toFixed(2)}</span></div>
                              <div className="review-data-item"><span className="review-item-label">Mother&apos;s Details</span><span className="review-item-value">{[details.noncustodialMother.firstName, details.noncustodialMother.lastName].filter(Boolean).join(' ') ? `${[details.noncustodialMother.firstName, details.noncustodialMother.lastName].filter(Boolean).join(' ')} ${details.noncustodialMother.deceased === 'yes' ? '(Deceased)' : ''}` : '—'}</span></div>
                              <div className="review-data-item"><span className="review-item-label">Father&apos;s Details</span><span className="review-item-value">{[details.noncustodialFather.firstName, details.noncustodialFather.lastName].filter(Boolean).join(' ') ? `${[details.noncustodialFather.firstName, details.noncustodialFather.lastName].filter(Boolean).join(' ')} ${details.noncustodialFather.deceased === 'yes' ? '(Deceased)' : ''}` : '—'}</span></div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 6: SUPPORT ORDERS */}
                      {form.assistanceType === 'full' && (
                        <div className="review-section">
                          <div className="review-section-header">
                            <h3>Existing Support Orders</h3>
                            {editingSection === 'support-orders' ? (
                              <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={cancelEditingSection}>Done</button>
                            ) : (
                              <button type="button" className="review-edit-link" onClick={() => startEditingSection('support-orders')}>{t('review.edit')}</button>
                            )}
                          </div>
                          {editingSection === 'support-orders' ? (
                            <div className="review-edit-form-container">
                              {showSupportOrderForm ? (
                                <div className="sof-section-container animate-fade-in" style={{ padding: '16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)' }}>
                                    {editingSupportOrderId ? 'Edit Support Order Details' : 'Add New Support Order'}
                                  </h4>
                                  
                                  <div className="field-table">
                                    <FieldRow label="Order Type" required>
                                      <select value={supportOrderDraft.orderType} onChange={(e) => setSupportOrderDraft(p => ({ ...p, orderType: e.target.value }))}>
                                        <option value="">PLEASE SELECT</option>
                                        <option value="Child Support">Child Support</option>
                                        <option value="Spousal Support">Spousal Support</option>
                                        <option value="Medical Support">Medical Support</option>
                                      </select>
                                    </FieldRow>
                                    <FieldRow label="Order Number" required>
                                      <input type="text" value={supportOrderDraft.orderNumber} onChange={(e) => setSupportOrderDraft(p => ({ ...p, orderNumber: e.target.value }))} />
                                    </FieldRow>
                                    <FieldRow label="State Filed" required>
                                      <select value={supportOrderDraft.stateFiled} onChange={(e) => setSupportOrderDraft(p => ({ ...p, stateFiled: e.target.value }))}>
                                        <option value="">PLEASE SELECT</option>
                                        {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    </FieldRow>
                                    <FieldRow label="Date Filed" required>
                                      <input type="date" value={supportOrderDraft.dateFiled} onChange={(e) => setSupportOrderDraft(p => ({ ...p, dateFiled: e.target.value }))} />
                                    </FieldRow>
                                    <FieldRow label="Amount" required>
                                      <input type="number" min={0} value={supportOrderDraft.amount} onChange={(e) => setSupportOrderDraft(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                                    </FieldRow>
                                    <FieldRow label="Frequency" required>
                                      <select value={supportOrderDraft.frequency} onChange={(e) => setSupportOrderDraft(p => ({ ...p, frequency: e.target.value }))}>
                                        <option value="">PLEASE SELECT</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Bi-weekly">Bi-weekly</option>
                                        <option value="Monthly">Monthly</option>
                                      </select>
                                    </FieldRow>
                                    <FieldRow label="Start Date" required>
                                      <input type="date" value={supportOrderDraft.startDate} onChange={(e) => setSupportOrderDraft(p => ({ ...p, startDate: e.target.value }))} />
                                    </FieldRow>
                                    <FieldRow label="End Date">
                                      <input type="date" value={supportOrderDraft.endDate} onChange={(e) => setSupportOrderDraft(p => ({ ...p, endDate: e.target.value }))} />
                                    </FieldRow>
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                                    <button type="button" className="apply-btn apply-btn-outline" onClick={() => { setShowSupportOrderForm(false); setEditingSupportOrderId(null); setSupportOrderDraft(EMPTY_SUPPORT_ORDER); }}>Cancel</button>
                                    <button type="button" className="apply-btn apply-btn-primary" onClick={editingSupportOrderId ? handleUpdateSupportOrder : handleSaveSupportOrder}>{editingSupportOrderId ? 'Update Order' : 'Add Order'}</button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                                    <button type="button" className="apply-btn apply-btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => { setSupportOrderDraft(EMPTY_SUPPORT_ORDER); setEditingSupportOrderId(null); setShowSupportOrderForm(true); }}>
                                      <Plus size={14} strokeWidth={2.5} /> Add Support Order
                                    </button>
                                  </div>
                                  
                                  {(!form.supportOrders || form.supportOrders.length === 0) ? (
                                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>No support orders added.</div>
                                  ) : (
                                    <div className="sof-table-container">
                                      <table className="sof-minimal-table">
                                        <thead>
                                          <tr>
                                            <th>Type</th>
                                            <th>Order #</th>
                                            <th>State</th>
                                            <th>Amount</th>
                                            <th>Frequency</th>
                                            <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {form.supportOrders.map((order) => (
                                            <tr key={order.id}>
                                              <td style={{ fontWeight: 600 }}>{order.orderType}</td>
                                              <td>{order.orderNumber}</td>
                                              <td>{order.stateFiled}</td>
                                              <td>${order.amount}</td>
                                              <td>{order.frequency}</td>
                                              <td>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                  <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }} onClick={() => startEditingSupportOrder(order)}>Edit</button>
                                                  <button type="button" className="sof-table-remove-btn" onClick={() => removeSupportOrder(order.id)}><X size={14} /></button>
                                                </div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="review-section-body" style={{ display: 'block', padding: '14px 18px' }}>
                              {(!form.supportOrders || form.supportOrders.length === 0) ? (
                                <span style={{ color: 'var(--text-secondary)' }}>No support orders added.</span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                  {form.supportOrders.map((order, idx) => (
                                    <div key={order.id} style={{ borderBottom: idx < form.supportOrders.length - 1 ? '1px dashed #e2e8f0' : 'none', paddingBottom: idx < form.supportOrders.length - 1 ? 16 : 0 }}>
                                      <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary)', fontSize: '14.5px', fontWeight: 700 }}>
                                        Order #{idx + 1}: {order.orderType} (Order #{order.orderNumber})
                                      </h4>
                                      <div className="review-data-grid">
                                        <div className="review-data-item"><span className="review-item-label">State Filed</span><span className="review-item-value">{order.stateFiled || '—'}</span></div>
                                        <div className="review-data-item"><span className="review-item-label">Date Filed</span><span className="review-item-value">{order.dateFiled || '—'}</span></div>
                                        <div className="review-data-item"><span className="review-item-label">Payment</span><span className="review-item-value">${order.amount} ({order.frequency})</span></div>
                                        <div className="review-data-item"><span className="review-item-label">Dates</span><span className="review-item-value">{order.startDate} to {order.endDate || 'Present'}</span></div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* SECTION 7: OTHER CHILDREN */}
                      <div className="review-section">
                        <div className="review-section-header">
                          <h3>Other Children in Household</h3>
                          {editingSection === 'other-children' ? (
                            <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={cancelEditingSection}>Done</button>
                          ) : (
                            <button type="button" className="review-edit-link" onClick={() => startEditingSection('other-children')}>{t('review.edit')}</button>
                          )}
                        </div>
                        {editingSection === 'other-children' ? (
                          <div className="review-edit-form-container">
                            {showOtherChildForm ? (
                              <div className="sof-section-container animate-fade-in" style={{ padding: '16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--primary)' }}>
                                  {editingOtherChildId ? 'Edit Child Details' : 'Add New Child'}
                                </h4>
                                
                                <div className="field-table">
                                  <FieldRow label="First Name" required>
                                    <input type="text" value={otherChildDraft.firstName} onChange={(e) => setOtherChildDraft(p => ({ ...p, firstName: e.target.value }))} />
                                  </FieldRow>
                                  <FieldRow label="Middle Name">
                                    <input type="text" value={otherChildDraft.middleName} onChange={(e) => setOtherChildDraft(p => ({ ...p, middleName: e.target.value }))} />
                                  </FieldRow>
                                  <FieldRow label="Last Name" required>
                                    <input type="text" value={otherChildDraft.lastName} onChange={(e) => setOtherChildDraft(p => ({ ...p, lastName: e.target.value }))} />
                                  </FieldRow>
                                  <FieldRow label="Suffix">
                                    <input type="text" value={otherChildDraft.suffix} onChange={(e) => setOtherChildDraft(p => ({ ...p, suffix: e.target.value }))} />
                                  </FieldRow>
                                  <FieldRow label="Birth Date" required>
                                    <input type="date" value={otherChildDraft.birthDate} onChange={(e) => setOtherChildDraft(p => ({ ...p, birthDate: e.target.value }))} />
                                  </FieldRow>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #cbd5e1' }}>
                                  <button type="button" className="apply-btn apply-btn-outline" onClick={() => { setShowOtherChildForm(false); setEditingOtherChildId(null); setOtherChildDraft(EMPTY_OTHER_CHILD); }}>Cancel</button>
                                  <button type="button" className="apply-btn apply-btn-primary" onClick={editingOtherChildId ? handleUpdateOtherChild : handleSaveOtherChild}>{editingOtherChildId ? 'Update Child' : 'Add Child'}</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                                  <button type="button" className="apply-btn apply-btn-primary" style={{ padding: '6px 14px', fontSize: '13px' }} onClick={() => { setOtherChildDraft(EMPTY_OTHER_CHILD); setEditingOtherChildId(null); setShowOtherChildForm(true); }}>
                                    <Plus size={14} strokeWidth={2.5} /> Add Child
                                  </button>
                                </div>
                                
                                {(!form.otherChildren || form.otherChildren.length === 0) ? (
                                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-secondary)' }}>No other children added.</div>
                                ) : (
                                  <div className="sof-table-container">
                                    <table className="sof-minimal-table">
                                      <thead>
                                        <tr>
                                          <th>Name</th>
                                          <th>Birth Date</th>
                                          <th style={{ width: 120, textAlign: 'center' }}>Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {form.otherChildren.map((child) => (
                                          <tr key={child.id}>
                                            <td style={{ fontWeight: 600 }}>{[child.firstName, child.lastName].filter(Boolean).join(' ')}</td>
                                            <td>{child.birthDate}</td>
                                            <td>
                                              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }} onClick={() => startEditingOtherChild(child)}>Edit</button>
                                                <button type="button" className="sof-table-remove-btn" onClick={() => removeOtherChild(child.id)}><X size={14} /></button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="review-section-body review-data-grid">
                            {(!form.otherChildren || form.otherChildren.length === 0) ? (
                              <span style={{ color: 'var(--text-secondary)' }}>No other children in household.</span>
                            ) : (
                              form.otherChildren.map((child, idx) => (
                                <div className="review-data-item" key={child.id || idx}>
                                  <span className="review-item-label">Child #{idx + 1} Name</span>
                                  <span className="review-item-value">{[child.firstName, child.lastName].filter(Boolean).join(' ')} (DOB: {child.birthDate})</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {/* SECTION 8: OTHER INFORMATION */}
                      <div className="review-section">
                        <div className="review-section-header">
                          <h3>Other Information</h3>
                          {editingSection === 'other-info' ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button type="button" className="apply-btn apply-btn-outline" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={cancelEditingSection}>Cancel</button>
                              <button type="button" className="apply-btn apply-btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={saveEditingSection}>Save</button>
                            </div>
                          ) : (
                            <button type="button" className="review-edit-link" onClick={() => startEditingSection('other-info')}>{t('review.edit')}</button>
                          )}
                        </div>
                        {editingSection === 'other-info' ? (
                          <div className="review-edit-form-container">
                            <textarea
                              value={form.otherInformationText || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val.length <= 4000) {
                                  setForm(p => ({ ...p, otherInformationText: val }));
                                }
                              }}
                              className="ocf-textarea"
                              placeholder="Enter any other details here..."
                              rows={8}
                              style={{
                                width: '100%',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '12px',
                                outline: 'none',
                                fontSize: '14px',
                                resize: 'vertical'
                              }}
                            />
                            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 8 }}>
                              {4000 - (form.otherInformationText || '').length} characters left
                            </div>
                          </div>
                        ) : (
                          <div className="review-section-body" style={{ display: 'block', padding: '14px 18px' }}>
                            <span className="review-item-label" style={{ marginBottom: 6 }}>Notes / Additional Comments</span>
                            <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--primary)', fontWeight: 500 }}>
                              {form.otherInformationText || 'No additional comments provided.'}
                            </div>
                          </div>
                        )}
                      </div>

                      <label className={`ack-item ${form.certify ? 'checked' : ''}`} style={{ marginTop: 16 }}>
                        <input
                          type="checkbox"
                          checked={form.certify}
                          onChange={() => setForm((p) => ({ ...p, certify: !p.certify }))}
                        />
                        <span className="ack-text">
                          {t('review.certify')}
                        </span>
                      </label>
                    </>
                  )
}
                </div>
              )}
            </div>

            {!submitted && (
              <div className="apply-footer-actions">
                {currentStep.key === 'household' && activeSubSection === 'other-support-orders' && showSupportOrderForm ? (
                  <>
                    <button
                      type="button"
                      className="apply-btn apply-btn-outline"
                      onClick={() => {
                        setError('');
                        setShowSupportOrderForm(false);
                        setSupportOrderDraft(EMPTY_SUPPORT_ORDER);
                      }}
                    >
                      <X size={16} strokeWidth={2} />
                      {t('field.cancel')}
                    </button>
                    <button
                      type="button"
                      className="apply-btn apply-btn-primary"
                      onClick={handleSaveSupportOrder}
                    >
                      <Plus size={16} strokeWidth={2} />
                      Save Support Order
                    </button>
                  </>
                ) : currentStep.key === 'household' && activeSubSection === 'custodial-children' && form.assistanceType === 'full' && showChildForm ? (
                  null
                ) : currentStep.key === 'household' && activeSubSection ? (
                  <>
                    <button type="button" className="apply-btn apply-btn-outline" onClick={handleSubSectionPrevious}>
                      <ArrowLeft size={16} strokeWidth={2} />
                      {t('apply.previous')}
                    </button>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button type="button" className="apply-btn apply-btn-primary" onClick={handleSubSectionNext}>
                        {t('apply.next')}
                        <ArrowRight size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      {stepIndex > 0 && (
                        <button type="button" className="apply-btn apply-btn-outline" onClick={handleBack}>
                          <ArrowLeft size={16} strokeWidth={2} />
                          {t('apply.previous')}
                        </button>
                      )}
                    </div>
                    {currentStep.key === 'review' ? (
                      showSignaturePage ? (
                        <button
                          type="button"
                          className="apply-btn apply-btn-primary"
                          onClick={handleSubmit}
                          disabled={!soSworn || submitting}
                        >
                          {submitting ? 'Submitting...' : t('apply.submitApplication')}
                          <ArrowRight size={16} strokeWidth={2} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="apply-btn apply-btn-primary"
                          onClick={() => {
                            if (!form.certify) {
                              setError('Please check the certification box first.');
                              return;
                            }
                            setError('');
                            setShowSignaturePage(true);
                            scrollCardToTop();
                          }}
                          disabled={!form.certify}
                        >
                          {t('apply.submitApplication')}
                          <ArrowRight size={16} strokeWidth={2} />
                        </button>
                      )
                    ) : (
                      <button type="button" className="apply-btn apply-btn-primary" onClick={handleNext}>
                        {t('apply.next')}
                        <ArrowRight size={16} strokeWidth={2} />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedChildForView && (
        <div className="custom-modal-overlay" onClick={() => setSelectedChildForView(null)}>
          <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="custom-modal-header">
              <h3>{t('field.name')}: {[selectedChildForView.firstName, selectedChildForView.lastName].filter(Boolean).join(' ') || '—'}</h3>
              <button
                type="button"
                className="custom-modal-close-btn"
                onClick={() => setSelectedChildForView(null)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <div className="custom-modal-body">
              <div className="review-field">
                <span className="rf-label">{t('field.name')}</span>
                <span className="rf-value">{[selectedChildForView.firstName, selectedChildForView.middleName, selectedChildForView.lastName, selectedChildForView.suffix].filter(Boolean).join(' ') || '—'}</span>
              </div>
              <div className="review-field">
                <span className="rf-label">{t('field.ssn')}</span>
                <span className="rf-value">{selectedChildForView.ssn || '—'}</span>
              </div>
              <div className="review-field">
                <span className="rf-label">{t('field.gender')}</span>
                <span className="rf-value">{selectedChildForView.gender === 'male' ? t('field.male') : selectedChildForView.gender === 'female' ? t('field.female') : '—'}</span>
              </div>
              <div className="review-field">
                <span className="rf-label">{t('field.birthDate')}</span>
                <span className="rf-value">{selectedChildForView.birthDate || '—'}</span>
              </div>
              <div className="review-field">
                <span className="rf-label">{t('field.birthCity')}</span>
                <span className="rf-value">{selectedChildForView.birthCity || '—'}</span>
              </div>
              <div className="review-field">
                <span className="rf-label">{t('field.birthState')}</span>
                <span className="rf-value">{selectedChildForView.birthState || '—'}</span>
              </div>
              <div className="review-field">
                <span className="rf-label">{t('field.relationshipToCustodian')}</span>
                <span className="rf-value">{selectedChildForView.relationship || '—'}</span>
              </div>
              <div className="review-field">
                <span className="rf-label">{t('field.paternityEstablished')}</span>
                <span className="rf-value">
                  {selectedChildForView.paternityEstablished === 'yes' ? t('apply.common.yes') : selectedChildForView.paternityEstablished === 'no' ? t('apply.common.no') : selectedChildForView.paternityEstablished === 'unknown' ? t('apply.common.unknown') : '—'}
                </span>
              </div>
              <div className="review-field">
                <span className="rf-label">{t('field.paternityDate')}</span>
                <span className="rf-value">{selectedChildForView.paternityDate || '—'}</span>
              </div>
              <div className="review-field">
                <span className="rf-label">{t('field.state')}</span>
                <span className="rf-value">{selectedChildForView.state || '—'}</span>
              </div>
            </div>
            <div className="custom-modal-footer">
              <button
                type="button"
                className="apply-btn apply-btn-primary"
                onClick={() => setSelectedChildForView(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

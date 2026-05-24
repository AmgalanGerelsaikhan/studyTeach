import type { UserRole } from '@studyteach/contracts';

/**
 * Runtime wizard config. Source-of-truth spec lives in
 * `docs/signup-wizard-schema.json` — keep this file in sync.
 *
 * Open questions resolved on 2026-05-24:
 *  - PARENT school-picker = metadata only (no audit-scope grant)
 *  - Profile fields live in new user_profiles table
 *  - PLATFORM_ADMIN omitted from role dropdown entirely
 *  - Unknown school = hard-block (no stub orgs created from signup)
 */

export type StepType = 'text' | 'tel' | 'email' | 'password' | 'radio' | 'school-picker';

export type StepKey =
  | 'full_name'
  | 'phone_number'
  | 'email'
  | 'password'
  | 'grade'
  | 'subject'
  | 'experience_years'
  | 'position'
  | 'school_code'
  | 'child_school_code';

export interface RadioOption {
  key: string;
  label: string;
}

export interface WizardStep {
  key: StepKey;
  type: StepType;
  label: string;
  placeholder?: string;
  required: boolean;
  note?: string;
  hint?: string;
  showToggle?: boolean;
  options?: RadioOption[];
  fallbackOptionLabel?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

const FULL_NAME: WizardStep = {
  key: 'full_name',
  type: 'text',
  label: 'Таны нэр?',
  placeholder: 'Бат Эрдэнэбаатар',
  required: true,
  validation: { minLength: 2, maxLength: 80 },
};

const PHONE_NUMBER: WizardStep = {
  key: 'phone_number',
  type: 'tel',
  label: 'Утасны дугаар',
  placeholder: '+976 ХХХХХХХХ',
  required: true,
  validation: { pattern: /^\+976\d{8}$/ },
};

const EMAIL_OPTIONAL: WizardStep = {
  key: 'email',
  type: 'email',
  label: 'И-мэйл хаяг',
  placeholder: 'you@example.mn',
  required: false,
  note: 'Сэргээх кодыг и-мэйлээр илгээх боломжтой.',
};

const EMAIL_REQUIRED: WizardStep = {
  ...EMAIL_OPTIONAL,
  required: true,
};

const EMAIL_WORK: WizardStep = {
  ...EMAIL_REQUIRED,
  label: 'Ажлын и-мэйл',
  note: 'Сургуулийн домэйнтай и-мэйл ашиглавал баталгаажуулалт хурдан болно.',
};

const PASSWORD: WizardStep = {
  key: 'password',
  type: 'password',
  label: 'Нууц үг',
  required: true,
  showToggle: true,
  validation: { minLength: 8 },
  hint: 'Дор хаяж 8 тэмдэгт.',
};

const STUDENT_GRADE: WizardStep = {
  key: 'grade',
  type: 'radio',
  label: 'Хэддүгээр ангид сурдаг вэ?',
  required: true,
  options: [
    { key: 'G6', label: '6-р анги' },
    { key: 'G7', label: '7-р анги' },
    { key: 'G8', label: '8-р анги' },
    { key: 'G9', label: '9-р анги' },
    { key: 'G10', label: '10-р анги' },
    { key: 'G11', label: '11-р анги' },
    { key: 'G12', label: '12-р анги' },
  ],
};

const STUDENT_SCHOOL: WizardStep = {
  key: 'school_code',
  type: 'school-picker',
  label: 'Аль сургуульд сурдаг вэ?',
  required: true,
  note: 'Сургуулиа хайж сонгоно уу.',
};

const TEACHER_SCHOOL: WizardStep = {
  ...STUDENT_SCHOOL,
  label: 'Аль сургуульд багшилдаг вэ?',
};

const TEACHER_SUBJECT: WizardStep = {
  key: 'subject',
  type: 'radio',
  label: 'Гол хичээл?',
  required: true,
  options: [
    { key: 'math', label: 'Математик' },
    { key: 'physics', label: 'Физик' },
    { key: 'chemistry', label: 'Хими' },
    { key: 'biology', label: 'Биологи' },
    { key: 'mongolian', label: 'Монгол хэл' },
    { key: 'english', label: 'Англи хэл' },
    { key: 'history', label: 'Түүх, нийгэм' },
    { key: 'informatics', label: 'Мэдээллийн технологи' },
    { key: 'other', label: 'Бусад' },
  ],
};

const TEACHER_EXPERIENCE: WizardStep = {
  key: 'experience_years',
  type: 'radio',
  label: 'Багшилсан жил?',
  required: true,
  options: [
    { key: 'lt2', label: '2 жилээс бага' },
    { key: '2_5', label: '2-5 жил' },
    { key: '5_10', label: '5-10 жил' },
    { key: '10_20', label: '10-20 жил' },
    { key: 'gt20', label: '20+ жил' },
  ],
};

const PARENT_CHILD_SCHOOL: WizardStep = {
  key: 'child_school_code',
  type: 'school-picker',
  label: 'Хүүхэд тань аль сургуульд сурдаг вэ?',
  required: true,
  note: 'Бүртгэл үүссэний дараа хүүхдээ нэрээр нь холбоно.',
};

const SCHOOL_ADMIN_SCHOOL: WizardStep = {
  ...STUDENT_SCHOOL,
  label: 'Аль сургуулийг удирдах вэ?',
};

const SCHOOL_ADMIN_POSITION: WizardStep = {
  key: 'position',
  type: 'radio',
  label: 'Албан тушаал?',
  required: true,
  options: [
    { key: 'principal', label: 'Захирал' },
    { key: 'deputy', label: 'Сургалтын менежер' },
    { key: 'it_admin', label: 'IT хариуцагч' },
    { key: 'other', label: 'Бусад' },
  ],
};

export const WIZARD_BY_ROLE: Record<Exclude<UserRole, 'PLATFORM_ADMIN'>, WizardStep[]> = {
  STUDENT: [FULL_NAME, PHONE_NUMBER, EMAIL_OPTIONAL, STUDENT_GRADE, STUDENT_SCHOOL, PASSWORD],
  TEACHER: [
    FULL_NAME,
    PHONE_NUMBER,
    EMAIL_REQUIRED,
    TEACHER_SCHOOL,
    TEACHER_SUBJECT,
    TEACHER_EXPERIENCE,
    PASSWORD,
  ],
  PARENT: [FULL_NAME, PHONE_NUMBER, EMAIL_OPTIONAL, PARENT_CHILD_SCHOOL, PASSWORD],
  SCHOOL_ADMIN: [
    FULL_NAME,
    PHONE_NUMBER,
    EMAIL_WORK,
    SCHOOL_ADMIN_SCHOOL,
    SCHOOL_ADMIN_POSITION,
    PASSWORD,
  ],
};

export const SELECTABLE_ROLES: Exclude<UserRole, 'PLATFORM_ADMIN'>[] = [
  'STUDENT',
  'TEACHER',
  'PARENT',
  'SCHOOL_ADMIN',
];

export const ROLE_LABELS: Record<Exclude<UserRole, 'PLATFORM_ADMIN'>, string> = {
  STUDENT: 'Сурагч',
  TEACHER: 'Багш',
  PARENT: 'Эцэг эх',
  SCHOOL_ADMIN: 'Сургуулийн админ',
};

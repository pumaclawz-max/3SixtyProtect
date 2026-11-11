import type {
  BookingStatus,
  CourseStatus,
  BuiltInCourseType,
  CourseTypeInfo,
  CourseLocation,
  EnquiryType,
} from './types';

export const SITE = {
  name: '3Sixty Protect',
  shortName: '3Sixty',
  tagline: 'Private Security, Protection & Training',
  description:
    'A full-spectrum UK private security company: executive protection, risk consultancy, technical surveillance, manpower and investigations, plus accredited SIA training. Delivered to a professional standard.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.3sixtyprotect.com',
  email: 'info@3sixtyprotect.com',
  phone: '020 3989 7024',
  phoneHref: 'tel:+442039897024',
  serviceArea: 'London & the South East · Nationwide group bookings',
  addresses: [
    {
      label: 'Registered Address',
      lines: ['3Sixty Protect Ltd', '20-22 Wenlock Road', 'London', 'N1 7GU'],
    },
    {
      label: 'Centre Address',
      lines: ['3Sixty Protect Ltd', '10-16 Tiller Road', 'London', 'E14 8PX'],
    },
  ],
} as const;

export interface NavLink {
  label: string;
  /** Omitted for `mega`, which opens the menu rather than navigating. */
  href?: string;
  /** Renders the Training Courses mega menu instead of a plain link. */
  mega?: boolean;
}

/** Primary navigation shown in the header. */
export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Training Courses', mega: true },
  { label: 'Training Calendar', href: '/calendar' },
  { label: 'Contact Us', href: '/contact' },
];

export const COURSE_TYPE_META: Record<
  BuiltInCourseType,
  {
    label: string;
    shortLabel: string;
    slug: string;
    href: string;
    abbr: string;
    blurb: string;
  }
> = {
  door_supervision: {
    label: 'SIA Door Supervision',
    shortLabel: 'Door Supervision',
    slug: 'door-supervision',
    href: '/door-supervision',
    abbr: 'DS',
    blurb:
      'The licence-linked qualification to work as an SIA Door Supervisor in pubs, clubs, events and licensed premises.',
  },
  close_protection: {
    label: 'SIA Close Protection',
    shortLabel: 'Close Protection',
    slug: 'close-protection',
    href: '/close-protection',
    abbr: 'CP',
    blurb:
      'The advanced qualification for protecting individuals, the gateway to a career as a professional bodyguard or CPO.',
  },
};

export const COURSE_STATUS_META: Record<
  CourseStatus,
  { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }
> = {
  draft: { label: 'Draft', tone: 'neutral' },
  published: { label: 'Published', tone: 'success' },
  fully_booked: { label: 'Fully booked', tone: 'warning' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};

export const BOOKING_STATUS_META: Record<
  BookingStatus,
  { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' }
> = {
  new: { label: 'New', tone: 'warning' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  completed: { label: 'Completed', tone: 'neutral' },
};

export const ENQUIRY_TYPES: { value: EnquiryType; label: string }[] = [
  { value: 'door_supervision', label: 'Door Supervision training' },
  { value: 'close_protection', label: 'Close Protection training' },
  { value: 'booking', label: 'Booking / course dates' },
  { value: 'general', label: 'General enquiry' },
  { value: 'other', label: 'Something else' },
];

/** Used when the course_types table is unavailable (demo mode / before migration). */
export const DEFAULT_COURSE_TYPES: CourseTypeInfo[] = [
  { key: 'door_supervision', label: 'Level 2 Award for Door Supervisors in the Private Security Industry (RQF)', short_label: 'Door Supervision', sort_order: 40 },
  { key: 'close_protection', label: 'Level 3 Certificate for Close Protection Operatives in the Private Security Industry (RQF)', short_label: 'Close Protection', sort_order: 220 },
];

export const BUILT_IN_COURSE_TYPES: string[] = ['door_supervision', 'close_protection'];

/** Used when the course_locations table is unavailable (demo mode / before migration). */
export const DEFAULT_COURSE_LOCATIONS: CourseLocation[] = [
  'London, E14',
  'West Midlands - Wednesbury - WS10',
  'Birmingham',
  'Leicester - LE4',
  'Edinburgh, Scotland',
].map((name, i) => ({ id: `default-${i}`, name, sort_order: (i + 1) * 10 }));

function prettifyKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Short label for a course type key (e.g. "Door Supervision"). Client-safe. */
export function courseTypeShortLabel(key: string, types?: CourseTypeInfo[]): string {
  const t = types?.find((x) => x.key === key) ?? DEFAULT_COURSE_TYPES.find((x) => x.key === key);
  return t?.short_label ?? prettifyKey(key);
}

/** Full label for a course type key (e.g. "SIA Door Supervision"). Client-safe. */
export function courseTypeLabel(key: string, types?: CourseTypeInfo[]): string {
  const t = types?.find((x) => x.key === key) ?? DEFAULT_COURSE_TYPES.find((x) => x.key === key);
  return t?.label ?? prettifyKey(key);
}

/** Short label for a loaded course (uses the label attached when it was fetched). */
export function courseShortType(course: { course_type: string; type_short_label?: string }): string {
  return course.type_short_label ?? courseTypeShortLabel(course.course_type);
}

export const COURSE_STATUS_OPTIONS: { value: CourseStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'fully_booked', label: 'Fully booked' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const BOOKING_STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
];

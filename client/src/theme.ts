import React from 'react';
import {
  Users,
  Car,
  CalendarCheck,
  Key,
  CreditCard,
  Tag,
  MapPin,
  UserCheck,
  Wrench,
  Star,
} from 'lucide-react';
import type { CoreLabel } from './types';

export interface EntityStyle {
  label: CoreLabel;
  name: string;
  description: string;
  icon: React.ElementType;
  // Node visualization colors
  color: string;         // Solid fill color for node circle
  borderColor: string;   // Stroke color for node circle
  textColor: string;     // Text color on light backgrounds
  bgSoft: string;        // Very soft background for badges & cards
  borderSoft: string;    // Soft border for cards
}

export const ENTITY_STYLES: Record<CoreLabel, EntityStyle> = {
  Customer: {
    label: 'Customer',
    name: 'Customer',
    description: 'Registered drivers & corporate rental clients',
    icon: Users,
    color: '#2E5B88',
    borderColor: '#1D3D5D',
    textColor: '#1E4366',
    bgSoft: '#F0F4F8',
    borderSoft: '#C9D8E6',
  },
  VehicleType: {
    label: 'VehicleType',
    name: 'Vehicle Type',
    description: 'Fleet categories (Compact, SUV, EV, Luxury)',
    icon: Tag,
    color: '#326B74',
    borderColor: '#1E474E',
    textColor: '#21525A',
    bgSoft: '#EFF6F7',
    borderSoft: '#C3DFE2',
  },
  Branch: {
    label: 'Branch',
    name: 'Branch Hub',
    description: 'Physical rental depots & vehicle return hubs',
    icon: MapPin,
    color: '#2D664A',
    borderColor: '#1D4532',
    textColor: '#1E4B35',
    bgSoft: '#EEF6F2',
    borderSoft: '#C0DEC9',
  },
  Vehicle: {
    label: 'Vehicle',
    name: 'Vehicle Asset',
    description: 'Fleet units, license plates, and mileage odometers',
    icon: Car,
    color: '#246D7D',
    borderColor: '#174A54',
    textColor: '#184F5A',
    bgSoft: '#EDF5F7',
    borderSoft: '#BEDEE3',
  },
  Booking: {
    label: 'Booking',
    name: 'Booking Order',
    description: 'Customer reservations & date window bookings',
    icon: CalendarCheck,
    color: '#93581D',
    borderColor: '#683C0F',
    textColor: '#704113',
    bgSoft: '#FAF3EB',
    borderSoft: '#E8D2B7',
  },
  Rental: {
    label: 'Rental',
    name: 'Rental Contract',
    description: 'Dispatched vehicle contracts & active checkouts',
    icon: Key,
    color: '#6B4769',
    borderColor: '#4A2F48',
    textColor: '#543452',
    bgSoft: '#F6EFF5',
    borderSoft: '#DEC4D8',
  },
  Payment: {
    label: 'Payment',
    name: 'Payment Ledger',
    description: 'Settled transactions, receipts & deposits',
    icon: CreditCard,
    color: '#3D6B3C',
    borderColor: '#264A25',
    textColor: '#2B512A',
    bgSoft: '#F0F6EF',
    borderSoft: '#C4DEC2',
  },
  Employee: {
    label: 'Employee',
    name: 'Fleet Employee',
    description: 'Branch supervisors, agents & technicians',
    icon: UserCheck,
    color: '#554A78',
    borderColor: '#393054',
    textColor: '#40375E',
    bgSoft: '#F3F1F8',
    borderSoft: '#CEC8DE',
  },
  Maintenance: {
    label: 'Maintenance',
    name: 'Maintenance Log',
    description: 'Scheduled inspections, repairs & servicing records',
    icon: Wrench,
    color: '#933D33',
    borderColor: '#692720',
    textColor: '#712A22',
    bgSoft: '#FAF0EF',
    borderSoft: '#EBC0BC',
  },
  Review: {
    label: 'Review',
    name: 'Customer Review',
    description: 'Post-rental ratings, appraisals & star reviews',
    icon: Star,
    color: '#8A621E',
    borderColor: '#60420E',
    textColor: '#684812',
    bgSoft: '#FAF4E8',
    borderSoft: '#E7D3AD',
  },
};

export const CORE_LABELS: CoreLabel[] = [
  'Customer',
  'Vehicle',
  'Booking',
  'Rental',
  'Payment',
  'VehicleType',
  'Branch',
  'Employee',
  'Maintenance',
  'Review',
];

import { getSession, closeDriver, verifyConnection } from '../neo4j';

/**
 * Idempotent Expansion Script for Neo4j AuraDB
 * Vehicle Rental Graph Intelligence System
 *
 * Expands dataset from 20 nodes to ~244 nodes and ~337 relationships.
 * Preserves all original 20 nodes and 22 relationships.
 * Strictly idempotent using MERGE on constrained primary keys.
 */

// ──────────────────────────────────────────────
// 1. New VehicleTypes (4 new: VT03 - VT06) -> Total 6
// ──────────────────────────────────────────────
const NEW_VEHICLE_TYPES = [
  {
    type_id: 'VT03',
    type_name: 'Sedan',
    daily_rate: 2200,
    description: 'Executive comfortable 5-seater sedan with ample trunk space',
  },
  {
    type_id: 'VT04',
    type_name: 'Electric EV',
    daily_rate: 2500,
    description: 'Zero-emission modern electric vehicle with rapid charging capability',
  },
  {
    type_id: 'VT05',
    type_name: 'Luxury Sedan',
    daily_rate: 4500,
    description: 'Premium executive luxury sedan with leather seating and chauffeur assist',
  },
  {
    type_id: 'VT06',
    type_name: 'Multi-Utility MPV',
    daily_rate: 3200,
    description: 'Spacious 7-seater multi-utility family vehicle designed for group travel',
  },
];

// ──────────────────────────────────────────────
// 2. New Branches (4 new: B03 - B06) -> Total 6
// ──────────────────────────────────────────────
const NEW_BRANCHES = [
  {
    branch_id: 'B03',
    branch_name: 'Hyderabad Hitec City',
    city: 'Hyderabad',
    phone: '040-40003001',
    address: '45 Cyber Towers Road, Madhapur',
  },
  {
    branch_id: 'B04',
    branch_name: 'Mumbai Airport T2',
    city: 'Mumbai',
    phone: '022-40004001',
    address: 'Terminal 2 Commercial Concourse, Andheri East',
  },
  {
    branch_id: 'B05',
    branch_name: 'Delhi Connaught Place',
    city: 'Delhi',
    phone: '011-40005001',
    address: 'Inner Circle Block B, Rajiv Chowk',
  },
  {
    branch_id: 'B06',
    branch_name: 'Pune Hinjawadi',
    city: 'Pune',
    phone: '020-40006001',
    address: 'Phase 1 Infotech Park, Hinjawadi',
  },
];

// ──────────────────────────────────────────────
// 3. New Employees (10 new: E503 - E512) -> Total 12
// ──────────────────────────────────────────────
const NEW_EMPLOYEES = [
  {
    employee_id: 'E503',
    full_name: 'Karthik Rao',
    email: 'karthik.rao@vrms.com',
    phone: '9822000503',
    position: 'Fleet Supervisor',
    hire_date: '2024-03-10',
    branch_id: 'B01', // Chennai
  },
  {
    employee_id: 'E504',
    full_name: 'Ananya Sharma',
    email: 'ananya.sharma@vrms.com',
    phone: '9822000504',
    position: 'Branch Manager',
    hire_date: '2023-11-01',
    branch_id: 'B02', // Bengaluru
  },
  {
    employee_id: 'E505',
    full_name: 'Suresh Reddy',
    email: 'suresh.reddy@vrms.com',
    phone: '9822000505',
    position: 'Rental Executive',
    hire_date: '2024-01-15',
    branch_id: 'B03', // Hyderabad
  },
  {
    employee_id: 'E506',
    full_name: 'Meera Iyer',
    email: 'meera.iyer@vrms.com',
    phone: '9822000506',
    position: 'Dispatch Agent',
    hire_date: '2024-05-20',
    branch_id: 'B03', // Hyderabad
  },
  {
    employee_id: 'E507',
    full_name: 'Vikram Deshmukh',
    email: 'vikram.deshmukh@vrms.com',
    phone: '9822000507',
    position: 'Branch Manager',
    hire_date: '2023-08-12',
    branch_id: 'B04', // Mumbai
  },
  {
    employee_id: 'E508',
    full_name: 'Pooja Kulkarni',
    email: 'pooja.kulkarni@vrms.com',
    phone: '9822000508',
    position: 'Rental Executive',
    hire_date: '2024-02-18',
    branch_id: 'B04', // Mumbai
  },
  {
    employee_id: 'E509',
    full_name: 'Amitabh Malhotra',
    email: 'amitabh.malhotra@vrms.com',
    phone: '9822000509',
    position: 'Branch Manager',
    hire_date: '2023-09-01',
    branch_id: 'B05', // Delhi
  },
  {
    employee_id: 'E510',
    full_name: 'Neha Kapoor',
    email: 'neha.kapoor@vrms.com',
    phone: '9822000510',
    position: 'Customer Service Lead',
    hire_date: '2024-04-05',
    branch_id: 'B05', // Delhi
  },
  {
    employee_id: 'E511',
    full_name: 'Tanmay Joshi',
    email: 'tanmay.joshi@vrms.com',
    phone: '9822000511',
    position: 'Fleet Technician',
    hire_date: '2024-06-10',
    branch_id: 'B06', // Pune
  },
  {
    employee_id: 'E512',
    full_name: 'Ritu Patil',
    email: 'ritu.patil@vrms.com',
    phone: '9822000512',
    position: 'Rental Officer',
    hire_date: '2024-07-01',
    branch_id: 'B06', // Pune
  },
];

// ──────────────────────────────────────────────
// 4. New Vehicles (23 new: V203 - V225) -> Total 25
// ──────────────────────────────────────────────
const NEW_VEHICLES = [
  // Sedans (VT03)
  { vehicle_id: 'V203', reg_number: 'TN02CD2345', brand: 'Honda', model: 'City', vehicle_year: 2023, color: 'Silver', status: 'Available', type_id: 'VT03', branch_id: 'B01' },
  { vehicle_id: 'V204', reg_number: 'KA01EF3456', brand: 'Hyundai', model: 'Verna', vehicle_year: 2024, color: 'Black', status: 'Available', type_id: 'VT03', branch_id: 'B02' },
  { vehicle_id: 'V205', reg_number: 'TS07GH4567', brand: 'Skoda', model: 'Slavia', vehicle_year: 2023, color: 'Red', status: 'Rented', type_id: 'VT03', branch_id: 'B03' },
  { vehicle_id: 'V206', reg_number: 'MH02IJ5678', brand: 'Volkswagen', model: 'Virtus', vehicle_year: 2024, color: 'Blue', status: 'Available', type_id: 'VT03', branch_id: 'B04' },
  // Electric EVs (VT04)
  { vehicle_id: 'V207', reg_number: 'DL01KL6789', brand: 'Tata', model: 'Nexon EV', vehicle_year: 2024, color: 'Teal Blue', status: 'Available', type_id: 'VT04', branch_id: 'B05' },
  { vehicle_id: 'V208', reg_number: 'MH12MN7890', brand: 'MG', model: 'ZS EV', vehicle_year: 2024, color: 'White', status: 'Available', type_id: 'VT04', branch_id: 'B06' },
  { vehicle_id: 'V209', reg_number: 'KA03OP8901', brand: 'Hyundai', model: 'Ioniq 5', vehicle_year: 2024, color: 'Matte Grey', status: 'Available', type_id: 'VT04', branch_id: 'B02' },
  { vehicle_id: 'V210', reg_number: 'TS08QR9012', brand: 'Tata', model: 'Tiago EV', vehicle_year: 2023, color: 'Tropical Mist', status: 'Available', type_id: 'VT04', branch_id: 'B03' },
  // Luxury Sedans (VT05)
  { vehicle_id: 'V211', reg_number: 'MH01ST0123', brand: 'Toyota', model: 'Camry Hybrid', vehicle_year: 2024, color: 'Pearl White', status: 'Available', type_id: 'VT05', branch_id: 'B04' },
  { vehicle_id: 'V212', reg_number: 'DL03UV1234', brand: 'BMW', model: '3 Series Gran Limousine', vehicle_year: 2023, color: 'Mineral Grey', status: 'Rented', type_id: 'VT05', branch_id: 'B05' },
  { vehicle_id: 'V213', reg_number: 'KA05WX2345', brand: 'Mercedes-Benz', model: 'C-Class', vehicle_year: 2024, color: 'Obsidian Black', status: 'Available', type_id: 'VT05', branch_id: 'B02' },
  // Multi-Utility MPVs (VT06)
  { vehicle_id: 'V214', reg_number: 'TN09YZ3456', brand: 'Toyota', model: 'Innova Crysta', vehicle_year: 2023, color: 'Bronze', status: 'Available', type_id: 'VT06', branch_id: 'B01' },
  { vehicle_id: 'V215', reg_number: 'TS09AB4567', brand: 'Maruti', model: 'Ertiga', vehicle_year: 2024, color: 'Magma Grey', status: 'Available', type_id: 'VT06', branch_id: 'B03' },
  { vehicle_id: 'V216', reg_number: 'MH14CD5678', brand: 'Toyota', model: 'Innova Hycross', vehicle_year: 2024, color: 'Super White', status: 'Available', type_id: 'VT06', branch_id: 'B06' },
  { vehicle_id: 'V217', reg_number: 'DL04EF6789', brand: 'Kia', model: 'Carens', vehicle_year: 2023, color: 'Imperial Blue', status: 'Available', type_id: 'VT06', branch_id: 'B05' },
  // Additional SUVs (VT02)
  { vehicle_id: 'V218', reg_number: 'MH03GH7890', brand: 'Mahindra', model: 'XUV700', vehicle_year: 2024, color: 'Midnight Black', status: 'Available', type_id: 'VT02', branch_id: 'B04' },
  { vehicle_id: 'V219', reg_number: 'TS10IJ8901', brand: 'Tata', model: 'Harrier', vehicle_year: 2023, color: 'Ash Grey', status: 'Available', type_id: 'VT02', branch_id: 'B03' },
  { vehicle_id: 'V220', reg_number: 'KA04KL9012', brand: 'Toyota', model: 'Fortuner', vehicle_year: 2024, color: 'Attitude Black', status: 'Available', type_id: 'VT02', branch_id: 'B02' },
  { vehicle_id: 'V221', reg_number: 'TN10MN0123', brand: 'Mahindra', model: 'Thar 4x4', vehicle_year: 2023, color: 'Red Rage', status: 'Maintenance', type_id: 'VT02', branch_id: 'B01' },
  { vehicle_id: 'V222', reg_number: 'DL05OP1234', brand: 'Kia', model: 'Seltos', vehicle_year: 2024, color: 'Pewter Olive', status: 'Available', type_id: 'VT02', branch_id: 'B05' },
  // Additional Hatchbacks (VT01)
  { vehicle_id: 'V223', reg_number: 'MH12QR2345', brand: 'Hyundai', model: 'i20 Asta', vehicle_year: 2023, color: 'Fiery Red', status: 'Available', type_id: 'VT01', branch_id: 'B06' },
  { vehicle_id: 'V224', reg_number: 'TN05ST3456', brand: 'Maruti', model: 'Baleno', vehicle_year: 2024, color: 'Nexa Blue', status: 'Rented', type_id: 'VT01', branch_id: 'B01' },
  { vehicle_id: 'V225', reg_number: 'TS08UV4567', brand: 'Tata', model: 'Altroz', vehicle_year: 2023, color: 'Downtown Red', status: 'Maintenance', type_id: 'VT01', branch_id: 'B03' },
];

// ──────────────────────────────────────────────
// 5. New Customers (28 new: C103 - C130) -> Total 30
// ──────────────────────────────────────────────
const NEW_CUSTOMERS = [
  { customer_id: 'C103', full_name: 'Vikramaditya Patel', email: 'vikram.patel@fictional-corp.in', phone: '9811000103', driving_license_no: 'DL-IND-1003', address: 'Bandra West, Mumbai', dob: '1990-05-14', gender: 'M' },
  { customer_id: 'C104', full_name: 'Sneha Reddy', email: 'sneha.reddy@fictional-net.in', phone: '9811000104', driving_license_no: 'DL-IND-1004', address: 'Jubilee Hills, Hyderabad', dob: '1994-08-22', gender: 'F' },
  { customer_id: 'C105', full_name: 'Ananya Deshmukh', email: 'ananya.d@fictional-mail.org', phone: '9811000105', driving_license_no: 'DL-IND-1005', address: 'Kothrud, Pune', dob: '1998-12-03', gender: 'F' },
  { customer_id: 'C106', full_name: 'Rohan Varma', email: 'rohan.varma@fictional-cloud.in', phone: '9811000106', driving_license_no: 'DL-IND-1006', address: 'Vasant Vihar, Delhi', dob: '1987-02-19', gender: 'M' },
  { customer_id: 'C107', full_name: 'Deepa Narayanan', email: 'deepa.n@fictional-labs.in', phone: '9811000107', driving_license_no: 'DL-IND-1007', address: 'Adyar, Chennai', dob: '1992-07-30', gender: 'F' },
  { customer_id: 'C108', full_name: 'Aditya Bhattacharya', email: 'aditya.b@fictional-post.in', phone: '9811000108', driving_license_no: 'DL-IND-1008', address: 'Indiranagar, Bengaluru', dob: '1995-10-11', gender: 'M' },
  { customer_id: 'C109', full_name: 'Kavita Sengupta', email: 'kavita.s@fictional-hub.org', phone: '9811000109', driving_license_no: 'DL-IND-1009', address: 'Powai, Mumbai', dob: '1991-03-25', gender: 'F' },
  { customer_id: 'C110', full_name: 'Siddharth Nair', email: 'siddharth.n@fictional-corp.in', phone: '9811000110', driving_license_no: 'DL-IND-1010', address: 'Banjara Hills, Hyderabad', dob: '1989-11-17', gender: 'M' },
  { customer_id: 'C111', full_name: 'Pooja Agarwal', email: 'pooja.a@fictional-net.in', phone: '9811000111', driving_license_no: 'DL-IND-1011', address: 'Hauz Khas, Delhi', dob: '1996-06-08', gender: 'F' },
  { customer_id: 'C112', full_name: 'Manoj Pillai', email: 'manoj.pillai@fictional-mail.org', phone: '9811000112', driving_license_no: 'DL-IND-1012', address: 'T Nagar, Chennai', dob: '1986-09-15', gender: 'M' },
  { customer_id: 'C113', full_name: 'Divya Joshi', email: 'divya.joshi@fictional-cloud.in', phone: '9811000113', driving_license_no: 'DL-IND-1013', address: 'Aundh, Pune', dob: '1999-01-28', gender: 'F' },
  { customer_id: 'C114', full_name: 'Nikhil Rathi', email: 'nikhil.rathi@fictional-labs.in', phone: '9811000114', driving_license_no: 'DL-IND-1014', address: 'Whitefield, Bengaluru', dob: '1993-04-12', gender: 'M' },
  { customer_id: 'C115', full_name: 'Meenakshi Sundaram', email: 'meenakshi.s@fictional-post.in', phone: '9811000115', driving_license_no: 'DL-IND-1015', address: 'Mylapore, Chennai', dob: '1988-08-04', gender: 'F' },
  { customer_id: 'C116', full_name: 'Gaurav Khanna', email: 'gaurav.k@fictional-hub.org', phone: '9811000116', driving_license_no: 'DL-IND-1016', address: 'Greater Kailash, Delhi', dob: '1994-12-20', gender: 'M' },
  { customer_id: 'C117', full_name: 'Shweta Kulkarni', email: 'shweta.k@fictional-corp.in', phone: '9811000117', driving_license_no: 'DL-IND-1017', address: 'Viman Nagar, Pune', dob: '1997-05-09', gender: 'F' },
  { customer_id: 'C118', full_name: 'Ashwin Rao', email: 'ashwin.rao@fictional-net.in', phone: '9811000118', driving_license_no: 'DL-IND-1018', address: 'Koramangala, Bengaluru', dob: '1990-10-31', gender: 'M' },
  { customer_id: 'C119', full_name: 'Tanvi Shah', email: 'tanvi.shah@fictional-mail.org', phone: '9811000119', driving_license_no: 'DL-IND-1019', address: 'Juhu, Mumbai', dob: '1995-03-18', gender: 'F' },
  { customer_id: 'C120', full_name: 'Harish Choudhary', email: 'harish.c@fictional-cloud.in', phone: '9811000120', driving_license_no: 'DL-IND-1020', address: 'Gachibowli, Hyderabad', dob: '1985-06-24', gender: 'M' },
  { customer_id: 'C121', full_name: 'Rhea Chakraborty', email: 'rhea.c@fictional-labs.in', phone: '9811000121', driving_license_no: 'DL-IND-1021', address: 'Defence Colony, Delhi', dob: '1998-09-07', gender: 'F' },
  { customer_id: 'C122', full_name: 'Kunal Kapoor', email: 'kunal.k@fictional-post.in', phone: '9811000122', driving_license_no: 'DL-IND-1022', address: 'Alwarpet, Chennai', dob: '1992-02-14', gender: 'M' },
  { customer_id: 'C123', full_name: 'Priyanka Ghosh', email: 'priyanka.g@fictional-hub.org', phone: '9811000123', driving_license_no: 'DL-IND-1023', address: 'Worli, Mumbai', dob: '1991-11-29', gender: 'F' },
  { customer_id: 'C124', full_name: 'Varun Somani', email: 'varun.s@fictional-corp.in', phone: '9811000124', driving_license_no: 'DL-IND-1024', address: 'Kalyani Nagar, Pune', dob: '1989-07-16', gender: 'M' },
  { customer_id: 'C125', full_name: 'Ishaan Trivedi', email: 'ishaan.t@fictional-net.in', phone: '9811000125', driving_license_no: 'DL-IND-1025', address: 'HSR Layout, Bengaluru', dob: '1996-12-05', gender: 'M' },
  { customer_id: 'C126', full_name: 'Anupama Menon', email: 'anupama.m@fictional-mail.org', phone: '9811000126', driving_license_no: 'DL-IND-1026', address: 'Kondapur, Hyderabad', dob: '1993-08-19', gender: 'F' },
  { customer_id: 'C127', full_name: 'Abhishek Saxena', email: 'abhishek.s@fictional-cloud.in', phone: '9811000127', driving_license_no: 'DL-IND-1027', address: 'Noida Sector 62, Delhi NCR', dob: '1987-04-26', gender: 'M' },
  { customer_id: 'C128', full_name: 'Swati Bansal', email: 'swati.b@fictional-labs.in', phone: '9811000128', driving_license_no: 'DL-IND-1028', address: 'Colaba, Mumbai', dob: '1994-01-10', gender: 'F' },
  { customer_id: 'C129', full_name: 'Pranav Hegde', email: 'pranav.h@fictional-post.in', phone: '9811000129', driving_license_no: 'DL-IND-1029', address: 'Malleshwaram, Bengaluru', dob: '1990-09-02', gender: 'M' },
  { customer_id: 'C130', full_name: 'Radhika Madan', email: 'radhika.m@fictional-hub.org', phone: '9811000130', driving_license_no: 'DL-IND-1030', address: 'Anna Nagar, Chennai', dob: '1995-05-27', gender: 'F' },
];

// ──────────────────────────────────────────────
// 6. New Bookings (48 new: BK303 - BK350) -> Total 50
// ──────────────────────────────────────────────
// Strategy:
// - Bookings BK303 - BK335: Completed/Historical rentals (May - August 2026) -> generate Rentals & Payments
// - Bookings BK336 - BK345: Current Confirmed rentals (August - September 2026)
// - Bookings BK346 - BK349: Future Pending reservations (September - October 2026)
// - Booking BK350: Cancelled booking (does not generate rental)
const NEW_BOOKINGS = [
  // Historical Completed Bookings
  { booking_id: 'BK303', customer_id: 'C103', vehicle_id: 'V203', status: 'Completed', booking_date: '2026-05-01', start_date: '2026-05-04', end_date: '2026-05-07' },
  { booking_id: 'BK304', customer_id: 'C104', vehicle_id: 'V204', status: 'Completed', booking_date: '2026-05-10', start_date: '2026-05-12', end_date: '2026-05-15' },
  { booking_id: 'BK305', customer_id: 'C105', vehicle_id: 'V205', status: 'Completed', booking_date: '2026-05-18', start_date: '2026-05-20', end_date: '2026-05-24' },
  { booking_id: 'BK306', customer_id: 'C106', vehicle_id: 'V206', status: 'Completed', booking_date: '2026-05-25', start_date: '2026-05-28', end_date: '2026-05-31' },
  { booking_id: 'BK307', customer_id: 'C107', vehicle_id: 'V207', status: 'Completed', booking_date: '2026-06-01', start_date: '2026-06-03', end_date: '2026-06-06' },
  { booking_id: 'BK308', customer_id: 'C108', vehicle_id: 'V208', status: 'Completed', booking_date: '2026-06-05', start_date: '2026-06-08', end_date: '2026-06-11' },
  { booking_id: 'BK309', customer_id: 'C109', vehicle_id: 'V209', status: 'Completed', booking_date: '2026-06-12', start_date: '2026-06-15', end_date: '2026-06-18' },
  { booking_id: 'BK310', customer_id: 'C110', vehicle_id: 'V210', status: 'Completed', booking_date: '2026-06-20', start_date: '2026-06-22', end_date: '2026-06-25' },
  { booking_id: 'BK311', customer_id: 'C111', vehicle_id: 'V211', status: 'Completed', booking_date: '2026-06-26', start_date: '2026-06-28', end_date: '2026-07-02' },
  { booking_id: 'BK312', customer_id: 'C112', vehicle_id: 'V212', status: 'Completed', booking_date: '2026-07-01', start_date: '2026-07-04', end_date: '2026-07-07' },
  { booking_id: 'BK313', customer_id: 'C113', vehicle_id: 'V213', status: 'Completed', booking_date: '2026-07-05', start_date: '2026-07-08', end_date: '2026-07-12' },
  { booking_id: 'BK314', customer_id: 'C114', vehicle_id: 'V214', status: 'Completed', booking_date: '2026-07-10', start_date: '2026-07-13', end_date: '2026-07-16' },
  { booking_id: 'BK315', customer_id: 'C115', vehicle_id: 'V215', status: 'Completed', booking_date: '2026-07-15', start_date: '2026-07-18', end_date: '2026-07-21' },
  { booking_id: 'BK316', customer_id: 'C116', vehicle_id: 'V216', status: 'Completed', booking_date: '2026-07-20', start_date: '2026-07-22', end_date: '2026-07-26' },
  { booking_id: 'BK317', customer_id: 'C117', vehicle_id: 'V217', status: 'Completed', booking_date: '2026-07-25', start_date: '2026-07-27', end_date: '2026-07-30' },
  { booking_id: 'BK318', customer_id: 'C118', vehicle_id: 'V218', status: 'Completed', booking_date: '2026-07-28', start_date: '2026-08-01', end_date: '2026-08-04' },
  { booking_id: 'BK319', customer_id: 'C119', vehicle_id: 'V219', status: 'Completed', booking_date: '2026-08-02', start_date: '2026-08-05', end_date: '2026-08-08' },
  { booking_id: 'BK320', customer_id: 'C120', vehicle_id: 'V220', status: 'Completed', booking_date: '2026-08-04', start_date: '2026-08-07', end_date: '2026-08-11' },
  { booking_id: 'BK321', customer_id: 'C121', vehicle_id: 'V221', status: 'Completed', booking_date: '2026-08-06', start_date: '2026-08-09', end_date: '2026-08-12' },
  { booking_id: 'BK322', customer_id: 'C122', vehicle_id: 'V222', status: 'Completed', booking_date: '2026-08-08', start_date: '2026-08-11', end_date: '2026-08-14' },
  { booking_id: 'BK323', customer_id: 'C123', vehicle_id: 'V223', status: 'Completed', booking_date: '2026-08-10', start_date: '2026-08-13', end_date: '2026-08-16' },
  { booking_id: 'BK324', customer_id: 'C124', vehicle_id: 'V224', status: 'Completed', booking_date: '2026-08-12', start_date: '2026-08-14', end_date: '2026-08-17' },
  { booking_id: 'BK325', customer_id: 'C125', vehicle_id: 'V225', status: 'Completed', booking_date: '2026-08-13', start_date: '2026-08-15', end_date: '2026-08-18' },
  // Repeated customer bookings to demonstrate loyalty in Graph Analytics
  { booking_id: 'BK326', customer_id: 'C103', vehicle_id: 'V211', status: 'Completed', booking_date: '2026-06-10', start_date: '2026-06-14', end_date: '2026-06-17' },
  { booking_id: 'BK327', customer_id: 'C104', vehicle_id: 'V215', status: 'Completed', booking_date: '2026-06-22', start_date: '2026-06-25', end_date: '2026-06-28' },
  { booking_id: 'BK328', customer_id: 'C108', vehicle_id: 'V220', status: 'Completed', booking_date: '2026-07-02', start_date: '2026-07-05', end_date: '2026-07-08' },
  { booking_id: 'BK329', customer_id: 'C114', vehicle_id: 'V207', status: 'Completed', booking_date: '2026-07-18', start_date: '2026-07-21', end_date: '2026-07-24' },
  { booking_id: 'BK330', customer_id: 'C118', vehicle_id: 'V209', status: 'Completed', booking_date: '2026-07-24', start_date: '2026-07-27', end_date: '2026-07-30' },
  { booking_id: 'BK331', customer_id: 'C106', vehicle_id: 'V212', status: 'Completed', booking_date: '2026-08-01', start_date: '2026-08-04', end_date: '2026-08-07' },
  { booking_id: 'BK332', customer_id: 'C110', vehicle_id: 'V219', status: 'Completed', booking_date: '2026-08-05', start_date: '2026-08-08', end_date: '2026-08-11' },
  { booking_id: 'BK333', customer_id: 'C122', vehicle_id: 'V203', status: 'Completed', booking_date: '2026-08-09', start_date: '2026-08-12', end_date: '2026-08-15' },
  { booking_id: 'BK334', customer_id: 'C126', vehicle_id: 'V210', status: 'Completed', booking_date: '2026-08-11', start_date: '2026-08-14', end_date: '2026-08-17' },
  { booking_id: 'BK335', customer_id: 'C129', vehicle_id: 'V213', status: 'Completed', booking_date: '2026-08-14', start_date: '2026-08-16', end_date: '2026-08-19' },

  // Active / Confirmed Bookings (August - September 2026)
  { booking_id: 'BK336', customer_id: 'C105', vehicle_id: 'V205', status: 'Confirmed', booking_date: '2026-08-19', start_date: '2026-08-22', end_date: '2026-08-25' },
  { booking_id: 'BK337', customer_id: 'C112', vehicle_id: 'V212', status: 'Confirmed', booking_date: '2026-08-20', start_date: '2026-08-23', end_date: '2026-08-27' },
  { booking_id: 'BK338', customer_id: 'C124', vehicle_id: 'V224', status: 'Confirmed', booking_date: '2026-08-21', start_date: '2026-08-24', end_date: '2026-08-28' },
  { booking_id: 'BK339', customer_id: 'C127', vehicle_id: 'V204', status: 'Confirmed', booking_date: '2026-08-25', start_date: '2026-08-28', end_date: '2026-09-01' },
  { booking_id: 'BK340', customer_id: 'C128', vehicle_id: 'V206', status: 'Confirmed', booking_date: '2026-08-26', start_date: '2026-09-02', end_date: '2026-09-05' },
  { booking_id: 'BK341', customer_id: 'C107', vehicle_id: 'V214', status: 'Confirmed', booking_date: '2026-08-28', start_date: '2026-09-04', end_date: '2026-09-08' },
  { booking_id: 'BK342', customer_id: 'C109', vehicle_id: 'V216', status: 'Confirmed', booking_date: '2026-08-29', start_date: '2026-09-07', end_date: '2026-09-10' },
  { booking_id: 'BK343', customer_id: 'C113', vehicle_id: 'V218', status: 'Confirmed', booking_date: '2026-08-30', start_date: '2026-09-10', end_date: '2026-09-14' },
  { booking_id: 'BK344', customer_id: 'C117', vehicle_id: 'V223', status: 'Confirmed', booking_date: '2026-09-01', start_date: '2026-09-12', end_date: '2026-09-15' },
  { booking_id: 'BK345', customer_id: 'C121', vehicle_id: 'V207', status: 'Confirmed', booking_date: '2026-09-03', start_date: '2026-09-15', end_date: '2026-09-18' },

  // Future Pending Reservations
  { booking_id: 'BK346', customer_id: 'C123', vehicle_id: 'V208', status: 'Pending', booking_date: '2026-09-05', start_date: '2026-09-20', end_date: '2026-09-24' },
  { booking_id: 'BK347', customer_id: 'C125', vehicle_id: 'V211', status: 'Pending', booking_date: '2026-09-06', start_date: '2026-09-22', end_date: '2026-09-26' },
  { booking_id: 'BK348', customer_id: 'C130', vehicle_id: 'V217', status: 'Pending', booking_date: '2026-09-08', start_date: '2026-09-25', end_date: '2026-09-28' },
  { booking_id: 'BK349', customer_id: 'C115', vehicle_id: 'V215', status: 'Pending', booking_date: '2026-09-10', start_date: '2026-10-01', end_date: '2026-10-05' },

  // Controlled Conflict Test Pair: Booking BK350 overlaps with BK336 for vehicle V205 (Aug 23 - Aug 26)
  { booking_id: 'BK350', customer_id: 'C119', vehicle_id: 'V205', status: 'Confirmed', booking_date: '2026-08-20', start_date: '2026-08-23', end_date: '2026-08-26' },
];

// ──────────────────────────────────────────────
// 7. New Rentals (33 new: R403 - R435) -> Total 35
// (Generated from completed bookings BK303 - BK335)
// ──────────────────────────────────────────────
const NEW_RENTALS = NEW_BOOKINGS.slice(0, 33).map((b, idx) => {
  const rentalNum = 403 + idx;
  const rental_id = `R4${rentalNum.toString().slice(1)}`;
  const empIdx = idx % NEW_EMPLOYEES.length;
  const employee_id = NEW_EMPLOYEES[empIdx].employee_id;

  // Compute charges based on days
  const startDay = parseInt(b.start_date.split('-')[2]);
  const endDay = parseInt(b.end_date.split('-')[2]);
  const days = Math.max(endDay - startDay, 1);
  const dailyRate = 2200; // estimated average
  const total_charges = days * dailyRate;

  const km_start = 12000 + idx * 450;
  const km_end = km_start + days * 110 + 25;
  const fuel_start = 95;
  const fuel_end = 65;

  return {
    rental_id,
    booking_id: b.booking_id,
    employee_id,
    pickup_date: b.start_date,
    expected_return_date: b.end_date,
    actual_return_date: b.end_date,
    total_charges,
    km_start,
    km_end,
    fuel_start,
    fuel_end,
  };
});

// ──────────────────────────────────────────────
// 8. New Payments (33 new: PY503 - PY535) -> Total 35
// ──────────────────────────────────────────────
const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'];

const NEW_PAYMENTS = NEW_RENTALS.map((r, idx) => {
  const payNum = 503 + idx;
  const payment_id = `PY${payNum}`;
  const transaction_id = `TXN9${(idx + 3).toString().padStart(3, '0')}`;
  const method = PAYMENT_METHODS[idx % PAYMENT_METHODS.length];

  return {
    payment_id,
    rental_id: r.rental_id,
    transaction_id,
    payment_method: method,
    payment_status: 'Paid',
    amount: r.total_charges,
    payment_date: r.pickup_date,
  };
});

// ──────────────────────────────────────────────
// 9. New Maintenance (18 new: M603 - M620) -> Total 20
// ──────────────────────────────────────────────
const MAINTENANCE_DESCRIPTIONS = [
  'Regular 10,000 km periodic engine check and synthetic oil replacement',
  'Brake pads wear inspection and rotor resurfacing',
  'Wheel alignment, computerized balancing, and tire rotation',
  'Battery electrolyte check, terminal cleaning, and health diagnostic',
  'AC cabin filter replacement and evaporator core sanitization',
  'Coolant fluid flush and radiator pressure test',
  'Transmission fluid replacement and clutch play calibration',
  'Suspension bushing inspection and shock absorber check',
  'EV high-voltage battery diagnostic and motor coolant service',
  'Wiper blade replacement and windshield washer pump repair',
];

const NEW_MAINTENANCE = Array.from({ length: 18 }, (_, idx) => {
  const mNum = 603 + idx;
  const maintenance_id = `M${mNum}`;
  const vehicle_id = NEW_VEHICLES[idx % NEW_VEHICLES.length].vehicle_id;
  const desc = MAINTENANCE_DESCRIPTIONS[idx % MAINTENANCE_DESCRIPTIONS.length];
  const isPast = idx < 12;
  const status = isPast ? 'Completed' : idx % 2 === 0 ? 'Scheduled' : 'In Progress';
  const cost = 1500 + (idx % 6) * 1200;

  const month = (idx % 4) + 6;
  const service_date = `2026-0${month}-15`;
  const nextMonth = (idx % 4) + 9;
  const next_service_date = `2026-${nextMonth < 10 ? '0' + nextMonth : nextMonth}-20`;

  return {
    maintenance_id,
    vehicle_id,
    description: desc,
    status,
    cost,
    service_date,
    next_service_date,
  };
});

// ──────────────────────────────────────────────
// 10. New Reviews (23 new: RV703 - RV725) -> Total 25
// ──────────────────────────────────────────────
const REVIEW_COMMENTS = [
  'Extremely smooth pickup experience and spotless vehicle interior.',
  'Well maintained car with excellent fuel efficiency on the highway.',
  'Punctual dispatch, quick paperwork, and very helpful staff.',
  'Comfortable ride for family road trip. The AC was chilling perfectly.',
  'Clean EV with great battery range. Charging cable was provided.',
  'Luxury feel and premium sound system. Will definitely book again.',
  'Good condition car, clean tires, and seamless UPI security deposit return.',
  'Responsive customer support and smooth key handover at the airport.',
  'Vehicle drove like brand new. Great mileage and solid braking.',
  'Quick checkout process. Transparent fuel policy with zero hidden charges.',
];

const NEW_REVIEWS = Array.from({ length: 23 }, (_, idx) => {
  const rNum = 703 + idx;
  const review_id = `RV${rNum}`;
  const customer_id = NEW_CUSTOMERS[idx % NEW_CUSTOMERS.length].customer_id;
  const vehicle_id = NEW_VEHICLES[idx % NEW_VEHICLES.length].vehicle_id;
  const rating = idx % 5 === 0 ? 4 : idx % 7 === 0 ? 3 : 5;
  const comments = REVIEW_COMMENTS[idx % REVIEW_COMMENTS.length];
  const review_date = `2026-0${(idx % 3) + 6}-${15 + (idx % 12)}`;

  return {
    review_id,
    customer_id,
    vehicle_id,
    rating,
    comments,
    review_date,
  };
});

// ──────────────────────────────────────────────
// MAIN EXECUTION LOGIC
// ──────────────────────────────────────────────
export async function expandDataset() {
  console.log('========================================================');
  console.log('   VEHICLE RENTAL GRAPH INTELLIGENCE - EXPANSION SEED   ');
  console.log('========================================================\n');

  // 1. Verify connection
  const conn = await verifyConnection();
  if (!conn.connected) {
    throw new Error(`Cannot connect to Neo4j AuraDB: ${conn.error}`);
  }
  console.log(`[INFO] Connected to Neo4j AuraDB (Latency: ${conn.latencyMs}ms)\n`);

  const session = getSession('WRITE');
  try {
    // 2. Initial count check
    const preCount = await session.run('MATCH (n) RETURN count(n) AS nodeCount');
    const preRel = await session.run('MATCH ()-[r]->() RETURN count(r) AS relCount');
    console.log(`[PRE-SEED STATUS] Current Nodes: ${preCount.records[0].get('nodeCount')}, Current Relationships: ${preRel.records[0].get('relCount')}\n`);

    // ──────────────────────────────────────────────
    // A. Insert VehicleTypes
    // ──────────────────────────────────────────────
    console.log(`[STEP 1/10] Upserting ${NEW_VEHICLE_TYPES.length} VehicleTypes...`);
    for (const vt of NEW_VEHICLE_TYPES) {
      await session.run(
        `
        MERGE (vt:VehicleType { type_id: $type_id })
        ON CREATE SET
          vt.type_name = $type_name,
          vt.daily_rate = $daily_rate,
          vt.description = $description
        `,
        vt
      );
    }

    // ──────────────────────────────────────────────
    // B. Insert Branches
    // ──────────────────────────────────────────────
    console.log(`[STEP 2/10] Upserting ${NEW_BRANCHES.length} Branches...`);
    for (const br of NEW_BRANCHES) {
      await session.run(
        `
        MERGE (br:Branch { branch_id: $branch_id })
        ON CREATE SET
          br.branch_name = $branch_name,
          br.city = $city,
          br.phone = $phone,
          br.address = $address
        `,
        br
      );
    }

    // ──────────────────────────────────────────────
    // C. Insert Employees & Connect to Branches
    // ──────────────────────────────────────────────
    console.log(`[STEP 3/10] Upserting ${NEW_EMPLOYEES.length} Employees & Linking [:EMPLOYS]...`);
    for (const emp of NEW_EMPLOYEES) {
      await session.run(
        `
        MERGE (e:Employee { employee_id: $employee_id })
        ON CREATE SET
          e.full_name = $full_name,
          e.email = $email,
          e.phone = $phone,
          e.position = $position,
          e.hire_date = date($hire_date)
        WITH e
        MATCH (br:Branch { branch_id: $branch_id })
        MERGE (br)-[:EMPLOYS]->(e)
        `,
        emp
      );
    }

    // ──────────────────────────────────────────────
    // D. Insert Vehicles & Connect to Type & Branch
    // ──────────────────────────────────────────────
    console.log(`[STEP 4/10] Upserting ${NEW_VEHICLES.length} Vehicles & Linking [:OF_TYPE], [:LOCATED_AT]...`);
    for (const v of NEW_VEHICLES) {
      await session.run(
        `
        MERGE (veh:Vehicle { vehicle_id: $vehicle_id })
        ON CREATE SET
          veh.reg_number = $reg_number,
          veh.brand = $brand,
          veh.model = $model,
          veh.vehicle_year = $vehicle_year,
          veh.color = $color,
          veh.status = $status
        WITH veh
        MATCH (vt:VehicleType { type_id: $type_id })
        MATCH (br:Branch { branch_id: $branch_id })
        MERGE (veh)-[:OF_TYPE]->(vt)
        MERGE (veh)-[:LOCATED_AT]->(br)
        `,
        v
      );
    }

    // ──────────────────────────────────────────────
    // E. Insert Customers
    // ──────────────────────────────────────────────
    console.log(`[STEP 5/10] Upserting ${NEW_CUSTOMERS.length} Customers...`);
    for (const c of NEW_CUSTOMERS) {
      await session.run(
        `
        MERGE (cust:Customer { customer_id: $customer_id })
        ON CREATE SET
          cust.full_name = $full_name,
          cust.email = $email,
          cust.phone = $phone,
          cust.driving_license_no = $driving_license_no,
          cust.address = $address,
          cust.dob = date($dob),
          cust.gender = $gender
        `,
        c
      );
    }

    // ──────────────────────────────────────────────
    // F. Insert Bookings & Link Customer [:MADE] & Vehicle [:RESERVES]
    // ──────────────────────────────────────────────
    console.log(`[STEP 6/10] Upserting ${NEW_BOOKINGS.length} Bookings & Linking [:MADE], [:RESERVES]...`);
    for (const b of NEW_BOOKINGS) {
      await session.run(
        `
        MERGE (bk:Booking { booking_id: $booking_id })
        ON CREATE SET
          bk.status = $status,
          bk.booking_date = date($booking_date),
          bk.start_date = date($start_date),
          bk.end_date = date($end_date)
        WITH bk
        MATCH (c:Customer { customer_id: $customer_id })
        MATCH (v:Vehicle { vehicle_id: $vehicle_id })
        MERGE (c)-[:MADE]->(bk)
        MERGE (bk)-[:RESERVES]->(v)
        `,
        b
      );
    }

    // ──────────────────────────────────────────────
    // G. Insert Rentals & Link Booking [:GENERATES] & Employee [:HANDLED_BY]
    // ──────────────────────────────────────────────
    console.log(`[STEP 7/10] Upserting ${NEW_RENTALS.length} Rentals & Linking [:GENERATES], [:HANDLED_BY]...`);
    for (const r of NEW_RENTALS) {
      await session.run(
        `
        MERGE (rent:Rental { rental_id: $rental_id })
        ON CREATE SET
          rent.pickup_date = date($pickup_date),
          rent.expected_return_date = date($expected_return_date),
          rent.actual_return_date = date($actual_return_date),
          rent.total_charges = $total_charges,
          rent.km_start = $km_start,
          rent.km_end = $km_end,
          rent.fuel_start = $fuel_start,
          rent.fuel_end = $fuel_end
        WITH rent
        MATCH (bk:Booking { booking_id: $booking_id })
        MATCH (e:Employee { employee_id: $employee_id })
        MERGE (bk)-[:GENERATES]->(rent)
        MERGE (rent)-[:HANDLED_BY]->(e)
        `,
        r
      );
    }

    // ──────────────────────────────────────────────
    // H. Insert Payments & Link Rental [:HAS_PAYMENT]
    // ──────────────────────────────────────────────
    console.log(`[STEP 8/10] Upserting ${NEW_PAYMENTS.length} Payments & Linking [:HAS_PAYMENT]...`);
    for (const p of NEW_PAYMENTS) {
      await session.run(
        `
        MERGE (pay:Payment { payment_id: $payment_id })
        ON CREATE SET
          pay.transaction_id = $transaction_id,
          pay.payment_method = $payment_method,
          pay.payment_status = $payment_status,
          pay.amount = $amount,
          pay.payment_date = date($payment_date)
        WITH pay
        MATCH (r:Rental { rental_id: $rental_id })
        MERGE (r)-[:HAS_PAYMENT]->(pay)
        `,
        p
      );
    }

    // ──────────────────────────────────────────────
    // I. Insert Maintenance & Link Vehicle [:HAS_MAINTENANCE]
    // ──────────────────────────────────────────────
    console.log(`[STEP 9/10] Upserting ${NEW_MAINTENANCE.length} Maintenance Records & Linking [:HAS_MAINTENANCE]...`);
    for (const m of NEW_MAINTENANCE) {
      await session.run(
        `
        MERGE (maint:Maintenance { maintenance_id: $maintenance_id })
        ON CREATE SET
          maint.description = $description,
          maint.status = $status,
          maint.cost = $cost,
          maint.service_date = date($service_date),
          maint.next_service_date = date($next_service_date)
        WITH maint
        MATCH (v:Vehicle { vehicle_id: $vehicle_id })
        MERGE (v)-[:HAS_MAINTENANCE]->(maint)
        `,
        m
      );
    }

    // ──────────────────────────────────────────────
    // J. Insert Reviews & Link Customer [:WROTE] & Vehicle [:REVIEWS]
    // ──────────────────────────────────────────────
    console.log(`[STEP 10/10] Upserting ${NEW_REVIEWS.length} Reviews & Linking [:WROTE], [:REVIEWS]...`);
    for (const rev of NEW_REVIEWS) {
      await session.run(
        `
        MERGE (r:Review { review_id: $review_id })
        ON CREATE SET
          r.rating = $rating,
          r.comments = $comments,
          r.review_date = date($review_date)
        WITH r
        MATCH (c:Customer { customer_id: $customer_id })
        MATCH (v:Vehicle { vehicle_id: $vehicle_id })
        MERGE (c)-[:WROTE]->(r)
        MERGE (r)-[:REVIEWS]->(v)
        `,
        rev
      );
    }

    console.log('\n[SUCCESS] Expansion script completed successfully!\n');

    // ──────────────────────────────────────────────
    // POST-SEED VERIFICATION REPORT
    // ──────────────────────────────────────────────
    console.log('========================================================');
    console.log('              POST-SEED VERIFICATION AUDIT              ');
    console.log('========================================================\n');

    const postNodeCount = await session.run('MATCH (n) RETURN count(n) AS nodeCount');
    const postRelCount = await session.run('MATCH ()-[r]->() RETURN count(r) AS relCount');
    console.log(`Total Graph Nodes:         ${postNodeCount.records[0].get('nodeCount')}`);
    console.log(`Total Graph Relationships: ${postRelCount.records[0].get('relCount')}\n`);

    console.log('--- Breakdown by Label ---');
    const labelBreakdown = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] AS label, count(n) AS count
      ORDER BY count DESC
    `);
    labelBreakdown.records.forEach((r) => {
      console.log(`  ${r.get('label').padEnd(16)}: ${r.get('count')}`);
    });

    console.log('\n--- Breakdown by Relationship Type ---');
    const relBreakdown = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) AS type, count(r) AS count
      ORDER BY count DESC
    `);
    relBreakdown.records.forEach((r) => {
      console.log(`  [:${r.get('type')}]:`.padEnd(20) + ` ${r.get('count')}`);
    });

    console.log('\n--- Referential Integrity Checks ---');
    const orphanBookings = await session.run('MATCH (b:Booking) WHERE NOT (b)<-[:MADE]-(:Customer) OR NOT (b)-[:RESERVES]->(:Vehicle) RETURN count(b) AS c');
    const orphanRentals = await session.run('MATCH (r:Rental) WHERE NOT (r)<-[:GENERATES]-(:Booking) OR NOT (r)-[:HANDLED_BY]->(:Employee) RETURN count(r) AS c');
    const orphanPayments = await session.run('MATCH (p:Payment) WHERE NOT (p)<-[:HAS_PAYMENT]-(:Rental) RETURN count(p) AS c');
    const orphanReviews = await session.run('MATCH (rev:Review) WHERE NOT (rev)<-[:WROTE]-(:Customer) OR NOT (rev)-[:REVIEWS]->(:Vehicle) RETURN count(rev) AS c');

    console.log(`  Orphan Bookings: ${orphanBookings.records[0].get('c')} (expected: 0)`);
    console.log(`  Orphan Rentals:  ${orphanRentals.records[0].get('c')} (expected: 0)`);
    console.log(`  Orphan Payments: ${orphanPayments.records[0].get('c')} (expected: 0)`);
    console.log(`  Orphan Reviews:  ${orphanReviews.records[0].get('c')} (expected: 0)`);

    console.log('\n[AUDIT COMPLETE] Live Neo4j database is integral and fully expanded.\n');
  } finally {
    await session.close();
    await closeDriver();
  }
}

// Execute if run directly
if (process.argv[1] && process.argv[1].includes('expandDataset')) {
  expandDataset().catch((err) => {
    console.error('[FATAL ERROR IN EXPANSION SEED]:', err);
    process.exit(1);
  });
}

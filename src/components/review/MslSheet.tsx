import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Search, Save, Download, Check, Plus, Trash2, 
  Eye, EyeOff, Sparkles, Filter, RefreshCw, AlertTriangle, 
  X, RotateCcw, Link2, UserPlus, ArrowUpDown, Settings2, Info,
  SlidersHorizontal, Tag, Layers, CheckCircle2, Edit3, ArrowUp, ArrowDown, ListOrdered
} from 'lucide-react';
import { memoryStore, MslDoctor } from '../../data/memoryStore';

const MSL_STORAGE_KEY = 'dios_msl_schedule_permanent_v5';
const MSL_ALIASES_KEY = 'dios_msl_aliases_mapping_v5';
const MSL_SAVED_VIEW_KEY = 'dios_msl_saved_filter_view_v5';
const MSL_ACTIVITY_MASTER_KEY = 'dios_msl_activity_master_v1';
const MSL_SPECIALITY_MASTER_KEY = 'dios_msl_speciality_master_v1';
const MSL_CUSTOM_RULES_KEY = 'dios_msl_custom_priority_rules_v1';

export interface CustomPriorityRule {
  id: string;
  field: 'activity' | 'speciality';
  value: string;
}

const DEFAULT_CUSTOM_RULES: CustomPriorityRule[] = [
  { id: 'r1', field: 'activity', value: 'CRM' },
  { id: 'r2', field: 'speciality', value: 'ENDO' },
  { id: 'r3', field: 'activity', value: 'WCFYH VAL/VIN' }
];

const DEFAULT_ACTIVITY_MASTER = [
  'CRM', 'WCFYH VAL/VIN', 'WCFYH VTL', 'A2 GHEE', 'LGT TABLE TOP',
  'VTL TABLE TOP', 'GLUCOMETER', 'CRM+LGT TABLE TOP', 'SPECIAL PLAN'
];

const DEFAULT_SPECIALITY_MASTER = [
  'MD MED',
  'DM CARDIO',
  'CARDIOLOGY',
  'DM ENDO',
  'ENDO',
  'DM NEURO',
  'DNB NEFRO',
  'NEPHROLOGIST',
  'MBBS MD',
  'PHY',
  'GENERAL PHYSICIAN',
  'GP',
  'CVTS',
  'MD PSY',
  'MS ORTHO',
  'SURJAN',
  'C.PHY',
  'CONSULTANT PHYSICIAN',
  'CONSPHYS',
  'M B B S PHY'
];

export const MASTER_123_MSL_DOCTORS: MslDoctor[] = [
  { srNo: 23, doctorName: 'Abhay jain', activityType: 'CRM', speciality: 'CONSULTANT PHYSICIAN', dob: '12/12/1972', doa: '', apr: '1,7,10,17,21,24,27,29', may: '6,8,11,19,26,27,29', jun: '1,2,12,16,18', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 50, doctorName: 'ABHIJEET BASU', activityType: '', speciality: 'MD MED', dob: '12/12/1972', doa: '', apr: '7,9,11,17,24', may: '4,6,8,15,18', jun: '13,19,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 61, doctorName: 'Abhishek Kumar', activityType: '', speciality: 'CONSPHYS', dob: '', doa: '', apr: '2,10,17,23,24,28,30', may: '15,21,28', jun: '12,18,25', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 10, doctorName: 'AKVATS', activityType: 'CRM', speciality: 'DM NEURO', dob: '02/08/2019', doa: '', apr: '1,15,23,30', may: '6,14,21', jun: '3,18,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 59, doctorName: 'Ameet Mehta', activityType: '', speciality: 'GENERAL PHYSICIAN', dob: '27/04/1900', doa: '19/05/1900', apr: '3,13,17,24,27', may: '8,15,28,29', jun: '1,3,16', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 37, doctorName: 'AMIT KHANDELWAL', activityType: 'WCFYH VAL/VIN', speciality: 'CARDIO', dob: '03/04/1977', doa: '', apr: '21', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 66, doctorName: 'ANIS JUKARWALA', activityType: '', speciality: 'MD', dob: '', doa: '', apr: '1,10,30', may: '18,27', jun: '12', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 20, doctorName: 'ANISH JAIN', activityType: 'CRM', speciality: 'MD MED', dob: '16/12/2019', doa: '', apr: '', may: '', jun: '11', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 86, doctorName: 'ANMOL PAGARIYA', activityType: '', speciality: 'MD MED', dob: '23/01/2019', doa: '', apr: '6,22', may: '7,22', jun: '4,23', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 96, doctorName: 'ANUBHAV BANSAL', activityType: '', speciality: 'CVTS', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 74, doctorName: 'ANURAG JAIN', activityType: '', speciality: 'DNB NEFRO', dob: '12/03/1979', doa: '', apr: '', may: '', jun: '20', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 107, doctorName: 'Ashutosh soni', activityType: '', speciality: 'NEPHRO', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 114, doctorName: 'ASHWIN PATIDAR', activityType: '', speciality: 'MBBS MD', dob: '', doa: '', apr: '8', may: '13,25', jun: '17,26', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 22, doctorName: 'BALDEV MEENA', activityType: 'CRM', speciality: 'MD MED', dob: '05/07/1997', doa: '', apr: '1,2,9,11,18,27', may: '14,28,27', jun: '12,22,25,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 57, doctorName: 'BHUPESH PARTANI', activityType: '', speciality: 'MD MED', dob: '23/10/2019', doa: '', apr: '6,22', may: '7,22', jun: '4,23', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 113, doctorName: 'BIPIN CHANDRA ADITYA DASARI', activityType: '', speciality: 'CARDIO', dob: '13/05/1990', doa: '', apr: '8,16', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 111, doctorName: 'BL KUMAWAT', activityType: '', speciality: 'MBBB MD', dob: '', doa: '', apr: '6,22', may: '22', jun: '4,23', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 6, doctorName: 'BS BOMB', activityType: 'CRM', speciality: 'MD MED', dob: '08/12/2019', doa: '', apr: '4,11,15', may: '8,14,18', jun: '1,18', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 79, doctorName: 'CHIRAG RATHOR', activityType: '', speciality: 'MD MED', dob: '03/04/1990', doa: '10/02/2000', apr: '25', may: '2,16', jun: '6,20,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 34, doctorName: 'CPPUROHIT', activityType: 'WCFYH VAL/VIN', speciality: 'DM CARDIO', dob: '02/11/1971', doa: '', apr: '4,14,21,28', may: '12,18', jun: '20', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 7, doctorName: 'D C SHARMA', activityType: 'CRM', speciality: 'DM ENDO', dob: '12/05/2019', doa: '', apr: '3,9,10', may: '7,12,28', jun: '12,18', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 108, doctorName: 'DEEPA KATARA', activityType: '', speciality: 'MD PHYSICAN', dob: '', doa: '', apr: '8,16', may: '25', jun: '26', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 32, doctorName: 'DEEPAK AAMETHA', activityType: 'WCFYH VAL/VIN', speciality: 'MD.CARDIO', dob: '17/03/1980', doa: '', apr: '7,10,17', may: '12,19,26', jun: '16,19', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 120, doctorName: 'DEEPAK GARG', activityType: '', speciality: 'MBBS PHY', dob: '', doa: '', apr: '4', may: '', jun: '20', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 12, doctorName: 'DENY', activityType: 'CRM', speciality: 'DM CARDIO', dob: '03/06/2019', doa: '', apr: '9,10,24,30', may: '8,19,26,29', jun: '12,18,25', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 38, doctorName: 'Dilip jain', activityType: 'WCFYH VAL/VIN', speciality: 'CARDIOLOGY', dob: '24/04/1982', doa: '', apr: '4,13,17,21,27', may: '18,26,29', jun: '9,19,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 2, doctorName: 'DP SINGH', activityType: 'CRM', speciality: 'MD MED', dob: '23/11/2019', doa: '', apr: '7,23,27', may: '6,11,21,29,30', jun: '15,24,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 27, doctorName: 'G K Mukhiya', activityType: 'CRM', speciality: 'DM NEPHRO', dob: '13/05/1973', doa: '', apr: '3,11', may: '8,15,29', jun: '13,19', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 97, doctorName: 'GOURAV KUMAR MITTAL', activityType: '', speciality: 'CARDIO', dob: '11/09/1900', doa: '23/06/1900', apr: '27', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 75, doctorName: 'GOVIND MANGAL', activityType: '', speciality: 'DM NEURO', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 103, doctorName: 'GYANKUMAR DAKSH', activityType: '', speciality: 'General Practitioner (GP)', dob: '', doa: '', apr: '', may: '', jun: '11', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 116, doctorName: 'HARBEER SINGH CHHABRA', activityType: '', speciality: 'PHY', dob: '', doa: '', apr: '3,24', may: '29', jun: '12', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 92, doctorName: 'Harish charpota', activityType: '', speciality: 'M B B S PHY', dob: '16/10/1900', doa: '27/04/1900', apr: '', may: '13', jun: '17,26', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 70, doctorName: 'HARISH SANADHY', activityType: '', speciality: 'MD MED', dob: '01/01/1970', doa: '', apr: '4,14,21,28', may: '12', jun: '9', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 87, doctorName: 'HC SONI', activityType: '', speciality: 'MD MED', dob: '25/10/1955', doa: '23/11/2023', apr: '6,22', may: '7,22', jun: '4,23', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 21, doctorName: 'HEMANT MAHUR', activityType: 'CRM', speciality: 'MD MED', dob: '25/03/1996', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 24, doctorName: 'Hitesh yadav', activityType: 'CRM', speciality: 'CARDIO', dob: '11/05/1900', doa: '31/01/1900', apr: '1,10,15', may: '8,11,28', jun: '12,22,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 76, doctorName: 'JAGDISH VISHNOI', activityType: '', speciality: 'MD MED', dob: '03/03/1974', doa: '', apr: '14,21,23,28', may: '6,12,19,26', jun: '2,9,16', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 42, doctorName: 'JAY CHORDIYA', activityType: 'LGT TABLE TOP', speciality: 'DM ENDO', dob: '21/04/2019', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 56, doctorName: 'JAYESH GANDHI', activityType: '', speciality: 'MD MED', dob: '10/06/2019', doa: '', apr: '25', may: '2,9,16', jun: '6,10,20,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 51, doctorName: 'JC DEVPURA', activityType: '', speciality: 'MD MED', dob: '30/03/2019', doa: '', apr: '7,13,18', may: '12', jun: '2,13,22,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 25, doctorName: 'jimesh Pandiya', activityType: 'CRM', speciality: 'MBBB MD', dob: '22/03/1900', doa: '06/12/1900', apr: '8,16', may: '13,25', jun: '17,26', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 54, doctorName: 'JITENA JINGAR', activityType: '', speciality: 'MD PSY', dob: '24/09/2019', doa: '', apr: '4,17,23,24,28', may: '4,11,15,27,29', jun: '13,19,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 44, doctorName: 'JITESH AGRAWAL', activityType: 'VTL TABLE TOP', speciality: 'MBBB MD', dob: '', doa: '', apr: '', may: '29', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 68, doctorName: 'KALPESH CHODHRAY', activityType: '', speciality: 'MD MED', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 100, doctorName: 'KAMLESH BHATT', activityType: '', speciality: 'DNB', dob: '', doa: '', apr: '', may: '6,19,26', jun: '2,9,16', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 81, doctorName: 'KANTI LAL MEGWAL', activityType: '', speciality: 'MD MED', dob: '09/01/2019', doa: '', apr: '25', may: '2,9,16,23', jun: '6,10,20,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 35, doctorName: 'KAPIL BHARGAV', activityType: 'WCFYH VAL/VIN', speciality: 'DM CARDIO', dob: '16/12/2019', doa: '', apr: '3,17,24', may: '', jun: '19', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 3, doctorName: 'KAVITA BADJATIYA', activityType: 'CRM', speciality: 'MD MED', dob: '26/08/2019', doa: '', apr: '1,7,13,18,20', may: '4,11,21,27', jun: '9,13,15,22,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 64, doctorName: 'KB BADAULIA', activityType: '', speciality: 'MBBS', dob: '', doa: '', apr: '13', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 47, doctorName: 'KC JAIN', activityType: '', speciality: 'MD MED', dob: '24/07/2019', doa: '', apr: '18', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 19, doctorName: 'KIRIT GANDHI', activityType: 'CRM', speciality: 'MD MED', dob: '11/07/2019', doa: '', apr: '8,16', may: '25', jun: '17,26', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 78, doctorName: 'KN DAS', activityType: '', speciality: 'MD MED', dob: '15/11/2019', doa: '', apr: '25', may: '2,9,16,23', jun: '6,10,20,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 58, doctorName: 'KRIPA SHANKAR', activityType: '', speciality: 'MD MED', dob: '15/09/2019', doa: '', apr: '6,22', may: '7,22', jun: '4,23', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 82, doctorName: 'LALIT JAINANI', activityType: '', speciality: 'MD MED', dob: '11/04/2019', doa: '', apr: '', may: '', jun: '11', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 67, doctorName: 'LALIT SHREEMALI', activityType: '', speciality: 'MD MED', dob: '20/12/2019', doa: '', apr: '3,11,17,24,27', may: '15,29', jun: '19', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 89, doctorName: 'M vijay vargiy', activityType: '', speciality: 'M B B S PHY', dob: '', doa: '', apr: '6,22', may: '7,22', jun: '4,23', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 83, doctorName: 'MADHUP BAXI', activityType: '', speciality: 'MD MED', dob: '29/01/2019', doa: '', apr: '', may: '', jun: '11', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 1, doctorName: 'MAHESH DAVE', activityType: 'CRM', speciality: 'MD MED', dob: '03/03/2019', doa: '', apr: '1,10,17', may: '15,19,26,30', jun: '13,25,30', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 122, doctorName: 'MAHESH DESAI', activityType: '', speciality: 'DNB NEFRO', dob: '', doa: '', apr: '3,17', may: '4,29', jun: '13,15', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 40, doctorName: 'MAHESH JAIN', activityType: 'A2 GHEE', speciality: 'CARDIO', dob: '', doa: '', apr: '28', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 93, doctorName: 'Manish Khandelwal', activityType: '', speciality: 'MBBS MD', dob: '', doa: '', apr: '6,22', may: '7,22', jun: '4,23', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 43, doctorName: 'MANISH KULSHERT', activityType: 'VTL TABLE TOP', speciality: 'DM NEURO', dob: '', doa: '', apr: '4,7,9,13,18,24', may: '11,15', jun: '2,25', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 13, doctorName: 'MANU SHARMA', activityType: 'CRM', speciality: 'MD PSY', dob: '05/12/2019', doa: '', apr: '4,17,24', may: '4,15,27,29', jun: '15,19', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 98, doctorName: 'MAYANK SHARMA', activityType: '', speciality: 'medicine', dob: '', doa: '', apr: '8,16', may: '13,25', jun: '17,26', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 88, doctorName: 'MK MEENA', activityType: '', speciality: 'SURJAN', dob: '', doa: '', apr: '6', may: '7', jun: '4', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 30, doctorName: 'Mona dingra', activityType: 'WCFYH VTL', speciality: 'ENDO', dob: '18/07/1900', doa: '10/02/1900', apr: '18,23', may: '21,28', jun: '22', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 53, doctorName: 'MUKESH BARJATIYA', activityType: '', speciality: 'DNB NEFRO', dob: '', doa: '', apr: '', may: '12,19,27', jun: '3,15', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 33, doctorName: 'MUKESH SHARMA', activityType: 'WCFYH VAL/VIN', speciality: 'DM CARDIO', dob: '07/07/2019', doa: '', apr: '2,21,29', may: '12,19', jun: '3,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 4, doctorName: 'NAVGEET MATHUR', activityType: 'CRM', speciality: 'MD MED', dob: '', doa: '', apr: '3,11', may: '', jun: '13,19', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 91, doctorName: 'Navneet patel kiyda', activityType: '', speciality: 'MBBB MD', dob: '30/06/1900', doa: '23/04/1900', apr: '8,16', may: '13,25', jun: '17,26', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 46, doctorName: 'Nilesh pathira', activityType: 'GLUCOMETER', speciality: 'M B B S PHY', dob: '28/01/1900', doa: '14/04/1900', apr: '28', may: '12,19,26', jun: '2', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 69, doctorName: 'OP MEENA', activityType: '', speciality: 'MD MED', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 5, doctorName: 'PARAS JAIN', activityType: 'CRM', speciality: 'MD MED', dob: '23/11/2019', doa: '', apr: '4,15,24', may: '14,26', jun: '1,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 90, doctorName: 'pintu aahari', activityType: '', speciality: 'MBBB MD', dob: '', doa: '', apr: '25', may: '2,9,16,23', jun: '6,10,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 60, doctorName: 'PRASHANT BADJATIYA', activityType: '', speciality: 'CONSULTANT PHYSICIAN', dob: '', doa: '', apr: '7,13,18,20', may: '4,11,14,27', jun: '9,12,22', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 99, doctorName: 'PRATIBHA CHOUDHURY', activityType: '', speciality: 'PHY', dob: '', doa: '', apr: '1,15,20', may: '11,27', jun: '12,15,18,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 110, doctorName: 'Praveen jain', activityType: '', speciality: 'MBBS', dob: '', doa: '', apr: '', may: '', jun: '10', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 105, doctorName: 'Prerna baheti', activityType: '', speciality: 'MBBS,DNB,ECMO', dob: '', doa: '', apr: '4,17', may: '14,19', jun: '27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 77, doctorName: 'PRERNA BHARGAV', activityType: '', speciality: 'MD MED', dob: '23/03/2019', doa: '', apr: '9', may: '21', jun: '24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 29, doctorName: 'PRIYANKA MINOCHA', activityType: 'WCFYH VTL', speciality: 'MBBS,DNB,ECMO', dob: '', doa: '', apr: '3,17,24', may: '8,19,29', jun: '12', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 106, doctorName: 'R N LADHA', activityType: '', speciality: 'MS ORTHO', dob: '', doa: '', apr: '', may: '21', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 17, doctorName: 'RAHUL PANCHAL', activityType: 'CRM', speciality: 'MD MED', dob: '21/04/2019', doa: '', apr: '25', may: '2,9,16,23', jun: '10,20,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 62, doctorName: 'rahul sehlot', activityType: '', speciality: 'ENDO', dob: '', doa: '', apr: '3,15', may: '29', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 117, doctorName: 'RAJENDRA KUMAR SAMAR', activityType: '', speciality: 'PHY', dob: '', doa: '', apr: '3,24', may: '', jun: '12', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 71, doctorName: 'RAJESH KHOIWAL', activityType: '', speciality: 'DM NEURO', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 80, doctorName: 'RAJESH SIROIYA', activityType: '', speciality: 'MD MED', dob: '04/10/2019', doa: '', apr: '25', may: '2,9,16,23', jun: '6,10,20,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 11, doctorName: 'RAMESH PATEL', activityType: 'CRM', speciality: 'DM CARDIO', dob: '30/09/2019', doa: '', apr: '1,17,22', may: '8,15,18,19,29', jun: '12,19,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 104, doctorName: 'RAMKUMAR DAKSH', activityType: '', speciality: 'GP', dob: '', doa: '', apr: '', may: '', jun: '11', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 121, doctorName: 'RAVI KUMAR MANGLANI', activityType: '', speciality: 'MBBB MD', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 95, doctorName: 'Ravi Mangalia', activityType: '', speciality: 'CONSULTANT PHY', dob: '', doa: '', apr: '3,17,22', may: '8,15,29', jun: '13,19,20,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 18, doctorName: 'RK MALOT', activityType: 'CRM', speciality: 'MD MED', dob: '09/05/2019', doa: '', apr: '8,16', may: '13,25', jun: '17,26', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 55, doctorName: 'RK SHARMA', activityType: '', speciality: 'DM ENDO', dob: '14/01/2019', doa: '', apr: '14,21,28', may: '6,12,19,26', jun: '9,16', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 115, doctorName: 'RL MEENA', activityType: '', speciality: 'C.PHY', dob: '', doa: '', apr: '7,23', may: '4', jun: '22,25', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 39, doctorName: 'S K KUASHIK', activityType: 'A2 GHEE', speciality: 'DM CARDIO', dob: '', doa: '', apr: '2,17,27', may: '6,27', jun: '13,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 118, doctorName: 'S.A.BOHRA', activityType: '', speciality: 'MBBS MD', dob: '', doa: '', apr: '21,28', may: '12,19,26', jun: '2,9,16', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 48, doctorName: 'SAFDAR HUSSAIN', activityType: '', speciality: 'MD MED', dob: '05/05/2019', doa: '', apr: '7,13', may: '4,11,18', jun: '1,15,22,25,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 49, doctorName: 'SALMA SHAH', activityType: '', speciality: 'MD MED', dob: '07/03/2019', doa: '', apr: '2,10,17,23,24,30', may: '8,15', jun: '12,18,25', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 16, doctorName: 'SANDEEP BHATNAGAR', activityType: 'CRM', speciality: 'MD MED', dob: '13/02/2019', doa: '', apr: '2,15,27', may: '21', jun: '15', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 101, doctorName: 'SANDEEP CHANDOLIYA', activityType: '', speciality: 'MBBB MD', dob: '', doa: '', apr: '', may: '', jun: '11', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 8, doctorName: 'SANDEEP KANSARA', activityType: 'CRM+LGT TABLE TOP', speciality: 'DM ENDO', dob: '22/10/2019', doa: '', apr: '11,23', may: '14,21', jun: '2,9,24', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 36, doctorName: 'Sanjay Gandhi', activityType: 'WCFYH VAL/VIN', speciality: 'C V T S', dob: '', doa: '', apr: '', may: '', jun: '13', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 45, doctorName: 'SATISH CHOUDHARY', activityType: 'VTL TABLE TOP', speciality: 'PHYSCIAN', dob: '', doa: '', apr: '6,22', may: '7,22', jun: '23', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 119, doctorName: 'SHRAVAN KUMAR MEENA', activityType: '', speciality: 'MBBS', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 84, doctorName: 'SHUSHIL CHOUHAN', activityType: '', speciality: 'MD MED', dob: '17/02/2019', doa: '', apr: '', may: '', jun: '4,23', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 15, doctorName: 'SUMIT SIROIYA', activityType: 'CRM', speciality: 'MD MED', dob: '14/01/2019', doa: '', apr: '18', may: '', jun: '12', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 85, doctorName: 'SUNIL UPADHAY', activityType: '', speciality: 'MD MED', dob: '07/02/2019', doa: '', apr: '6,22', may: '22', jun: '4', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 94, doctorName: 'SURAJ GUPTA', activityType: '', speciality: 'NEPHROLOGIST', dob: '', doa: '', apr: '3', may: '8,15', jun: '13,19', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 26, doctorName: 'Suresh Chandra', activityType: 'CRM', speciality: 'GEN MED', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 73, doctorName: 'TARUN MATHUR', activityType: '', speciality: 'DM NEURO', dob: '02/08/1979', doa: '', apr: '24', may: '5', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 52, doctorName: 'TARUN RHLOT', activityType: '', speciality: 'DM NEURO', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 31, doctorName: 'UDAY BHOMIK', activityType: 'WCFYH VTL', speciality: 'DM NEURO', dob: '08/04/2019', doa: '', apr: '30', may: '15', jun: '12', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 14, doctorName: 'VIJAY GOYAL', activityType: 'CRM', speciality: 'MD MED', dob: '01/09/2019', doa: '', apr: '4,15', may: '14', jun: '1', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 41, doctorName: 'Vinod bokadia', activityType: 'LGT TABLE TOP', speciality: 'Diabet/ End', dob: '24/02/1988', doa: '02/05/2014', apr: '28', may: '6,28', jun: '19,20,27', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 28, doctorName: 'VINOD KUMAR RAI', activityType: 'CRM', speciality: 'MBBS', dob: '', doa: '', apr: '2,10,17,23,24,30', may: '8,15,21,28', jun: '12,18,25', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 9, doctorName: 'VINOD MEHTA', activityType: 'CRM', speciality: 'DM NEURO', dob: '02/06/2019', doa: '', apr: '2,3,11,17', may: '14,15,26,29', jun: '16,18,19,29', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 102, doctorName: 'VK RAMCHANDANI', activityType: '', speciality: 'General Practitioner (GP)', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 109, doctorName: 'YASH SHAH', activityType: '', speciality: 'CONS PHY', dob: '', doa: '', apr: '8,16', may: '13,25', jun: '17,26', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 63, doctorName: 'YN VERMA', activityType: '', speciality: 'MD MED', dob: '03/07/2019', doa: '', apr: '', may: '', jun: '11,22', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' },
  { srNo: 112, doctorName: 'YOGENDRA SINGH RANAWAT', activityType: '', speciality: 'MD CARDIO', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '' }
];

const MONTH_KEYS_MAP: Record<number, keyof MslDoctor> = {
  4: 'apr', 5: 'may', 6: 'jun', 7: 'jul', 8: 'aug', 9: 'sept',
  10: 'oct', 11: 'nov', 12: 'dec', 1: 'jan', 2: 'feb', 3: 'mar'
};

const RESET_MONTH_OPTIONS = [
  { label: 'All Months (Full Reset)', key: 'ALL' },
  { label: 'April 2026', key: 'apr' },
  { label: 'May 2026', key: 'may' },
  { label: 'June 2026', key: 'jun' },
  { label: 'July 2026', key: 'jul' },
  { label: 'August 2026', key: 'aug' },
  { label: 'September 2026', key: 'sept' },
  { label: 'October 2026', key: 'oct' },
  { label: 'November 2026', key: 'nov' },
  { label: 'December 2026', key: 'dec' },
  { label: 'January 2027', key: 'jan' },
  { label: 'February 2027', key: 'feb' },
  { label: 'March 2027', key: 'mar' }
];

const cleanStr = (s: string) => (s || '').toLowerCase().replace(/^(dr\.?|dr\s+)/i, '').replace(/[^a-z0-9]/g, '').trim();

const DEFAULT_ALIASES_MAP: Record<string, number> = {
  'dannykumarmanglani': 12,
  'mvijayvargiy': 89,
  'manishkulshert': 43,
};

export const MslSheet: React.FC = () => {
  const [search, setSearch] = useState('');

  const [doctors, setDoctors] = useState<MslDoctor[]>(() => {
    try {
      const saved = localStorage.getItem(MSL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryStore.mslData = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    return memoryStore.mslData || MASTER_123_MSL_DOCTORS;
  });

  const [activityMaster, setActivityMaster] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(MSL_ACTIVITY_MASTER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ACTIVITY_MASTER;
  });

  const [specialityMaster, setSpecialityMaster] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(MSL_SPECIALITY_MASTER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SPECIALITY_MASTER;
  });

  const [customPriorityRules, setCustomPriorityRules] = useState<CustomPriorityRule[]>(() => {
    try {
      const saved = localStorage.getItem(MSL_CUSTOM_RULES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_CUSTOM_RULES;
  });

    const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDocForm, setNewDocForm] = useState({
    doctorName: '',
    activityType: '',
    speciality: '',
    dob: '',
    doa: ''
  });

  const [showMasterManager, setShowMasterManager] = useState(false);
  const [showPriorityManager, setShowPriorityManager] = useState(false);
  const [masterTab, setMasterTab] = useState<'activity' | 'speciality'>('activity');
  const [newMasterItemText, setNewMasterItemText] = useState('');
  const [editingItemOldValue, setEditingItemOldValue] = useState<string | null>(null);
  const [editingItemNewValue, setEditingItemNewValue] = useState('');

  const [newRuleField, setNewRuleField] = useState<'activity' | 'speciality'>('activity');
  const [newRuleValue, setNewRuleValue] = useState('');

  const [aliasMap, setAliasMap] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(MSL_ALIASES_KEY);
      if (saved) return { ...DEFAULT_ALIASES_MAP, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_ALIASES_MAP;
  });

  const [activityFilter, setActivityFilter] = useState<string>('ALL');
  const [specialityFilter, setSpecialityFilter] = useState<string>('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState<'ALL' | 'MASTER' | 'NEW'>('ALL');
  
  const [sortMode, setSortMode] = useState<string>(() => {
    try {
      const sf = localStorage.getItem(MSL_SAVED_VIEW_KEY);
      if (sf) return JSON.parse(sf).sortMode || 'CUSTOM_RANK';
    } catch (e) {}
    return 'CUSTOM_RANK';
  });

  const [showActivity, setShowActivity] = useState(true);
  const [showSpeciality, setShowSpeciality] = useState(true);
  const [showDob, setShowDob] = useState(true);
  const [showDoa, setShowDoa] = useState(true);

  const [selectedResetMonth, setSelectedResetMonth] = useState<string>('ALL');
  const [syncAlert, setSyncAlert] = useState<{ type: 'success' | 'warning'; msg: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [showMappingModal, setShowMappingModal] = useState(false);
  const [pendingUnmatchedCboDocs, setPendingUnmatchedCboDocs] = useState<Array<{
    cboName: string;
    speciality: string;
    cleanKey: string;
    visitsCount: number;
    sampleDates: string;
    action: 'LINK' | 'NEW';
    targetMasterSrNo: number;
    extractedMonths: Record<string, Set<number>>;
  }>>([]);

  const persistDoctors = (updatedList: MslDoctor[]) => {
    setDoctors(updatedList);
    memoryStore.mslData = updatedList;
    try {
      localStorage.setItem(MSL_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (e) {}
  };

  const persistAliases = (newAliases: Record<string, number>) => {
    setAliasMap(newAliases);
    try {
      localStorage.setItem(MSL_ALIASES_KEY, JSON.stringify(newAliases));
    } catch (e) {}
  };

  const persistActivityMaster = (list: string[]) => {
    setActivityMaster(list);
    try {
      localStorage.setItem(MSL_ACTIVITY_MASTER_KEY, JSON.stringify(list));
    } catch (e) {}
  };

  const persistSpecialityMaster = (list: string[]) => {
    setSpecialityMaster(list);
    try {
      localStorage.setItem(MSL_SPECIALITY_MASTER_KEY, JSON.stringify(list));
    } catch (e) {}
  };

  const persistCustomRules = (rules: CustomPriorityRule[]) => {
    setCustomPriorityRules(rules);
    try {
      localStorage.setItem(MSL_CUSTOM_RULES_KEY, JSON.stringify(rules));
    } catch (e) {}
  };

  const handleSaveFilterView = () => {
    try {
      const viewState = { activityFilter, specialityFilter, docTypeFilter, sortMode };
      localStorage.setItem(MSL_SAVED_VIEW_KEY, JSON.stringify(viewState));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {}
  };

  const handleResetFilters = () => {
    setSearch('');
    setActivityFilter('ALL');
    setSpecialityFilter('ALL');
    setDocTypeFilter('ALL');
    setSortMode('DEFAULT');
    try {
      localStorage.removeItem(MSL_SAVED_VIEW_KEY);
    } catch (e) {}
  };

  const newDoctorsList = doctors.filter(d => d.isNewDoctor);

  const W_SR = 42;
  const W_DOC = 155;
  const W_ACT = 125;
  const W_SPEC = 110;
  const W_DOB = 75;
  const W_DOA = 75;

  let currentOffset = W_SR + W_DOC;
  const offsetAct = currentOffset;
  if (showActivity) currentOffset += W_ACT;
  const offsetSpec = currentOffset;
  if (showSpeciality) currentOffset += W_SPEC;
  const offsetDob = currentOffset;
  if (showDob) currentOffset += W_DOB;
  const offsetDoa = currentOffset;

  let lastLeftCol = 'doa';
  if (!showDoa) {
    if (showDob) lastLeftCol = 'dob';
    else if (showSpeciality) lastLeftCol = 'speciality';
    else if (showActivity) lastLeftCol = 'activity';
    else lastLeftCol = 'doctor';
  }

  const isAllHidden = !showActivity && !showSpeciality && !showDob && !showDoa;

  const toggleFocusMode = () => {
    if (isAllHidden) {
      setShowActivity(true);
      setShowSpeciality(true);
      setShowDob(true);
      setShowDoa(true);
    } else {
      setShowActivity(false);
      setShowSpeciality(false);
      setShowDob(false);
      setShowDoa(false);
    }
  };

  const handleAutoSyncFromCallStatus = () => {
    if (memoryStore.mslSyncEnabled === false) {
      setSyncAlert({
        type: 'warning',
        msg: '⚠️ Call Status Report (Sheet 15) mein "Sync to MSL" switch OFF hai. Pehle Sheet 15 mein jakar Sync switch ON karein!'
      });
      return;
    }

    const allStoredRuns = Object.values(memoryStore.dcrCallsByMonth || {});
    const allDoctorCalls = allStoredRuns.flatMap(run => run.doctors || []);

    if (allDoctorCalls.length === 0) {
      setSyncAlert({
        type: 'warning',
        msg: '⚠️ Koi Call Status data memory mein nahi hai! Pehle 15. Call Status Report mein jakar "⚡ Live CBO Fetch" karein.'
      });
      return;
    }

    const callsAgg: Record<string, { cboName: string; speciality: string; months: Record<string, Set<number>> }> = {};

    allDoctorCalls.forEach(call => {
      const norm = cleanStr(call.docName);
      if (!norm) return;

      if (!callsAgg[norm]) {
        callsAgg[norm] = {
          cboName: call.docName,
          speciality: call.speciality || '',
          months: { apr: new Set(), may: new Set(), jun: new Set(), jul: new Set(), aug: new Set(), sept: new Set(), oct: new Set(), nov: new Set(), dec: new Set(), jan: new Set(), feb: new Set(), mar: new Set() }
        };
      }

      if (call.date && call.date.includes('/')) {
        const parts = call.date.split('/');
        const day = parseInt(parts[0], 10);
        const monthNum = parseInt(parts[1], 10);
        const mKey = MONTH_KEYS_MAP[monthNum];
        if (mKey && !isNaN(day)) {
          callsAgg[norm].months[mKey].add(day);
        }
      }
    });

    let updatedList = [...doctors];
    const unmatchedDocsForReview: typeof pendingUnmatchedCboDocs = [];

    const masterNameMap = new Map<string, MslDoctor>();
    const masterSrMap = new Map<number, MslDoctor>();
    updatedList.forEach(d => {
      masterNameMap.set(cleanStr(d.doctorName), d);
      masterSrMap.set(d.srNo, d);
    });

    Object.entries(callsAgg).forEach(([cboCleanKey, cboData]) => {
      const mappedSr = aliasMap[cboCleanKey];
      let targetDoc = mappedSr ? masterSrMap.get(mappedSr) : masterNameMap.get(cboCleanKey);

      if (targetDoc) {
        Object.entries(cboData.months).forEach(([mKey, daySet]) => {
          if (daySet.size > 0) {
            const sortedDates = Array.from(daySet).sort((a, b) => a - b).join(',');
            (targetDoc as any)[mKey] = sortedDates;
          }
        });
      } else {
        const sampleDatesList = Object.entries(cboData.months)
          .filter(([_, set]) => set.size > 0)
          .map(([m, set]) => `${m.toUpperCase()}: ${Array.from(set).join(',')}`)
          .join(' | ');

        let suggestedSr = 12;
        const candidate = updatedList.find(d => cleanStr(d.doctorName).includes(cboCleanKey.slice(0, 4)) || cboCleanKey.includes(cleanStr(d.doctorName).slice(0, 4)));
        if (candidate) suggestedSr = candidate.srNo;

        unmatchedDocsForReview.push({
          cboName: cboData.cboName,
          speciality: cboData.speciality,
          cleanKey: cboCleanKey,
          visitsCount: Object.values(cboData.months).reduce((acc, s) => acc + s.size, 0),
          sampleDates: sampleDatesList,
          action: 'LINK',
          targetMasterSrNo: suggestedSr,
          extractedMonths: cboData.months
        });
      }
    });

    persistDoctors(updatedList);

    if (unmatchedDocsForReview.length > 0) {
      setPendingUnmatchedCboDocs(unmatchedDocsForReview);
      setShowMappingModal(true);
      setSyncAlert({
        type: 'warning',
        msg: `⚠️ ${unmatchedDocsForReview.length} CBO Doctors matched nahi huye. Link / Create popup mein mapping set karein!`
      });
    } else {
      setSyncAlert({
        type: 'success',
        msg: `🎉 100% SYNC COMPLETE! Saari visit dates auto-fill hokar permanently save ho gayi hain!`
      });
    }
  };

  const handleApplyMappings = () => {
    let updatedList = [...doctors];
    const newAliases = { ...aliasMap };
    let linkedCount = 0;
    let createdCount = 0;

    const nextSrStart = updatedList.length > 0 ? Math.max(...updatedList.map(d => d.srNo)) + 1 : 124;
    let runningSr = nextSrStart;

    pendingUnmatchedCboDocs.forEach(item => {
      if (item.action === 'LINK' && item.targetMasterSrNo) {
        const masterDoc = updatedList.find(d => d.srNo === item.targetMasterSrNo);
        if (masterDoc) {
          Object.entries(item.extractedMonths).forEach(([mKey, daySet]) => {
            if (daySet.size > 0) {
              const existing = ((masterDoc as any)[mKey] || '').split(',').filter(Boolean).map(Number);
              const combined = Array.from(new Set([...existing, ...Array.from(daySet)])).sort((a, b) => a - b).join(',');
              (masterDoc as any)[mKey] = combined;
            }
          });
          newAliases[item.cleanKey] = item.targetMasterSrNo;
          linkedCount++;
        }
      } else {
        const formattedMonths: any = {};
        Object.entries(item.extractedMonths).forEach(([mKey, daySet]) => {
          formattedMonths[mKey] = daySet.size > 0 ? Array.from(daySet).sort((a, b) => a - b).join(',') : '';
        });

        const newEntry: MslDoctor = {
          srNo: runningSr++,
          doctorName: item.cboName,
          activityType: '',
          speciality: item.speciality || '',
          dob: '',
          doa: '',
          apr: formattedMonths.apr || '',
          may: formattedMonths.may || '',
          jun: formattedMonths.jun || '',
          jul: formattedMonths.jul || '',
          aug: formattedMonths.aug || '',
          sept: formattedMonths.sept || '',
          oct: formattedMonths.oct || '',
          nov: formattedMonths.nov || '',
          dec: formattedMonths.dec || '',
          jan: formattedMonths.jan || '',
          feb: formattedMonths.feb || '',
          mar: formattedMonths.mar || '',
          isNewDoctor: true
        };

        updatedList.push(newEntry);
        createdCount++;
      }
    });

    persistDoctors(updatedList);
    persistAliases(newAliases);
    setShowMappingModal(false);
    setPendingUnmatchedCboDocs([]);

    setSyncAlert({
      type: 'success',
      msg: `🎉 Master Updated! ${linkedCount} Doctors Master mein Link huye, ${createdCount} Naye Doctors add huye!`
    });
  };

  const handleResetSelectedMonth = () => {
    if (selectedResetMonth === 'ALL') {
      if (window.confirm("⚠️ Kya aap poora MSL Schedule 123 Master Seed Data par Reset karna chahte hain?")) {
        persistDoctors(MASTER_123_MSL_DOCTORS);
        setSyncAlert({ type: 'success', msg: '🧹 Poora MSL Schedule default par reset ho gaya!' });
      }
    } else {
      const mObj = RESET_MONTH_OPTIONS.find(m => m.key === selectedResetMonth);
      const mLabel = mObj ? mObj.label : selectedResetMonth.toUpperCase();
      if (window.confirm(`Kya aap sirf '${mLabel}' ke saare visit dates clear karna chahte hain?`)) {
        const updated = doctors.map(d => ({
          ...d,
          [selectedResetMonth]: ''
        }));
        persistDoctors(updated);
        setSyncAlert({ type: 'success', msg: `🧹 '${mLabel}' ke visit dates successfully reset ho gaye!` });
      }
    }
  };

    const handleRestoreDefaultMasters = () => {
    if (window.confirm("Kya aap Activity & Speciality Masters ko Company Default List par Reset karna chahte hain?")) {
      persistActivityMaster(DEFAULT_ACTIVITY_MASTER);
      persistSpecialityMaster(DEFAULT_SPECIALITY_MASTER);
      localStorage.removeItem(MSL_SPECIALITY_MASTER_KEY);
      localStorage.removeItem(MSL_ACTIVITY_MASTER_KEY);
      setSyncAlert({ type: 'success', msg: '🎉 Saari Specialities aur Activities successfully restore ho gayi hain!' });
    }
  };

  const handleAddMasterItem = () => {
    const text = newMasterItemText.trim().toUpperCase();
    if (!text) return;
    if (masterTab === 'activity') {
      if (!activityMaster.includes(text)) persistActivityMaster([...activityMaster, text]);
    } else {
      if (!specialityMaster.includes(text)) persistSpecialityMaster([...specialityMaster, text]);
    }
    setNewMasterItemText('');
  };

  const handleStartEditMasterItem = (currentVal: string) => {
    setEditingItemOldValue(currentVal);
    setEditingItemNewValue(currentVal);
  };

  const handleSaveEditMasterItem = () => {
    if (!editingItemOldValue) return;
    const oldVal = editingItemOldValue;
    const newVal = editingItemNewValue.trim().toUpperCase();
    if (!newVal || oldVal === newVal) { setEditingItemOldValue(null); return; }

    if (masterTab === 'activity') {
      const updatedList = activityMaster.map(a => a === oldVal ? newVal : a);
      persistActivityMaster(updatedList);
      persistDoctors(doctors.map(d => d.activityType === oldVal ? { ...d, activityType: newVal } : d));
    } else {
      const updatedList = specialityMaster.map(s => s === oldVal ? newVal : s);
      persistSpecialityMaster(updatedList);
      persistDoctors(doctors.map(d => d.speciality === oldVal ? { ...d, speciality: newVal } : d));
    }
    setEditingItemOldValue(null);
    setEditingItemNewValue('');
  };

  const handleDeleteMasterItemWithWarning = (itemText: string) => {
    const countUsed = doctors.filter(d => masterTab === 'activity' ? d.activityType === itemText : d.speciality === itemText).length;
    const warningMsg = countUsed > 0 
      ? `⚠️ WARNING: '${itemText}' filhal ${countUsed} Doctors par assigned hai!\n\nKya aap ise Master se delete karna chahte hain?`
      : `⚠️ Kya aap '${itemText}' ko Master list se delete karna chahte hain?`;

    if (window.confirm(warningMsg)) {
      if (masterTab === 'activity') persistActivityMaster(activityMaster.filter(a => a !== itemText));
      else persistSpecialityMaster(specialityMaster.filter(s => s !== itemText));
    }
  };

  const handleAddCustomRule = () => {
    if (!newRuleValue) return;
    persistCustomRules([...customPriorityRules, { id: 'rule_' + Date.now(), field: newRuleField, value: newRuleValue }]);
    setNewRuleValue('');
  };

  const handleMoveRule = (idx: number, dir: 'UP' | 'DOWN') => {
    const copy = [...customPriorityRules];
    const targetIdx = dir === 'UP' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= copy.length) return;
    const temp = copy[idx]; copy[idx] = copy[targetIdx]; copy[targetIdx] = temp;
    persistCustomRules(copy);
  };

  const handleDeleteRule = (id: string) => {
    persistCustomRules(customPriorityRules.filter(r => r.id !== id));
  };

  const handleFieldChange = (srNo: number, field: keyof MslDoctor, val: string) => {
    const updated = doctors.map(d => d.srNo === srNo ? { ...d, [field]: val } : d);
    persistDoctors(updated);
  };

    // 🧹 Remove all empty/blank doctor rows in 1-click
  const handleRemoveBlankDoctors = () => {
    const validDocs = doctors.filter(d => (d.doctorName || '').trim().length > 0);
    const removedCount = doctors.length - validDocs.length;
    if (removedCount === 0) {
      alert("Koi khali/blank doctor row nahi hai!");
      return;
    }
    if (window.confirm(`Kya aap ${removedCount} bina naam wali khali rows ko permanently remove karna chahte hain?`)) {
      persistDoctors(validDocs);
      setSyncAlert({ type: 'success', msg: `🧹 ${removedCount} khali rows successfully remove ho gayi hain!` });
    }
  };

    const handleConfirmAddDoctor = () => {
    if (!newDocForm.doctorName.trim()) {
      alert("Kripya Doctor ka naam zaroor likhein!");
      return;
    }
    const nextSr = doctors.length > 0 ? Math.max(...doctors.map(p => p.srNo)) + 1 : 1;
    const createdDoc: MslDoctor = {
      srNo: nextSr,
      doctorName: newDocForm.doctorName.trim(),
      activityType: newDocForm.activityType,
      speciality: newDocForm.speciality,
      dob: newDocForm.dob.trim(),
      doa: newDocForm.doa.trim(),
      apr: '', may: '', jun: '', jul: '', aug: '', sept: '',
      oct: '', nov: '', dec: '', jan: '', feb: '', mar: '',
      isNewDoctor: true
    };
    persistDoctors([...doctors, createdDoc]);
    setShowAddDoctorModal(false);
    setNewDocForm({ doctorName: '', activityType: '', speciality: '', dob: '', doa: '' });
    setSyncAlert({ type: 'success', msg: `🎉 Dr. ${createdDoc.doctorName} (#${createdDoc.srNo}) successfully add ho gaye!` });
  };

  const handleAddDoctor = () => {
    setShowAddDoctorModal(true);
  };
  const handleAddDoctorOld = () => {
    const nextSr = doctors.length > 0 ? Math.max(...doctors.map(p => p.srNo)) + 1 : 1;
    const updated: MslDoctor[] = [
      ...doctors,
      { srNo: nextSr, doctorName: '', activityType: '', speciality: '', dob: '', doa: '', apr: '', may: '', jun: '', jul: '', aug: '', sept: '', oct: '', nov: '', dec: '', jan: '', feb: '', mar: '', isNewDoctor: true }
    ];
    persistDoctors(updated);
  };

  const handleDeleteDoctor = (srNo: number) => {
    const updated = doctors.filter(d => d.srNo !== srNo);
    persistDoctors(updated);
  };

  const handleSave = () => {
    persistDoctors(doctors);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportCSV = () => {
    const lines: string[] = [];
    
    // Header Row 1 matching csv_output/14_MSL.csv
    lines.push(',,,,,,VISIT DATES,,,,,,,,,,,');
    // Header Row 2
    lines.push('SrNo,Doctor Name,Activity Type,Speciality,DOB,DOA,APR,MAY,JUN,JUL,AUG,SEPT,OCT,NOV,DEC,JAN,FEB,MAR');

    // Data rows
    filtered.forEach(d => {
      const q = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      const row = [
        d.srNo ?? '',
        q(d.doctorName),
        q(d.activityType),
        q(d.speciality),
        q(d.dob),
        q(d.doa),
        q(d.apr),
        q(d.may),
        q(d.jun),
        q(d.jul),
        q(d.aug),
        q(d.sept),
        q(d.oct),
        q(d.nov),
        q(d.dec),
        q(d.jan),
        q(d.feb),
        q(d.mar)
      ];
      lines.push(row.join(','));
    });

    const csvContent = lines.join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', '14_MSL.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = useMemo(() => {
    return doctors.filter(d => {
      const q = search.toLowerCase();
      const matchesSearch = !q || (d.doctorName || '').toLowerCase().includes(q) || (d.speciality || '').toLowerCase().includes(q) || (d.activityType || '').toLowerCase().includes(q);
      const matchesActivity = activityFilter === 'ALL' || (activityFilter === 'NONE' ? (!d.activityType || d.activityType === '-') : (d.activityType || '').toUpperCase() === activityFilter.toUpperCase());
      const matchesSpeciality = specialityFilter === 'ALL' || (d.speciality || '').toUpperCase() === specialityFilter.toUpperCase();
      const matchesType = docTypeFilter === 'ALL' || (docTypeFilter === 'MASTER' ? !d.isNewDoctor : !!d.isNewDoctor);
      return matchesSearch && matchesActivity && matchesSpeciality && matchesType;
    }).sort((a, b) => {
      // 🌟 RULE: Empty/Blank names ALWAYS go to the absolute bottom in all sort modes!
      const nameA = (a.doctorName || '').trim();
      const nameB = (b.doctorName || '').trim();
      if (!nameA && nameB) return 1;
      if (nameA && !nameB) return -1;

      if (sortMode === 'CUSTOM_RANK') {
        const getCustomScore = (doc: MslDoctor) => {
          const act = (doc.activityType || '').toUpperCase();
          const spec = (doc.speciality || '').toUpperCase();
          for (let i = 0; i < customPriorityRules.length; i++) {
            const rule = customPriorityRules[i];
            const ruleVal = rule.value.toUpperCase();
            if (rule.field === 'activity' && act.includes(ruleVal)) return i + 1;
            if (rule.field === 'speciality' && spec.includes(ruleVal)) return i + 1;
          }
          return 999;
        };
        const scoreA = getCustomScore(a);
        const scoreB = getCustomScore(b);
        if (scoreA !== scoreB) return scoreA - scoreB;
        return a.srNo - b.srNo;
      }
      if (sortMode === 'NAME_AZ') return a.doctorName.localeCompare(b.doctorName);
      if (sortMode === 'NAME_ZA') return b.doctorName.localeCompare(a.doctorName);
      if (sortMode === 'SRNO_DESC') return b.srNo - a.srNo;
      return a.srNo - b.srNo;
    });
  }, [doctors, search, activityFilter, specialityFilter, docTypeFilter, sortMode, customPriorityRules]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg"><Calendar size={18} /></span>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              14. MSL (Master Specialty List &amp; Visit Dates)
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                Custom Hierarchy &amp; Master Dropdown
              </span>
            </h2>
            <p className="text-xs text-slate-400">123 Master Doctors Protected • Custom Priority Builder • Master Dropdowns</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-36">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleAutoSyncFromCallStatus}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-600/30 transition cursor-pointer"
          >
            <RefreshCw size={13} className="text-yellow-300" /> ⚡ Sync Now
          </button>

          <button
            onClick={() => setShowPriorityManager(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-500/50 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
          >
            <ListOrdered size={13} /> Custom Priority
          </button>

          <button
            onClick={() => setShowMasterManager(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Tag size={13} /> Manage Masters
          </button>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <select
              value={selectedResetMonth}
              onChange={e => setSelectedResetMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-amber-400 px-2 py-1 focus:outline-none cursor-pointer"
            >
              {RESET_MONTH_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key} className="bg-slate-900 text-white">{opt.label}</option>
              ))}
            </select>
            <button
              onClick={handleResetSelectedMonth}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          <button
            onClick={handleRemoveBlankDoctors}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Clean all empty/unnamed rows"
          >
            <Trash2 size={13} /> 🧹 Clean Blanks
          </button>

          <button
            onClick={handleAddDoctor}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Plus size={14} /> Add Doctor
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
            {savedSuccess ? 'Saved' : 'Save'}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {syncAlert && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
          syncAlert.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200' : 'bg-amber-950/80 border-amber-500/60 text-amber-200'
        }`}>
          <div className="flex items-center gap-2">
            {syncAlert.type === 'success' ? <Check size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-amber-400" />}
            <span className="font-semibold">{syncAlert.msg}</span>
          </div>
          <button onClick={() => setSyncAlert(null)} className="p-1 hover:text-white cursor-pointer"><X size={15} /></button>
        </div>
      )}

      {/* Filter & Arrange Order Bar */}
      <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-xl border border-purple-500/40 shadow-sm">
              <SlidersHorizontal size={13} className="text-purple-400" />
              <span className="text-[10px] text-purple-300 font-bold uppercase">Order:</span>
              <select
                value={sortMode}
                onChange={e => setSortMode(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="CUSTOM_RANK" className="bg-slate-900">👑 Custom Priority ({customPriorityRules.map(r => r.value).join(' ➔ ') || 'None'})</option>
                <option value="DEFAULT" className="bg-slate-900">#1 Default Master Order (#1 to #123)</option>
                <option value="NAME_AZ" className="bg-slate-900">Doctor Name (A to Z)</option>
                <option value="NAME_ZA" className="bg-slate-900">Doctor Name (Z to A)</option>
                <option value="SRNO_DESC" className="bg-slate-900">Sr No (Desc: #150 ➔ #1)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-amber-400 font-bold uppercase">Activity:</span>
              <select
                value={activityFilter}
                onChange={e => setActivityFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Activities</option>
                <option value="NONE" className="bg-slate-900">- Blank</option>
                {activityMaster.map(act => (
                  <option key={act} value={act} className="bg-slate-900">{act}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-blue-400 font-bold uppercase">Speciality:</span>
              <select
                value={specialityFilter}
                onChange={e => setSpecialityFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All Specialities</option>
                {specialityMaster.map(sp => (
                  <option key={sp} value={sp} className="bg-slate-900">{sp}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[10px] text-cyan-400 font-bold uppercase">Type:</span>
              <select
                value={docTypeFilter}
                onChange={e => setDocTypeFilter(e.target.value as any)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900">All ({doctors.length})</option>
                <option value="MASTER" className="bg-slate-900">Master (123)</option>
                <option value="NEW" className="bg-slate-900">✨ New ({newDoctorsList.length})</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveFilterView}
              className="flex items-center gap-1 px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded-xl font-bold transition cursor-pointer shadow-sm"
            >
              <Save size={12} /> Save View
            </button>
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Column Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
              <Filter size={11} className="text-cyan-400" /> Columns:
            </span>
            <button
              onClick={() => setShowActivity(!showActivity)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showActivity ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {showActivity ? <Eye size={11} /> : <EyeOff size={11} />} Activity
            </button>

            <button
              onClick={() => setShowSpeciality(!showSpeciality)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showSpeciality ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {showSpeciality ? <Eye size={11} /> : <EyeOff size={11} />} Speciality
            </button>

            <button
              onClick={() => setShowDob(!showDob)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showDob ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {showDob ? <Eye size={11} /> : <EyeOff size={11} />} DOB
            </button>

            <button
              onClick={() => setShowDoa(!showDoa)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition cursor-pointer flex items-center gap-1 ${
                showDoa ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              {showDoa ? <Eye size={11} /> : <EyeOff size={11} />} DOA
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">
              Showing <b className="text-cyan-300 font-mono">{filtered.length}</b> Doctors
            </span>
            <button
              onClick={toggleFocusMode}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                isAllHidden ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400' : 'bg-slate-900 text-amber-300 border-amber-500/40'
              }`}
            >
              <Sparkles size={11} className="text-yellow-300" />
              {isAllHidden ? 'Show All' : 'Focus Mode'}
            </button>
          </div>
        </div>
      </div>

            {/* 🌟 ADD NEW DOCTOR DIALOG POPUP */}
      {showAddDoctorModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/40">
                  <UserPlus size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Add New Doctor to MSL</h3>
                  <p className="text-xs text-slate-400">Enter doctor details &amp; select master activity/speciality</p>
                </div>
              </div>
              <button onClick={() => setShowAddDoctorModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Doctor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={newDocForm.doctorName}
                  onChange={e => setNewDocForm({ ...newDocForm, doctorName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 focus:border-cyan-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-400 font-semibold mb-1">Activity Type</label>
                  <select
                    value={newDocForm.activityType}
                    onChange={e => setNewDocForm({ ...newDocForm, activityType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-semibold rounded-xl px-3 py-2 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">- None -</option>
                    {activityMaster.map(act => <option key={act} value={act}>{act}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-blue-400 font-semibold mb-1">Speciality</label>
                  <select
                    value={newDocForm.speciality}
                    onChange={e => setNewDocForm({ ...newDocForm, speciality: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-blue-300 font-semibold rounded-xl px-3 py-2 focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">- Select -</option>
                    {specialityMaster.map(sp => <option key={sp} value={sp}>{sp}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-purple-400 font-semibold mb-1">DOB (Date of Birth)</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={newDocForm.dob}
                    onChange={e => setNewDocForm({ ...newDocForm, dob: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-mono rounded-xl px-3 py-2 focus:border-cyan-500 focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-emerald-400 font-semibold mb-1">DOA (Anniversary)</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={newDocForm.doa}
                    onChange={e => setNewDocForm({ ...newDocForm, doa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-mono rounded-xl px-3 py-2 focus:border-cyan-500 focus:outline-none text-center"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddDoctorModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddDoctor}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/30 cursor-pointer"
              >
                <Check size={15} /> Save &amp; Add to MSL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Manager Modal */}
      {showPriorityManager && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/60 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/40"><ListOrdered size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white">Custom Priority Hierarchy Builder</h3>
                  <p className="text-xs text-slate-400">Set custom ranks: 1st CRM, 2nd ENDO, 3rd WCFYH, etc.</p>
                </div>
              </div>
              <button onClick={() => setShowPriorityManager(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">Add Priority Rank Rule:</div>
              <div className="flex items-center gap-2">
                <select
                  value={newRuleField}
                  onChange={e => { setNewRuleField(e.target.value as any); setNewRuleValue(''); }}
                  className="bg-slate-900 border border-slate-700 text-xs text-purple-300 font-bold rounded-xl px-2.5 py-2 focus:outline-none"
                >
                  <option value="activity">Activity Type</option>
                  <option value="speciality">Speciality</option>
                </select>

                <select
                  value={newRuleValue}
                  onChange={e => setNewRuleValue(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-xl px-2.5 py-2 focus:outline-none"
                >
                  <option value="">-- Select Value --</option>
                  {(newRuleField === 'activity' ? activityMaster : specialityMaster).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>

                <button
                  onClick={handleAddCustomRule}
                  disabled={!newRuleValue}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl p-2 space-y-2 bg-slate-950/60 max-h-[300px]">
              {customPriorityRules.map((rule, idx) => (
                <div key={rule.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold flex items-center justify-center border border-purple-500/40">#{idx + 1}</span>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1.5">{rule.field}:</span>
                      <span className={`font-bold ${rule.field === 'activity' ? 'text-amber-300' : 'text-blue-300'}`}>{rule.value}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleMoveRule(idx, 'UP')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer"><ArrowUp size={14} /></button>
                    <button onClick={() => handleMoveRule(idx, 'DOWN')} disabled={idx === customPriorityRules.length - 1} className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer"><ArrowDown size={14} /></button>
                    <button onClick={() => handleDeleteRule(rule.id)} className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-purple-300">{customPriorityRules.map(r => r.value).join(' ➔ ') || 'Default'}</span>
              <button
                onClick={() => { setSortMode('CUSTOM_RANK'); setShowPriorityManager(false); }}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
              >
                Apply &amp; Sort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Masters Modal with Edit & Warning Delete */}
      {showMasterManager && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40"><Tag size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white">Activity &amp; Speciality Master Manager</h3>
                  <p className="text-xs text-slate-400">Add, Edit (✏️), or Delete (⚠️) Master tags across MSL</p>
                </div>
              </div>
              <button onClick={() => setShowMasterManager(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => { setMasterTab('activity'); setEditingItemOldValue(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  masterTab === 'activity' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Activity Master ({activityMaster.length})
              </button>
              <button
                onClick={() => { setMasterTab('speciality'); setEditingItemOldValue(null); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  masterTab === 'speciality' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                Speciality Master ({specialityMaster.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newMasterItemText}
                onChange={e => setNewMasterItemText(e.target.value)}
                placeholder={masterTab === 'activity' ? "New Activity..." : "New Speciality..."}
                className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 uppercase"
              />
              <button onClick={handleAddMasterItem} className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer">
                <Plus size={14} /> Add
              </button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl p-2 space-y-1.5 bg-slate-950/60 max-h-[300px]">
              {(masterTab === 'activity' ? activityMaster : specialityMaster).map(item => (
                <div key={item} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  {editingItemOldValue === item ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editingItemNewValue}
                        onChange={e => setEditingItemNewValue(e.target.value)}
                        className="flex-1 bg-slate-950 border border-cyan-500 text-xs text-cyan-300 font-bold rounded-lg px-2 py-1 uppercase"
                        autoFocus
                      />
                      <button onClick={handleSaveEditMasterItem} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">Save</button>
                      <button onClick={() => setEditingItemOldValue(null)} className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <span className={`font-semibold ${masterTab === 'activity' ? 'text-amber-300' : 'text-blue-300'}`}>{item}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleStartEditMasterItem(item)} className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 cursor-pointer" title="Edit Name"><Edit3 size={13} /></button>
                        <button onClick={() => handleDeleteMasterItemWithWarning(item)} className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer" title="Delete tag"><Trash2 size={13} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleRestoreDefaultMasters}
                className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={13} /> 🔄 Restore Default Masters
              </button>
              <button onClick={() => setShowMasterManager(false)} className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer">Done</button>
            </div>
          </div>
        </div>
      )}

      {/* CBO Doctor Link & Mapping Hub Modal */}
      {showMappingModal && pendingUnmatchedCboDocs.length > 0 && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/40"><Link2 size={20} /></span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    CBO Doctor Link &amp; Master Mapping Hub
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                      {pendingUnmatchedCboDocs.length} Unmatched Doctors
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">CBO ke names ko Master 123 Doctor se link karein ya New add karein.</p>
                </div>
              </div>
              <button onClick={() => setShowMappingModal(false)} className="text-slate-400 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="overflow-y-auto flex-1 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-bold uppercase border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-3 min-w-[200px]">CBO Extracted Doctor</th>
                    <th className="p-3 min-w-[150px]">Extracted Visits</th>
                    <th className="p-3 min-w-[140px]">Action Choice</th>
                    <th className="p-3 min-w-[240px]">Target Master Doctor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/60">
                  {pendingUnmatchedCboDocs.map((item, idx) => (
                    <tr key={item.cleanKey} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-bold text-white">{item.cboName}</div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{item.speciality || '-'}</div>
                      </td>
                      <td className="p-3 text-[11px] font-mono text-slate-300">
                        <span className="text-emerald-400 font-bold">{item.visitsCount} Calls</span>
                        <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">{item.sampleDates}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <label className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${item.action === 'LINK' ? 'bg-cyan-950 text-cyan-300 border-cyan-500/60' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                            <input type="radio" name={`action_${idx}`} checked={item.action === 'LINK'} onChange={() => setPendingUnmatchedCboDocs(prev => prev.map((p, i) => i === idx ? { ...p, action: 'LINK' } : p))} className="hidden" />
                            <Link2 size={12} /> Link to Master
                          </label>
                          <label className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer ${item.action === 'NEW' ? 'bg-purple-950 text-purple-300 border-purple-500/60' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                            <input type="radio" name={`action_${idx}`} checked={item.action === 'NEW'} onChange={() => setPendingUnmatchedCboDocs(prev => prev.map((p, i) => i === idx ? { ...p, action: 'NEW' } : p))} className="hidden" />
                            <UserPlus size={12} /> Add as New
                          </label>
                        </div>
                      </td>
                      <td className="p-3">
                        {item.action === 'LINK' ? (
                          <select
                            value={item.targetMasterSrNo}
                            onChange={(e) => {
                              const targetSr = parseInt(e.target.value, 10);
                              setPendingUnmatchedCboDocs(prev => prev.map((p, i) => i === idx ? { ...p, targetMasterSrNo: targetSr } : p));
                            }}
                            className="w-full bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
                          >
                            {doctors.filter(d => !d.isNewDoctor).map(doc => (
                              <option key={doc.srNo} value={doc.srNo} className="bg-slate-900 text-white">#{doc.srNo} {doc.doctorName} ({doc.speciality || '-'})</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-purple-300 font-mono italic">Will be created as #{Math.max(...doctors.map(d => d.srNo)) + 1 + idx} New Doctor</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">Yeh mapping permanent store ho jayegi.</div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button onClick={() => setShowMappingModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
                <button onClick={handleApplyMappings} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/30 transition cursor-pointer">
                  <Save size={14} /> 💾 Apply &amp; Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table with Activity Select Dropdown */}
      <div className="overflow-x-auto max-h-[640px] border border-slate-800 rounded-2xl relative shadow-2xl">
        <table className="w-full text-left text-xs border-separate border-spacing-0">
          <thead className="sticky top-0 z-40 bg-slate-950">
            <tr>
              <th style={{ width: `${W_SR}px`, minWidth: `${W_SR}px`, left: 0 }} className="p-2 text-center bg-slate-950 border-b border-r border-slate-800 sticky z-50 text-slate-400 font-bold uppercase">#</th>
              <th style={{ width: `${W_DOC}px`, minWidth: `${W_DOC}px`, left: `${W_SR}px` }} className={`p-2 bg-slate-950 border-b border-slate-800 sticky z-50 text-slate-400 font-bold uppercase ${lastLeftCol === 'doctor' ? 'border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)]' : 'border-r'}`}>Doctor Name</th>

              {showActivity && (
                <th style={{ width: `${W_ACT}px`, minWidth: `${W_ACT}px`, left: `${offsetAct}px` }} className={`p-2 bg-slate-950 border-b border-slate-800 sticky z-50 text-amber-400 font-bold uppercase ${lastLeftCol === 'activity' ? 'border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)]' : 'border-r'}`}>Activity</th>
              )}

              {showSpeciality && (
                <th style={{ width: `${W_SPEC}px`, minWidth: `${W_SPEC}px`, left: `${offsetSpec}px` }} className={`p-2 bg-slate-950 border-b border-slate-800 sticky z-50 text-blue-300 font-bold uppercase ${lastLeftCol === 'speciality' ? 'border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)]' : 'border-r'}`}>Speciality</th>
              )}

              {showDob && (
                <th style={{ width: `${W_DOB}px`, minWidth: `${W_DOB}px`, left: `${offsetDob}px` }} className={`p-2 text-center bg-slate-950 border-b border-slate-800 sticky z-50 text-purple-300 font-bold uppercase ${lastLeftCol === 'dob' ? 'border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)]' : 'border-r'}`}>DOB</th>
              )}

              {showDoa && (
                <th style={{ width: `${W_DOA}px`, minWidth: `${W_DOA}px`, left: `${offsetDoa}px` }} className="p-2 text-center bg-slate-950 border-b border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] sticky z-50 text-emerald-400 font-bold uppercase">DOA</th>
              )}

              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-cyan-400 font-bold uppercase">APR</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-emerald-400 font-bold uppercase">MAY</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-purple-400 font-bold uppercase">JUN</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-blue-400 font-bold uppercase">JUL</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-amber-400 font-bold uppercase">AUG</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-rose-400 font-bold uppercase">SEPT</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-cyan-300 font-bold uppercase">OCT</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-emerald-300 font-bold uppercase">NOV</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-purple-300 font-bold uppercase">DEC</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-blue-300 font-bold uppercase">JAN</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-amber-300 font-bold uppercase">FEB</th>
              <th className="p-2.5 text-center w-[160px] min-w-[160px] bg-slate-950 border-b border-r border-slate-800 text-rose-300 font-bold uppercase">MAR</th>
              <th className="p-2.5 text-center w-[50px] min-w-[50px] bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="bg-slate-900">
            {filtered.map(doc => {
              const isNew = !!doc.isNewDoctor;

              return (
                <tr key={doc.srNo} className={`transition group ${isNew ? 'bg-cyan-950/30 hover:bg-cyan-900/40 border-l-4 border-cyan-400' : 'hover:bg-slate-800/60'}`}>
                  <td style={{ width: `${W_SR}px`, minWidth: `${W_SR}px`, left: 0 }} className={`p-1.5 text-center font-mono border-b border-r border-slate-800/80 sticky z-20 text-xs ${isNew ? 'bg-cyan-950 text-cyan-300 font-bold' : 'bg-slate-900 text-slate-400 group-hover:bg-slate-800'}`}>{doc.srNo}</td>
                  <td style={{ width: `${W_DOC}px`, minWidth: `${W_DOC}px`, left: `${W_SR}px` }} className={`p-1 border-b border-slate-800/80 sticky z-20 ${isNew ? 'bg-cyan-950' : 'bg-slate-900 group-hover:bg-slate-800'} ${lastLeftCol === 'doctor' ? 'border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)]' : 'border-r'}`}>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={doc.doctorName}
                        onChange={e => handleFieldChange(doc.srNo, 'doctorName', e.target.value)}
                        className={`w-full py-1 px-1.5 bg-slate-950 rounded-md font-bold text-[11px] border focus:outline-none ${isNew ? 'text-cyan-300 border-cyan-500/60' : 'text-white border-slate-800 focus:border-cyan-500'}`}
                      />
                      {isNew && <span className="absolute -top-2 -right-1 text-[8px] bg-cyan-500 text-slate-950 font-black px-1 rounded-full uppercase tracking-tighter shadow">NEW</span>}
                    </div>
                  </td>

                  {/* 🌟 3. ACTIVITY DROPDOWN (Strict select from Master) */}
                  {showActivity && (
                    <td style={{ width: `${W_ACT}px`, minWidth: `${W_ACT}px`, left: `${offsetAct}px` }} className={`p-1 border-b border-slate-800/80 sticky z-20 ${isNew ? 'bg-cyan-950' : 'bg-slate-900 group-hover:bg-slate-800'} ${lastLeftCol === 'activity' ? 'border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)]' : 'border-r'}`}>
                      <select
                        value={doc.activityType || ''}
                        onChange={e => handleFieldChange(doc.srNo, 'activityType', e.target.value)}
                        className="w-full py-1 px-1 bg-slate-950 rounded-md text-amber-400 border border-slate-800 focus:border-cyan-500 focus:outline-none text-[10px] font-semibold uppercase cursor-pointer"
                      >
                        <option value="" className="bg-slate-900 text-slate-500">- None -</option>
                        {activityMaster.map(act => (
                          <option key={act} value={act} className="bg-slate-900 text-amber-300">{act}</option>
                        ))}
                        {doc.activityType && !activityMaster.includes(doc.activityType) && (
                          <option value={doc.activityType} className="bg-slate-900 text-cyan-300">{doc.activityType}</option>
                        )}
                      </select>
                    </td>
                  )}

                  {/* 4. Speciality Dropdown */}
                  {showSpeciality && (
                    <td style={{ width: `${W_SPEC}px`, minWidth: `${W_SPEC}px`, left: `${offsetSpec}px` }} className={`p-1 border-b border-slate-800/80 sticky z-20 ${isNew ? 'bg-cyan-950' : 'bg-slate-900 group-hover:bg-slate-800'} ${lastLeftCol === 'speciality' ? 'border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)]' : 'border-r'}`}>
                      <select
                        value={doc.speciality || ''}
                        onChange={e => handleFieldChange(doc.srNo, 'speciality', e.target.value)}
                        className="w-full py-1 px-1 bg-slate-950 rounded-md text-slate-300 border border-slate-800 focus:border-cyan-500 focus:outline-none text-[10px] uppercase cursor-pointer"
                      >
                        <option value="" className="bg-slate-900 text-slate-500">- Select -</option>
                        {specialityMaster.map(sp => (
                          <option key={sp} value={sp} className="bg-slate-900 text-slate-200">{sp}</option>
                        ))}
                        {doc.speciality && !specialityMaster.includes(doc.speciality) && (
                          <option value={doc.speciality} className="bg-slate-900 text-blue-300">{doc.speciality}</option>
                        )}
                      </select>
                    </td>
                  )}

                  {/* 5. DOB */}
                  {showDob && (
                    <td style={{ width: `${W_DOB}px`, minWidth: `${W_DOB}px`, left: `${offsetDob}px` }} className={`p-1 border-b border-slate-800/80 sticky z-20 ${isNew ? 'bg-cyan-950' : 'bg-slate-900 group-hover:bg-slate-800'} ${lastLeftCol === 'dob' ? 'border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)]' : 'border-r'}`}>
                      <input
                        type="text"
                        value={doc.dob}
                        onChange={e => handleFieldChange(doc.srNo, 'dob', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full py-1 px-1 bg-slate-950 rounded-md font-mono text-slate-300 border border-slate-800 focus:border-cyan-500 focus:outline-none text-center text-[10px]"
                      />
                    </td>
                  )}

                  {/* 6. DOA */}
                  {showDoa && (
                    <td style={{ width: `${W_DOA}px`, minWidth: `${W_DOA}px`, left: `${offsetDoa}px` }} className={`p-1 border-b border-r-4 border-cyan-500 shadow-[4px_0_12px_rgba(0,0,0,0.6)] sticky z-20 ${isNew ? 'bg-cyan-950' : 'bg-slate-900 group-hover:bg-slate-800'}`}>
                      <input
                        type="text"
                        value={doc.doa}
                        onChange={e => handleFieldChange(doc.srNo, 'doa', e.target.value)}
                        placeholder="DD/MM/YYYY"
                        className="w-full py-1 px-1 bg-slate-950 rounded-md font-mono text-slate-300 border border-slate-800 focus:border-cyan-500 focus:outline-none text-center text-[10px] font-bold"
                      />
                    </td>
                  )}

                  {/* 12 Months */}
                  {['apr', 'may', 'jun', 'jul', 'aug', 'sept', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar'].map(monthKey => {
                    const cellVal = (doc as any)[monthKey] || '';
                    const hasDates = cellVal.trim().length > 0;

                    return (
                      <td key={monthKey} className={`p-1.5 w-[160px] min-w-[160px] border-b border-r border-slate-800/50 ${isNew ? 'bg-cyan-950/20' : ''}`}>
                        <input
                          type="text"
                          value={cellVal}
                          onChange={e => handleFieldChange(doc.srNo, monthKey as any, e.target.value)}
                          placeholder="-"
                          className={`w-full py-1.5 px-2 rounded-lg font-mono text-center text-xs font-semibold border focus:outline-none ${
                            hasDates 
                              ? isNew ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500/50 font-bold' : 'bg-slate-950 text-slate-100 border-slate-700 font-bold'
                              : 'bg-slate-950/60 text-slate-500 border-slate-800'
                          }`}
                        />
                      </td>
                    );
                  })}

                  <td className="p-1 text-center border-b border-slate-800/80 w-[50px] min-w-[50px]">
                    <button type="button" onClick={() => handleDeleteDoctor(doc.srNo)} className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

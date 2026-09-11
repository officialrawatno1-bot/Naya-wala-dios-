export interface CboDoctorMaster {
  srNo: number;
  doctorName: string;
  drCode: string;
  speciality: string;
  qualification: string;
  station: 'UDAIPUR' | 'BANSWARA' | 'DUNGARPUR' | 'CHITTORGARH' | 'RAJASMAND';
  daType: 'L' | 'EX' | 'NSD';
  dob: string;
  doa: string;
  mobile: string;
  clinicAddress: string;
  activityType?: string;
}

export const CBO_MASTER_130_DOCTORS: CboDoctorMaster[] = [
  { srNo: 1, doctorName: 'NEHA SHARMA', drCode: 'A29716', speciality: 'MBBS MD', qualification: 'MDMED', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9464816191', clinicAddress: 'g6 pharmacy' },
  { srNo: 2, doctorName: 'MAHESH DAVE', drCode: 'A08290', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '03/03/2019', doa: '', mobile: '9414471050', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 3, doctorName: 'KC JAIN', drCode: 'A08291', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '24/07/2019', doa: '27/11/2001', mobile: '9414162424', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 4, doctorName: 'DP SINGH', drCode: 'A08292', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '23/11/2019', doa: '', mobile: '9829164092', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 5, doctorName: 'KAVITA BADJATIYA', drCode: 'A08293', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '26/08/2019', doa: '09/02/2007', mobile: '9413954873', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 6, doctorName: 'SAFDAR HUSSAIN', drCode: 'A08294', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '05/05/2019', doa: '', mobile: '9414167404', clinicAddress: 'UDAIPUR' },
  { srNo: 7, doctorName: 'SALMA SHAH', drCode: 'A08296', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '07/03/2019', doa: '01/01/2000', mobile: '9460401750', clinicAddress: 'UDAIPUR' },
  { srNo: 8, doctorName: 'ABHIJEET BASU', drCode: 'A08298', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '12/12/1972', doa: '19/04/2000', mobile: '9352517072', clinicAddress: 'UDAIPUR' },
  { srNo: 9, doctorName: 'LALIT SHREEMALI', drCode: 'A08299', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '20/12/2019', doa: '27/04/2008', mobile: '9414161410', clinicAddress: 'UDAIPUR' },
  { srNo: 10, doctorName: 'NAVGEET MATHUR', drCode: 'A08300', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '28/03/1982', doa: '06/12/2009', mobile: '', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 11, doctorName: 'JC DEVPURA', drCode: 'A08301', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '30/03/2019', doa: '', mobile: '9351251117', clinicAddress: 'UDAIPUR' },
  { srNo: 12, doctorName: 'KALPESH CHODHRAY', drCode: 'A08304', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9950777467', clinicAddress: 'UDAIPUR' },
  { srNo: 13, doctorName: 'PARAS JAIN', drCode: 'A08305', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '23/11/2019', doa: '', mobile: '9829150159', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 14, doctorName: 'DEEPAK AAMETHA', drCode: 'A08306', speciality: 'MD.CARDIO', qualification: 'MD.CARDIO', station: 'UDAIPUR', daType: 'L', dob: '17/03/1980', doa: '', mobile: '7727837100', clinicAddress: 'UDAIPUR', activityType: 'WCFYH VAL/VIN' },
  { srNo: 15, doctorName: 'BS BOMB', drCode: 'A08307', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '08/12/2019', doa: '', mobile: '9352500310', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 16, doctorName: 'OP MEENA', drCode: 'A08309', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '', clinicAddress: 'UDAIPUR' },
  { srNo: 17, doctorName: 'D C SHARMA', drCode: 'A08311', speciality: 'DM ENDO', qualification: 'DM ENDO', station: 'UDAIPUR', daType: 'L', dob: '12/05/2019', doa: '', mobile: '9414159690', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 18, doctorName: 'SANDEEP KANSARA', drCode: 'A08313', speciality: 'DM ENDO', qualification: 'DM ENDO', station: 'UDAIPUR', daType: 'L', dob: '22/10/2019', doa: '', mobile: '9352241126', clinicAddress: 'UDAIPUR', activityType: 'CRM+LGT TABLE TOP' },
  { srNo: 19, doctorName: 'MUKESH SHARMA', drCode: 'A08314', speciality: 'DM CARDIO', qualification: 'DM CARDIO', station: 'UDAIPUR', daType: 'L', dob: '07/07/2019', doa: '', mobile: '9413695861', clinicAddress: 'UDAIPUR', activityType: 'WCFYH VAL/VIN' },
  { srNo: 20, doctorName: 'CPPUROHIT', drCode: 'A08315', speciality: 'DM CARDIO', qualification: 'DM CARDIO', station: 'UDAIPUR', daType: 'L', dob: '02/11/1971', doa: '', mobile: '9587509850', clinicAddress: 'UDAIPUR', activityType: 'WCFYH VAL/VIN' },
  { srNo: 21, doctorName: 'KAPIL BHARGAV', drCode: 'A08316', speciality: 'DM CARDIO', qualification: 'DM CARDIO', station: 'UDAIPUR', daType: 'L', dob: '16/12/2019', doa: '27/04/1998', mobile: '9414169848', clinicAddress: 'UDAIPUR', activityType: 'WCFYH VAL/VIN' },
  { srNo: 22, doctorName: 'S K KUASHIK', drCode: 'A08317', speciality: 'DM CARDIO', qualification: 'DM CARDIO', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9414158432', clinicAddress: 'UDAIPUR', activityType: 'A2 GHEE' },
  { srNo: 23, doctorName: 'HARISH SANADHY', drCode: 'A08318', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '01/01/1970', doa: '', mobile: '9462627692', clinicAddress: 'UDAIPUR' },
  { srNo: 24, doctorName: 'TARUN RHLOT', drCode: 'A08319', speciality: 'DM NEURO', qualification: 'DM NEURO', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9468967338', clinicAddress: 'UDAIPUR' },
  { srNo: 25, doctorName: 'VINOD MEHTA', drCode: 'A08320', speciality: 'DM NEURO', qualification: 'DM NEURO', station: 'UDAIPUR', daType: 'L', dob: '02/06/2019', doa: '02/12/2009', mobile: '9794321171', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 26, doctorName: 'AKVATS', drCode: 'A08321', speciality: 'DM NEURO', qualification: 'DM NEURO', station: 'UDAIPUR', daType: 'L', dob: '02/08/2019', doa: '', mobile: '9829279719', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 27, doctorName: 'MANISH KULSHERT', drCode: 'A08322', speciality: 'DM NEURO', qualification: 'DM NEURO', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '8826631981', clinicAddress: 'UDAIPUR', activityType: 'VTL TABLE TOP' },
  { srNo: 28, doctorName: 'RAJESH KHOIWAL', drCode: 'A08324', speciality: 'DM NEURO', qualification: 'DM NEURO', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9950531777', clinicAddress: 'UDAIPUR' },
  { srNo: 29, doctorName: 'TARUN MATHUR', drCode: 'DMA08325', speciality: 'DM NEURO', qualification: 'DM NEURO', station: 'UDAIPUR', daType: 'L', dob: '02/08/1979', doa: '', mobile: '', clinicAddress: 'UDAIPUR' },
  { srNo: 30, doctorName: 'ANURAG JAIN', drCode: 'A08327', speciality: 'DNB NEFRO', qualification: 'DNB NEFRO', station: 'UDAIPUR', daType: 'L', dob: '12/03/1979', doa: '', mobile: '9558938278', clinicAddress: 'UDAIPUR' },
  { srNo: 31, doctorName: 'MUKESH BARJATIYA', drCode: 'A08329', speciality: 'DNB NEFRO', qualification: 'DNB NEFRO', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9414169665', clinicAddress: 'UDAIPUR' },
  { srNo: 32, doctorName: 'RAMESH PATEL', drCode: 'A08331', speciality: 'DM CARDIO', qualification: 'DM CARDIO', station: 'UDAIPUR', daType: 'L', dob: '30/09/2019', doa: '', mobile: '9530079043', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 33, doctorName: 'DANNY KUMAR MANGLANI', drCode: 'A08332', speciality: 'DM CARDIO', qualification: 'DM CARDIO', station: 'UDAIPUR', daType: 'L', dob: '03/06/2019', doa: '30/04/1998', mobile: '9711185891', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 34, doctorName: 'UDAY BHOMIK', drCode: 'A08335', speciality: 'DM NEURO', qualification: 'DM NEURO', station: 'UDAIPUR', daType: 'L', dob: '08/04/2019', doa: '', mobile: '9460068868', clinicAddress: 'UDAIPUR', activityType: 'WCFYH VTL' },
  { srNo: 35, doctorName: 'GOVIND MANGAL', drCode: 'B08336', speciality: 'DM NEURO', qualification: 'DM NEURO', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9414728062', clinicAddress: 'UDAIPUR' },
  { srNo: 36, doctorName: 'MANU SHARMA', drCode: 'B08339', speciality: 'MD PSY', qualification: 'MD PSY', station: 'UDAIPUR', daType: 'L', dob: '05/12/2019', doa: '', mobile: '8890725215', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 37, doctorName: 'JITENA JINGAR', drCode: 'B08340', speciality: 'MD PSY', qualification: 'MD PSY', station: 'UDAIPUR', daType: 'L', dob: '24/09/2019', doa: '', mobile: '9772177234', clinicAddress: 'UDAIPUR' },
  { srNo: 38, doctorName: 'YN VERMA', drCode: 'B08341', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '03/07/2019', doa: '11/05/1900', mobile: '9828056778', clinicAddress: 'UDAIPUR' },
  { srNo: 39, doctorName: 'VIJAY GOYAL', drCode: 'B08344', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '01/09/2019', doa: '11/12/2008', mobile: '9414026742', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 40, doctorName: 'SUMIT SIROIYA', drCode: 'B08348', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '14/01/2019', doa: '', mobile: '8529490073', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 41, doctorName: 'JAGDISH VISHNOI', drCode: 'B08350', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '03/03/1974', doa: '25/12/2009', mobile: '9414471317', clinicAddress: 'UDAIPUR' },
  { srNo: 42, doctorName: 'PRERNA BHARGAV', drCode: 'B08352', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '23/03/2019', doa: '', mobile: '9461643713', clinicAddress: 'UDAIPUR' },
  { srNo: 43, doctorName: 'SANDEEP BHATNAGAR', drCode: 'B08358', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '13/02/2019', doa: '27/04/1993', mobile: '9414167693', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 44, doctorName: 'RK SHARMA', drCode: 'B08360', speciality: 'DM ENDO', qualification: 'DM ENDO', station: 'UDAIPUR', daType: 'L', dob: '14/01/2019', doa: '', mobile: '9414002633', clinicAddress: 'UDAIPUR' },
  
  // DUNGARPUR (EX)
  { srNo: 45, doctorName: 'KN DAS', drCode: 'B08361', speciality: 'MD MED', qualification: 'MD MED', station: 'DUNGARPUR', daType: 'EX', dob: '15/11/2019', doa: '15/05/2009', mobile: '9414104950', clinicAddress: 'DUNGARPUR' },
  { srNo: 46, doctorName: 'JAYESH GANDHI', drCode: 'B08362', speciality: 'MD MED', qualification: 'MD MED', station: 'DUNGARPUR', daType: 'EX', dob: '10/06/2019', doa: '', mobile: '9413639344', clinicAddress: 'DUNGARPUR', activityType: 'CASH' },
  { srNo: 47, doctorName: 'RAHUL PANCHAL', drCode: 'B08363', speciality: 'MD MED', qualification: 'MD MED', station: 'DUNGARPUR', daType: 'EX', dob: '21/04/2019', doa: '', mobile: '8290703766', clinicAddress: 'DUNGARPUR', activityType: 'CRM' },
  { srNo: 48, doctorName: 'CHIRAG RATHOR', drCode: 'B08364', speciality: 'MD MED', qualification: 'MD MED', station: 'DUNGARPUR', daType: 'EX', dob: '03/04/1990', doa: '10/02/2000', mobile: '7485965657', clinicAddress: 'DUNGARPUR' },
  { srNo: 49, doctorName: 'RAJESH SIROIYA', drCode: 'B08366', speciality: 'MD MED', qualification: 'MD MED', station: 'DUNGARPUR', daType: 'EX', dob: '04/10/2019', doa: '', mobile: '9414349145', clinicAddress: 'DUNGARPUR' },
  { srNo: 50, doctorName: 'KANTI LAL MEGWAL', drCode: 'B08367', speciality: 'MD MED', qualification: 'MD MED', station: 'DUNGARPUR', daType: 'EX', dob: '09/01/2019', doa: '', mobile: '9950697113', clinicAddress: 'DUNGARPUR' },

  // BANSWARA (EX)
  { srNo: 51, doctorName: 'RK MALOT', drCode: 'A08370', speciality: 'MD MED', qualification: 'MD MED', station: 'BANSWARA', daType: 'EX', dob: '09/05/2019', doa: '', mobile: '9414102661', clinicAddress: 'BANSWADA', activityType: 'CRM' },
  { srNo: 52, doctorName: 'KIRIT GANDHI', drCode: 'B08374', speciality: 'MD MED', qualification: 'MD MED', station: 'BANSWARA', daType: 'EX', dob: '11/07/2019', doa: '', mobile: '9166330023', clinicAddress: 'BANSWADA', activityType: 'CRM' },

  // CHITTORGARH (EX)
  { srNo: 53, doctorName: 'LALIT JAINANI', drCode: 'B08377', speciality: 'MD MED', qualification: 'MD MED', station: 'CHITTORGARH', daType: 'EX', dob: '11/04/2019', doa: '', mobile: '9829225597', clinicAddress: 'CHITOR' },
  { srNo: 54, doctorName: 'MADHUP BAXI', drCode: 'A08378', speciality: 'MD MED', qualification: 'MD MED', station: 'CHITTORGARH', daType: 'EX', dob: '29/01/2019', doa: '', mobile: '9414249043', clinicAddress: 'CHITOR' },
  { srNo: 55, doctorName: 'ANISH JAIN', drCode: 'A08379', speciality: 'MD MED', qualification: 'MD MED', station: 'CHITTORGARH', daType: 'EX', dob: '16/12/2019', doa: '', mobile: '9414109022', clinicAddress: 'CHITOR', activityType: 'CRM' },
  { srNo: 56, doctorName: 'SHUSHIL CHOUHAN', drCode: 'B08380', speciality: 'MD MED', qualification: 'MD MED', station: 'CHITTORGARH', daType: 'EX', dob: '17/02/2019', doa: '', mobile: '9982386398', clinicAddress: 'CHITOR' },

  // RAJSAMAND (EX)
  { srNo: 57, doctorName: 'SUNIL UPADHAY', drCode: 'B08384', speciality: 'MD MED', qualification: 'MD MED', station: 'RAJASMAND', daType: 'EX', dob: '07/02/2019', doa: '', mobile: '9829165267', clinicAddress: 'RAJASMAND' },
  { srNo: 58, doctorName: 'ANMOL PAGARIYA', drCode: 'B08385', speciality: 'MD MED', qualification: 'MD MED', station: 'RAJASMAND', daType: 'EX', dob: '23/01/2019', doa: '', mobile: '9460378990', clinicAddress: 'RAJASMAND' },
  { srNo: 59, doctorName: 'BHUPESH PARTANI', drCode: 'B08386', speciality: 'MD MED', qualification: 'MD MED', station: 'RAJASMAND', daType: 'EX', dob: '23/10/2019', doa: '', mobile: '9414741190', clinicAddress: 'RAJASMAND' },
  { srNo: 60, doctorName: 'KRIPA SHANKAR', drCode: 'A08387', speciality: 'MD MED', qualification: 'MD MED', station: 'RAJASMAND', daType: 'EX', dob: '15/09/2019', doa: '', mobile: '9610251730', clinicAddress: 'RAJASMAND' },
  { srNo: 61, doctorName: 'HC SONI', drCode: 'A08388', speciality: 'MD MED', qualification: 'MD MED', station: 'RAJASMAND', daType: 'EX', dob: '25/10/1955', doa: '23/11/2023', mobile: '9414472440', clinicAddress: 'RAJASMAND' },
  { srNo: 62, doctorName: 'MK MEENA', drCode: 'B08389', speciality: 'SURJAN', qualification: 'SURJAN', station: 'RAJASMAND', daType: 'EX', dob: '', doa: '', mobile: '9462733484', clinicAddress: 'RAJASMAND' },

  // UDAIPUR (L)
  { srNo: 63, doctorName: 'JAY CHORDIYA', drCode: 'A08390', speciality: 'DM ENDO', qualification: 'DM ENDO', station: 'UDAIPUR', daType: 'L', dob: '21/04/2019', doa: '', mobile: '9928116333', clinicAddress: 'UDAIPUR', activityType: 'LGT TABLE TOP' },
  { srNo: 64, doctorName: 'HEMANT MAHUR', drCode: 'A08393', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '25/03/1996', doa: '', mobile: '9829040103', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 65, doctorName: 'BALDEV MEENA', drCode: 'B08395', speciality: 'MD MED', qualification: 'MD MED', station: 'UDAIPUR', daType: 'L', dob: '05/07/1978', doa: '16/01/2005', mobile: '9460125520', clinicAddress: 'UDAIPUR', activityType: 'CRM' },
  { srNo: 66, doctorName: 'Abhay jain', drCode: 'A+10028', speciality: 'CONSULTANT PHYSICIAN', qualification: 'MBBS ,MD', station: 'UDAIPUR', daType: 'L', dob: '12/12/1972', doa: '', mobile: '9828053113', clinicAddress: 'Sec. 3,Udaipur', activityType: 'CRM' },
  { srNo: 67, doctorName: 'Ameet Mehta', drCode: 'GEB13013', speciality: 'GENERAL PHYSICIAN', qualification: 'M,B.B.S', station: 'UDAIPUR', daType: 'L', dob: '27/04/1900', doa: '19/05/1900', mobile: '9879188503', clinicAddress: 'Gitanjali hospital' },
  { srNo: 68, doctorName: 'Mona dingra', drCode: 'A+13017', speciality: 'ENDO', qualification: 'DIABETO', station: 'UDAIPUR', daType: 'L', dob: '18/07/1900', doa: '10/02/1900', mobile: '7300091132', clinicAddress: 'Pacific hospital ,Bhulo ka bedla', activityType: 'WCFYH VTL' },
  
  // RAJSAMAND (EX)
  { srNo: 69, doctorName: 'M vijay vargiy', drCode: 'B13535', speciality: 'M B B S PHY', qualification: 'M B B S', station: 'RAJASMAND', daType: 'EX', dob: '', doa: '', mobile: '9660510289', clinicAddress: 'Near rk hospital,Rajsamand' },
  
  // DUNGARPUR (EX)
  { srNo: 70, doctorName: 'pintu aahari', drCode: 'C13536', speciality: 'MBBB MD', qualification: 'M B B S', station: 'DUNGARPUR', daType: 'EX', dob: '', doa: '', mobile: '', clinicAddress: 'Dungarpur' },

  // UDAIPUR (L)
  { srNo: 71, doctorName: 'Hitesh yadav', drCode: 'A13802', speciality: 'CARDIO', qualification: 'DM CARD', station: 'UDAIPUR', daType: 'L', dob: '11/05/1900', doa: '31/01/2009', mobile: '8301865586', clinicAddress: 'Gbh. American,Bhat ji ki badi,Udaipur', activityType: 'CRM' },
  { srNo: 72, doctorName: 'Nilesh pathira', drCode: 'A13853', speciality: 'M B B S PHY', qualification: 'M D', station: 'UDAIPUR', daType: 'L', dob: '28/01/1900', doa: '14/04/1900', mobile: '9799039973', clinicAddress: 'Pacific hospital bedla', activityType: 'GLUCOMETER' },

  // BANSWARA (EX)
  { srNo: 73, doctorName: 'Navneet patel kiyda', drCode: 'A13889', speciality: 'MBBB MD', qualification: 'MBBS', station: 'BANSWARA', daType: 'EX', dob: '30/06/1900', doa: '23/04/1900', mobile: '7838909442', clinicAddress: 'Banswara' },
  { srNo: 74, doctorName: 'jimesh Pandiya', drCode: 'A13890', speciality: 'MBBB MD', qualification: 'M B B S', station: 'BANSWARA', daType: 'EX', dob: '22/03/1900', doa: '06/12/1900', mobile: '8005584092', clinicAddress: 'Banswara', activityType: 'CRM' },
  { srNo: 75, doctorName: 'Harish charpota', drCode: 'B13891', speciality: 'M B B S PHY', qualification: 'MBBS ,MD', station: 'BANSWARA', daType: 'EX', dob: '16/10/1900', doa: '27/04/1900', mobile: '9664484613', clinicAddress: 'Banswara ,Mohan colony' },

  // UDAIPUR (L)
  { srNo: 76, doctorName: 'Vinod bokadia', drCode: 'A13921', speciality: 'Diabet/ End', qualification: 'M B B S', station: 'UDAIPUR', daType: 'L', dob: '24/02/1988', doa: '02/05/2014', mobile: '9001958224', clinicAddress: 'Sec. 6,Udaipur', activityType: 'LGT TABLE TOP' },

  // RAJSAMAND (EX)
  { srNo: 77, doctorName: 'Manish Khandelwal', drCode: 'C15103', speciality: 'MBBS MD', qualification: 'MBBS ,MD', station: 'RAJASMAND', daType: 'EX', dob: '', doa: '', mobile: '8209856882', clinicAddress: 'Near rk hospital,Rajsamand' },

  // UDAIPUR (L)
  { srNo: 78, doctorName: 'Sanjay Gandhi', drCode: 'B16513', speciality: 'C V T S', qualification: 'M.S MCH', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9429966567', clinicAddress: 'Gitanjali Hospital,Udaipur', activityType: 'WCFYH VAL/VIN' },
  { srNo: 79, doctorName: 'Suresh Chandra', drCode: 'C16514', speciality: 'GEN MED', qualification: 'GP-MBBS', station: 'UDAIPUR', daType: 'L', dob: '17/02/1983', doa: '13/07/2001', mobile: '9461272110', clinicAddress: 'Hindustan Zinc clinic,Udaipur', activityType: 'CRM' },
  { srNo: 80, doctorName: 'G K Mukhiya', drCode: 'DMB16515', speciality: 'DM NEPHRO', qualification: 'DM', station: 'UDAIPUR', daType: 'L', dob: '13/05/1973', doa: '11/03/2009', mobile: '8233639147', clinicAddress: 'Gitanjali Hospital,Udaipur', activityType: 'CRM' },
  { srNo: 81, doctorName: 'SURAJ GUPTA', drCode: 'NEB16516', speciality: 'NEPHROLOGIST', qualification: 'DM (Nephro)', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9971861147', clinicAddress: 'Gitanjali Hospital,Udaipur' },
  { srNo: 82, doctorName: 'Ravi Mangalia', drCode: 'B16573', speciality: 'CONSULTANT PHY', qualification: 'MBBS ,MD', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '7568962541', clinicAddress: 'Geetanjali Hospital,Udaipur' },
  { srNo: 83, doctorName: 'Dilip jain', drCode: 'A17879', speciality: 'CARDIOLOGY', qualification: 'D.M', station: 'UDAIPUR', daType: 'L', dob: '24/04/1982', doa: '', mobile: '9079166793', clinicAddress: 'Gitanjali hospital', activityType: 'WCFYH VAL/VIN' },
  { srNo: 84, doctorName: 'AMIT KHANDELWAL', drCode: 'A17902', speciality: 'CARDIO', qualification: 'DMCARD', station: 'UDAIPUR', daType: 'L', dob: '03/04/1977', doa: '', mobile: '9549877354', clinicAddress: 'Paras JK', activityType: 'WCFYH VAL/VIN' },
  { srNo: 85, doctorName: 'ANUBHAV BANSAL', drCode: 'A19321', speciality: 'CVTS', qualification: 'CVTS', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '7529838402', clinicAddress: 'Geetanjali' },
  { srNo: 86, doctorName: 'GOURAV KUMAR MITTAL', drCode: 'A20312', speciality: 'CARDIO', qualification: 'DM (Cardio)', station: 'UDAIPUR', daType: 'L', dob: '11/09/1900', doa: '23/06/1900', mobile: '9583276335', clinicAddress: 'Geetanjali' },

  // BANSWARA (EX)
  { srNo: 87, doctorName: 'MAYANK SHARMA', drCode: 'A20426', speciality: 'medicine', qualification: 'MD', station: 'BANSWARA', daType: 'EX', dob: '', doa: '', mobile: '8005529023', clinicAddress: 'BANSWADA' },

  // UDAIPUR (L)
  { srNo: 88, doctorName: 'PRATIBHA CHOUDHURY', drCode: 'A20842', speciality: 'PHY', qualification: 'M B B S', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '8003132216', clinicAddress: 'Dhanmandi' },
  { srNo: 89, doctorName: 'KAMLESH BHATT', drCode: 'A20923', speciality: 'DNB', qualification: 'DNB PSY', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '8003366579', clinicAddress: 'Bedla pmch hospital' },

  // CHITTORGARH (EX)
  { srNo: 90, doctorName: 'SANDEEP CHANDOLIYA', drCode: 'A20965', speciality: 'MBBB MD', qualification: 'MBBS ,MD', station: 'CHITTORGARH', daType: 'EX', dob: '', doa: '', mobile: '9999999999', clinicAddress: 'Pratap circle' },
  { srNo: 91, doctorName: 'VK RAMCHANDANI', drCode: 'A20966', speciality: 'General Practitioner (GP)', qualification: 'MBBB', station: 'CHITTORGARH', daType: 'EX', dob: '', doa: '', mobile: '9999999999', clinicAddress: 'Dr vk RAMCHANDANI' },

  // UDAIPUR (L)
  { srNo: 92, doctorName: 'Prerna baheti', drCode: 'A20977', speciality: 'MBBS,DNB,ECMO', qualification: 'MBBS DNB', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9999999999', clinicAddress: 'Gbh American hospital' },
  { srNo: 93, doctorName: 'PRASHANT BADJATIYA', drCode: 'A22242', speciality: 'CONSULTANT PHYSICIAN', qualification: 'MBBS', station: 'UDAIPUR', daType: 'L', dob: '25/06/2000', doa: '02/11/2025', mobile: '9166170905', clinicAddress: 'Victoria hospital' },
  { srNo: 94, doctorName: 'Abhishek Kumar', drCode: 'B22355', speciality: 'CONSPHYS', qualification: 'MBBS,MD', station: 'UDAIPUR', daType: 'L', dob: '26/05/1990', doa: '', mobile: '0000000000', clinicAddress: 'near dr salma Shah' },
  { srNo: 95, doctorName: 'rahul sehlot', drCode: 'A22358', speciality: 'ENDO', qualification: 'DM,ENDO', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '0000000000', clinicAddress: 'at geetanjali hospital' },
  { srNo: 96, doctorName: 'Ashutosh soni', drCode: 'NEA22879', speciality: 'NEPHRO', qualification: 'DM,NEURO', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9041528800', clinicAddress: 'PARAS JK HOSPITAL' },

  // BANSWARA (EX)
  { srNo: 97, doctorName: 'DEEPA KATARA', drCode: 'B23090', speciality: 'MD PHYSICAN', qualification: 'MBBS MD', station: 'BANSWARA', daType: 'EX', dob: '', doa: '', mobile: '7014041197', clinicAddress: 'mahatama Gandhi hospital' },
  { srNo: 98, doctorName: 'YASH SHAH', drCode: 'B23091', speciality: 'CONS PHY', qualification: 'GEN PHY', station: 'BANSWARA', daType: 'EX', dob: '', doa: '', mobile: '8094667334', clinicAddress: 'zeal hospital' },

  // RAJSAMAND (EX)
  { srNo: 99, doctorName: 'BL KUMAWAT', drCode: 'A23231', speciality: 'MBBB MD', qualification: 'MBBS ,MD', station: 'RAJASMAND', daType: 'EX', dob: '', doa: '', mobile: '0000000000', clinicAddress: 'Rajsamand' },

  // BANSWARA (EX)
  { srNo: 100, doctorName: 'BIPIN CHANDRA ADITYA DASARI', drCode: 'A23659', speciality: 'CARDIO', qualification: 'DM (CARDIOLOGY)', station: 'BANSWARA', daType: 'EX', dob: '13/05/1990', doa: '', mobile: '0000000000', clinicAddress: 'rhythm' },
  { srNo: 101, doctorName: 'ASHWIN PATIDAR', drCode: 'B24282', speciality: 'MBBS MD', qualification: 'MBBS', station: 'BANSWARA', daType: 'NSD', dob: '', doa: '', mobile: '8875874462', clinicAddress: 'mb hospital' },

  // RAJSAMAND (EX)
  { srNo: 102, doctorName: 'SATISH CHOUDHARY', drCode: 'A24285', speciality: 'PHYSCIAN', qualification: 'MD', station: 'RAJASMAND', daType: 'EX', dob: '', doa: '', mobile: '9413671394', clinicAddress: 'Nathdwara', activityType: 'VTL TABLE TOP' },

  // UDAIPUR (L)
  { srNo: 103, doctorName: 'VINOD KUMAR RAI', drCode: 'MBA24453', speciality: 'MBBS', qualification: 'MBBS ,MD', station: 'UDAIPUR', daType: 'L', dob: '22/12/1969', doa: '28/04/1999', mobile: '9929598599', clinicAddress: 'zinc', activityType: 'CRM' },
  { srNo: 104, doctorName: 'RL MEENA', drCode: 'A24458', speciality: 'C.PHY', qualification: 'MBBS', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9414736511', clinicAddress: 'MB HOSPITAL' },
  { srNo: 105, doctorName: 'HARBEER SINGH CHHABRA', drCode: 'A24559', speciality: 'PHY', qualification: 'MBBS,MD', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9414497636', clinicAddress: 'GBH' },
  { srNo: 106, doctorName: 'RAJENDRA KUMAR SAMAR', drCode: 'A24560', speciality: 'PHY', qualification: 'MBBS ,MD', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9414164669', clinicAddress: 'GBH' },

  // DUNGARPUR (EX)
  { srNo: 107, doctorName: 'RAKESH MEENA', drCode: 'B29975', speciality: 'MBBS MD', qualification: 'MBBS ,MD', station: 'DUNGARPUR', daType: 'EX', dob: '', doa: '', mobile: '82903 1788', clinicAddress: 'near manglam medical' },

  // BANSWARA (EX)
  { srNo: 108, doctorName: 'SAMARTH PATEL', drCode: 'DMA+33520', speciality: 'DM CARD', qualification: 'MBBS ,MD', station: 'BANSWARA', daType: 'EX', dob: '', doa: '', mobile: '90991 7878', clinicAddress: 'rhythm hospital' },

  // CHITTORGARH (EX)
  { srNo: 109, doctorName: 'JAY PRAKASH KULDEEP', drCode: 'A+33525', speciality: 'MBBS MD', qualification: 'MBBS ,MD', station: 'CHITTORGARH', daType: 'EX', dob: '21/03/1990', doa: '25/11/2010', mobile: '6350676591', clinicAddress: 'ne' },

  // UDAIPUR (L)
  { srNo: 110, doctorName: 'S.A.BOHRA', drCode: 'B26706', speciality: 'MBBS MD', qualification: 'MBBS', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '8005809779', clinicAddress: 'PACIFIC BEDLA' },

  // RAJSAMAND (EX)
  { srNo: 111, doctorName: 'SHRAVAN KUMAR MEENA', drCode: 'MBB26707', speciality: 'MBBS', qualification: 'MBBS', station: 'RAJASMAND', daType: 'L', dob: '', doa: '', mobile: '9982156850', clinicAddress: 'Pacific BEDLA' },

  // UDAIPUR (L)
  { srNo: 112, doctorName: 'DEEPAK GARG', drCode: 'A+26718', speciality: 'MBBS PHY', qualification: 'MBBS ,MD', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9509462746', clinicAddress: 'GBH HOSPITAL' },

  // RAJSAMAND (EX)
  { srNo: 113, doctorName: 'RAVI KUMAR  MANGLANI', drCode: 'B26719', speciality: 'MBBB MD', qualification: 'MBBS ,MD', station: 'RAJASMAND', daType: 'L', dob: '', doa: '', mobile: '8005676152', clinicAddress: 'gbh hospital' },

  // UDAIPUR (L)
  { srNo: 114, doctorName: 'NAMAN N TANEJA', drCode: 'MBA+31206', speciality: 'MBBS', qualification: 'MBBS DNB', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '0000000009', clinicAddress: 'gbh hospital' },
  { srNo: 115, doctorName: 'RAVIRAJ SINGH AHADA', drCode: 'A+31207', speciality: 'MBBS.DM', qualification: 'MBBS MD DM', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '+918769611', clinicAddress: 'gbh city' },
  { srNo: 116, doctorName: 'MAHESH DESAI', drCode: 'A+27106', speciality: 'DNB NEFRO', qualification: 'MBBS DNB', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9738930750', clinicAddress: 'gbh bedwas' },
  { srNo: 117, doctorName: 'PRIYANKA MINOCHA', drCode: 'A27107', speciality: 'MBBS,DNB,ECMO', qualification: 'MBBS', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '0000000009', clinicAddress: 'gbh hospital udaipur', activityType: 'WCFYH VTL' },
  { srNo: 118, doctorName: 'KB BADAULIA', drCode: 'MBA+27108', speciality: 'MBBS', qualification: 'MBBS DNB', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '0000000006', clinicAddress: 'udaipur' },

  // RAJSAMAND (EX)
  { srNo: 119, doctorName: 'YOGENDRA SINGH RANAWAT', drCode: 'A23394', speciality: 'MD CARDIO', qualification: 'DM CARDIO', station: 'RAJASMAND', daType: 'EX', dob: '', doa: '', mobile: '9929672209', clinicAddress: 'Ananta hospital' },

  // UDAIPUR (L)
  { srNo: 120, doctorName: 'MAHESH JAIN', drCode: 'A28665', speciality: 'CARDIO', qualification: 'Cardiologist', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9834665682', clinicAddress: 'pmch umarda', activityType: 'A2 GHEE' },
  { srNo: 121, doctorName: 'JITESH AGRAWAL', drCode: 'A+28783', speciality: 'MBBB MD', qualification: 'MBBS', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '0000000035', clinicAddress: 'gbh BEDWAS', activityType: 'VTL TABLE TOP' },

  // CHITTORGARH (EX)
  { srNo: 122, doctorName: 'ANURAG JAIN', drCode: 'A32362', speciality: 'CARDIO', qualification: 'DM (Cardio)', station: 'CHITTORGARH', daType: 'EX', dob: '02/07/2026', doa: '07/04/2008', mobile: '9829157069', clinicAddress: 'Sanwariya hospital' },

  // UDAIPUR (L)
  { srNo: 123, doctorName: 'ANIS JUKARWALA', drCode: 'MDA29084', speciality: 'MD', qualification: 'MBBS', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '0016615186', clinicAddress: 'bsbjejejj' },
  { srNo: 124, doctorName: 'ASHWINI SHANBHAG', drCode: 'A29167', speciality: 'MBBS MD', qualification: 'MBBS ,MD', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9916737495', clinicAddress: 'gbh bedwas' },
  { srNo: 125, doctorName: 'PARTH VYAS', drCode: 'A29168', speciality: 'MBBS MD', qualification: 'GP-MBBS', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9466488619', clinicAddress: 'gbh bedwas' },
  { srNo: 126, doctorName: 'GORANG UPADHYAY', drCode: 'A29171', speciality: 'MBBS MD', qualification: 'MBBS ,MD', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '8767554646', clinicAddress: 'gmch' },
  { srNo: 127, doctorName: 'G D GAMBHIR', drCode: 'A32316', speciality: 'MBBS MD', qualification: 'MBBS', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '0000000009', clinicAddress: 'gd' },

  // CHITTORGARH (EX)
  { srNo: 128, doctorName: 'JL PUNGALIA', drCode: 'B32349', speciality: 'MD.PHY', qualification: 'M.D', station: 'CHITTORGARH', daType: 'EX', dob: '', doa: '', mobile: '9694302883', clinicAddress: 'Chittorgarh' },

  // DUNGARPUR (EX)
  { srNo: 129, doctorName: 'Praveen jain', drCode: 'MBA23179', speciality: 'MBBS', qualification: 'GYN', station: 'DUNGARPUR', daType: 'EX', dob: '', doa: '', mobile: '0000009466', clinicAddress: 'disha hospital' },

  // UDAIPUR (L)
  { srNo: 130, doctorName: 'R N LADHA', drCode: 'A+20986', speciality: 'MS ORTHO', qualification: 'MS ORTHO', station: 'UDAIPUR', daType: 'L', dob: '', doa: '', mobile: '9999999988', clinicAddress: 'LADHA clinic' }
];

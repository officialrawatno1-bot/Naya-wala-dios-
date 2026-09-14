export interface MonthVisitCall {
  call: string;
  reminder: string;
}

export interface ConversionDoctorRow {
  id: string;
  sNo: number | string;
  beName: string;
  hq: string;
  drName: string;
  isNew?: boolean;
  july: MonthVisitCall;
  aug: MonthVisitCall;
  sept: MonthVisitCall;
  oct: MonthVisitCall;
  nov: MonthVisitCall;
}

export const INITIAL_CONVERSION_DRS_SEED: ConversionDoctorRow[] = [
  { id: "c1", sNo: 1, beName: "Ravi Kumar", hq: "Jaipur", drName: "Davender Shrimal", july: { call: "8,22,28", reminder: "" }, aug: { call: "4,8,13,20,22,27", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c2", sNo: 2, beName: "Ravi Kumar", hq: "Jaipur", drName: "Vipul Khandelwal", july: { call: "10,21,22", reminder: "" }, aug: { call: "11,13", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c3", sNo: 3, beName: "Ravi Kumar", hq: "Jaipur", drName: "Rahul Singhal", july: { call: "9", reminder: "" }, aug: { call: "20,27", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c4", sNo: 4, beName: "Ravi Kumar", hq: "Jaipur", drName: "Vijay Pathak", july: { call: "10,22,30", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c5", sNo: 5, beName: "Ravi Kumar", hq: "Jaipur", drName: "Manoj Lkhandelwal", july: { call: "9,23,30", reminder: "" }, aug: { call: "13,20,27", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c6", sNo: "", beName: "Ravi Kumar", hq: "Jaipur", drName: "Deepak Chand Gupta", july: { call: "14,17,18,21,29", reminder: "" }, aug: { call: "4,12,13", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  { id: "c7", sNo: 6, beName: "Deepak Sharma", hq: "Jaipur", drName: "Sanjay Sharma", july: { call: "2,16,21,31", reminder: "" }, aug: { call: "11,18,25,29", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c8", sNo: 7, beName: "Deepak Sharma", hq: "Jaipur", drName: "Ashok Garg", july: { call: "13,31", reminder: "" }, aug: { call: "10,26", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c9", sNo: 8, beName: "Deepak Sharma", hq: "Jaipur", drName: "G l Dhayal", july: { call: "10,31", reminder: "" }, aug: { call: "5,11,19", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c10", sNo: 9, beName: "Deepak Sharma", hq: "Jaipur", drName: "Rohit Chopra", july: { call: "3,7,11,17", reminder: "" }, aug: { call: "6,13,22", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c11", sNo: 10, beName: "Deepak Sharma", hq: "Jaipur", drName: "Kapil Manodia", july: { call: "6,21,31", reminder: "" }, aug: { call: "12", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  { id: "c12", sNo: 11, beName: "Subhash Gurjar", hq: "Jaipur", drName: "GL Sharma", july: { call: "2,13,20,31", reminder: "" }, aug: { call: "10,20,26", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c13", sNo: 12, beName: "Subhash Gurjar", hq: "Jaipur", drName: "Hema Singh", july: { call: "2,10,23,30", reminder: "" }, aug: { call: "10,27", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c14", sNo: 13, beName: "Subhash Gurjar", hq: "Jaipur", drName: "Amit Bhushan", july: { call: "13,27,31", reminder: "" }, aug: { call: "11,29", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c15", sNo: 14, beName: "Subhash Gurjar", hq: "Jaipur", drName: "Sunil Beniwal", july: { call: "14,20,28", reminder: "" }, aug: { call: "6,11,22", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c16", sNo: 15, beName: "Subhash Gurjar", hq: "Jaipur", drName: "Anamika Gora", july: { call: "3,10,30", reminder: "" }, aug: { call: "6,12,24", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  { id: "c17", sNo: 16, beName: "Saurabh Choudhary", hq: "Ajmer", drName: "Pramod Parik", july: { call: "3,9,19,27", reminder: "" }, aug: { call: "8,10,17,31", reminder: "" }, sept: { call: "", reminder: "2" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c18", sNo: 17, beName: "Saurabh Choudhary", hq: "Ajmer", drName: "Mayank Srivastav", july: { call: "3,9,16,23,27", reminder: "" }, aug: { call: "3,10,19,26", reminder: "" }, sept: { call: "", reminder: "3" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c19", sNo: 18, beName: "Saurabh Choudhary", hq: "Ajmer", drName: "Anand Agrawal", july: { call: "3,10,17,24", reminder: "" }, aug: { call: "5,19,26", reminder: "" }, sept: { call: "2,9", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c20", sNo: 19, beName: "Saurabh Choudhary", hq: "Ajmer", drName: "Sunil Gothwal", july: { call: "4,9,16,19,26", reminder: "" }, aug: { call: "4,11,31", reminder: "" }, sept: { call: "3,9", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c21", sNo: 20, beName: "Saurabh Choudhary", hq: "Ajmer", drName: "Ankur Mathur", july: { call: "2,9,16,23,30", reminder: "" }, aug: { call: "4,11,18,20,25", reminder: "" }, sept: { call: "", reminder: "8" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  { id: "c22", sNo: 21, beName: "Pushpendra Singh", hq: "Kota", drName: "Bhupendra Bathla", july: { call: "", reminder: "" }, aug: { call: "3,18", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c23", sNo: 22, beName: "Pushpendra Singh", hq: "Kota", drName: "MS Suri", july: { call: "", reminder: "" }, aug: { call: "4", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c24", sNo: 23, beName: "Pushpendra Singh", hq: "Kota", drName: "Parth Jethwani", july: { call: "", reminder: "" }, aug: { call: "4", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c25", sNo: 24, beName: "Pushpendra Singh", hq: "Kota", drName: "Vineet Chawla", july: { call: "", reminder: "" }, aug: { call: "17", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c26", sNo: 25, beName: "Pushpendra Singh", hq: "Kota", drName: "Pawan Singhal", july: { call: "", reminder: "" }, aug: { call: "1,10", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  // 🌟 UDAIPUR (BANWARI MEENA) - 6 PRIMARY CONVERSION DOCTORS
  { id: "c27", sNo: 26, beName: "Banwari Meena", hq: "Udaipur", drName: "Dilip Jain", july: { call: "6,8,17,23,24", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c28", sNo: 27, beName: "Banwari Meena", hq: "Udaipur", drName: "Deepak Ameta", july: { call: "16,22", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c29", sNo: 28, beName: "Banwari Meena", hq: "Udaipur", drName: "SK Kaushiq", july: { call: "", reminder: "8" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c30", sNo: 29, beName: "Banwari Meena", hq: "Udaipur", drName: "Rahul Sehlot", july: { call: "9,16,17", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c31", sNo: 30, beName: "Banwari Meena", hq: "Udaipur", drName: "Anis Jukarwal", july: { call: "1,16,22", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c32", sNo: "", beName: "Banwari Meena", hq: "Udaipur", drName: "Sanjay Gandhi", july: { call: "", reminder: "9" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  { id: "c33", sNo: 31, beName: "Dunger Ram", hq: "Jodhpur", drName: "ARVIND KALLA", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c34", sNo: 32, beName: "Dunger Ram", hq: "Jodhpur", drName: "MAYANK JAIN", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c35", sNo: 33, beName: "Dunger Ram", hq: "Jodhpur", drName: "ANIL BERUPAL", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c36", sNo: 34, beName: "Dunger Ram", hq: "Jodhpur", drName: "LALIT MOHAN RATHI", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c37", sNo: 35, beName: "Dunger Ram", hq: "Jodhpur", drName: "AJEETH KOTHARI", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  { id: "c38", sNo: 36, beName: "Jayesh Prajapat", hq: "Jodhpur", drName: "KUSHALA RAM CHOUDHARY", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c39", sNo: 37, beName: "Jayesh Prajapat", hq: "Jodhpur", drName: "DEVRAM BARAD", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c40", sNo: 38, beName: "Jayesh Prajapat", hq: "Jodhpur", drName: "BHARAT RATHI", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c41", sNo: 39, beName: "Jayesh Prajapat", hq: "Jodhpur", drName: "SANJEEV SANGHVI", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c42", sNo: 40, beName: "Jayesh Prajapat", hq: "Jodhpur", drName: "J S SHEKAWAT", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  { id: "c43", sNo: 41, beName: "Manish Upadhaya", hq: "Bikaner", drName: "V B SINGH", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c44", sNo: 42, beName: "Manish Upadhaya", hq: "Bikaner", drName: "KANU PRIYA AGARWAL", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c45", sNo: 43, beName: "Manish Upadhaya", hq: "Bikaner", drName: "RAHUL VYAS", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c46", sNo: 44, beName: "Manish Upadhaya", hq: "Bikaner", drName: "J K SUTHAR", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c47", sNo: 45, beName: "Manish Upadhaya", hq: "Bikaner", drName: "HARISH ARYA", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  { id: "c48", sNo: 46, beName: "PANKAJ MEWADA", hq: "Indore", drName: "PRAFUL DUBEY", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c49", sNo: 47, beName: "PANKAJ MEWADA", hq: "Indore", drName: "HUSSAIN RATLAM WALA", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },

  { id: "c50", sNo: 56, beName: "AMAN TIWARI", hq: "Bhopal", drName: "BRIJESH SHRIVASTAVA", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c51", sNo: 57, beName: "AMAN TIWARI", hq: "Bhopal", drName: "PRASHANT SHRIVASTAVA", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c52", sNo: 58, beName: "AMAN TIWARI", hq: "Bhopal", drName: "PRAVJ HSHMI", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c53", sNo: 59, beName: "AMAN TIWARI", hq: "Bhopal", drName: "VIKRANT SHRIVASTAVA", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } },
  { id: "c54", sNo: 60, beName: "AMAN TIWARI", hq: "Bhopal", drName: "ABHISHAK MISHRA", july: { call: "", reminder: "" }, aug: { call: "", reminder: "" }, sept: { call: "", reminder: "" }, oct: { call: "", reminder: "" }, nov: { call: "", reminder: "" } }
];

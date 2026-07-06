/**
 * MSME Financial Health Card — Synthetic Data Layer
 *
 * Data is synthetically generated to simulate realistic alternate-data signals.
 * Sources: GST filings, UPI collections, Account Aggregator (AA) bank data,
 * EPFO contributions, and electricity/utility consumption.
 *
 * Risk profiles: 2 strong, 2 weak, 2–3 mixed-signal, 1 fraud-flag
 *
 * NOTE: This data is for prototype/demo purposes only.
 * Production integration requires GSP/AA-FIU partnerships and DPDP/RBI compliance.
 */

export const MSME_DATA = [
  // ─────────────────────────────────────────────────────────────────────────
  // STRONG PROFILE 1 — Textile Trader, Surat
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "MSME-001",
    name: "Riya Fabrics Pvt. Ltd.",
    owner: "Riya Mehta",
    sector: "Textile & Apparel",
    location: "Surat, Gujarat",
    udyam: "UDYAM-GJ-01-0012345",
    loanAmountRequested: 2500000,
    loanPurpose: "Working Capital",
    vintage: "6 years",
    employees: 42,
    riskProfile: "strong",

    gst: {
      monthlyTurnover: [820000, 910000, 880000, 950000, 1020000, 970000,
                        930000, 1100000, 1050000, 1010000, 980000, 1150000],
      filingDelays: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0],  // months with delay
      gstCompliance: 0.92,      // fraction of returns filed on time
      eBillsRaised: 156,        // e-invoices over 12m
      totalGSTTurnover: 11770000,
    },

    upi: {
      monthlyInflow: [760000, 840000, 810000, 880000, 940000, 900000,
                      860000, 1020000, 980000, 950000, 910000, 1080000],
      payerConcentration: 0.18,  // top payer share (low = diversified = good)
      avgTransactionSize: 18500,
      uniquePayersLast6M: 98,
      bouncedPayments: 2,
    },

    aaBankData: {
      monthlyInflow:  [780000, 860000, 830000, 900000, 960000, 920000,
                       880000, 1040000, 1000000, 970000, 930000, 1100000],
      monthlyOutflow: [620000, 680000, 660000, 720000, 760000, 730000,
                       700000, 830000, 800000, 770000, 740000, 875000],
      avgBalance: 485000,
      minBalance: 180000,
      lowBalanceMonths: 0,    // months where balance < 10% of avg
      bounceIncidents: 1,
      od_cc_utilized: 0.35,
    },

    epfo: {
      monthlyContributions: [38000, 38000, 40000, 40000, 42000, 42000,
                             42000, 44000, 44000, 44000, 46000, 46000],
      employeeCountTrend: [36, 37, 38, 39, 40, 40, 41, 41, 42, 42, 42, 42],
      filingRegularity: 1.0,   // 1.0 = always on time
      missingMonths: 0,
    },

    utility: {
      monthlyUnits: [4200, 4400, 4300, 4600, 4800, 4500,
                     4400, 5200, 5000, 4900, 4700, 5500],
      paymentRegularity: 1.0,
      disconnectionEvents: 0,
      avgMonthlyBill: 38000,
    },

    bureau: {
      available: false,
      score: null,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // STRONG PROFILE 2 — Software Services, Pune
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "MSME-002",
    name: "TechNova Solutions LLP",
    owner: "Arjun Patel",
    sector: "IT & Software Services",
    location: "Pune, Maharashtra",
    udyam: "UDYAM-MH-02-0098765",
    loanAmountRequested: 1800000,
    loanPurpose: "Equipment Purchase",
    vintage: "4 years",
    employees: 28,
    riskProfile: "strong",

    gst: {
      monthlyTurnover: [650000, 680000, 670000, 700000, 720000, 710000,
                        730000, 760000, 750000, 780000, 800000, 820000],
      filingDelays: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      gstCompliance: 1.0,
      eBillsRaised: 84,
      totalGSTTurnover: 8770000,
    },

    upi: {
      monthlyInflow: [600000, 625000, 615000, 640000, 660000, 650000,
                      670000, 700000, 690000, 720000, 740000, 760000],
      payerConcentration: 0.28,
      avgTransactionSize: 42000,
      uniquePayersLast6M: 34,
      bouncedPayments: 0,
    },

    aaBankData: {
      monthlyInflow:  [640000, 665000, 655000, 680000, 705000, 695000,
                       715000, 745000, 735000, 765000, 785000, 805000],
      monthlyOutflow: [480000, 500000, 490000, 510000, 530000, 520000,
                       535000, 555000, 550000, 570000, 590000, 605000],
      avgBalance: 620000,
      minBalance: 320000,
      lowBalanceMonths: 0,
      bounceIncidents: 0,
      od_cc_utilized: 0.20,
    },

    epfo: {
      monthlyContributions: [25000, 25000, 26000, 26000, 27000, 27000,
                             28000, 28000, 28000, 29000, 29000, 30000],
      employeeCountTrend: [24, 25, 25, 26, 26, 27, 27, 27, 28, 28, 28, 28],
      filingRegularity: 1.0,
      missingMonths: 0,
    },

    utility: {
      monthlyUnits: [2800, 2900, 2850, 3000, 3100, 2950,
                     2900, 3200, 3100, 3050, 3000, 3300],
      paymentRegularity: 1.0,
      disconnectionEvents: 0,
      avgMonthlyBill: 24000,
    },

    bureau: {
      available: true,
      score: 762,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAK PROFILE 1 — Auto Parts Dealer, Kanpur (distressed)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "MSME-003",
    name: "Kumar Auto Parts",
    owner: "Suresh Kumar",
    sector: "Auto Components & Trade",
    location: "Kanpur, Uttar Pradesh",
    udyam: "UDYAM-UP-05-0034567",
    loanAmountRequested: 1200000,
    loanPurpose: "Inventory Restocking",
    vintage: "3 years",
    employees: 9,
    riskProfile: "weak",

    gst: {
      monthlyTurnover: [280000, 310000, 240000, 190000, 260000, 200000,
                        170000, 220000, 180000, 150000, 200000, 160000],
      filingDelays: [1, 0, 2, 1, 0, 2, 1, 1, 2, 3, 1, 2],
      gstCompliance: 0.42,
      eBillsRaised: 28,
      totalGSTTurnover: 2560000,
    },

    upi: {
      monthlyInflow: [240000, 270000, 210000, 160000, 230000, 170000,
                      150000, 190000, 160000, 130000, 175000, 140000],
      payerConcentration: 0.62,   // very concentrated — 1 buyer dominates
      avgTransactionSize: 9200,
      uniquePayersLast6M: 8,
      bouncedPayments: 14,
    },

    aaBankData: {
      monthlyInflow:  [250000, 280000, 220000, 170000, 240000, 180000,
                       160000, 200000, 170000, 140000, 185000, 150000],
      monthlyOutflow: [245000, 290000, 230000, 185000, 260000, 200000,
                       175000, 220000, 190000, 160000, 210000, 175000],
      avgBalance: 28000,
      minBalance: 3000,
      lowBalanceMonths: 7,
      bounceIncidents: 11,
      od_cc_utilized: 0.92,
    },

    epfo: {
      monthlyContributions: [8000, 8000, 6000, 0, 6000, 0,
                             6000, 5000, 0, 0, 4000, 0],
      employeeCountTrend: [12, 12, 10, 9, 9, 8, 8, 9, 9, 8, 9, 9],
      filingRegularity: 0.50,
      missingMonths: 4,
    },

    utility: {
      monthlyUnits: [1200, 1100, 900, 700, 950, 750,
                     650, 800, 700, 600, 750, 620],
      paymentRegularity: 0.58,
      disconnectionEvents: 2,
      avgMonthlyBill: 9000,
    },

    bureau: {
      available: false,
      score: null,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // WEAK PROFILE 2 — Food Processing Unit, Bhopal (declining revenue)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "MSME-004",
    name: "Madhya Foods Processing",
    owner: "Geeta Sharma",
    sector: "Food Processing",
    location: "Bhopal, Madhya Pradesh",
    udyam: "UDYAM-MP-04-0056789",
    loanAmountRequested: 800000,
    loanPurpose: "Machinery Repair",
    vintage: "2 years",
    employees: 14,
    riskProfile: "weak",

    gst: {
      monthlyTurnover: [420000, 390000, 350000, 310000, 280000, 250000,
                        230000, 210000, 195000, 180000, 170000, 160000],
      filingDelays: [0, 1, 1, 2, 1, 2, 2, 3, 2, 4, 3, 3],
      gstCompliance: 0.35,
      eBillsRaised: 31,
      totalGSTTurnover: 2945000,
    },

    upi: {
      monthlyInflow: [380000, 350000, 310000, 280000, 250000, 220000,
                      200000, 185000, 170000, 160000, 150000, 145000],
      payerConcentration: 0.48,
      avgTransactionSize: 7800,
      uniquePayersLast6M: 15,
      bouncedPayments: 9,
    },

    aaBankData: {
      monthlyInflow:  [400000, 370000, 330000, 295000, 265000, 235000,
                       215000, 200000, 185000, 172000, 162000, 155000],
      monthlyOutflow: [395000, 380000, 345000, 320000, 295000, 275000,
                       260000, 250000, 240000, 235000, 228000, 220000],
      avgBalance: 18000,
      minBalance: 2000,
      lowBalanceMonths: 8,
      bounceIncidents: 13,
      od_cc_utilized: 0.97,
    },

    epfo: {
      monthlyContributions: [12000, 11000, 10000, 9000, 8000, 7000,
                             6000, 5000, 4000, 3000, 0, 0],
      employeeCountTrend: [18, 17, 16, 16, 15, 14, 14, 14, 14, 13, 12, 14],
      filingRegularity: 0.58,
      missingMonths: 2,
    },

    utility: {
      monthlyUnits: [3800, 3500, 3100, 2800, 2500, 2200,
                     1900, 1700, 1500, 1400, 1300, 1250],
      paymentRegularity: 0.67,
      disconnectionEvents: 1,
      avgMonthlyBill: 26000,
    },

    bureau: {
      available: false,
      score: null,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MIXED SIGNAL 1 — Agri-input Supplier, Nashik (seasonal, good compliance)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "MSME-005",
    name: "GreenField Agri Inputs",
    owner: "Pratap Desai",
    sector: "Agriculture & Inputs",
    location: "Nashik, Maharashtra",
    udyam: "UDYAM-MH-08-0023456",
    loanAmountRequested: 3000000,
    loanPurpose: "Pre-Season Inventory",
    vintage: "8 years",
    employees: 19,
    riskProfile: "mixed",

    gst: {
      monthlyTurnover: [180000, 160000, 920000, 1400000, 1650000, 1200000,
                        380000, 140000, 120000, 150000, 300000, 820000],
      filingDelays: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      gstCompliance: 1.0,
      eBillsRaised: 102,
      totalGSTTurnover: 7420000,
    },

    upi: {
      monthlyInflow: [160000, 140000, 840000, 1260000, 1500000, 1080000,
                      350000, 120000, 105000, 135000, 270000, 740000],
      payerConcentration: 0.24,
      avgTransactionSize: 28000,
      uniquePayersLast6M: 62,
      bouncedPayments: 1,
    },

    aaBankData: {
      monthlyInflow:  [170000, 150000, 870000, 1300000, 1560000, 1120000,
                       360000, 130000, 115000, 145000, 280000, 765000],
      monthlyOutflow: [155000, 145000, 780000, 1180000, 1400000, 980000,
                       340000, 180000, 160000, 170000, 280000, 720000],
      avgBalance: 290000,
      minBalance: 35000,    // very low in off-season
      lowBalanceMonths: 3,
      bounceIncidents: 2,
      od_cc_utilized: 0.60,
    },

    epfo: {
      monthlyContributions: [16000, 16000, 19000, 22000, 24000, 22000,
                             18000, 16000, 16000, 16000, 17000, 20000],
      employeeCountTrend: [16, 16, 19, 22, 24, 22, 18, 16, 16, 16, 17, 19],
      filingRegularity: 0.92,
      missingMonths: 0,
    },

    utility: {
      monthlyUnits: [800, 750, 2200, 3400, 4000, 3000,
                     1200, 700, 650, 750, 1100, 2400],
      paymentRegularity: 1.0,
      disconnectionEvents: 0,
      avgMonthlyBill: 18000,
    },

    bureau: {
      available: false,
      score: null,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MIXED SIGNAL 2 — Printing & Packaging, Ahmedabad (growing but stretched)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "MSME-006",
    name: "PrintPro Packaging",
    owner: "Nilesh Shah",
    sector: "Printing & Packaging",
    location: "Ahmedabad, Gujarat",
    udyam: "UDYAM-GJ-03-0067890",
    loanAmountRequested: 4000000,
    loanPurpose: "Capacity Expansion",
    vintage: "5 years",
    employees: 31,
    riskProfile: "mixed",

    gst: {
      monthlyTurnover: [480000, 510000, 540000, 590000, 630000, 670000,
                        720000, 760000, 800000, 840000, 880000, 940000],
      filingDelays: [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 1],
      gstCompliance: 0.75,
      eBillsRaised: 118,
      totalGSTTurnover: 8360000,
    },

    upi: {
      monthlyInflow: [440000, 465000, 490000, 540000, 580000, 620000,
                      665000, 700000, 740000, 780000, 820000, 875000],
      payerConcentration: 0.35,
      avgTransactionSize: 21000,
      uniquePayersLast6M: 54,
      bouncedPayments: 3,
    },

    aaBankData: {
      monthlyInflow:  [465000, 490000, 520000, 570000, 610000, 650000,
                       700000, 735000, 775000, 815000, 860000, 920000],
      monthlyOutflow: [460000, 495000, 530000, 580000, 625000, 665000,
                       720000, 760000, 800000, 840000, 885000, 945000],
      avgBalance: 95000,    // thin — growing faster than cash reserves
      minBalance: 18000,
      lowBalanceMonths: 4,
      bounceIncidents: 4,
      od_cc_utilized: 0.75,
    },

    epfo: {
      monthlyContributions: [26000, 27000, 28000, 30000, 31000, 33000,
                             35000, 36000, 37000, 38000, 39000, 41000],
      employeeCountTrend: [24, 25, 26, 27, 28, 29, 30, 30, 31, 31, 31, 31],
      filingRegularity: 0.92,
      missingMonths: 0,
    },

    utility: {
      monthlyUnits: [3400, 3600, 3800, 4100, 4400, 4700,
                     5000, 5300, 5600, 5800, 6100, 6500],
      paymentRegularity: 0.92,
      disconnectionEvents: 0,
      avgMonthlyBill: 42000,
    },

    bureau: {
      available: true,
      score: 620,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // MIXED SIGNAL 3 — Construction Contractor, Hyderabad (project-based)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "MSME-007",
    name: "Srinivas Infra Works",
    owner: "V. Srinivas",
    sector: "Construction & Infra",
    location: "Hyderabad, Telangana",
    udyam: "UDYAM-TS-06-0089012",
    loanAmountRequested: 5000000,
    loanPurpose: "Equipment Hire & Materials",
    vintage: "7 years",
    employees: 38,
    riskProfile: "mixed",

    gst: {
      monthlyTurnover: [0, 0, 1200000, 1800000, 2400000, 2200000,
                        1600000, 0, 0, 0, 1400000, 2000000],
      filingDelays: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      gstCompliance: 0.92,
      eBillsRaised: 47,
      totalGSTTurnover: 12600000,
    },

    upi: {
      monthlyInflow: [0, 0, 1100000, 1650000, 2200000, 2000000,
                      1500000, 0, 0, 0, 1280000, 1840000],
      payerConcentration: 0.55,   // 2 large project clients
      avgTransactionSize: 185000,
      uniquePayersLast6M: 6,
      bouncedPayments: 0,
    },

    aaBankData: {
      monthlyInflow:  [100000, 80000, 1200000, 1750000, 2300000, 2100000,
                       1550000, 200000, 150000, 120000, 1320000, 1900000],
      monthlyOutflow: [280000, 260000, 1400000, 1900000, 2500000, 2300000,
                       1700000, 350000, 280000, 260000, 1450000, 2100000],
      avgBalance: 380000,
      minBalance: 42000,
      lowBalanceMonths: 3,
      bounceIncidents: 0,
      od_cc_utilized: 0.45,
    },

    epfo: {
      monthlyContributions: [22000, 22000, 36000, 46000, 56000, 52000,
                             42000, 24000, 22000, 22000, 38000, 48000],
      employeeCountTrend: [20, 20, 30, 38, 46, 44, 36, 22, 20, 20, 32, 40],
      filingRegularity: 0.92,
      missingMonths: 0,
    },

    utility: {
      monthlyUnits: [400, 400, 2800, 4200, 5600, 5100,
                     3800, 500, 400, 400, 3200, 4600],
      paymentRegularity: 1.0,
      disconnectionEvents: 0,
      avgMonthlyBill: 32000,
    },

    bureau: {
      available: false,
      score: null,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // FRAUD FLAG — Medical Supplies, Delhi (declared vs. actual divergence)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "MSME-008",
    name: "MediQuick Distributors",
    owner: "Rakesh Gupta",
    sector: "Medical & Healthcare Supplies",
    location: "New Delhi",
    udyam: "UDYAM-DL-01-0045678",
    loanAmountRequested: 8000000,
    loanPurpose: "Expansion",
    vintage: "2 years",
    employees: 22,
    riskProfile: "fraud-flag",

    gst: {
      // Declared GST turnover is ~3x bank/UPI actuals — inconsistency flag
      monthlyTurnover: [1200000, 1350000, 1400000, 1500000, 1550000, 1600000,
                        1650000, 1700000, 1750000, 1800000, 1850000, 1900000],
      filingDelays: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      gstCompliance: 1.0,
      eBillsRaised: 92,
      totalGSTTurnover: 18250000,
    },

    upi: {
      // UPI inflows much lower than GST declared — red flag
      monthlyInflow: [380000, 410000, 420000, 445000, 460000, 475000,
                      490000, 510000, 525000, 540000, 558000, 575000],
      payerConcentration: 0.78,
      avgTransactionSize: 32000,
      uniquePayersLast6M: 12,
      bouncedPayments: 1,
    },

    aaBankData: {
      // Bank inflows also far lower than GST declared
      monthlyInflow:  [420000, 450000, 465000, 490000, 505000, 520000,
                       540000, 560000, 575000, 595000, 615000, 635000],
      monthlyOutflow: [390000, 415000, 430000, 455000, 470000, 485000,
                       505000, 525000, 540000, 560000, 580000, 600000],
      avgBalance: 180000,
      minBalance: 65000,
      lowBalanceMonths: 0,
      bounceIncidents: 0,
      od_cc_utilized: 0.15,
    },

    epfo: {
      monthlyContributions: [18000, 18000, 18000, 18000, 18000, 18000,
                             18000, 18000, 18000, 18000, 18000, 18000],
      employeeCountTrend: [22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22],
      filingRegularity: 1.0,
      missingMonths: 0,
    },

    utility: {
      monthlyUnits: [1800, 1820, 1810, 1800, 1815, 1820,
                     1810, 1825, 1815, 1820, 1810, 1805],
      paymentRegularity: 1.0,
      disconnectionEvents: 0,
      avgMonthlyBill: 14000,
    },

    bureau: {
      available: false,
      score: null,
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NEW-TO-CREDIT — Handicraft Exporter, Jaipur (strong ops, no credit history)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "MSME-009",
    name: "Jaipur Craft Collective",
    owner: "Meera Agarwal",
    sector: "Handicrafts & Exports",
    location: "Jaipur, Rajasthan",
    udyam: "UDYAM-RJ-07-0078901",
    loanAmountRequested: 1500000,
    loanPurpose: "Export Order Financing",
    vintage: "3 years",
    employees: 16,
    riskProfile: "ntc-strong",

    gst: {
      monthlyTurnover: [340000, 360000, 380000, 410000, 440000, 460000,
                        490000, 520000, 550000, 580000, 610000, 640000],
      filingDelays: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      gstCompliance: 0.92,
      eBillsRaised: 68,
      totalGSTTurnover: 5780000,
    },

    upi: {
      monthlyInflow: [310000, 330000, 350000, 378000, 404000, 424000,
                      452000, 480000, 506000, 535000, 563000, 590000],
      payerConcentration: 0.31,
      avgTransactionSize: 28500,
      uniquePayersLast6M: 42,
      bouncedPayments: 0,
    },

    aaBankData: {
      monthlyInflow:  [325000, 345000, 366000, 395000, 423000, 443000,
                       472000, 502000, 530000, 560000, 590000, 620000],
      monthlyOutflow: [290000, 308000, 326000, 352000, 377000, 395000,
                       421000, 448000, 473000, 500000, 527000, 554000],
      avgBalance: 168000,
      minBalance: 82000,
      lowBalanceMonths: 0,
      bounceIncidents: 0,
      od_cc_utilized: 0.0,
    },

    epfo: {
      monthlyContributions: [13000, 13000, 14000, 14000, 15000, 15000,
                             16000, 16000, 16000, 17000, 17000, 18000],
      employeeCountTrend: [13, 13, 14, 14, 15, 15, 16, 16, 16, 16, 16, 16],
      filingRegularity: 1.0,
      missingMonths: 0,
    },

    utility: {
      monthlyUnits: [1400, 1450, 1520, 1600, 1680, 1740,
                     1820, 1910, 1980, 2060, 2140, 2220],
      paymentRegularity: 1.0,
      disconnectionEvents: 0,
      avgMonthlyBill: 13500,
    },

    bureau: {
      available: false,
      score: null,
    },
  },
];

export default MSME_DATA;

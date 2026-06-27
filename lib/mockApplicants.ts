export const MOCK_APPLICANTS = [
  {
    id: "cmppsrrk1000q11dnt6rlhfyd",
    name: "Morgan Lee",
    phone: "202-555-0134",
    email: "morganlee.drive@gmail.com",
    status: "REJECTED",
    source: "TEXT",
    availability: JSON.stringify({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }),
    createdAt: "2026-05-28T17:59:07.586Z",
    updatedAt: "2026-05-28T17:59:07.586Z",
    notes: [
      { id: "cmppsrrk1000r11dnzqcs5ohm", content: "Text inquiry: \"Need a job. Don't have a car though, can I walk or bike?\"", createdAt: "2026-05-28T17:59:07.586Z" },
      { id: "cmppsrrk1000s11dnylbnoio2", content: "Replied that a reliable personal vehicle is required for our delivery platform. Morgan confirmed they do not have a license or car. Marked as Rejected.", createdAt: "2026-05-28T17:59:07.586Z" }
    ],
    documents: [
      { id: "cmppsrrk1000t11dnzbdrtpkn", name: "Onboarding Material", status: "NOT_SENT", sentAt: null, signedAt: null, fileUrl: null, esignData: null },
      { id: "cmppsrrk1000u11dnbqzkp8lk", name: "W-9 Form", status: "NOT_SENT", sentAt: null, signedAt: null, fileUrl: null, esignData: null },
      { id: "cmppsrrk1000v11dnwvq3buso", name: "Driver Contract", status: "NOT_SENT", sentAt: null, signedAt: null, fileUrl: null, esignData: null }
    ]
  },
  {
    id: "cmppsrrjy000i11dnzsxpe2bc",
    name: "Casey Johnson",
    phone: "443-555-0111",
    email: "casey.johnson.dispatch@gmail.com",
    status: "ACTIVE",
    source: "EMAIL",
    availability: JSON.stringify({ monday: ["morning", "afternoon", "evening"], tuesday: ["morning", "afternoon", "evening"], wednesday: ["morning", "afternoon", "evening"], thursday: ["morning", "afternoon", "evening"], friday: ["morning", "afternoon", "evening"], saturday: [], sunday: [] }),
    createdAt: "2026-05-28T17:59:07.583Z",
    updatedAt: "2026-05-28T17:59:07.583Z",
    notes: [
      { id: "cmppsrrjy000j11dnycao3866", content: "Applied via Libertydispatch.com email query.", createdAt: "2026-05-28T17:59:07.583Z" },
      { id: "cmppsrrjz000k11dnuvffgwib", content: "Sent onboarding documents.", createdAt: "2026-05-28T17:59:07.583Z" },
      { id: "cmppsrrjz000l11dn9a0nbn5x", content: "Completed W-9, signed contract, and confirmed full availability.", createdAt: "2026-05-28T17:59:07.583Z" },
      { id: "cmppsrrjz000m11dnneq1xfx7", content: "Completed background check. Onboarded and active. Ready for shifts!", createdAt: "2026-05-28T17:59:07.583Z" }
    ],
    documents: [
      { id: "cmppsrrjz000n11dnkmfyw1zu", name: "Onboarding Material", status: "SIGNED", sentAt: "2026-05-25T17:59:07.582Z", signedAt: "2026-05-26T17:59:07.582Z", fileUrl: "#", esignData: JSON.stringify({ vehicleType: "Cargo Van", coverageArea: "Downtown Baltimore", desiredDistance: "10 miles", chargingStationsHelp: "Yes", chargingStationsWorth: "$10/day", shiftPreference: "Any Time", payoutMethod: "Zelle", payoutDetails: "casey.johnson.dispatch@gmail.com", dailyPayoutsOk: "Yes", currentApps: "Amazon Flex, DoorDash", experience: "2 years delivering with Flex." }) },
      { id: "cmppsrrjz000o11dn11u2h3ij", name: "W-9 Form", status: "SIGNED", sentAt: "2026-05-25T17:59:07.582Z", signedAt: "2026-05-26T17:59:07.582Z", fileUrl: "#", esignData: JSON.stringify({ ssn: "***-**-1234", address: "123 Main St, Baltimore MD 21201", classification: "Individual" }) },
      { id: "cmppsrrjz000p11dnbueb87hk", name: "Driver Contract", status: "SIGNED", sentAt: "2026-05-25T17:59:07.582Z", signedAt: "2026-05-26T17:59:07.582Z", fileUrl: "#", esignData: JSON.stringify({ signature: "Casey Johnson", ipAddress: "192.168.1.50" }) }
    ]
  },
  {
    id: "cmppsrrjv000b11dnp34twga8",
    name: "Taylor Smith",
    phone: "410-555-0187",
    email: "taylorsmith.delivery@gmail.com",
    status: "ONBOARDING",
    source: "EMAIL",
    availability: JSON.stringify({ monday: ["afternoon", "evening"], tuesday: ["afternoon", "evening"], wednesday: ["afternoon", "evening"], thursday: ["afternoon", "evening"], friday: ["afternoon", "evening"], saturday: [], sunday: [] }),
    createdAt: "2026-05-28T17:59:07.580Z",
    updatedAt: "2026-05-28T17:59:07.580Z",
    notes: [
      { id: "cmppsrrjv000c11dnyqqpq0kv", content: "Emailed resume. Has 2 years experience with DoorDash and UberEats.", createdAt: "2026-05-28T17:59:07.580Z" },
      { id: "cmppsrrjv000d11dn4ymed6vt", content: "Screened Taylor via call. Confirmed they have a clean driving record and reliable vehicle.", createdAt: "2026-05-28T17:59:07.580Z" },
      { id: "cmppsrrjw000e11dni446osqd", content: "Sent e-sign onboarding link for Driver Contract and W-9.", createdAt: "2026-05-28T17:59:07.580Z" }
    ],
    documents: [
      { id: "cmppsrrjw000f11dnrgqdxt57", name: "Onboarding Material", status: "SENT", sentAt: "2026-05-27T17:59:07.568Z", signedAt: null, fileUrl: null, esignData: null },
      { id: "cmppsrrjw000g11dnmgegtspm", name: "W-9 Form", status: "SENT", sentAt: "2026-05-27T17:59:07.569Z", signedAt: null, fileUrl: null, esignData: null },
      { id: "cmppsrrjw000h11dnz3pv4qzn", name: "Driver Contract", status: "SENT", sentAt: "2026-05-27T17:59:07.569Z", signedAt: null, fileUrl: null, esignData: null }
    ]
  },
  {
    id: "cmppsrrji000511dnv2pasolr",
    name: "Jordan Vance",
    phone: "301-555-0142",
    email: "jordan.vance@yahoo.com",
    status: "CONTACTED",
    source: "CALL",
    availability: JSON.stringify({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: ["evening"], saturday: ["morning", "afternoon", "evening"], sunday: ["morning", "afternoon", "evening"] }),
    createdAt: "2026-05-28T17:59:07.566Z",
    updatedAt: "2026-05-28T17:59:07.566Z",
    notes: [
      { id: "cmppsrrji000611dnx23swpvh", content: "Called the Workspace line. Interested in weekend shifts only. Left voicemail.", createdAt: "2026-05-28T17:59:07.566Z" },
      { id: "cmppsrrji000711dn4xz1d2ht", content: "Called back: Spoke to Jordan. He is a college student looking for part-time. Sounds very polite and reliable. Marked as Contacted, preparing to send contract.", createdAt: "2026-05-28T17:59:07.566Z" }
    ],
    documents: [
      { id: "cmppsrrji000811dns5ftj3ss", name: "Onboarding Material", status: "NOT_SENT", sentAt: null, signedAt: null, fileUrl: null, esignData: null },
      { id: "cmppsrrji000911dnfb3o6xda", name: "W-9 Form", status: "NOT_SENT", sentAt: null, signedAt: null, fileUrl: null, esignData: null },
      { id: "cmppsrrji000a11dne0p4ldun", name: "Driver Contract", status: "NOT_SENT", sentAt: null, signedAt: null, fileUrl: null, esignData: null }
    ]
  },
  {
    id: "cmppsrrjd000011dnn2wz5k1r",
    name: "Alex Rivera",
    phone: "240-555-0199",
    email: "alex.rivera92@gmail.com",
    status: "NEW",
    source: "TEXT",
    availability: JSON.stringify({ monday: ["morning", "afternoon"], tuesday: ["morning", "afternoon"], wednesday: ["morning", "afternoon"], thursday: ["morning", "afternoon"], friday: ["morning", "afternoon", "evening"], saturday: ["evening"], sunday: [] }),
    createdAt: "2026-05-28T17:59:07.561Z",
    updatedAt: "2026-05-28T17:59:07.561Z",
    notes: [
      { id: "cmppsrrjd000111dnkov10gdc", content: "Text inquiry: \"Hey saw the ad for drivers, are you guys still hiring?\"", createdAt: "2026-05-28T17:59:07.561Z" }
    ],
    documents: [
      { id: "cmppsrrjd000211dn6addb9nm", name: "Onboarding Material", status: "NOT_SENT", sentAt: null, signedAt: null, fileUrl: null, esignData: null },
      { id: "cmppsrrjd000311dn4b4eqo88", name: "W-9 Form", status: "NOT_SENT", sentAt: null, signedAt: null, fileUrl: null, esignData: null },
      { id: "cmppsrrjd000411dnqri26ju2", name: "Driver Contract", status: "NOT_SENT", sentAt: null, signedAt: null, fileUrl: null, esignData: null }
    ]
  }
];

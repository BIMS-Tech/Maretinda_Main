export interface PhilippineBank {
  code: string
  name: string
  swift_code: string
  category: 'universal' | 'commercial' | 'thrift' | 'rural' | 'cooperative'
}

export const PHILIPPINE_BANKS: PhilippineBank[] = [
  // Universal Banks
  {
    code: "ANZ",
    name: "ANZ - PHILIPPINES",
    swift_code: "ANZBPHMXXXX",
    category: "universal"
  },
  {
    code: "AUB",
    name: "AUB",
    swift_code: "AUBKPHMMXXX",
    category: "universal"
  },
  {
    code: "BKKB",
    name: "BANGKOK BANK - MANILA",
    swift_code: "BKKBPHMMXXX",
    category: "commercial"
  },
  {
    code: "BKCH",
    name: "BANK OF CHINA - MANILA",
    swift_code: "BKCHPHMMXXX",
    category: "commercial"
  },
  {
    code: "PABI",
    name: "BANK OF COMMERCE",
    swift_code: "PABIPHMMXXX",
    category: "commercial"
  },
  {
    code: "BDO",
    name: "BDO UNIBANK",
    swift_code: "BNORPHMMXXX",
    category: "universal"
  },
  {
    code: "BPI",
    name: "BPI",
    swift_code: "BOPIPHMMXXX",
    category: "universal"
  },
  {
    code: "CBC",
    name: "CHINABANK",
    swift_code: "CHBKPHMMXXX",
    category: "universal"
  },
  {
    code: "CITI",
    name: "CITIBANK MANILA",
    swift_code: "CITIPHMXXXX",
    category: "commercial"
  },
  {
    code: "CTCB",
    name: "CTBC BANK - PHILIPPINES",
    swift_code: "CTCBPHMMXXX",
    category: "commercial"
  },
  {
    code: "DBP",
    name: "DBP",
    swift_code: "DBPHPHMMXXX",
    category: "universal"
  },
  {
    code: "DEUT",
    name: "DEUTSCHE BANK - MANILA",
    swift_code: "DEUTPHMMXXX",
    category: "commercial"
  },
  {
    code: "EWB",
    name: "EASTWEST BANK",
    swift_code: "EWBCPHMMXXX",
    category: "commercial"
  },
  {
    code: "HSBC",
    name: "HSBC - PHILIPPINES",
    swift_code: "HSBCPHMMXXX",
    category: "commercial"
  },
  {
    code: "CHAS",
    name: "JPMORGAN CHASE BANK MANILA",
    swift_code: "CHASPHMMXXX",
    category: "commercial"
  },
  {
    code: "KOEX",
    name: "KEB HANA BANK - MANILA",
    swift_code: "KOEXPHMMXXX",
    category: "commercial"
  },
  {
    code: "LBP",
    name: "LANDBANK",
    swift_code: "TLBPPHMMXXX",
    category: "universal"
  },
  {
    code: "MBBE",
    name: "MAYBANK PHILIPPINES",
    swift_code: "MBBEPHMMXXX",
    category: "commercial"
  },
  {
    code: "ICBC",
    name: "MEGA INTL COMML BANK - MANILA",
    swift_code: "ICBCPHMMXXX",
    category: "commercial"
  },
  {
    code: "MBTC",
    name: "METROBANK",
    swift_code: "MBC12345HAQUE",
    category: "universal"
  },
  {
    code: "MHCB",
    name: "MIZUHO BANK - MANILA",
    swift_code: "MHCBPHMMXXX",
    category: "commercial"
  },
  {
    code: "BOTK",
    name: "MUFG BANK - MANILA",
    swift_code: "BOTKPHMMXXX",
    category: "commercial"
  },
  {
    code: "CPHI",
    name: "PBCOM",
    swift_code: "CPHIPHMMXXX",
    category: "commercial"
  },
  {
    code: "PHTB",
    name: "PHILTRUST BANK",
    swift_code: "PHTBPHMMXXX",
    category: "commercial"
  },
  {
    code: "PNB",
    name: "PNB",
    swift_code: "PNBMPHMMXXX",
    category: "universal"
  },
  {
    code: "PHSB",
    name: "PSBANK",
    swift_code: "PHSBPHMMXXX",
    category: "commercial"
  },
  {
    code: "RCBC",
    name: "RCBC",
    swift_code: "RCBCPHMMXXX",
    category: "universal"
  },
  {
    code: "ROBP",
    name: "ROBINSONS BANK CORPORATION",
    swift_code: "ROBPPHMQXXX",
    category: "commercial"
  },
  {
    code: "SETC",
    name: "SECURITY BANK",
    swift_code: "SETCPHMMXXX",
    category: "universal"
  },
  {
    code: "SHBK",
    name: "SHINHAN BANK - MANILA",
    swift_code: "SHBKPHMMXXX",
    category: "commercial"
  },
  {
    code: "SMBC",
    name: "SMBC - MANILA",
    swift_code: "SMBCPHMMXXX",
    category: "commercial"
  },
  {
    code: "SCBL",
    name: "STANDARD CHARTERED - MANILA",
    swift_code: "SCBLPHMMXXX",
    category: "commercial"
  },
  {
    code: "UCPB",
    name: "UCPB",
    swift_code: "UCPBPHMMXXX",
    category: "commercial"
  },
  {
    code: "UBP",
    name: "UNIONBANK",
    swift_code: "UBPHPHMMXXX",
    category: "universal"
  },
  {
    code: "UOVB",
    name: "UOB PHILIPPINES",
    swift_code: "UOVBPHMMXXX",
    category: "commercial"
  },
  {
    code: "PHVB",
    name: "VETERANS BANK",
    swift_code: "PHVBPHMMXXX",
    category: "commercial"
  }
]

export const getBankByName = (name: string): PhilippineBank | undefined => {
  return PHILIPPINE_BANKS.find(bank => 
    bank.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(bank.name.toLowerCase())
  )
}

export const getBankBySwiftCode = (swiftCode: string): PhilippineBank | undefined => {
  return PHILIPPINE_BANKS.find(bank => bank.swift_code === swiftCode.toUpperCase())
}

export const getBanksByCategory = (category: PhilippineBank['category']): PhilippineBank[] => {
  return PHILIPPINE_BANKS.filter(bank => bank.category === category)
}





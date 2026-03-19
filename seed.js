// prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emissionFactors = [
  // SCOPE 1 — Fuels
  { name:'Diesel (SG)',              category:'fuel',         substance:'DIESEL_SG',         unit:'litre',    kgCO2ePerUnit:2.68,   scope:1, source:'NEA Singapore 2024', year:2024 },
  { name:'Petrol (SG)',              category:'fuel',         substance:'PETROL_SG',         unit:'litre',    kgCO2ePerUnit:2.31,   scope:1, source:'NEA Singapore 2024', year:2024 },
  { name:'LPG (SG)',                 category:'fuel',         substance:'LPG_SG',            unit:'litre',    kgCO2ePerUnit:1.63,   scope:1, source:'NEA Singapore 2024', year:2024 },
  { name:'Natural Gas (SG)',         category:'fuel',         substance:'NATURAL_GAS_SG',    unit:'m3',       kgCO2ePerUnit:2.04,   scope:1, source:'NEA Singapore 2024', year:2024 },
  // SCOPE 1 — Refrigerants
  { name:'R-410A',                   category:'refrigerant',  substance:'R410A',             unit:'kg',       kgCO2ePerUnit:2088,   scope:1, source:'IPCC AR6 GWP100',    year:2021, country:'GLOBAL' },
  { name:'R-22',                     category:'refrigerant',  substance:'R22',               unit:'kg',       kgCO2ePerUnit:1760,   scope:1, source:'IPCC AR6 GWP100',    year:2021, country:'GLOBAL' },
  { name:'R-134a',                   category:'refrigerant',  substance:'R134A',             unit:'kg',       kgCO2ePerUnit:1360,   scope:1, source:'IPCC AR6 GWP100',    year:2021, country:'GLOBAL' },
  { name:'R-32',                     category:'refrigerant',  substance:'R32',               unit:'kg',       kgCO2ePerUnit:675,    scope:1, source:'IPCC AR6 GWP100',    year:2021, country:'GLOBAL' },
  // SCOPE 2 — Electricity
  { name:'SG Grid Electricity 2024', category:'electricity',  substance:'SG_ELECTRICITY_2024',unit:'kWh',    kgCO2ePerUnit:0.4168, scope:2, source:'EMA Singapore 2024', year:2024 },
  { name:'SG Grid Electricity 2023', category:'electricity',  substance:'SG_ELECTRICITY_2023',unit:'kWh',    kgCO2ePerUnit:0.4180, scope:2, source:'EMA Singapore 2023', year:2023 },
  // SCOPE 3 — Materials
  { name:'Concrete C30',             category:'material',     substance:'CONCRETE_C30',      unit:'m3',       kgCO2ePerUnit:260,    scope:3, source:'SBCC/BCA EPD SG',    year:2023 },
  { name:'Concrete C40',             category:'material',     substance:'CONCRETE_C40',      unit:'m3',       kgCO2ePerUnit:310,    scope:3, source:'SBCC/BCA EPD SG',    year:2023 },
  { name:'Steel Rebar',              category:'material',     substance:'STEEL_REBAR',       unit:'tonne',    kgCO2ePerUnit:1400,   scope:3, source:'ecoinvent 2023',     year:2023, country:'GLOBAL' },
  { name:'Structural Steel',         category:'material',     substance:'STEEL_STRUCT',      unit:'tonne',    kgCO2ePerUnit:2150,   scope:3, source:'ecoinvent 2023',     year:2023, country:'GLOBAL' },
  { name:'Timber (tropical)',        category:'material',     substance:'TIMBER_TROPICAL',   unit:'m3',       kgCO2ePerUnit:400,    scope:3, source:'ecoinvent SG',       year:2023 },
  { name:'Aluminium (primary)',      category:'material',     substance:'ALUMINIUM',         unit:'tonne',    kgCO2ePerUnit:9900,   scope:3, source:'IAI 2023',           year:2023, country:'GLOBAL' },
  { name:'Float Glass',             category:'material',     substance:'GLASS',             unit:'tonne',    kgCO2ePerUnit:840,    scope:3, source:'ecoinvent',          year:2022, country:'GLOBAL' },
  { name:'Cement (OPC)',             category:'material',     substance:'CEMENT',            unit:'tonne',    kgCO2ePerUnit:820,    scope:3, source:'IEA 2023',           year:2023, country:'GLOBAL' },
  // SCOPE 3 — Transport
  { name:'Heavy Goods Vehicle',      category:'transport',    substance:'TRANSPORT_HGV',     unit:'tonne-km', kgCO2ePerUnit:0.080,  scope:3, source:'DEFRA 2024',         year:2024, country:'GLOBAL' },
  { name:'Sea Freight',              category:'transport',    substance:'SEA_FREIGHT',       unit:'tonne-km', kgCO2ePerUnit:0.011,  scope:3, source:'DEFRA 2024',         year:2024, country:'GLOBAL' },
  { name:'MRT/LRT (SG)',             category:'commute',      substance:'MRT_SG',            unit:'km',       kgCO2ePerUnit:0.041,  scope:3, source:'NEA SG',             year:2024 },
  { name:'Bus (SG)',                 category:'commute',      substance:'BUS_SG',            unit:'km',       kgCO2ePerUnit:0.082,  scope:3, source:'NEA SG',             year:2024 },
  { name:'Taxi/PHV (SG)',            category:'commute',      substance:'TAXI_SG',           unit:'km',       kgCO2ePerUnit:0.186,  scope:3, source:'NEA SG',             year:2024 },
  // SCOPE 3 — Business Travel
  { name:'Short-haul Flight',        category:'travel',       substance:'FLIGHT_SHORT',      unit:'km',       kgCO2ePerUnit:0.184,  scope:3, source:'DEFRA 2024',         year:2024, country:'GLOBAL' },
  { name:'Long-haul Flight',         category:'travel',       substance:'FLIGHT_LONG',       unit:'km',       kgCO2ePerUnit:0.188,  scope:3, source:'DEFRA 2024',         year:2024, country:'GLOBAL' },
  { name:'Hotel Stay',               category:'travel',       substance:'HOTEL',             unit:'night',    kgCO2ePerUnit:38.4,   scope:3, source:'DEFRA 2024',         year:2024, country:'GLOBAL' },
  // SCOPE 3 — Waste
  { name:'General Waste (landfill)', category:'waste',        substance:'WASTE_GENERAL',     unit:'tonne',    kgCO2ePerUnit:525,    scope:3, source:'NEA SG',             year:2024 },
  { name:'Construction Waste',       category:'waste',        substance:'WASTE_CONSTRUCTION',unit:'tonne',    kgCO2ePerUnit:680,    scope:3, source:'NEA SG',             year:2024 },
  { name:'Inert Waste (recycled)',   category:'waste',        substance:'WASTE_INERT',       unit:'tonne',    kgCO2ePerUnit:20,     scope:3, source:'NEA SG',             year:2024 },
];

async function main() {
  console.log('Seeding emission factors...');
  for (const ef of emissionFactors) {
    await prisma.emissionFactor.upsert({
      where: { substance_year: { substance: ef.substance, year: ef.year } },
      update: ef,
      create: { country: 'SG', ...ef },
    });
  }
  console.log(`✅ Done! Seeded ${emissionFactors.length} emission factors.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

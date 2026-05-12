'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');
const Category = require('../models/category.model');
const Product  = require('../models/product.model');
const User     = require('../models/user.model');

const categories = [
  { name: 'Dresses',     description: 'From silk minis to floor-length gowns', sortOrder: 1 },
  { name: 'Outerwear',   description: 'Coats, capes, and jackets', sortOrder: 2 },
  { name: 'Tailoring',   description: 'Precision-cut blazers and trousers', sortOrder: 3 },
  { name: 'Knitwear',    description: 'Luxury cashmere and fine wool', sortOrder: 4 },
  { name: 'Separates',   description: 'Tops and bottoms to build your wardrobe', sortOrder: 5 },
  { name: 'Accessories', description: 'Bags, belts, and jewellery', sortOrder: 6 },
];

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('🌱  Connected. Seeding...');

  // Clear
  await Promise.all([Category.deleteMany(), Product.deleteMany(), User.deleteMany()]);

  // Seed categories
  const cats = await Category.insertMany(categories);
  const catMap = Object.fromEntries(cats.map(c => [c.name, c._id]));

  // Seed admin user
  await User.create({
    firstName: 'Aura',
    lastName:  'Admin',
    email:     'admin@aura.com',
    password:  'Aura@2025!',
    role:      'admin',
    isEmailVerified: true,
  });

  // Seed products
  const products = [
    {
      name: 'Noir Silk Gown',
      brand: 'Maison Aura',
      description: 'A floor-length gown crafted from the finest Charmeuse silk. The fluid silhouette and deep plunge neckline define understated glamour.',
      shortDescription: 'Floor-length Charmeuse silk gown with deep plunge neckline.',
      category: catMap['Dresses'],
      basePrice: 1290,
      comparePrice: 0,
      tags: ['silk', 'gown', 'evening', 'black', 'new'],
      material: '100% Silk Charmeuse',
      madeIn: 'Italy',
      isNewArrival: true,
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
      variants: [
        { size: 'XS', color: 'Noir', colorHex: '#1A1714', sku: 'NSG-XS-NR', stock: 3 },
        { size: 'S',  color: 'Noir', colorHex: '#1A1714', sku: 'NSG-S-NR',  stock: 5 },
        { size: 'M',  color: 'Noir', colorHex: '#1A1714', sku: 'NSG-M-NR',  stock: 4 },
        { size: 'L',  color: 'Noir', colorHex: '#1A1714', sku: 'NSG-L-NR',  stock: 2 },
      ],
    },
    {
      name: 'Camel Wool Coat',
      brand: 'Maison Aura',
      description: 'Double-faced virgin wool coat in a classic camel palette. Structured shoulders and a clean silhouette make this the definitive investment piece.',
      shortDescription: 'Double-faced virgin wool overcoat in camel.',
      category: catMap['Outerwear'],
      basePrice: 2150,
      comparePrice: 0,
      tags: ['wool', 'coat', 'camel', 'classic', 'bestseller'],
      material: '100% Virgin Wool',
      madeIn: 'France',
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
      variants: [
        { size: 'XS', color: 'Camel', colorHex: '#C09458', sku: 'CWC-XS-CM', stock: 4 },
        { size: 'S',  color: 'Camel', colorHex: '#C09458', sku: 'CWC-S-CM',  stock: 6 },
        { size: 'M',  color: 'Camel', colorHex: '#C09458', sku: 'CWC-M-CM',  stock: 5 },
        { size: 'L',  color: 'Camel', colorHex: '#C09458', sku: 'CWC-L-CM',  stock: 3 },
        { size: 'XL', color: 'Camel', colorHex: '#C09458', sku: 'CWC-XL-CM', stock: 2 },
      ],
    },
    {
      name: 'Anthracite Wool Blazer',
      brand: 'Maison Aura',
      description: 'A single-button blazer cut from heavyweight anthracite wool. Darted seams and welt pockets deliver precise, architectural tailoring.',
      shortDescription: 'Heavyweight wool blazer with architectural tailoring.',
      category: catMap['Tailoring'],
      basePrice: 620,
      comparePrice: 890,
      tags: ['blazer', 'wool', 'anthracite', 'tailoring', 'sale'],
      material: '95% Wool, 5% Elastane',
      madeIn: 'Italy',
      isActive: true,
      publishedAt: new Date(),
      variants: [
        { size: 'XS', color: 'Anthracite', colorHex: '#3A3A38', sku: 'AWB-XS-AN', stock: 3 },
        { size: 'S',  color: 'Anthracite', colorHex: '#3A3A38', sku: 'AWB-S-AN',  stock: 4 },
        { size: 'M',  color: 'Anthracite', colorHex: '#3A3A38', sku: 'AWB-M-AN',  stock: 5 },
        { size: 'L',  color: 'Anthracite', colorHex: '#3A3A38', sku: 'AWB-L-AN',  stock: 3 },
      ],
    },
    {
      name: 'Ivory A-Line Skirt',
      brand: 'Maison Aura',
      description: 'A gently flared A-line skirt in lightweight ivory crepe. Falls precisely at the knee for effortless versatility from day to evening.',
      shortDescription: 'Lightweight ivory crepe A-line skirt, knee-length.',
      category: catMap['Separates'],
      basePrice: 650,
      comparePrice: 0,
      tags: ['skirt', 'ivory', 'crepe', 'new', 'versatile'],
      material: '100% Silk Crepe',
      madeIn: 'France',
      isNewArrival: true,
      isActive: true,
      publishedAt: new Date(),
      variants: [
        { size: 'XS', color: 'Ivory', colorHex: '#F5F0E6', sku: 'IAS-XS-IV', stock: 6 },
        { size: 'S',  color: 'Ivory', colorHex: '#F5F0E6', sku: 'IAS-S-IV',  stock: 8 },
        { size: 'M',  color: 'Ivory', colorHex: '#F5F0E6', sku: 'IAS-M-IV',  stock: 7 },
        { size: 'L',  color: 'Ivory', colorHex: '#F5F0E6', sku: 'IAS-L-IV',  stock: 4 },
      ],
    },
    {
      name: 'Cashmere Turtleneck',
      brand: 'Maison Aura',
      description: 'A grade-A Mongolian cashmere turtleneck in a versatile ecru colourway. Ribbed cuffs and hem ensure a refined, put-together silhouette.',
      shortDescription: 'Grade-A Mongolian cashmere ribbed turtleneck.',
      category: catMap['Knitwear'],
      basePrice: 480,
      comparePrice: 0,
      tags: ['cashmere', 'knitwear', 'turtleneck', 'ecru', 'classic'],
      material: '100% Grade-A Cashmere',
      madeIn: 'Scotland',
      isFeatured: true,
      isActive: true,
      publishedAt: new Date(),
      variants: [
        { size: 'S',  color: 'Ecru',  colorHex: '#F0E8DC', sku: 'CTN-S-EC',  stock: 10 },
        { size: 'M',  color: 'Ecru',  colorHex: '#F0E8DC', sku: 'CTN-M-EC',  stock: 12 },
        { size: 'L',  color: 'Ecru',  colorHex: '#F0E8DC', sku: 'CTN-L-EC',  stock: 8 },
        { size: 'S',  color: 'Noir',  colorHex: '#1A1714', sku: 'CTN-S-NR',  stock: 9 },
        { size: 'M',  color: 'Noir',  colorHex: '#1A1714', sku: 'CTN-M-NR',  stock: 11 },
      ],
    },
  ];

  await Product.insertMany(products);

  console.log(`✅  Seeded:`);
  console.log(`    ${cats.length} categories`);
  console.log(`    ${products.length} products`);
  console.log(`    1 admin user (admin@aura.com / Aura@2025!)`);
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
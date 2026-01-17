/**
 * Name Generation Utilities
 *
 * Generates realistic candidate names for demo data
 */

const FIRST_NAMES = {
  male: [
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
    'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark',
    'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
    'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
    'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott',
    'Brandon', 'Benjamin', 'Samuel', 'Raymond', 'Gregory', 'Frank', 'Alexander',
    'Patrick', 'Raymond', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Jose',
  ],
  female: [
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Barbara', 'Elizabeth', 'Susan',
    'Jessica', 'Sarah', 'Karen', 'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra',
    'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Dorothy', 'Carol',
    'Amanda', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura',
    'Cynthia', 'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela',
    'Emma', 'Nicole', 'Helen', 'Samantha', 'Katherine', 'Christine', 'Debra',
    'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather', 'Diane',
  ],
};

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Turner', 'Phillips', 'Evans', 'Collins', 'Edwards', 'Stewart',
  'Morris', 'Murphy', 'Cook', 'Rogers', 'Morgan', 'Peterson', 'Cooper', 'Reed',
  'Bailey', 'Bell', 'Gomez', 'Kelly', 'Howard', 'Ward', 'Cox', 'Diaz', 'Richardson',
  'Wood', 'Watson', 'Brooks', 'Bennett', 'Gray', 'James', 'Reyes', 'Cruz', 'Hughes',
  'Price', 'Myers', 'Long', 'Foster', 'Sanders', 'Ross', 'Morales', 'Powell', 'Sullivan',
];

// Southern-specific last names for regional flavor
const SOUTHERN_LAST_NAMES = [
  'Beaumont', 'Calhoun', 'Chandler', 'Crawford', 'Cunningham', 'Davidson', 'Douglas',
  'Ferguson', 'Fleming', 'Hampton', 'Harrison', 'Henderson', 'Hicks', 'Holland',
  'Hollis', 'Holloway', 'Jefferson', 'Jenkins', 'Johnston', 'Lawrence', 'Lawson',
  'Madison', 'Manning', 'Marshall', 'Mason', 'McAllister', 'McCoy', 'McDaniel',
  'McDowell', 'McKinney', 'Mills', 'Montgomery', 'Norwood', 'Patterson', 'Payne',
  'Perkins', 'Pierce', 'Porter', 'Preston', 'Randolph', 'Rawlings', 'Reynolds',
  'Russell', 'Singleton', 'Spencer', 'Stanton', 'Stevens', 'Stone', 'Sutton',
  'Thornton', 'Tucker', 'Wallace', 'Warren', 'Washington', 'Watkins', 'Weaver',
];

/**
 * Generate a random name
 */
export function generateName(seed?: number): string {
  let currentSeed = seed ?? 0;
  const rand = seed !== undefined
    ? () => {
        currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
        return currentSeed / 0x7fffffff;
      }
    : Math.random;

  const isFemale = rand() < 0.45; // Slightly more male candidates historically
  const firstName = isFemale
    ? FIRST_NAMES.female[Math.floor(rand() * FIRST_NAMES.female.length)]
    : FIRST_NAMES.male[Math.floor(rand() * FIRST_NAMES.male.length)];

  // Mix southern and general last names
  const useSouthern = rand() < 0.3;
  const lastNamePool = useSouthern ? SOUTHERN_LAST_NAMES : LAST_NAMES;
  const lastName = lastNamePool[Math.floor(rand() * lastNamePool.length)];

  // Sometimes add middle initial
  const addMiddle = rand() < 0.2;
  const middleInitial = addMiddle
    ? ` ${String.fromCharCode(65 + Math.floor(rand() * 26))}.`
    : '';

  return `${firstName}${middleInitial} ${lastName}`;
}

/**
 * Generate a deterministic name based on district
 */
export function generateDeterministicName(stateCode: string, chamber: string, districtNum: number, index: number): string {
  const seed = hashCode(`${stateCode}-${chamber}-${districtNum}-${index}`);
  return generateName(seed);
}

/**
 * Simple hash function for seeding
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

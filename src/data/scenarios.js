/** All lifestyle factors — order in DEFAULT_SCENARIO_ORDER is the initial stack (before user drags). */
export const SCENARIOS = [
  { id: 'city', symbol: '◎', label: 'Mostly city driving', explanation: 'Short trips, traffic, around town' },
  { id: 'upcountry', symbol: '→', label: 'Long trips out of town', explanation: 'Weekends away, highway driving' },
  { id: 'homeCharging', symbol: '⌂', label: 'I charge at home', explanation: 'I can plug in at night' },
  { id: 'family', symbol: '◻', label: 'Family in the car', explanation: 'Back seat and boot need to work' },
  { id: 'noHeadache', symbol: '○', label: 'Easy to own', explanation: 'Warranty, service, fewer worries' },
  { id: 'drivingFeel', symbol: '△', label: 'Fun to drive', explanation: 'I care how it feels on the road' },
  { id: 'valueForMoney', symbol: '¥', label: 'Best for my budget', explanation: 'I want a lot for what I pay' },
  { id: 'tightParking', symbol: '▣', label: 'Tight parking', explanation: 'Small car, condo, tricky spots' },
  { id: 'preferWestern', symbol: '⊕', label: 'US or European brands', explanation: 'American or European car brands' },
];

export const DEFAULT_SCENARIO_ORDER = SCENARIOS.map((s) => s.id);

export function getScenarioById(id) {
  return SCENARIOS.find((s) => s.id === id);
}

/** Top N ranks → user cares enough to filter fleet to western brands only */
export const PREFER_WESTERN_FILTER_TOP_N = 5;

export function formatPriorityListForAi(order) {
  return order
    .map((id, i) => `${i + 1}. ${getScenarioById(id)?.label ?? id}`)
    .join('; ');
}

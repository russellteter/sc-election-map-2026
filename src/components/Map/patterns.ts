/**
 * SVG Pattern definitions for district map fills.
 * These patterns create crosshatch/textured fills for special district states.
 */

export const SVG_PATTERNS = `
  <!-- Needs Candidate: Light blue with blue diagonal crosshatch -->
  <pattern id="needs-candidate" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8" fill="#DBEAFE"/>
    <path d="M0,0 L8,8 M8,0 L0,8" stroke="#3B82F6" stroke-width="0.6" opacity="0.5"/>
  </pattern>

  <!-- High Opportunity: Light green with subtle green diagonal lines -->
  <pattern id="high-opportunity-pattern" patternUnits="userSpaceOnUse" width="6" height="6">
    <rect width="6" height="6" fill="#ECFDF5"/>
    <path d="M0,0 L6,6" stroke="#059669" stroke-width="0.5" opacity="0.4"/>
  </pattern>

  <!-- No Data / Empty: Light gray with subtle gray diagonal lines -->
  <pattern id="empty-district" patternUnits="userSpaceOnUse" width="6" height="6">
    <rect width="6" height="6" fill="#F3F4F6"/>
    <path d="M0,0 L6,6" stroke="#9CA3AF" stroke-width="0.4" opacity="0.3"/>
  </pattern>

  <!-- Scenario: Flipped to Democrat (blue with white dashed stripes) -->
  <pattern id="flipped-dem-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8" fill="#2563EB"/>
    <path d="M0,4 L8,4" stroke="white" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
  </pattern>

  <!-- Scenario: Flipped to Republican (red with white dashed stripes) -->
  <pattern id="flipped-rep-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8" fill="#DC2626"/>
    <path d="M0,4 L8,4" stroke="white" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
  </pattern>

  <!-- Scenario: Toss-up (purple with white dashed crosshatch) -->
  <pattern id="tossup-pattern" patternUnits="userSpaceOnUse" width="8" height="8">
    <rect width="8" height="8" fill="#8B5CF6"/>
    <path d="M0,0 L8,8 M8,0 L0,8" stroke="white" stroke-width="0.5" stroke-dasharray="2,2" opacity="0.4"/>
  </pattern>

  <!-- Historical: Democrat improving (blue gradient stripes) -->
  <pattern id="dem-improving-pattern" patternUnits="userSpaceOnUse" width="6" height="6">
    <rect width="6" height="6" fill="#93C5FD"/>
    <path d="M0,3 L6,3" stroke="#1E40AF" stroke-width="1" opacity="0.5"/>
  </pattern>

  <!-- Historical: Republican improving (red gradient stripes) -->
  <pattern id="rep-improving-pattern" patternUnits="userSpaceOnUse" width="6" height="6">
    <rect width="6" height="6" fill="#FCA5A5"/>
    <path d="M0,3 L6,3" stroke="#B91C1C" stroke-width="1" opacity="0.5"/>
  </pattern>
`;

/**
 * Inject SVG pattern definitions into an SVG element.
 * Call this after parsing the SVG but before processing paths.
 */
export function injectPatterns(svg: SVGSVGElement): void {
  // Check if defs already exists
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }

  // Add patterns to defs
  const patternsContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  patternsContainer.innerHTML = SVG_PATTERNS;

  // Move pattern elements from temp container to defs
  while (patternsContainer.firstChild) {
    if (patternsContainer.firstChild.nodeType === Node.ELEMENT_NODE) {
      defs.appendChild(patternsContainer.firstChild);
    } else {
      patternsContainer.removeChild(patternsContainer.firstChild);
    }
  }
}

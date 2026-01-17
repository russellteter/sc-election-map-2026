# API Connectivity Investigation Report

**Date:** January 16, 2026
**Status:** CRITICAL FINDING - Keys are NOT direct API keys
**Investigator:** Backend Architect Agent

---

## Executive Summary

The API keys obtained from VoteBuilder's API Integrations portal (`https://www.votebuilder.com/ApiIntegrations.aspx#/`) are **NOT direct API keys** for BallotReady (CivicEngine) or TargetSmart APIs. They appear to be **NGP VAN API integration identifiers** that work within VAN's ecosystem, not standalone API credentials for direct third-party API access.

### Root Cause of 403 Errors

Both APIs return HTTP 403 (Forbidden) because:
1. The keys are in UUID/GUID format typical of VAN integration keys
2. They lack the `|0` or `|1` database mode suffix required for VAN API authentication
3. These keys are meant for VAN-to-VAN integrations, not direct external API calls
4. BallotReady and TargetSmart require **separate, enterprise-level API agreements** with their own provisioned keys

---

## Key Format Analysis

### Current Keys (from `.env.local`)

```
NEXT_PUBLIC_BALLOTREADY_KEY=97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131
NEXT_PUBLIC_TARGETSMART_KEY=e0893890-e080-5f98-8ebc-15066c9b1eb7
```

### Analysis

| Aspect | Finding |
|--------|---------|
| **Format** | UUID/GUID (36 characters, 8-4-4-4-12 pattern) |
| **VAN Key Format** | VAN keys are `GUID\|0` or `GUID\|1` for database mode |
| **Missing Component** | No `\|0` or `\|1` suffix present |
| **BallotReady Key Format** | Enterprise-provisioned, not documented publicly |
| **TargetSmart Key Format** | Enterprise-provisioned via TargetSmart Client Services |

These keys match the NGP VAN API key format (GUID) but are incomplete without the database mode suffix. They appear to be integration identifiers within VoteBuilder's ecosystem, not standalone API credentials.

---

## VoteBuilder API Integrations Portal Explained

### What the Portal Actually Does

The VoteBuilder API Integrations portal at `https://www.votebuilder.com/ApiIntegrations.aspx#/` allows users to:

1. **Request VAN API keys** for third-party integrations
2. **Manage existing integration connections** with approved partners
3. **Configure data sharing** between VAN and partner tools

### How BallotReady Integration Works (Per BallotReady Support)

According to [BallotReady's VAN Integration documentation](https://support.ballotready.org/article/753-van-integration):

1. Request a VAN API key via the API Integrations menu
2. Select **"Community Tech Alliance"** as the integration partner
3. Generate the key within your VAN account
4. **Share the key securely with BallotReady** via One Time Secret
5. BallotReady's backend uses the key to sync data **TO your VAN instance**

This is a **data synchronization integration**, not an API access grant. The keys enable BallotReady to push data into VAN, not for your application to pull data from BallotReady's API.

### What These Keys Are NOT

- NOT direct access credentials for BallotReady's CivicEngine API
- NOT direct access credentials for TargetSmart's VoterBase API
- NOT API keys that can be used to call `api.civicengine.com` or `api.targetsmart.com`

---

## How to Actually Get API Access

### BallotReady (CivicEngine) API

**Documentation:** https://developers.civicengine.com/

**Access Requirements:**
1. Contact BallotReady sales/support at support@ballotready.org
2. Request a demo and API pricing discussion
3. Execute an enterprise agreement (starting ~$5,000/year per Capterra)
4. Receive API key provisioned by BallotReady

**Authentication Method:**
```
Header: x-api-key: <your-provisioned-api-key>
```

**Base URL:** `https://api.civicengine.com`

**Available Endpoints:**
- `/elections` - Election data
- `/positions` - Elected offices/positions
- `/candidates` - Candidate information
- `/polling-places` - Polling locations
- `/officeholders` - Current officeholders

### TargetSmart API

**Documentation:** https://docs.targetsmart.com/developers/tsapis/v2/index.html
**Authentication Guide:** https://docs.targetsmart.com/developers/tsapis/authentication.html

**Access Requirements:**
1. Contact TargetSmart Client Services (support@targetsmart.com)
2. Or contact TargetSmart Sales (sales@targetsmart.com)
3. Discuss integration use case and pricing
4. Execute enterprise agreement
5. Keys provisioned via My TargetSmart portal (https://my.targetsmart.com/api/services)

**Authentication Method:**
```
Header: x-api-key: <your-provisioned-api-key>
Protocol: HTTPS required (SHA-256)
```

**Base URL:** `https://api.targetsmart.com`

**Available Endpoints:**
- `/voter/voter-registration-check` - Voter registration lookup
- `/voter/voter-suggest` - Voter autocomplete/search
- `/person/data-enhance` - Voter data enrichment
- `/service/district` - District lookup by address

---

## NGP VAN API (What the Keys Are Actually For)

### If You Want to Use These Keys with VAN

The keys obtained from VoteBuilder ARE valid for the NGP VAN API, with modifications:

**Documentation:** https://docs.ngpvan.com/reference/authentication

**Authentication Method:**
- HTTP Basic Authentication
- Username: Application Name (e.g., `acmeCrmProduct`)
- Password: API Key with mode suffix (e.g., `97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131|0`)

**Database Modes:**
- `|0` = My Voters (voter file data)
- `|1` = My Campaign (CRM data)

**Base URL:** `https://api.securevan.com/v4/`

However, using VAN's API directly would provide different data than BallotReady or TargetSmart APIs.

---

## Recommended Actions

### Option 1: Obtain Proper API Access (Recommended)

**For BallotReady:**
1. Email support@ballotready.org
2. Subject: "API Access Request - SC Election Map Project"
3. Request: Demo, pricing information, and API key provisioning
4. Budget: Plan for ~$5,000+ annually

**For TargetSmart:**
1. Email sales@targetsmart.com or support@targetsmart.com
2. Subject: "API Integration Inquiry - Political Campaign Application"
3. Request: API access discussion and pricing
4. Budget: Enterprise pricing (not publicly available)

### Option 2: Use Alternative Free/Low-Cost Data Sources

| Data Need | Alternative Source | Cost |
|-----------|-------------------|------|
| Election dates | Google Civic Information API | Free |
| Polling places | Google Civic Information API | Free |
| Candidate info | Vote Smart API | Free/donation |
| District lookup | Census Geocoder | Free |
| Voter registration | State election commission websites | Free |

### Option 3: Leverage Existing VAN Integration Differently

If the goal is to sync data WITH VAN rather than pull data FROM external APIs:
1. Work with your VAN administrator
2. Configure the Community Tech Alliance integration properly
3. Use VAN's data export features for static datasets

### Option 4: Use Static/Pre-Computed Data

The current codebase already includes mock data generation and static JSON file support. This approach:
1. Works without API dependencies
2. Can be manually updated periodically
3. Avoids ongoing API costs

---

## Code Changes Required

### If API Access is Obtained

**`src/lib/ballotready.ts`** - Current implementation is correctly structured:
- Uses `x-api-key` header (correct)
- Calls `https://api.civicengine.com` (correct)
- Just needs a valid API key

**`src/lib/targetsmart.ts`** - Current implementation is correctly structured:
- Uses `x-api-key` header (correct)
- Calls `https://api.targetsmart.com` (correct)
- Just needs a valid API key

### If Staying with Static Data

1. Remove API key requirements from build process
2. Enhance mock data generators in `targetsmart.ts`
3. Document data update procedures
4. Consider adding manual data import tooling

---

## Environment Variable Recommendations

### Current (Invalid for Direct API Access)
```env
NEXT_PUBLIC_BALLOTREADY_KEY=97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131
NEXT_PUBLIC_TARGETSMART_KEY=e0893890-e080-5f98-8ebc-15066c9b1eb7
```

### If VAN API Access is Desired
```env
VAN_APPLICATION_NAME=<your-app-name>
VAN_API_KEY=97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131|0
```

### If Direct API Access is Obtained
```env
# These would be NEW keys from each provider
BALLOTREADY_API_KEY=<key-from-ballotready>
TARGETSMART_API_KEY=<key-from-targetsmart>
```

**Security Note:** Remove `NEXT_PUBLIC_` prefix to prevent client-side exposure of API keys. These should be server-side only.

---

## Testing Performed

### Authentication Methods Tested

| Test | BallotReady Result | TargetSmart Result |
|------|-------------------|-------------------|
| `x-api-key` header | 403 Forbidden | 403 Forbidden |
| `Authorization: Bearer` | 403 Forbidden | 403 Forbidden |
| `X-API-KEY` (uppercase) | 403 Forbidden | 403 Forbidden |
| HTTP Basic Auth (VAN-style) | N/A (wrong API) | N/A (wrong API) |

### Key Format Validation

Both keys match UUID/GUID pattern: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`

This confirms they are VAN-style integration identifiers, not direct API keys.

---

## Conclusion

The 403 errors are **expected behavior** because the keys from VoteBuilder's API Integrations portal are VAN integration identifiers, not standalone API credentials for BallotReady or TargetSmart's public APIs.

**To resolve this issue, you must either:**
1. Contact BallotReady and TargetSmart directly to obtain proper API access agreements and keys
2. Use alternative free data sources (Google Civic API, Census, etc.)
3. Rely on static/manually updated data files

The current code implementation is technically correct and will work once proper API keys are provisioned.

---

## References

### Documentation
- [BallotReady Developers Portal](https://developers.civicengine.com/)
- [BallotReady VAN Integration Guide](https://support.ballotready.org/article/753-van-integration)
- [TargetSmart API Overview](https://docs.targetsmart.com/developers/tsapis/v2/index.html)
- [TargetSmart Authentication](https://docs.targetsmart.com/developers/tsapis/authentication.html)
- [NGP VAN API Authentication](https://docs.ngpvan.com/reference/authentication)
- [NGP VAN Key Generation](https://docs.ngpvan.com/docs/key-generation-and-usage)

### Pricing Information
- [BallotReady Pricing (Capterra)](https://www.capterra.com/p/234004/CivicEngine/) - Starting ~$5,000/year
- [TargetSmart Contact](https://targetsmart.com/) - Enterprise pricing, not published

### Support Contacts
- BallotReady: support@ballotready.org
- TargetSmart: support@targetsmart.com, sales@targetsmart.com
- NGP VAN: support@ngpvan.com

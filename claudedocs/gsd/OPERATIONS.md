# SC Election Map 2026 - Operations Reference

## Ralph Wiggum Execution

Ralph Wiggum provides persistent iteration for phase execution.

### Basic Usage

```bash
# Execute a plan with completion promise
/ralph-loop "Execute PLAN.md at .planning/phases/01-name/01-01-PLAN.md.
Read @claudedocs/gsd/CONTEXT.md first.
Follow task XML structure exactly.
Commit after each working task." \
  --completion-promise 'All tasks complete and verified' \
  --max-iterations 50
```

### Commands

| Command | Purpose |
|---------|---------|
| `/ralph-loop "prompt" --completion-promise 'text' --max-iterations N` | Start execution loop |
| `/cancel-ralph` | Cancel active loop |
| `/help` | Show ralph-wiggum documentation |

### Completion Promise

The loop exits when Claude outputs `<promise>YOUR_TEXT</promise>` matching your `--completion-promise`.

**Example promises:**
- `'All tasks complete and verified'`
- `'Build passes, tests pass, feature works'`
- `'Phase 1 complete'`

### Safety Limits

- `--max-iterations 50` prevents infinite loops
- Claude should only output promise when genuinely complete
- Use `/cancel-ralph` if stuck

---

## Development

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:3000)
```

## Build & Deploy
```bash
npm run build            # Build static site to ./out
npm start                # Serve built output locally

# Auto-deployment:
git push origin main     # Triggers GitHub Actions deployment
# Live: https://russellteter.github.io/sc-election-map-2026/
```

## Testing
```bash
npm test                 # Jest unit tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage report
npm run test:e2e         # Playwright E2E (headless)
npm run test:e2e:ui      # Playwright with browser UI
npx playwright show-report  # View last E2E report
```

## Code Quality
```bash
npm run lint             # Run ESLint
npx tsc --noEmit         # TypeScript check only
```

## Environment Variables
Create `.env.local` in project root:
```bash
NEXT_PUBLIC_BALLOTREADY_KEY=97e9a47f-c12b-b1ce-8a89-e1ecb1cd4131
NEXT_PUBLIC_TARGETSMART_KEY=e0893890-e080-5f98-8ebc-15066c9b1eb7
```

**Note:** Restart dev server after changing .env.local

## Verify Build Success
```bash
npm run build
# Should complete with no errors
# Check ./out folder created
ls -la out/
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Build fails | Check TypeScript errors: `npm run build 2>&1 \| head -50` |
| API not working | Verify .env.local exists with keys |
| Tests fail | Run `npm run test:e2e:ui` to see visually |
| Deployment stuck | Check GitHub Actions tab for errors |
| Module not found | Run `npm install` |
| Stale cache | Delete `.next` folder and rebuild |

## Pre-Flight Checklist
```bash
git status               # Should be clean or intentional changes
npm run build            # Must pass
npm test                 # Should pass (or skip if no tests)
```

## Git Workflow
```bash
# Feature branch
git checkout -b feature/tier-N-description
git add -A
git commit -m "feat(tier-N): description"
git push origin feature/tier-N-description

# Or direct to main (after verification)
git add -A
git commit -m "feat(tier-N): description"
git push origin main
```

## Deployment Verification
After `git push origin main`:
1. Check GitHub Actions: https://github.com/russellteter/sc-election-map-2026/actions
2. Wait for workflow to complete (green checkmark)
3. Verify live site: https://russellteter.github.io/sc-election-map-2026/

# ✅ Quick Start Checklist

## Step 1: Verify Installation ✓

- [ ] Navigate to project: `cd c:\100Hires`
- [ ] Check Node.js installed: `node --version` (should be 18+)
- [ ] Check pnpm installed: `pnpm --version`
- [ ] If pnpm not installed: `npm install -g pnpm`
 - [ ] Check Python installed: `python --version` or `python3 --version` (required for transcript helper)
 - [ ] Check pip installed: `pip --version`

## Step 2: Install Dependencies ✓

```bash
pnpm install
```

- [ ] Command completes without errors
- [ ] `node_modules` folder created
- [ ] `pnpm-lock.yaml` created

## Step 3: Configure Environment ✓

```bash
# Create .env file with required keys. At minimum provide a YouTube API key for reliable search
echo "YOUTUBE_API_KEY=your_key_here" > .env

# (Optional) If you want to use Supadata instead of the default Python helper:
# echo "SUPADATA_API_KEY=your_key_here" >> .env
```

- [ ] `.env` file created
- [ ] Contains `YOUTUBE_API_KEY=...` (recommended)
- [ ] Contains `SUPADATA_API_KEY=...` if you plan to use Supadata (optional)
- [ ] File is in project root (`c:\100Hires\.env`)

## Step 4: Build the Project ✓

```bash
pnpm build
```

- [ ] Command completes without errors
- [ ] `dist/` folder created with compiled JavaScript
- [ ] No TypeScript errors
- [ ] No warnings

## Step 5: Verify Build Output ✓

```bash
pnpm type-check
```

- [ ] No type errors reported
- [ ] Project is ready to run

## Step 6: Run in Development Mode ✓
Before running the app install the Python transcript helper deps:

```bash
pip install -r python/requirements.txt
```

Then start dev mode:

```bash
pnpm dev
```

- [ ] Application starts
- [ ] Reads experts from `research/sources.md`
- [ ] Shows progress logs
- [ ] Completes without crashing

## Step 7: Check Output ✓

- [ ] New files created in `research/youtube-transcripts/`
- [ ] Expert directories created (one per expert)
- [ ] Markdown files generated with video information
- [ ] Each file contains transcript + summary + takeaways

## Step 8: Review and Customize ✓

**In `src/config/index.ts`:**
- [ ] Review current keywords
- [ ] Update if your research topic differs
- [ ] Adjust `maxResultsPerExpert` if needed
- [ ] Check output directory setting

**In `research/sources.md`:**
- [ ] Verify expert names are correct
- [ ] Add more experts if desired
- [ ] Ensure format matches existing entries

## Step 9: Rebuild After Changes ✓

```bash
pnpm build
```

- [ ] Changes compiled without errors
- [ ] Ready to run again

## Step 10: Production Deployment ✓

```bash
pnpm build
pnpm start
```

- [ ] Application runs in production mode
- [ ] Completes successfully
- [ ] Output is correct

---

## Optional Configuration Steps

### Increase Search Results
Edit `src/config/index.ts`:
```typescript
maxResultsPerExpert: 50  // Instead of 20
```

### Add More Keywords
Edit `src/config/index.ts`:
```typescript
keywords: [
  'reddit',
  'b2b',
  'saas',
  'your-keyword-here'  // Add custom keywords
]
```

### Change Output Directory
Edit `src/config/index.ts`:
```typescript
outputDirectory: './my-custom-folder'
```

### Integrate Real LLM
Edit `src/index.ts`:
```typescript
// Replace MockLLMProvider with:
const llmProvider = new OpenAIProvider(apiKey);
// or
const llmProvider = new AnthropicProvider(apiKey);
```

---

## Troubleshooting

### ❌ "pnpm not found"
```bash
npm install -g pnpm
pnpm --version
```

### ❌ "transcripts not fetching / python helper not found"
```bash
# Ensure python deps are installed
pip install -r python/requirements.txt

# Verify python is callable from Node (spawned as `python`)
python -c "import sys; print(sys.executable)"
```

### ❌ "TypeScript compilation error"
```bash
pnpm type-check  # See detailed errors
# Fix errors in src/ files
pnpm build       # Try again
```

### ❌ "No videos found"
- Check expert names match sources.md format
- Verify keywords are appropriate
- Try increasing `maxResultsPerExpert`
- See IMPLEMENTATION.md for more tips

### ❌ "Port already in use" (if adding server)
- Change port in config
- Or use: `lsof -i :PORT` (on Mac/Linux)
- Or: `netstat -ano | findstr :PORT` (on Windows)

---

## Documentation Reference

Need help? Check these files:

| Question | Document |
|----------|----------|
| How do I set this up? | **GETTING_STARTED.md** |
| How do I use it? | **IMPLEMENTATION.md** |
| How does it work? | **ARCHITECTURE.md** |
| What files exist? | **README.md** |
| Quick overview? | This file ✓ |

---

## Success Indicators

✅ You've succeeded when:

1. ✅ `pnpm build` runs without errors
2. ✅ `pnpm dev` starts the application
3. ✅ Sees progress logs (reading experts, searching, etc.)
4. ✅ Creates files in `research/youtube-transcripts/`
5. ✅ Each expert has a directory with markdown files
6. ✅ Each markdown contains transcript + summary + takeaways

---

## Next Steps After Basic Setup

1. **Customize Keywords** - Update for your research topic
2. **Add More Experts** - Expand `research/sources.md`
3. **Implement Real APIs** - YouTube search + LLM integration
4. **Add New Sources** - LinkedIn, podcasts, blogs
5. **Deploy** - Run in production
6. **Extend** - Add database, scheduling, web UI

---

## Quick Command Reference

```bash
# Setup
pnpm install           # Install dependencies
pnpm build            # Build TypeScript

# Development
pnpm dev              # Run with hot-reload
pnpm type-check       # Check types only
pnpm lint             # Lint code

# Production
pnpm build            # Create dist/
pnpm start            # Run compiled code

# Maintenance
rm -r dist            # Clean build
rm -r node_modules    # Clean dependencies
```

---

## Getting Help

If you get stuck:

1. **Check the logs** - Error messages are detailed
2. **Review GETTING_STARTED.md** - Full setup guide
3. **Read IMPLEMENTATION.md** - Configuration details
4. **Check src/config/index.ts** - Current configuration
5. **Verify .env file** - Has API key

---

**You're all set! 🚀**

```bash
cd c:\100Hires
pnpm install
pnpm build
pnpm dev
```

(Make sure you ran `pip install -r python/requirements.txt` before `pnpm dev` if you want live transcript fetching.)

The application will start and begin processing experts from `research/sources.md`.

Happy researching! 🎉
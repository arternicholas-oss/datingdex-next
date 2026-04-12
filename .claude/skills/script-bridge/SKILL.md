---
name: script-bridge
description: >
  Generates self-contained, double-clickable .command scripts (macOS) that execute on the
  user's real machine when Claude cannot perform an action directly. Use this skill whenever
  Claude encounters an execution barrier — Terminal is click-tier only (can't type), the sandbox
  can't reach an external API or service, credentials are needed that Claude doesn't have access
  to, a CLI tool isn't available in the sandbox, or the task requires the user's local filesystem,
  network, or installed software. Also trigger when the user asks for a "script", "command file",
  "deployment script", "run this for me", or any variation of wanting an executable they can
  double-click. Even if Claude could theoretically do something another way, if a .command script
  would be faster or more reliable, prefer this approach. This is Claude's way of building its
  own tools on the fly.
---

# Script Bridge

When Claude hits a wall — can't type in Terminal, can't reach an API from the sandbox, doesn't
have credentials, needs a CLI tool that isn't installed here — the move is to write a
self-contained `.command` script that the user double-clicks to run on their real machine.

This isn't a workaround. It's a pattern. The script runs with the user's full permissions,
credentials, network access, and installed tools. Claude supplies the logic; the user supplies
the execution environment.

## When to generate a script

A .command script is the right call when any of these are true:

- **Terminal access is restricted.** Claude can see Terminal but can't type into it (click-tier).
- **Sandbox network limits.** The task needs to hit an external API (Stripe, Google, Vercel, GitHub, etc.) and the sandbox can't reach it or would need API keys Claude doesn't have.
- **Credentials required.** The task needs secret keys, tokens, or passwords that should never be pasted into chat.
- **Local CLI tools needed.** The task depends on tools installed on the user's machine (vercel, stripe, gh, gcloud, aws, docker, etc.) that aren't in the sandbox.
- **File system operations.** The task needs to read/write files outside the mounted workspace, or interact with the user's full filesystem.
- **Git operations with auth.** Pushing, pulling, or any git operation that requires SSH keys or credential helpers.
- **Long-running processes.** Tasks that might take minutes (API calls over hundreds of items, large builds, data migrations).

## Script anatomy

Every .command script follows this structure:

```bash
#!/bin/bash
# 1. Navigate to the project directory
cd ~/Desktop/Projects/websites/ProjectName   # Use ~ not absolute /Users/name

# 2. Header banner — tell the user what's about to happen
echo "============================================"
echo "  Descriptive Title of What This Does"
echo "============================================"
echo ""

# 3. Prerequisite checks
if ! command -v some_tool &> /dev/null; then
  echo "Installing some_tool..."
  npm install -g some_tool    # or brew install, pip install, etc.
fi

# 4. Credential prompts (if needed) — NEVER hardcode secrets in the script
echo "Paste your API key (input is hidden):"
read -s API_KEY
echo ""

# 5. The actual work — with progress indicators
echo "Step 1: Doing the thing..."
# ... commands here ...
echo "✓ Done"

# 6. Success summary
echo ""
echo "============================================"
echo "  SUCCESS! Here's what happened."
echo "============================================"

# 7. Always end with this
echo ""
echo "Press any key to close..."
read -n 1
```

## Key principles

### Self-contained
The script must work if the user double-clicks it tomorrow with zero context. No assumptions
about shell state, environment variables, or previous scripts. Install dependencies inline if
needed. Check for prerequisites before using them.

### Transparent
Every step gets an echo. The user should be able to watch the terminal and know exactly what's
happening. Use progress counters for loops (`[1/50] Processing...`). Print clear success/failure
at the end.

### Safe with credentials
Never hardcode API keys, tokens, or passwords. Use `read -s` to prompt for secrets (the `-s`
flag hides input). If the script produces values the user will need later (IDs, keys, URLs),
print them clearly at the end with copy-paste-ready formatting.

### Defensive
Check if tools exist before using them. Handle errors with clear messages. For git operations,
clean up stale locks (`rm -f .git/index.lock`). For API calls, test with one request before
looping through hundreds. Save progress periodically for long operations.

### Organized
Save scripts to the project's designated scripts folder. If one doesn't exist, create a
`Command Scripts` folder on the Desktop or within the project. Name scripts descriptively:
`setup-stripe-products.command`, `deploy-venue-photos.command`, `fetch-api-data.command`.

## Embedding other languages

For complex logic, embed Node.js or Python inside the bash script:

### Node.js (for npm ecosystem / API SDKs)
```bash
node -e "
const Stripe = require('stripe');
const stripe = new Stripe('$API_KEY');

async function main() {
  try {
    const result = await stripe.products.create({ name: 'Example' });
    console.log('✓ Created: ' + result.id);
  } catch (err) {
    console.error('ERROR: ' + err.message);
  }
}
main();
"
```

### Python (for data processing / no npm dependency)
```bash
python3 << 'PYEOF'
import json
import urllib.request

# Python code here — the PYEOF heredoc keeps it clean
with open("data/example.json") as f:
    data = json.load(f)

print(f"Processed {len(data)} items")
PYEOF
```

The heredoc approach (`<< 'PYEOF'`) is preferred for Python because it avoids bash variable
interpolation issues. For Node.js, use `-e` with double quotes so bash variables like
`$API_KEY` get substituted in.

## Common script categories

### Deploy scripts
Git add, commit, pull, push. Handle merge conflicts with `-X ours` when appropriate. Clean
up git locks. Set git identity if needed. Always pull before pushing.

### API setup scripts
Create resources via SDK (Stripe products, Supabase tables, etc.). Prompt for credentials.
Output the resulting IDs/keys in a copy-paste-ready env var block.

### Environment variable scripts
Use CLI tools (vercel env add, heroku config:set) to configure hosting. Link the project
first if the CLI requires it. Add vars to all environments (production, preview, development).

### Data processing scripts
Fetch from external APIs, transform data, write to local files. Include progress counters,
periodic saves, and skip logic for already-processed items. Test with one item before
looping.

### Build and test scripts
Run builds, test suites, or linting with proper error handling. Capture exit codes. Provide
clear pass/fail output.

## Delivery

1. Write the script to the project's scripts folder (or `~/Desktop/Command Scripts/` if no
   project context exists)
2. **Make it executable immediately** by running `chmod +x` on the file via Bash. The
   `.command` extension alone is NOT enough — macOS requires the execute bit or it will
   refuse to run the file. This step is mandatory, never skip it.
3. Tell the user: "I've created `script-name.command` in your scripts folder. Double-click
   it to run."
4. Explain what the script will do in 1-2 sentences before they run it
5. After they run it, ask for the output or take a screenshot to verify success

## Platform notes

- `.command` is macOS-specific. If the user is on Linux, use `.sh` with `chmod +x`. On
  Windows, use `.bat` or `.ps1`.
- Always use `~/` for home directory, never hardcode `/Users/username/`.
- Use `read -n 1` at the end so Terminal stays open after completion.
- The shebang must be `#!/bin/bash` (not `/bin/sh`) for full bash feature support.

# Reels in Claude Code: what to do

## What's in this kit
- `SETUP-PROMPT.md` – the one-time setup message (paste it into Claude Code)
- `.claude/skills/reel-standard-edit/SKILL.md` – your editing standard for every reel

## Step 1. Make a folder
Make one folder on your computer, for example `Documents/Reels Studio`.

## Step 2. Open Claude Code in that folder
Open Claude Code and choose that folder.

## Step 3. Paste the setup prompt
Copy everything in `SETUP-PROMPT.md`, paste it, and attach `SKILL.md`.
Say yes when it asks permission. It ends with a summary and won't edit any videos yet.

## Step 4. Fill your brand folder (once)
Put your fonts, colors and logo into the `brand` folder.

## Step 5. Every reel after that
Drop the clip into `public/recordings`, then say:

> Edit [file name] using my reel standard. Storyboard first.

With direction:

> Edit [file name] using my reel standard. Hook is "[your hook]". End with [what you want people to do]. Moody grade. Storyboard first.

You'll always get a storyboard first. Reply "go" or tell it what to change.
Finished videos land in `ready to post`. Your original clips are never changed.

## Good to know
- The first setup takes a while because of installs. After that, edits are faster.
- If something breaks, say "run npx hyperframes doctor and fix what's missing."

## Tools installed
* Cursor IDE
* Claude, Codex, and GitHub extensions for Cursor

## Steps completed
* Cursor was already installed on my machine, so I opened it
* Signed in via google (I already have an account)
* Updated cursor to the latest version
* Installed the Claude and Codex extensions on cursor and signed in
* Created a new directory "100Hires" and opened it on the cursor IDE
* Created a new "README.md" file inside the directory and populated it with the required information
* Signed in to GitHub and created a new public repository (I also already have a GitHub account)
* Installed the GitHub extension on Cursor
* Initialized and added origin for GitHub repository
* Committed and pushed the README.md file to the main branch of the repository

## Issues
* Neither Claude Code nor Codex were found as cursor extensions
* I did some digging, and it turned out that on Cursor version 3.x onwards, there are separate "Editor" and "Agents" views
* Cursor defaulted to opening the agent view, so I switched to editor view by clicking on the button on the top right
* I tried to sign in into Claude. However, it requires me to either have a paid Claude subscription or an Anthropic API account with billing enabled. Since I do not currently have either, I was unable to complete this step
* Initially, there were no formatting on the .md file, so I looked at a markdown syntax guide to fix it so that the README.md file is more easy to read on GitHub

## Environment
* OS: Windows 11 Home version 25H2
* IDE: Cursor IDE version 3.9.16

## Research Project Step-by-Step

### 1. Topic Selection

I selected **Reddit Marketing for B2B SaaS** because it combines community-driven marketing, demand generation, and content distribution strategies that are commonly used by modern B2B SaaS companies.

---

### 2. Expert Discovery

Instead of simply searching for "marketing experts," I prioritized practitioners with real-world B2B SaaS experience.

To identify candidates, I:

- Used AI (Codex) to generate an initial list of potential experts.
- Verified each candidate manually through LinkedIn, company websites, podcasts, and other public sources.
- Prioritized founders, Heads of Growth, demand generation leaders, and marketers actively working in B2B SaaS.
- Selected experts based on practical experience rather than follower count or personal branding.

This process resulted in a curated list of ten experts with strong practitioner backgrounds.

---

### 3. Repository Structure

The repository was organized into separate research categories:

```
research/
├── sources.md
├── linkedin-posts/
├── youtube-transcripts/
└── other/
```

This separation keeps expert metadata, LinkedIn content, YouTube research, and additional materials organized independently.

---

### 4. Building the YouTube Research Pipeline

Rather than collecting videos manually, I built a small automation pipeline using Codex.

The pipeline:

1. Reads the selected experts.
2. Searches YouTube for videos featuring each expert.
3. Filters relevant videos.
4. Retrieves video transcripts through a Python transcript service.
5. Generates Markdown files automatically for each video.

Automating this process significantly reduced the amount of manual work required to collect research material.

---

### 5. LinkedIn Research

LinkedIn content proved more difficult to automate due to authentication requirements and anti-scraping protections.

Instead of relying on unreliable automation, I manually collected relevant posts by:

- Searching LinkedIn using topic-specific keywords
- Filtering results by author
- Selecting posts relevant to Reddit marketing and B2B SaaS
- Organizing the collected posts under each expert

This ensured that only relevant, publicly accessible content was included.

---

### 6. Additional Research

When useful supporting material was available, I also collected:

- Podcast appearances
- Blog articles
- Interviews
- Company resources

These materials were placed under the `research/other/` directory.

---

### 7. Why These Experts

The selected experts were chosen because they are practitioners actively working in B2B SaaS marketing rather than general influencers.

Collectively, they cover multiple aspects of Reddit marketing, including:

- Community-led growth
- Demand generation
- Organic content strategy
- Paid Reddit advertising
- SEO and content distribution
- B2B growth marketing
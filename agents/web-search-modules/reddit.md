# Reddit Module

> Specialized Reddit search strategy for deep research

**Trigger scenarios**: Real user experiences, troubleshooting, comparisons, community opinions, "what do people actually use", pain points

## Search sources
- **Reddit search** (search.reddit.com / reddit.com/search) - posts, comments, discussions
- **Targeted subreddits**: r/programming, r/ExperiencedDevs, r/sysadmin, r/webdev, r/javascript, r/learnprogramming, r/AskReddit (careful), r/technology, r/LocalLLaMA, r/MachineLearning, r/ArtificialIntelligence, r/Entrepreneur, r/Investing, r/startups, r/PrivacyGuides, r/Security, r/hardware, r/selfhosted
- **Topic-specific subreddits** - identify and search relevant niche subs
- **old.reddit.com** - often more complete results and easier to parse

## Query strategy
- Search for "[topic] vs", "experience with [topic]", "problem [topic]", "[topic] worth it", "[topic] review 2024 2025"
- Include subreddit filters when appropriate: `site:reddit.com/r/subreddit [query]`
- Look for **highly upvoted threads with many comments** (signal of real discussion)
- Prioritize **top-level posts with detailed comments** over short posts
- Focus on **first-hand experiences** (users who deployed/used something) vs speculation
- Look for **"update" comments** - people often report back after time
- Check post dates - prefer recent threads but don't ignore evergreen ones with updates
- Sort by relevance + upvotes; look past first page

## Information extraction
- Extract concrete experiences, configs, gotchas, pricing reality
- Capture dissenting opinions and trade-offs
- Note when advice is outdated or context-specific
- Distinguish between "worked for me" vs consensus
- Look for linked resources in comments
- Pay attention to moderator clarifications

## Red flags
- Very old threads with no updates on rapidly changing tech
- Threads heavily driven by brand shilling
- Advice from users with unclear context

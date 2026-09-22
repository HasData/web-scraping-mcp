---
description: Pull named fields off a web page, rendering it first when the page needs it
---

Extract fields from a page.

Ask me for the URL and which fields I want if I have not given them.

Then:

1. Fetch the page with `hasdata_web_scraping_web_scraping_scrapeWebPage`, `jsRendering: false` and `outputFormat` set to `["json","markdown"]`. Rendering is on by default and it is the expensive mode, so start without it.
2. Check `statusCode` before reading anything. A 403 or 404 is a successful call with an empty `content` and a `requestMetadata.warning` naming the reason, so report the block rather than hunting selectors. A 400 means the host could not be reached at all.
3. If the body is a shell with no real content, call again with `jsRendering: true` and a `waitFor` selector naming something the finished page contains. Say that you did, because it means the page is client-rendered.
4. Write an `extractRules` object mapping my field names to CSS selectors, using `@` for attributes as in `a @href` or `img @src`, and call again with `json` still in `outputFormat`. Read the answer from `extractedData`.
5. Report the fields that came back null. A null is a selector that matched nothing, so fix the selector or tell me the page does not carry that field, and never fill it with a guess.
6. Add `extractLinks` or `extractEmails` when I asked for links or contacts, rather than parsing them out of the markup yourself.

If the page needs a click or a scroll before the content exists, use `jsScenario` rather than a longer `wait`.

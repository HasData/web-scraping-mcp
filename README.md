# Web Scraping MCP Server

<!-- mcp-name: com.hasdata/web-scraping -->

A hosted Model Context Protocol (MCP) server that gives Claude, Cursor, Windsurf and any other MCP client one read-only tool for fetching any public web page. It goes out through managed proxies, renders JavaScript when a page needs it, and returns clean markdown, plain text, raw HTML or structured JSON, with nothing to host and no browser in your stack.

This is the fallback for sites with no dedicated API. When a site does have one in the [HasData catalogue](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp), that tool returns parsed fields and this one returns a page.

**1,000 free credits every month, no card required.** A plain fetch costs 1 credit, so the free tier covers 1,000 of them.

```
https://mcp.hasdata.com/api/mcp?apis=web_scraping
```

[![Glama score](https://glama.ai/mcp/servers/HasData/web-scraping-mcp/badges/score.svg)](https://glama.ai/mcp/servers/HasData/web-scraping-mcp)
[![tool contract](https://github.com/HasData/web-scraping-mcp/actions/workflows/contract.yml/badge.svg)](https://github.com/HasData/web-scraping-mcp/actions/workflows/contract.yml)
[![MCP](https://img.shields.io/badge/MCP-remote%20%7C%20streamable%20HTTP-6366f1?style=flat-square)](https://mcp.hasdata.com/api/mcp?apis=web_scraping)
[![Tools](https://img.shields.io/badge/tools-1-10b981?style=flat-square)](#tools)
[![npm](https://img.shields.io/npm/v/@hasdata/web-scraping-mcp?style=flat-square&logo=npm&label=npm&color=cb3837)](https://www.npmjs.com/package/@hasdata/web-scraping-mcp)
[![PyPI](https://img.shields.io/pypi/v/hasdata-web-scraping-mcp?style=flat-square&logo=pypi&logoColor=white&label=PyPI&color=3775a9)](https://pypi.org/project/hasdata-web-scraping-mcp/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

## Contents

- [What you need](#what-you-need)
- [Quick start](#quick-start)
- [Example prompts](#example-prompts)
- [Tools](#tools)
- [Output formats](#output-formats)
- [Errors and failure paths](#errors-and-failure-paths)
- [Pricing, free tier and limits](#pricing-free-tier-and-limits)
- [How it compares](#how-it-compares)
- [FAQ](#faq)
- [HasData links](#hasdata-links)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## What you need

An MCP client and a HasData API key from the [dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp), free to create with no card. This is a remote server, so the simplest path is a URL and an `x-api-key` header, with no container to run. A client that only speaks stdio reaches it through a thin launcher, published as `@hasdata/web-scraping-mcp` on npm and `hasdata-web-scraping-mcp` on PyPI, shown below.

## Quick start

The server URL is the same for every client. We run it hands-on in Claude Code and Claude Desktop. The other blocks follow each client's own documented format for a remote server.

| Field | Value |
| :--- | :--- |
| URL | `https://mcp.hasdata.com/api/mcp?apis=web_scraping` |
| Transport | HTTP, streamable |
| Auth header | `x-api-key: HASDATA_API_KEY` |

Clients with OAuth support can add the same URL as a connector and sign in without putting a key in a config file.

<details>
<summary><b>Claude Code</b></summary>

```bash
claude mcp add --transport http web-scraping "https://mcp.hasdata.com/api/mcp?apis=web_scraping" \
  --header "x-api-key: HASDATA_API_KEY"
```

</details>

<details>
<summary><b>Claude Desktop</b></summary>

Settings, then Connectors, then Add custom connector, then paste `https://mcp.hasdata.com/api/mcp?apis=web_scraping` and sign in.

For the config-file route, Claude Desktop loads only local (stdio) servers, so it reaches a remote server through a stdio launcher. The `@hasdata/web-scraping-mcp` package is that launcher, and it reads the key from the environment. Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "web-scraping": {
      "command": "npx",
      "args": ["-y", "@hasdata/web-scraping-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

For Python instead of Node, swap the launcher for the PyPI package, which `uvx` runs without a manual install:

```json
{
  "mcpServers": {
    "web-scraping": {
      "command": "uvx",
      "args": ["hasdata-web-scraping-mcp"],
      "env": { "HASDATA_API_KEY": "YOUR_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Cursor</b></summary>

`~/.cursor/mcp.json` for every project, or `.cursor/mcp.json` for one:

```json
{
  "mcpServers": {
    "web-scraping": {
      "url": "https://mcp.hasdata.com/api/mcp?apis=web_scraping",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>Windsurf</b></summary>

`~/.codeium/windsurf/mcp_config.json`. Windsurf calls the field `serverUrl`, not `url`:

```json
{
  "mcpServers": {
    "web-scraping": {
      "serverUrl": "https://mcp.hasdata.com/api/mcp?apis=web_scraping",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

<details>
<summary><b>VS Code</b></summary>

`.vscode/mcp.json` in the workspace:

```json
{
  "servers": {
    "web-scraping": {
      "type": "http",
      "url": "https://mcp.hasdata.com/api/mcp?apis=web_scraping",
      "headers": { "x-api-key": "HASDATA_API_KEY" }
    }
  }
}
```

</details>

## Example prompts

- Fetch this page as markdown and summarise it.
- Read this documentation page and pull out every code block.
- Get the titles and links from the front page of this site as JSON.
- This page loads its content with JavaScript, so render it and wait for the results list before reading.
- Fetch this page through a German residential proxy and tell me whether the pricing differs.
- Take a screenshot of this page.

One call answers each of these. What changes between them is how much of the browser you asked for, and that is what the call costs.

## Tools

| Tool | What it returns |
| --- | --- |
| `hasdata_web_scraping_web_scraping_scrapeWebPage` | HTML, text, markdown, and/or JSON along with status code, extracted emails and links, CSS-selector extractions, and AI-structured fields per schema. 1, or 10 with JS rendering credits a call |

One tool. The cost depends on what you turn on, and the table is in [Pricing](#pricing-free-tier-and-limits).

### Scrape web page

[`hasdata_web_scraping_web_scraping_scrapeWebPage`](https://docs.hasdata.com/apis/web-scraping-api/api-params?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp)

Fetch one URL.

| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `url` | string | yes | The page to fetch |
| `outputFormat` | array | | Any of `markdown`, `text`, `html`, `json`. See [Output formats](#output-formats) |
| `jsRendering` | boolean | | Render the page in a browser. On by default, and the main cost lever |
| `proxyType` | string | | `datacenter` or `residential` |
| `proxyCountry` | string | | `US`, `UK`, `DE`, `IE`, `FR`, `IT`, `SE`, `BR`, `CA`, `JP`, `SG`, `IN` or `ID` |
| `headers` | object | | Custom request headers |
| `wait` | number | | Milliseconds to wait after load |
| `waitFor` | string | | CSS selector to wait for before reading |
| `jsScenario` | array | | Actions to run on the page. See below |
| `extractRules` | object | | CSS selectors to pull named fields |
| `aiExtractRules` | object | | A typed schema an LLM fills from the page |
| `extractLinks` | boolean | | Collect the page's links |
| `extractEmails` | boolean | | Collect email addresses on the page |
| `screenshot` | boolean | | Capture the rendered page |
| `blockResources` | boolean | | Skip images and stylesheets |
| `blockAds` | boolean | | Skip ad requests |
| `blockUrls` | array | | Skip these URLs |
| `includeOnlyTags` | array | | Keep only elements matching these selectors |
| `excludeTags` | array | | Drop elements matching these selectors |
| `removeBase64Images` | boolean | | Strip inline base64 images from the output |

`extractRules` maps a field name to a CSS selector, with `@attr` to read an attribute rather than text.

```json
{ "title": "h1", "link_href": "a#link @href", "page_text": "body" }
```

`jsScenario` is an array of actions run in order, covering `click`, `wait`, `waitFor`, `waitForAndClick`, `scrollX`, `scrollY`, `fill` and `evaluate` for arbitrary JavaScript. It needs `jsRendering` on.

`aiExtractRules` describes the shape you want and lets a model fill it from the HTML. Each key is an output field, typed as `string`, `number`, `boolean`, `list` or `item` for a nested object.

## Output formats

This is the part worth reading before your first call, because the response shape moves with `outputFormat`.

Ask for exactly one of `markdown`, `text` or `html`, and the content arrives as a plain string in `text` at the top level.

```json
{
  "url": "https://api.hasdata.com/scrape/web/",
  "status": 200,
  "json": null,
  "text": "# Example Domain\n\nThis domain is for use in documentation examples without needing permission. Avoid use in operations.\n\n[Learn more](https://iana.org/domains/example)\n"
}
```

Include `json`, alone or alongside another format, and everything moves inside `json`, the top-level `text` becomes null, and the requested formats become keys in there next to the page metadata.

```json
{
  "json": {
    "requestMetadata": { "id": "7764031a-43f7-4102-8561-a7b7a6f1cbf5", "status": "ok" },
    "statusCode": 200,
    "statusText": "OK",
    "headers": { "server": "nginx", "content-type": "text/html; charset=utf-8" },
    "extractedData": { "title": "Hacker News", "firstStory": ["iPhone Duo", "apple.com", "Show HN: What if the speed of light was 5 km/h?"] }
  },
  "text": null
}
```

`extractedData` holds the `extractRules` results. A selector matching several elements returns all of them as an array, so `.titleline a` on a listing page returns every match rather than the first.

## Errors and failure paths

Plan for these rather than assuming a happy path.

**`extractLinks` and `extractEmails` do nothing unless `outputFormat` includes `json`.** They put `links` and `emails` inside the `json` object, and there is nowhere for them to go in a plain markdown response. Asking for them with `outputFormat: ["text"]` returns the text and silently no links.

**A 404 or a 403 on the target page is a successful call.** The page's own status comes back as `statusCode` inside `json`, or as `status` at the top level, and the request is billed either way. Check the status before you parse the body.

**`jsRendering` is on by default, and it is what the call costs.** Turning it off takes a fetch from 10 credits to 1. Most static pages, documentation, articles and anything server-rendered do not need it. Turn it on when the content arrives empty without it.

**`waitFor` beats `wait`.** A fixed delay is a guess that is either too short on a slow load or wasted on a fast one. A CSS selector waits for the thing you actually need and returns as soon as it appears.

**A residential proxy is five to fifteen times the price of a datacenter one.** Reach for it when a datacenter fetch comes back blocked, rather than as the default.

**`includeOnlyTags` and `excludeTags` take `querySelectorAll` selectors.** An invalid selector narrows nothing rather than erroring, so a suspiciously complete response is the symptom of a typo.

**`aiExtractRules` runs a model over the HTML, so it is neither free nor deterministic.** Two calls on the same page can differ in wording. When a CSS selector can do the job, `extractRules` is cheaper and repeatable.

Results that carry data also carry a `requestMetadata.id` worth quoting in support.

## Pricing, free tier and limits

The cost depends on two switches, and nothing else changes it.

| | Datacenter proxy | Residential proxy |
| :--- | :--- | :--- |
| `jsRendering: false` | **1 credit** | 5 credits |
| `jsRendering: true` | 10 credits | 15 credits |

Rendering is on by default, so an unconfigured call costs 10. A static page fetched with `jsRendering: false` costs 1, which makes this the cheapest tool in the catalogue when you do not need a browser.

The free tier is **1,000 credits every month with no card**. That is 1,000 plain fetches, or 100 rendered ones. It renews with the billing cycle.

Paid plans start at **$49 a month** for 200,000 credits, which is 200,000 plain fetches or 20,000 rendered ones. The unit price falls with volume across the [high-volume plans](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp).

Your plan also sets concurrency. The free tier allows 1 request at a time, Startup 15, Business 30, Growth 50, and the high-volume plans run from 200 to 1,500. Retry on the 429 with a backoff in anything unattended, because an agent crawling a list of URLs will reach the ceiling before you do.

Credits come off successful requests only. A page that answers 404 is still a successful fetch of a 404.

## How it compares

The comparison worth making is against fetching the page yourself, and against the other tools in this catalogue.

| | `fetch` in your own code | A dedicated HasData tool | This server |
| :--- | :--- | :--- | :--- |
| Blocked by bot protection | Often | Handled | Handled |
| JavaScript-heavy pages | Needs a browser you run | Handled | A parameter |
| Geo-targeting | Your own proxies | Built in | A parameter |
| Output | Raw HTML | Parsed fields for that site | Markdown, text, HTML or JSON |
| Coverage | Anything | The sites with a tool | Anything public |
| Cost | Your infrastructure | Per call | From 1 credit a call |

The row that decides it against a dedicated tool is coverage. Amazon, Zillow, Yelp and the rest return typed fields because someone maintains a parser for that site. This one returns a page from any site and leaves the parsing to you, which is the right trade only when no dedicated tool exists.

Against your own `fetch`, the question is whether the target fights back. For a friendly page, your own code is free and this is not worth a credit.

## FAQ

### What is a web scraping MCP server?

An MCP server exposes tools an AI client can call. This one lets an agent fetch any public URL through managed proxies and get it back as markdown, text, HTML or structured JSON, without a browser or a proxy pool in your stack.

### Do I need my own proxies or a headless browser?

No. Both are on the server side. The only credential is your HasData key.

### How do I make calls cheaper?

Set `jsRendering: false`. That is the difference between 10 credits and 1. Add `blockResources` when you do need rendering, so the browser skips images and stylesheets.

### How do I know whether a page needs rendering?

Fetch it once without rendering, for 1 credit. If the content you want is there, you are done. If the body comes back as an empty shell, render it.

### Can it fill in a form or click through to the next page?

Yes, with `jsScenario`, which runs `click`, `fill`, `waitFor`, `scrollY` and `evaluate` steps in order on the rendered page.

### What is the difference between `extractRules` and `aiExtractRules`?

`extractRules` takes CSS selectors, and it is cheap, fast and repeatable. `aiExtractRules` describes the fields you want and lets a model read the page, which handles pages whose structure you cannot pin down but costs more and can vary between runs.

### Can I get a screenshot?

Yes, with `screenshot: true` on a rendered call.

### Can I use this together with other HasData APIs?

Yes. One key covers everything, and one endpoint serves them all through the `apis` parameter. Point a client at `?apis=web_scraping,google_serp` to get both tool sets in one connection, or at [`mcp.hasdata.com/api/mcp`](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp) for the full catalogue.

### Is HasData affiliated with the sites I fetch?

No. HasData is an independent service. This tool fetches pages you name, so what comes back is whatever that site publishes, and you are responsible for using it in line with that site's terms and the law that applies to you.

### Compliance and personal data

This tool points wherever you point it, which puts more on you than a site-specific one does. Two things deserve a decision before you build. `extractEmails` collects addresses, and an address is personal data in the GDPR sense and regulated separately again for marketing under the CAN-SPAM Act, the ePrivacy rules and their equivalents. And a page behind a login, a paywall or a robots exclusion is not made public by the fact that a proxy can reach it. Fetch what is genuinely public, keep only what your purpose needs, and check your own obligations.

## HasData links

- [Web Scraping API](https://hasdata.com/web-scraping-api?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp), the REST endpoint behind this tool
- [Parameter reference](https://docs.hasdata.com/apis/web-scraping-api/api-params?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp)
- [Request cost](https://docs.hasdata.com/apis/web-scraping-api/request-cost?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp)
- [Structured data extraction](https://docs.hasdata.com/apis/web-scraping-api/features/structured-data-extraction?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp)
- [MCP server documentation](https://docs.hasdata.com/mcp-server?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp)
- [Pricing](https://hasdata.com/prices?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp)
- [Dashboard](https://app.hasdata.com/sign-up?utm_source=github&utm_medium=syndication&utm_campaign=web-scraping-mcp)

Other HasData MCP servers: [Google Search](https://github.com/HasData/google-search-mcp), [Google Images](https://github.com/HasData/google-images-mcp), [Google Scholar](https://github.com/HasData/google-scholar-mcp), [Google Maps](https://github.com/HasData/google-maps-mcp), [Google Trends](https://github.com/HasData/google-trends-mcp), [Bing](https://github.com/HasData/bing-mcp), [DuckDuckGo](https://github.com/HasData/duckduckgo-mcp), [YouTube](https://github.com/HasData/youtube-mcp), [TikTok](https://github.com/HasData/tiktok-mcp), [Instagram](https://github.com/HasData/instagram-mcp), [Amazon](https://github.com/HasData/amazon-mcp), [Walmart](https://github.com/HasData/walmart-mcp), [Shopify](https://github.com/HasData/shopify-mcp), [Yelp](https://github.com/HasData/yelp-mcp), [Yellow Pages](https://github.com/HasData/yellowpages-mcp), [Zillow](https://github.com/HasData/zillow-mcp), [Redfin](https://github.com/HasData/redfin-mcp), [Airbnb](https://github.com/HasData/airbnb-mcp), [Booking.com](https://github.com/HasData/booking-mcp), [Indeed](https://github.com/HasData/indeed-mcp), [Glassdoor](https://github.com/HasData/glassdoor-mcp).

## Development

The launcher is a thin stdio bridge to the remote server, so there is nothing to build.

```bash
npm install
HASDATA_API_KEY=your_key_here npm test
```

The tests in `test/` assert the tool contract, the part that can break without a commit here. They check that `?apis=web_scraping` returns the one expected tool, that its name has not changed, that it still requires `url` and carries a description, that the parameters this README documents are still in the schema, and that the key in use is actually accepted.

Two tests pin the output-format behaviour, because it is the part of this README a reader is most likely to be caught by and the part a refactor is most likely to change. One asks for markdown alone and asserts the content arrives as a string at the top level. The other asks for `json` with `extractRules` and asserts the extraction lands in `extractedData` inside `json`. Both run without rendering, so the pair costs 2 credits.

The contract suite also runs weekly on a schedule, because the upstream tool list can change without anyone touching this repository.

## Contributing

A tool table, a response sample or a documented behaviour that does not match reality is worth an issue. There is a template for exactly that. Pull requests are welcome for the same, and for anything in the launcher.

## License

MIT, see [LICENSE](LICENSE).

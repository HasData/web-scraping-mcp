// Tool contract test.
//
// The README promises one tool with a specific name and parameter set. The upstream list can
// change without a single commit here, and the README would start lying silently. These checks
// catch that before a user does.
//
// Two tests call the API for real, because the part of this README a reader is most likely to
// be caught by is the output-format behaviour, and a schema check cannot see it. Both run with
// jsRendering off, so the pair costs 2 credits, which is the price of a canary that can fail
// for the right reason.
//
// Run: HASDATA_API_KEY=your_key_here npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

const ENDPOINT = 'https://mcp.hasdata.com/mcp?apis=web_scraping';
const KEY = process.env.HASDATA_API_KEY;
const TIMEOUT_MS = 45_000;

const TOOL = 'hasdata_web_scraping_web_scraping_scrapeWebPage';
const REQUIRED = ['url'];

// Parameters the README documents by name.
const PARAMS = [
    'outputFormat', 'jsRendering', 'proxyType', 'proxyCountry', 'headers', 'wait', 'waitFor',
    'jsScenario', 'extractRules', 'aiExtractRules', 'extractLinks', 'extractEmails', 'screenshot',
    'blockResources', 'blockAds', 'blockUrls', 'includeOnlyTags', 'excludeTags', 'removeBase64Images',
];

// Values the README lists.
const ENUMS = {
    proxyType: ['datacenter', 'residential'],
    proxyCountry: ['US', 'UK', 'DE', 'IE', 'FR', 'IT', 'SE', 'BR', 'CA', 'JP', 'SG', 'IN', 'ID'],
};
const FORMATS = ['html', 'text', 'markdown', 'json'];

// A streamable HTTP body arrives either as plain JSON or as server-sent events. One SSE event
// can span several data: lines, several events can share one response, and a server is free to
// send progress notifications before the answer. So collect every event and pick the message
// carrying our request id instead of trusting the first data: line.
function parseRpc(raw, id) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);

    const messages = [];
    for (const event of trimmed.split(/\r?\n\r?\n+/)) {
        const data = event
            .split(/\r?\n/)
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).replace(/^ /, ''))
            .join('\n');
        if (!data || data === '[DONE]') continue;
        try {
            messages.push(JSON.parse(data));
        } catch {
            // A keep-alive or a partial event is not our response.
        }
    }
    assert.ok(messages.length, `no JSON-RPC message in the response: ${raw.slice(0, 300)}`);
    const match = messages.find((m) => m.id === id);
    assert.ok(match, `no message with id ${id} in the response: ${raw.slice(0, 300)}`);
    return match;
}

let nextId = 1;

async function rpc(method, params = {}) {
    // The CI key sits on the free plan, where concurrency is 1. When several of
    // these repos are pushed at once their contract runs collide, and HasData
    // answers 429 with code concurrency_limit straight away rather than queueing.
    // That is a plan limit, not a broken contract, so the call is retried before
    // the test gives up. A 401 still fails on the first attempt.
    for (let attempt = 1; ; attempt++) {
        const id = nextId++;
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'x-api-key': KEY,
                'Content-Type': 'application/json',
                // The server answers over streamable HTTP, so accept both a plain body and a stream.
                Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        assert.equal(res.status, 200, `${method} returned ${res.status}`);
        const raw = await res.text();
        if (raw.includes('concurrency_limit') && attempt < 5) {
            await new Promise((r) => setTimeout(r, attempt * 4000));
            continue;
        }
        return { raw, body: parseRpc(raw, id) };
    }
}

function payloadOf(body) {
    const text = body.result?.content?.[0]?.text ?? '';
    return { text, payload: JSON.parse(text) };
}

// One network round trip for every test that needs the list.
let toolsPromise;
function listTools() {
    toolsPromise ??= rpc('tools/list').then(({ body }) => {
        assert.ok(body.result?.tools, 'the response carried no result.tools');
        return body.result.tools;
    });
    return toolsPromise;
}

const live = { skip: KEY ? false : 'HASDATA_API_KEY is not set, skipping the live checks' };

test('apis=web_scraping exposes the documented tool and nothing else', live, async () => {
    const tools = await listTools();
    const names = tools.map((t) => t.name).sort().join(', ');
    assert.equal(tools.length, 1, `expected 1 tool, got ${tools.length}: ${names}`);
    assert.equal(tools[0].name, TOOL, `the tool is now called ${tools[0].name}`);
});

test('the tool still requires a url and carries a description', live, async () => {
    const [tool] = await listTools();
    const required = tool.inputSchema?.required ?? [];
    for (const param of REQUIRED) {
        assert.ok(required.includes(param), `${TOOL} should require ${param}, declares: ${required.join(', ') || 'nothing'}`);
    }
    assert.ok((tool.description || '').trim().length > 20, `${TOOL} has an empty or near-empty description`);
});

test('the parameters the README documents are still in the schema', live, async () => {
    const [tool] = await listTools();
    const props = tool.inputSchema?.properties ?? {};
    for (const param of PARAMS) {
        assert.ok(props[param], `${TOOL} no longer accepts ${param}`);
    }
    for (const [param, values] of Object.entries(ENUMS)) {
        const offered = props[param]?.enum ?? [];
        for (const value of values) {
            assert.ok(offered.includes(value), `${param} no longer accepts ${value}, offers: ${offered.join(', ') || 'no enum'}`);
        }
    }
    const formats = props.outputFormat?.items?.enum ?? [];
    for (const value of FORMATS) {
        assert.ok(formats.includes(value), `outputFormat no longer accepts ${value}, offers: ${formats.join(', ') || 'no enum'}`);
    }
});

// The README says a single non-json format arrives as a string at the top level. That is the
// first thing a reader relies on, and no schema check can see it.
test('a single markdown request still returns the page as top-level text', live, async () => {
    const { raw, body } = await rpc('tools/call', {
        name: TOOL,
        arguments: { url: 'https://example.com', outputFormat: ['markdown'], jsRendering: false },
    });
    assert.ok(!raw.includes('401 Unauthorized'), 'HasData rejected the key');
    assert.ok(!raw.includes('"isError":true'), `the tool call failed: ${raw.slice(0, 300)}`);

    const { text, payload } = payloadOf(body);
    assert.equal(payload.status, 200, `the target page answered ${payload.status}`);
    assert.equal(typeof payload.text, 'string', `expected the content in top-level text: ${text.slice(0, 300)}`);
    assert.ok(payload.text.length, 'top-level text came back empty, so the page was not rendered to markdown');
    assert.equal(payload.json, null, 'json should stay null when only markdown is requested');
});

// And the README says that asking for json moves everything inside it, with extractRules landing
// in extractedData. That is the shape every structured-extraction prompt depends on.
test('a json request still puts extractRules output in extractedData', live, async () => {
    const { raw, body } = await rpc('tools/call', {
        name: TOOL,
        arguments: {
            url: 'https://example.com',
            outputFormat: ['json'],
            jsRendering: false,
            extractRules: { heading: 'h1' },
        },
    });
    assert.ok(!raw.includes('401 Unauthorized'), 'HasData rejected the key');
    assert.ok(!raw.includes('"isError":true'), `the tool call failed: ${raw.slice(0, 300)}`);

    const { text, payload } = payloadOf(body);
    assert.ok(payload.json, `expected a json object in the response: ${text.slice(0, 300)}`);
    assert.equal(payload.json.statusCode, 200, `the target page answered ${payload.json.statusCode}`);
    assert.ok(
        payload.json.extractedData,
        `extractRules produced no extractedData: ${JSON.stringify(payload.json).slice(0, 300)}`
    );
    assert.ok(
        payload.json.extractedData.heading,
        `the heading selector matched nothing: ${JSON.stringify(payload.json.extractedData).slice(0, 200)}`
    );
});

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * South African Reserve Bank (SARB) Web API MCP. Keyless.
 *
 * Base: https://custom.resbank.co.za/SarbWebApi
 * All endpoints below were verified live against the public SARB Web API
 * (swagger at /SarbWebApi/swagger/v1/swagger.json). No auth, no key.
 *
 * Snapshot endpoints (home_rates, current_market_rates, cpd_rates,
 * exchange_rates) return arrays of {Name, SectionName, TimeseriesCode,
 * Date, Value, UpDown, ...}. Use the TimeseriesCode from any of those with
 * `timeseries` to pull the historical observation series for that indicator.
 *
 * Quirk: an unknown TimeseriesCode returns HTTP 200 with an empty array `[]`
 * (not an error). The SARB API can be slow (several seconds per call).
 */


const BASE = 'https://custom.resbank.co.za/SarbWebApi';
const UA = 'pipeworx-mcp-sarb-za/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'home_rates',
    description:
      'Current headline South African rates shown on the SARB home page: CPI & PPI inflation, SARB Policy Rate, prime lending rate, government bond yields, Sabor/Zaronia money-market rates, and key Rand exchange rates (USD/GBP/EUR). Each item includes its TimeseriesCode for use with the `timeseries` tool. No arguments.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'current_market_rates',
    description:
      'Current South African money-market rates: SARB Policy Rate, Sabor, Zaronia. Each item includes a TimeseriesCode usable with the `timeseries` tool. No arguments.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'cpd_rates',
    description:
      'Current Corporation for Public Deposits (CPD) interest rates: interest charged and interest earned. Each item includes a TimeseriesCode usable with the `timeseries` tool. No arguments.',
    inputSchema: {
      type: 'object',
      properties: {
        frequency: {
          type: 'string',
          enum: ['cpd'],
          description: 'Ignored; reserved. Always returns current CPD rates.',
        },
      },
    },
  },
  {
    name: 'exchange_rates',
    description:
      'Selected South African Rand exchange rates. frequency="daily" (default) returns latest daily rates (Rand per USD, GBP, Euro, etc.). frequency="monthly" returns latest monthly figures including the nominal and real effective exchange rate indices. Each item includes a TimeseriesCode usable with the `timeseries` tool.',
    inputSchema: {
      type: 'object',
      properties: {
        frequency: {
          type: 'string',
          enum: ['daily', 'monthly'],
          description: 'daily (default) or monthly.',
        },
      },
    },
  },
  {
    name: 'timeseries',
    description:
      'Historical observation series for a single SARB indicator, identified by its TimeseriesCode (obtain codes from home_rates, current_market_rates, cpd_rates or exchange_rates). Examples: "MMRD002A" (SARB Policy Rate), "MMRD000A" (prime lending rate), "EXCX135D" (Rand per US Dollar), "CPI1000F" (CPI). Optionally bound the range with start_date and end_date (YYYY-MM-DD); omit both for the full available history. An unknown code returns an empty list.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'SARB TimeseriesCode, e.g. "MMRD002A", "EXCX135D", "CPI1000F".',
        },
        start_date: { type: 'string', description: 'Range start, YYYY-MM-DD (optional). Requires end_date.' },
        end_date: { type: 'string', description: 'Range end, YYYY-MM-DD (optional). Requires start_date.' },
      },
      required: ['code'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'home_rates':
      return sarbGet('/WebIndicators/HomePageRates');
    case 'current_market_rates':
      return sarbGet('/WebIndicators/CurrentMarketRates');
    case 'cpd_rates':
      return sarbGet('/WebIndicators/CPDRates');
    case 'exchange_rates': {
      const frequency = (args.frequency as string | undefined)?.toLowerCase().trim();
      const path =
        frequency === 'monthly'
          ? '/WebIndicators/HistoricalExchangeRatesMonthly'
          : '/WebIndicators/HistoricalExchangeRatesDaily';
      return sarbGet(path);
    }
    case 'timeseries': {
      const code = reqStr(args, 'code', '"MMRD002A" or "EXCX135D"');
      const start = (args.start_date as string | undefined)?.trim();
      const end = (args.end_date as string | undefined)?.trim();
      let path = `/WebIndicators/Shared/GetTimeseriesObservations/${encodeURIComponent(code)}`;
      if (start && end) {
        path += `/${encodeURIComponent(start)}/${encodeURIComponent(end)}`;
      }
      return sarbGet(path);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function sarbGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`SARB: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;

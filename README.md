# mcp-sarb-za

South African Reserve Bank (SARB) Web API MCP. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `sarb_home_rates` | Current headline South African rates shown on the SARB home page: CPI & PPI inflation, SARB Policy Rate, prime lending rate, government bond yields, Sabor/Zaronia money-market rates, and key Rand exchange rates (USD/GBP/EUR). Each item includes its TimeseriesCode for use with the `sarb_timeseries` tool. No arguments. |
| `sarb_current_market_rates` | Current South African money-market rates: SARB Policy Rate, Sabor, Zaronia. Each item includes a TimeseriesCode usable with the `sarb_timeseries` tool. No arguments. |
| `sarb_cpd_rates` | Current Corporation for Public Deposits (CPD) interest rates: interest charged and interest earned. Each item includes a TimeseriesCode usable with the `sarb_timeseries` tool. No arguments. |
| `sarb_exchange_rates` | Selected South African Rand exchange rates. frequency="daily" (default) returns latest daily rates (Rand per USD, GBP, Euro, etc.). frequency="monthly" returns latest monthly figures including the nominal and real effective exchange rate indices. Each item includes a TimeseriesCode usable with the `sarb_timeseries` tool. |
| `sarb_timeseries` | Historical observation series for a single SARB indicator, identified by its TimeseriesCode (obtain codes from home_rates, current_market_rates, cpd_rates or exchange_rates). Examples: "MMRD002A" (SARB Policy Rate), "MMRD000A" (prime lending rate), "EXCX135D" (Rand per US Dollar), "CPI1000F" (CPI). Optionally bound the range with start_date and end_date (YYYY-MM-DD); omit both for the full available history. An unknown code returns an empty list. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "sarb-za": {
      "url": "https://gateway.pipeworx.io/sarb-za/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/sarb-za/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Sarb Za data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT

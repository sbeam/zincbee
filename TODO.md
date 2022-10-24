
# TODO

[ ] 2 fields for Alpaca API keys
[ ] List orders from API
[ ] List open and closed positions
   - symbol
   - qty
   - date open
   - limit *
   - filled avg price
   - cost basis (incl fee)
   - stop *
   - target *
   - elevation, etc
   - current

* soft or hard

If closed
   - sold at
   - filled avg price
   - proceeds
   - % g/li
   - slip %

[ ] get current quote, fill g/l etc **
[ ] top row blank fields for sym, qty, limit, stop, target
[ ] exec button if pending
[ ] liquidate if open
[ ] edit stop/target if open
[ ] sparklines with performance side panel
[ ] page results
[ ] filter by symbol
[ ] remove hack in package.json when fix for font copy lands https://github.com/remix-run/remix/issues/1153

** https://github.com/prediqtiv/alpha-vantage-cookbook/blob/master/sp500-get-av-intraday/sp500-get-av-intraday.html#L95

# Random Notes

[Vite](https://vitejs.dev/) is a new build tool that's supposed to be faster than webpack. Probably worth trying out vs Remix

Integrate alpaca-js? or keep F/E vendor neutral?

Apparently you can use wasm-pack to run Rust inside of Node on the server??
https://github.com/remix-run/examples/tree/main/rust

Supabase
https://supabase.com/docs/guides/hosting/overview

Ory - auth and authz RBAC
https://www.ory.sh/cloud/

Fauna - distrubuted Graph DB (not useful here but for some future project)
https://fauna.com/

Primefaces UI lib https://www.primefaces.org/primereact/



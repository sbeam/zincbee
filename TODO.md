
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

[ ] top row blank fields for sym, qty, limit, stop, target
[ ] exec button if pending
[ ] liquidate if open
[ ] edit stop/target if open
[ ] page results
[ ] filter by date, symbol, etc


# Random Notes

Integrate alpaca-js? or keep F/E vendor neutral?

Apparently you can use wasm-pack to run Rust inside of Node on the server??
https://github.com/remix-run/examples/tree/main/rust

Supabase
https://supabase.com/docs/guides/hosting/overview

Ory - auth and authz RBAC
https://www.ory.sh/cloud/

Fauna - distrubuted Graph DB
https://fauna.com/

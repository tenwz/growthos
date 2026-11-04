# Summit Air — synthetic growthOS demo

Summit Air is a fictional HVAC SaaS company. This repo shows the full growthOS loop:

- 31 synthetic signals across 7 channels
- 1 memo that **fails** because a claim has no receipt
- 1 memo that **passes** with 6 claims and 18 receipts
- 3 experiments, including a failed one
- A generated cockpit with a Growth OS Score of 88/100

```bash
npx growthos doctor --strict
npx growthos score --explain
npx growthos cockpit --open
```

Every signal carries `provenance: synthetic` and an `example.com` URL. Synthetic signals cannot back a published claim.

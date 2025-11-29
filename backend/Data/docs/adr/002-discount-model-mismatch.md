# Decision Record 002 — Discount Model (PDF vs YAML)

## Summary
We decided to implement more like in the **full Discount data model from the PDF**, while exposing the **simplified API shape from the YAML specification**.

## Context
Two provided documents define the Discount entity differently:
- The **PDF** contains a complete system-level model (ProductId, ServiceId, Scope, Type, Value, StartsAt, EndsAt, IsActive, etc.).
- The **YAML** defines a simplified API payload (name, description, amount, amount_type, start_time, end_time).

## Decision
Use the **PDF model** internally in the database and C# entity.

## Rationale
- The PDF reflects the intended long-term system architecture.
- The YAML is the required external API contract for clients.
- Mapping the simple API onto the richer entity keeps both specs satisfied and avoids future refactoring.

## Notes
If later requirements remove unused fields, the richer model can be safely reduced without breaking the API.

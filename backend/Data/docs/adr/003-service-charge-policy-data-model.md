# Decision Record 003 — Service Charge Policy Data Model

## Summary

We standardized the Service Charge Policy database structure to a normalized 3-table model instead of what the early documentation described.

## Context

Original docs loosely described:

- a Service Charge Policy (fixed/percent rule)
- a Service Charge Policy Order mapping policies to orders

## Decision

Use the following normalized schema:

- ServiceChargePolicies — stores policy rules
- OrderServiceChargePolicy — many-to-many link between orders and policies
- ServiceServiceChargePolicy — many-to-many link between services and policies

This matches how policies are actually used in Orders and Services.

## Rationale

- Removes invalid/circular relationships
- Supports applying multiple policies to multiple orders/services
- Consistent with EF Core conventions
- Scales easier for future features (automatic fees, per-service policies)

## Note about documentation

The documentation defined:

- a Service Charge Policy (the rule)
- a Service Charge Policy Order table (mapping policies to orders)

However:

- There was no table for linking policies to services, even though services also require service charge policies.
- The existing ServiceChargePolicy table contained incorrect fields and ambiguous relationships.

## Alternatives considered

- Keep original table with mixed fields → rejected due to ambiguity and broken relationships.
- Single table without join tables → rejected; unable to support many-to-many mapping

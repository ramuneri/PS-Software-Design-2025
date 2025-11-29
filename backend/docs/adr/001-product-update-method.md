# Decision Record 001 — Product Update Method (PUT vs PATCH)

## Summary

We decided to use the HTTP **PATCH** method for updating a product instead of **PUT**, even though the original UAML documentation specifies a PUT endpoint.

## Context

The product update request in our backend only includes _optional_ fields:

- Name?
- Price?
- Category?
- TaxCategoryId?
- IsActive?

This means the client may update _only some fields_, not the entire product.

Using PUT would require the client to send the **full product object**, even when updating just one property.

## Decision

The `/api/products/{id}` update endpoint uses **PATCH**.

This fits the current backend model where partial updates are expected.

## Rationale

- PATCH is intended for **partial updates**
- PUT is intended for **full resource replacement**
- Our DTO (`UpdateProductRequest`) has all fields optional → naturally fits PATCH
- Reduces risk of overwriting fields accidentally
- Keeps API usage simpler for the frontend team

## Note about documentation

The YAML specification includes a **PUT** endpoint for updating products.  
This decision is a deliberate deviation to better match our backend design and partial-update workflow.

## Alternatives considered

- **PUT** → rejected because it requires submitting a full product object
- **POST /products/{id}/update** → rejected; not RESTful

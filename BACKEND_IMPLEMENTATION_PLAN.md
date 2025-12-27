# Backend Implementation Plan

Since the backend source code is not available in the current workspace, I have performed the Frontend and API Contract updates. The Backend must be updated as follows to complete the fix.

## 1. Update DTO
Locate the Data Transfer Object (DTO) used for the Admin Orders List (e.g., `AdminOrderDto.cs` or similar).
Add the nullable customer name field:

```csharp
public string? CustomerName { get; set; }
```

## 2. Update Mapping Logic
In the service or controller handling `GET /api/admin/orders`:
Ensure correct mapping from the `Order` entity to the DTO.

```csharp
// Example Mapping
orders.Select(o => new AdminOrderDto 
{
    Id = o.Id,
    // ... other fields
    CustomerName = o.User != null ? o.User.Name : (o.ShippingAddress != null ? o.ShippingAddress.Name : o.Name),
    // ...
})
```

## 3. API Response
Ensure the API returns the JSON with `customerName` property.

Once these backend changes are applied, the Admin Panel will automatically display the Customer Name in the Orders table handling the mapping correctly.

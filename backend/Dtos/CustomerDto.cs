namespace backend.Dtos;

public record CustomerDto(
    int Id,
    int MerchantId,
    string? Name,
    string? Surname,
    string? Email,
    string? Phone
);
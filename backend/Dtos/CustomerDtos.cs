namespace backend.Dtos;

public record CustomerDto(
    int Id,
    int MerchantId,
    string? Name,
    string? Surname,
    string? Email,
    string? Phone,
    bool IsActive
);

public record CustomerCreateDto(
    string? Name,
    string? Surname,
    string? Email,
    string? Phone
);

public record CustomerUpdateDto(
    string? Name,
    string? Surname,
    string? Email,
    string? Phone,
    bool? IsActive = null
);

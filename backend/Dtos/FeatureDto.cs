namespace backend.Dtos;

public record FeatureDto(
    int Id,
    string Name,
    string? Description,
    bool IsActive
);

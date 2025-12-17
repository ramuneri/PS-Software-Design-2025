namespace backend.Dtos;

public record AuditLogDto(
    int Id,
    string Action,
    string? PerformedByUserId,
    string AffectedUserId,
    string? Description,
    DateTime CreatedAt
);


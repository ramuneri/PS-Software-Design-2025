namespace backend.Dtos;

public record ReservationDto(
    int Id,
    string? EmployeeId,
    string? CustomerId,
    int? ServiceId,
    string? Status,
    DateTime? StartTime,
    DateTime? EndTime,
    DateTime? BookedAt,
    bool IsActive,
    string? EmployeeName,
    string? CustomerName,
    string? ServiceName
);
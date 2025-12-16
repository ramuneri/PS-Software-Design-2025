namespace backend.Dtos;

public record ReservationDto
(
    int Id,
    string? EmployeeId,
    string? EmployeeName,
    string? CustomerId,
    string? CustomerName,
    string? CustomerEmail,
    int? ServiceId,
    string? ServiceName,
    string Status,
    DateTime StartTime,
    DateTime EndTime,
    DateTime BookedAt,
    string? Note,
    bool IsActive
);

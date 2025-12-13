namespace backend.Dtos;

public record ReservationDto
(
    int Id,
    string? EmployeeId,
    string? EmployeeName,
    string? CustomerId,
    string? CustomerName,
    int? ServiceId,
    string? ServiceName,
    string Status,
    DateTime StartTime,
    DateTime EndTime,
    DateTime BookedAt,
    bool IsActive
);

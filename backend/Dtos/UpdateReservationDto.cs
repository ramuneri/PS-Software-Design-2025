namespace backend.Dtos;

public record UpdateReservationDto
(
    DateTime? StartTime,
    DateTime? EndTime,
    string? EmployeeId,
    string? Note,
    string? Status,
    bool? IsActive
);

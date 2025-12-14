namespace backend.Dtos;

public record UpdateReservationDto
(
    DateTime? StartTime,
    string? EmployeeId,
    string? Status,
    bool? IsActive
);

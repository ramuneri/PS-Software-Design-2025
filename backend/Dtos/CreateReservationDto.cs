namespace backend.Dtos;

public record CreateReservationDto
(
    string CustomerId,
    string EmployeeId,
    int ServiceId,
    DateTime StartTime,
    DateTime? EndTime,
    string? Note
);

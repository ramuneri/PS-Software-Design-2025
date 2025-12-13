using backend.Data.Models;
using backend.Dtos;

namespace backend.Mapping;

public static class ReservationMapping
{
    public static ReservationDto ToDto(this Reservation entity)
    {
        return new ReservationDto(
            entity.Id,
            entity.EmployeeId,
            entity.Employee != null
                ? $"{entity.Employee.Name} {entity.Employee.Surname}"
                : null,
            entity.CustomerId,
            entity.Customer != null
                ? $"{entity.Customer.Name} {entity.Customer.Surname}"
                : null,
            entity.ServiceId,
            entity.Service?.Name,
            entity.Status ?? "Booked",
            entity.StartTime ?? DateTime.MinValue,
            entity.EndTime ?? DateTime.MinValue,
            entity.BookedAt ?? DateTime.MinValue,
            entity.IsActive
        );
    }
}

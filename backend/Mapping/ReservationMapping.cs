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
            entity.Employee?.Name ?? entity.Employee?.Email,
            entity.CustomerId,
            entity.Customer?.Name ?? entity.Customer?.Email,
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

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
            entity.StartTime!.Value,
            entity.EndTime!.Value,
            entity.BookedAt!.Value,
            entity.IsActive
        );
    }
}

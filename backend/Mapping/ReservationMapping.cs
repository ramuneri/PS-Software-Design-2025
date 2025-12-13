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
            entity.Employee?.Name,
            entity.CustomerId,
            entity.Customer?.Name,
            entity.ServiceId,
            entity.Service?.Name,
            entity.Status ?? "Booked",
            entity.StartTime ?? DateTime.MinValue,
            entity.EndTime ?? DateTime.MinValue,
            entity.BookedAt ?? DateTime.MinValue,
            entity.IsActive
        );
    }

    public static Reservation ToEntity(this CreateReservationDto dto)
    {
        return new Reservation
        {
            EmployeeId = dto.EmployeeId,
            CustomerId = dto.CustomerId,
            ServiceId = dto.ServiceId,
            StartTime = dto.StartTime,
            Status = "Booked",
            IsActive = true,
            BookedAt = DateTime.UtcNow
        };
    }
}

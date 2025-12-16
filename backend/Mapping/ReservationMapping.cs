using backend.Data.Models;
using backend.Dtos;

namespace backend.Mapping;

public static class ReservationMapping
{
    public static ReservationDto ToDto(this Reservation entity)
    {
        string BuildUserName(User? user)
        {
            if (user == null) return string.Empty;
            var full = $"{user.Name ?? ""} {user.Surname ?? ""}".Trim();
            if (!string.IsNullOrWhiteSpace(full)) return full;
            return user.Email ?? "";
        }

        return new ReservationDto(
            entity.Id,
            entity.EmployeeId,
            BuildUserName(entity.Employee),
            entity.CustomerId,
            BuildUserName(entity.Customer),
            entity.Customer?.Email,
            entity.ServiceId,
            entity.Service?.Name,
            entity.Status ?? "Booked",
            entity.StartTime ?? DateTime.MinValue,
            entity.EndTime ?? (entity.StartTime ?? DateTime.MinValue),
            entity.BookedAt ?? DateTime.MinValue,
            entity.Note,
            entity.IsActive
        );
    }
}
